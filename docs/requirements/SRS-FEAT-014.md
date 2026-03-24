# SRS-FEAT-014 — Software Requirements Specification
# Sistema de Notificaciones Push & In-App

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-014 |
| Versión | 1.0 |
| Fecha | 2026-03-24 |
| Sprint | 16 |
| Feature | FEAT-014 |
| Autor | SOFIA Requirements Analyst Agent |
| Estado | DRAFT — Gate 2 pendiente |
| CMMI | RD SP 1.1 · RD SP 2.1 · RD SP 3.1 |

---

## 1. Introducción

### 1.1 Propósito

Especifica los requisitos funcionales y no funcionales del sistema de notificaciones Push & In-App para BankPortal. Sirve como contrato entre el Product Owner, el equipo técnico y QA.

### 1.2 Alcance

FEAT-014 extiende la infraestructura de notificaciones existente (FEAT-007: `NotificationService` + `SseEmitterRegistry` + tabla `user_notifications`) con:

- Web Push (VAPID) — notificaciones fuera de sesión
- Centro de notificaciones — historial con filtros y marcado de lectura
- Preferencias por canal — email / push / in-app por tipo de evento
- Alertas transaccionales — transfer, payment, bill
- Alertas de seguridad — nuevo dispositivo, contraseña, 2FA
- SSE extendido — filtro por categoría + replay `Last-Event-ID`
- Frontend Angular — `NotificationBell` + drawer + settings

### 1.3 Definiciones

| Término | Definición |
|---|---|
| VAPID | Voluntary Application Server Identification — estándar W3C Web Push sin FCM |
| SSE | Server-Sent Events — protocolo HTTP/1.1 unidireccional servidor→cliente |
| Push Subscription | Objeto PushSubscription del browser API (endpoint + p256dh + auth) |
| In-App | Notificación recibida mientras la sesión está activa (SSE) |
| threshold_alert | Umbral de importe para alerta por email (defecto: 1.000€) |

### 1.4 Documentos relacionados

| Documento | Descripción |
|---|---|
| FEAT-014.md | Backlog épica con criterios Gherkin |
| SRS-FEAT-007.md | Requisitos del módulo de notificaciones base |
| SPRINT-016-planning.md | Planning del sprint |

---

## 2. Contexto del sistema

```
┌────────────────────────────────────────────────────────────────────┐
│                    BankPortal Notificaciones                        │
│                                                                      │
│  ┌──────────┐  Evento   ┌──────────────────┐   SSE   ┌───────────┐│
│  │ Business │──────────▶│ NotificationHub  │────────▶│  Browser  ││
│  │ Events   │           │  (Orchestrator)  │   Push  │  Angular  ││
│  │ Transfer │           │                  │────────▶│  + SW     ││
│  │ Payment  │           │ ┌──────────────┐ │  Email  │           ││
│  │ Security │           │ │  Preferences │ │────────▶│  Inbox    ││
│  └──────────┘           │ │  Filter      │ │         └───────────┘│
│                         │ └──────────────┘ │                       │
│                         └──────────────────┘                       │
│                                  │                                  │
│                    push_subscriptions · user_notifications          │
└────────────────────────────────────────────────────────────────────┘
```

**Stack técnico:** Spring Boot 3.x · Java 21 · Angular 17 · PostgreSQL 15 · nl.martijndwars:web-push:5.1.2

---

## 3. Requisitos funcionales

### RF-014-01 — Gestión de preferencias de notificación (US-1401 · 2 SP)

**Descripción:** Persistir preferencias de canal (email / push / in-app) por usuario y por tipo de evento con modelo opt-out.

**Reglas de negocio:**
- RN-1: Defecto = todos los canales habilitados (opt-out, no opt-in)
- RN-2: Cambios de preferencia con efecto inmediato (sin caché)
- RN-3: `SECURITY_ALERT` nivel HIGH siempre genera in-app (no deshabilitable)

**Endpoints:**
```
GET  /api/v1/notifications/preferences
     → NotificationPreferencesResponse

PATCH /api/v1/notifications/preferences
      Body: { eventType, emailEnabled, pushEnabled, inAppEnabled }
      → HTTP 200 PreferenceDto | HTTP 422 si eventType inválido
```

**Flyway V16 — DDL:**
```sql
CREATE TABLE notification_preferences (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type     VARCHAR(50) NOT NULL,
    email_enabled  BOOLEAN NOT NULL DEFAULT true,
    push_enabled   BOOLEAN NOT NULL DEFAULT true,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, event_type)
);

CREATE TABLE push_subscriptions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint     TEXT NOT NULL UNIQUE,
    p256dh       TEXT NOT NULL,
    auth         TEXT NOT NULL,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ
);

ALTER TABLE user_notifications
    ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN severity VARCHAR(10) NOT NULL DEFAULT 'INFO',
    ADD COLUMN metadata JSONB,
    ADD COLUMN read_at  TIMESTAMPTZ;

CREATE INDEX idx_notif_prefs_user    ON notification_preferences(user_id);
CREATE INDEX idx_push_sub_user       ON push_subscriptions(user_id);
CREATE INDEX idx_notif_user_category ON user_notifications(user_id, category);
CREATE INDEX idx_notif_user_unread   ON user_notifications(user_id, read) WHERE read = false;
```

---

### RF-014-02 — Centro de notificaciones backend (US-1402 · 3 SP)

**Descripción:** API REST para consultar, filtrar y gestionar el historial de notificaciones del usuario autenticado.

**Endpoints:**
```
GET   /api/v1/notifications
      Params: page (default 0), size (default 20, max 50), category (TRANSACTION|SECURITY|KYC|SYSTEM|ALL)
      → Page<NotificationDto> ordenado createdAt DESC

GET   /api/v1/notifications/unread-count
      → { count: N }

PATCH /api/v1/notifications/{id}/read
      → HTTP 200 NotificationDto | HTTP 404 | HTTP 403

POST  /api/v1/notifications/mark-all-read
      → HTTP 200 { markedCount: N }

DELETE /api/v1/notifications/{id}
       → HTTP 204 | HTTP 404
```

**Modelo NotificationDto:**
```json
{
  "id": "uuid",
  "type": "TRANSFER_COMPLETED",
  "category": "TRANSACTION",
  "title": "Transferencia enviada",
  "body": "250.00€ a IBAN ES76...",
  "read": false,
  "readAt": null,
  "severity": "INFO",
  "createdAt": "2026-03-24T10:30:00Z",
  "metadata": { "amount": 250.00, "currency": "EUR" }
}
```

**Reglas:**
- RN-4: Isolación por userId del JWT — usuario solo accede a sus notificaciones
- RN-5: TTL 90 días — limpieza por job batch `@Scheduled`
- RN-6: readAt en UTC

---

### RF-014-03 — SSE extendido (US-1403 · 2 SP)

**Descripción:** Extensión del endpoint SSE con filtrado por categoría y soporte `Last-Event-ID` para reconexión sin pérdida.

**Endpoint:**
```
GET /api/v1/notifications/stream?categories=SECURITY,KYC
    Header: Last-Event-ID: evt-450 (opcional)
    Response: text/event-stream
```

**Formato:**
```
id: evt-451
event: SECURITY_NEW_DEVICE
data: {"notificationId":"uuid","title":"Nuevo dispositivo","body":"Chrome · Madrid","severity":"HIGH"}

: heartbeat
```

**Reglas:**
- RN-7: `categories` vacío → todos los eventos (compatible con FEAT-007)
- RN-8: Eventos pendientes en Redis 5 min (ventana reconexión)
- RN-9: Heartbeat cada 30s para proxies con idle-timeout

---

### RF-014-04 — Web Push / VAPID (US-1404 · 5 SP)

**Descripción:** Gestión de suscripciones Push y envío de notificaciones cifradas ECDH/VAPID.

**Endpoints:**
```
POST   /api/v1/notifications/push/subscribe
       Body: { endpoint, p256dh, auth, userAgent }
       → HTTP 201 { subscriptionId }

DELETE /api/v1/notifications/push/subscribe/{id}
       → HTTP 204
```

**Configuración (application.yml):**
```yaml
notifications:
  push:
    vapid-public-key:  ${VAPID_PUBLIC_KEY}
    vapid-private-key: ${VAPID_PRIVATE_KEY}
    vapid-subject:     mailto:no-reply@bancomeridian.es
    ttl-seconds:       86400
```

**Reglas:**
- RN-10: HTTP 410 Gone → eliminar suscripción automáticamente
- RN-11: HTTP 429 → backoff exponencial 3 reintentos (1s, 4s, 16s)
- RN-12: Payload máximo 4 KB
- RN-13: Fallback SSE + email si sin push_subscription activa
- RN-14: Máximo 5 suscripciones activas por usuario (multi-device)

---

### RF-014-05 — Alertas transaccionales (US-1405 · 3 SP)

**Descripción:** Notificaciones automáticas al completarse eventos transaccionales, respetando preferencias.

| Evento | Trigger | Canal extra si > threshold |
|---|---|---|
| `TRANSFER_COMPLETED` | TransferService status=COMPLETED | email si amount > 1.000€ |
| `TRANSFER_RECEIVED` | TransferService destinatario | — |
| `PAYMENT_COMPLETED` | PaymentService status=COMPLETED | — |
| `BILL_PAID` | BillService status=PAID | — |

**Reglas:**
- RN-15: Generación asíncrona `@Async` — no bloquea transacción principal
- RN-16: threshold_alert configurable `${NOTIFICATION_THRESHOLD_ALERT:1000}`
- RN-17: `@TransactionalEventListener(phase = AFTER_COMMIT)`

---

### RF-014-06 — Alertas de seguridad (US-1406 · 3 SP)

**Descripción:** Alertas de alta prioridad ante eventos de seguridad críticos.

| Evento | Trigger | Severidad | Canales obligatorios |
|---|---|---|---|
| `SECURITY_NEW_DEVICE` | DeviceService.registerDevice() | HIGH | push + email + in-app |
| `SECURITY_PASSWORD_CHANGED` | AuthService.changePassword() | HIGH | email + in-app |
| `SECURITY_2FA_FAILED` ×3 | TwoFactorService 3 fallos | HIGH | email + in-app |
| `SECURITY_PHONE_CHANGED` | ProfileService.updatePhone() | HIGH | email anterior + in-app |

- RN-18: Severidad HIGH ignora preferencias `inAppEnabled` y `emailEnabled` — solo `pushEnabled` es respetado

---

### RF-014-07 — Frontend Angular (US-1407 · 4 SP)

**Descripción:** Componentes Angular 17 integrados en DashboardModule.

| Componente | Selector | Responsabilidad |
|---|---|---|
| `NotificationBellComponent` | `app-notification-bell` | Icono + badge en header |
| `NotificationPanelComponent` | `app-notification-panel` | Drawer lateral historial + filtros |
| `NotificationSettingsComponent` | `app-notification-settings` | Ruta `/settings/notifications` |

**Servicio Angular (interfaz):**
```typescript
interface NotificationAngularService {
  notifications$: Observable<NotificationDto[]>
  unreadCount$:   Observable<number>
  connectSSE(categories?: string[]): void
  disconnectSSE(): void
  markAsRead(id: string): Observable<void>
  markAllRead(): Observable<void>
  subscribePush(): Promise<void>
  updatePreferences(prefs: PreferencePatchDto): Observable<void>
}
```

**Reglas:**
- RN-19: Service Worker (`ngsw-worker.js`) maneja evento `push` y llama `showNotification()`
- RN-20: Solicitud permiso push solo 1ª vez (flag localStorage `push_permission_asked`)
- RN-21: Panel accesible WCAG 2.1 AA — `role="complementary"` · `aria-label` · navegación teclado

---

## 4. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-014-01 | Rendimiento | ≥ 500 conexiones SSE simultáneas sin degradación · latencia evento→browser < 500ms |
| RNF-014-02 | Entrega push | Push en < 3s desde evento · disponibilidad ≥ 99.5% |
| RNF-014-03 | Seguridad push | ECDH P-256 + AES-128-GCM · VAPID keys en ENV · rotación anual |
| RNF-014-04 | Compatibilidad | Chrome ≥ 60, Firefox ≥ 67, Safari ≥ 16.4 con push; todos con SSE fallback |
| RNF-014-05 | RGPD Art.7 | Consentimiento explícito `requestPermission()` antes de suscripción push |
| RNF-014-06 | RGPD Art.32 | Payload push cifrado end-to-end |
| RNF-014-07 | PSD2 RTS Art.97 | Alerta inmediata en operaciones > threshold (1.000€ defecto) |

---

## 5. Matriz de trazabilidad

| RF | US | Escenarios Gherkin | Normativa |
|---|---|---|---|
| RF-014-01 | US-1401 | UT-1401-01..03 | RGPD Art.7 |
| RF-014-02 | US-1402 | UT-1402-01..04 | — |
| RF-014-03 | US-1403 | UT-1403-01..03 | — |
| RF-014-04 | US-1404 | UT-1404-01..05 | RGPD Art.32 |
| RF-014-05 | US-1405 | UT-1405-01..04 | PSD2 RTS Art.97 |
| RF-014-06 | US-1406 | UT-1406-01..04 | — |
| RF-014-07 | US-1407 | UT-1407-01..05 | RGPD Art.7 |
| DEBT-023 | — | UT-DEBT023-01 | — |
| DEBT-024 | — | UT-DEBT024-01 | — |

---

## 6. DoR — Definition of Ready (Gate 2)

- [x] Todos los RF con criterios Gherkin en FEAT-014.md
- [x] Flyway V16 DDL definido sin ambigüedades
- [x] Endpoints REST con contratos request/response completos
- [x] RNF con métricas cuantificables
- [x] Matriz de trazabilidad RF → US → Test
- [x] Normativa RGPD/PSD2 mapeada a requisitos concretos
- [x] Restricciones tecnológicas documentadas

---

*SOFIA Requirements Analyst Agent — Sprint 16 · FEAT-014*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal — Banco Meridian — 2026-03-24*
