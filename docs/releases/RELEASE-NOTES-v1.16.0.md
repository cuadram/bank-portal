# Release Notes — v1.16.0

**BankPortal · Banco Meridian**

| Campo | Valor |
|---|---|
| Versión | v1.16.0 |
| Sprint | 16 |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Fecha | 2026-03-24 |
| Rama | feature/FEAT-014-sprint16 → main |
| Build | CI/CD Jenkins — PASS · 0 fallos |
| QA Gate | ✅ 36/36 · 0 defectos |
| Security | 🟢 VERDE · 0 CVEs |
| Breaking changes | ❌ Ninguno — extensión aditiva |

---

## Novedades principales

### 🔔 Web Push (VAPID) — notificaciones fuera de sesión
Sistema completo de notificaciones web push estándar W3C sin dependencia de Firebase. Los usuarios pueden suscribirse desde el portal y recibir alertas en el navegador incluso cuando la sesión está cerrada. Soporte multi-dispositivo (hasta 5 suscripciones), limpieza automática de suscripciones caducadas (HTTP 410) y backoff exponencial en reintentos (RFC 8292).

### 📋 Centro de notificaciones
Historial completo de notificaciones del usuario con filtrado por categoría (TRANSACTION / SECURITY / KYC / SYSTEM), marcado individual o masivo como leída, y contador de no leídas en tiempo real. TTL de 90 días con limpieza automática por job programado.

### ⚙️ Preferencias por canal
Gestión granular opt-out por tipo de evento y canal (email / push / in-app). Los cambios tienen efecto inmediato sin caché. Las alertas de seguridad de severidad HIGH se envían siempre por todos los canales activos independientemente de las preferencias.

### ⚡ SSE extendido con replay Last-Event-ID
El stream SSE existente (FEAT-007) se extiende con filtrado por categoría y soporte de `Last-Event-ID` para reconexión sin pérdida de eventos (buffer Redis de 5 minutos). Degradación graciosa ante ventana de reconexión expirada (replay completo del buffer).

### 🔴 Alertas transaccionales
Notificaciones automáticas al completarse transferencias, pagos y cargos. Lógica `@TransactionalEventListener(AFTER_COMMIT)` que garantiza que las alertas solo se envían tras confirmar la transacción. Alerta email adicional para importes superiores al umbral configurable (defecto 1.000€, PSD2 RTS Art.97).

### 🛡️ Alertas de seguridad
Alertas inmediatas de alta prioridad ante eventos críticos: nuevo dispositivo registrado, cambio de contraseña, 3 intentos 2FA fallidos, cambio de teléfono. Fuerzan todos los canales activos del usuario independientemente de sus preferencias de canal.

### 🖥️ Angular NotificationModule
Tres componentes Angular 17 integrados en el portal: `NotificationBellComponent` (header con badge), `NotificationPanelComponent` (drawer lateral con historial y filtros), `NotificationSettingsComponent` (gestión de preferencias). Service Worker registrado para recepción de push fuera de sesión.

---

## Cambios técnicos

### Backend — nuevas tablas (Flyway V16)
- `notification_preferences` — preferencias por usuario + tipo de evento
- `push_subscriptions` — suscripciones Web Push VAPID (multi-device)
- `user_notifications` — extensión aditiva: columnas `category`, `severity`, `metadata`, `read_at`

### Backend — nuevos endpoints
| Método | Ruta | Descripción |
|---|---|---|
| `GET/PATCH` | `/api/v1/notifications/preferences` | Gestión preferencias |
| `GET` | `/api/v1/notifications` | Historial paginado |
| `GET` | `/api/v1/notifications/unread-count` | Contador no leídas |
| `PATCH` | `/api/v1/notifications/{id}/read` | Marcar leída |
| `POST` | `/api/v1/notifications/mark-all-read` | Marcar todas leídas |
| `DELETE` | `/api/v1/notifications/{id}` | Eliminar del historial |
| `GET` | `/api/v1/notifications/stream` | SSE filtrado + replay |
| `POST/DELETE` | `/api/v1/notifications/push/subscribe` | Gestión suscripción push |

### Backend — dependencias añadidas
- `nl.martijndwars:web-push:5.1.1` — biblioteca VAPID Web Push
- `org.bouncycastle:bcprov-jdk18on:1.78.1` — criptografía ECDH P-256
- `io.hypersistence:hypersistence-utils-hibernate-63:3.8.1` — JsonType para JSONB

### Variables de entorno nuevas requeridas
```
VAPID_PUBLIC_KEY=<clave pública VAPID Base64URL>
VAPID_PRIVATE_KEY=<clave privada VAPID Base64URL>
NOTIFICATION_THRESHOLD_ALERT=1000
SSE_REPLAY_TTL_SECONDS=300
```

---

## Deuda técnica cerrada

| ID | Descripción |
|---|---|
| DEBT-023 | `KycAuthorizationFilter` período de gracia usuarios pre-existentes |
| DEBT-024 | `KycReviewResponse` tipado como record explícito |

## Deuda técnica registrada (sprint futuro)

| ID | Descripción | Sprint |
|---|---|---|
| DEBT-026 | Race condition en límite 5 push subscriptions concurrentes | Sprint 18 |
| DEBT-027 | Domain events como inner classes de listeners | Sprint 17 |
| DEBT-028 | Cifrar `auth`+`p256dh` en reposo — CVSS 4.1 | Sprint 17 |
| DEBT-029 | Footer email RGPD Art.7 — enlace gestión preferencias | Sprint 17 |

---

## Métricas de calidad

| Métrica | Valor |
|---|---|
| SP entregados | 24 / 24 |
| Defectos en QA | 0 |
| Tests automatizados nuevos | +38 (~191 total) |
| CVEs en dependencias | 0 |
| Cobertura capa application | ≥ 80% |
| Findings bloqueantes CR | 2 → corregidos antes de QA |
| SP acumulados proyecto | 379 |
| Velocidad (16 sprints) | ~23.7 SP/sprint |

---

## Compatibilidad

| Aspecto | Estado |
|---|---|
| Backward-compat FEAT-007 (SSE legacy) | ✅ Solo extensión aditiva |
| Backward-compat FEAT-008 (TransferService) | ✅ Sin cambios en API existente |
| Backward-compat FEAT-013 (KYC) | ✅ Sin cambios |
| API versioning | ✅ `/api/v1/` — sin cambio de versión |
| Flyway DDL | ✅ Aditivo — `IF NOT EXISTS` · `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` |

---

*Sprint 16 — BankPortal v1.16.0 · Banco Meridian*
*SOFIA Documentation Agent — Step 8 · 2026-03-24*
