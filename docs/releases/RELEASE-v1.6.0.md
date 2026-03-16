# Release Notes — v1.6.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.6.0 |
| **Fecha** | 2026-06-20 |
| **Sprint** | 7 |
| **Cliente** | Banco Meridian |
| **Tag git** | `v1.6.0` |
| **Servicios** | `bankportal-backend-2fa` · `frontend-portal` |
| **Rama** | `feature/FEAT-006-contextual-auth` → `main` |

---

## Sprint Goal alcanzado ✅

> "Cerrar FEAT-005 al 100% (US-403), resolver DEBT-008, formalizar contratos JWT (ACT-30)
> y arrancar FEAT-006 (Autenticación Contextual) con US-601/602 Must Have y US-603/604 Should Have."
>
> **24/24 SP entregados · 0 defectos · WCAG 2.1 AA 104/104**

---

## FEAT-005 cerrada al 100% — US-403

| US | Funcionalidad | Endpoints |
|---|---|---|
| US-403 | Preferencias de seguridad unificadas: toggle de notificaciones por tipo de evento, selector de timeout de sesión | `GET /api/v1/security/preferences` · `PUT /api/v1/security/preferences` |

**R-F5-003 verificado:** las preferencias de notificación nunca suprimen el `audit_log` (PCI-DSS inmutable). El canal de notificación se puede silenciar; el registro de auditoría es siempre activo. Disclaimer obligatorio visible en la UI.

---

## FEAT-006 — Autenticación Contextual y Bloqueo de Cuenta

### US-601 — Bloqueo automático de cuenta

El sistema bloquea automáticamente una cuenta tras **10 intentos fallidos de OTP en 24h**.

- Aviso progresivo desde el intento 7: cabecera `X-Remaining-Attempts: N`
- HTTP 423 con código `ACCOUNT_LOCKED` al intentar acceder con cuenta bloqueada
- Email de notificación automático al usuario
- Pantalla Angular `AccountLockedComponent` con botón de solicitud de desbloqueo
- `audit_log` registra `ACCOUNT_LOCKED` con IP y timestamp
- **PCI-DSS 4.0 req. 8.3.4** — cumplido

### US-602 — Desbloqueo de cuenta por email

El usuario puede desbloquear su cuenta mediante un enlace enviado a su email, sin necesidad de contactar con soporte.

- Token HMAC-SHA256, TTL 1h, one-time use (patrón ADR-007)
- `POST /api/v1/account/unlock` — respuesta neutra 204 (anti-user-enumeration)
- `GET /api/v1/account/unlock/{token}` — redirect a `/login?reason=account-unlocked`
- `audit_log` registra `ACCOUNT_UNLOCKED` con reason=EMAIL_LINK

### US-603 — Login contextual

Detección de accesos desde subnets IP nuevas con confirmación adicional antes de emitir el JWT completo.

- Nuevo scope JWT `context-pending` (ADR-011, RS256, TTL 15min)
- Claim `pendingSubnet` en el token — subnet que requiere confirmación
- `POST /api/v1/auth/confirm-context` — solo accesible con scope `context-pending`
- Email de confirmación con token HMAC-SHA256, TTL 15min
- Subnets confirmadas almacenadas en tabla `known_subnets` (Flyway V8)
- Feature flag `login.context.enabled` para desactivación de emergencia (R-F6-002)
- Pantalla Angular `ContextConfirmComponent`
- `audit_log` registra `LOGIN_NEW_CONTEXT_DETECTED` y `LOGIN_NEW_CONTEXT_CONFIRMED`

### US-604 — Historial de cambios de configuración

Registro auditado y visible al usuario de todos los cambios de configuración de seguridad.

- `GET /api/v1/security/config-history?days=30|60|90`
- Indicador visual `⚠️ Desde ubicación nueva` cuando `unusualLocation=true`
- Aviso inmutabilidad PCI-DSS 4.0 req. 10.2 siempre visible
- Componente Angular `ConfigHistoryComponent` con selector de período
- **PCI-DSS 4.0 req. 10.2** — cumplido

---

## DEBT-008 — Performance dashboard resuelto

`SecurityDashboardUseCase.execute()` migrado de **5 queries secuenciales** a **6 queries paralelas** con `CompletableFuture.allOf()`.

| Métrica | Antes | Después |
|---|---|---|
| Latencia STG p50 | ~40ms | **8ms** |
| Latencia STG p95 | ~45ms | **22ms** |
| Latencia STG p99 | ~50ms | **28ms** |
| Timeout de seguridad | — | 5s |

---

## ACT-30 — Contratos JWT formalizados en OpenAPI

`openapi-2fa.yaml` v1.4.0 documenta todos los claims emitidos en `securitySchemes`:

| Scope | Claims documentados |
|---|---|
| `2fa-pending` | `sub`, `scope`, `jti`, `iat/exp` |
| `full-session` | `sub`, `scope`, `jti`, `twoFaEnabled`, `iat/exp` |
| `context-pending` | `sub`, `scope`, `jti`, `pendingSubnet`, `iat/exp` |

---

## Flyway V8

```sql
-- Nuevas columnas en tabla users (US-601/602)
account_status        VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
failed_otp_attempts   INT         NOT NULL DEFAULT 0
failed_attempts_since TIMESTAMP
locked_at             TIMESTAMP
lock_unlock_token     VARCHAR(128)

-- Nueva tabla known_subnets (US-603)
known_subnets (id, user_id, subnet, first_seen, last_seen, confirmed)
```

---

## Deuda técnica nueva

| ID | Descripción | Sprint |
|---|---|---|
| DEBT-009 | Conectar `SecurityPreferencesUseCase` a repositorios reales (TwoFactorRepository, SessionService, TrustedDeviceRepository) | Sprint 8 |

---

## Acciones de mejora cerradas

| ACT | Descripción | Estado |
|---|---|---|
| ACT-28 | DEBT-008: CompletableFuture.allOf() — latencia p95 22ms < 30ms objetivo | ✅ |
| ACT-29 | US-403 Preferencias de seguridad incluida en Sprint 7 | ✅ |
| ACT-30 | Claims JWT documentados en OpenAPI securitySchemes | ✅ |

## Acciones de mejora pendientes para Sprint 8

| ACT | Descripción |
|---|---|
| ACT-31 | Pre-commit hook automático para detectar imports no usados (enforcement > checklist manual) — Retro S7 |

---

## Calidad

| Métrica | Valor |
|---|---|
| Tests unitarios Java | 34/34 PASS |
| Tests unitarios Angular | 12/12 PASS |
| Integración API | 14/14 PASS |
| Integración BD (Flyway) | 3/3 PASS |
| E2E Playwright | 8/8 PASS |
| WCAG 2.1 AA | 104/104 PASS |
| Defectos QA | 0 (× 7 sprints consecutivos) |
| NCs CR mayores | 0 (× 6 sprints consecutivos) |

---

## Gates HITL completados

| Gate | Aprobador | Estado |
|---|---|---|
| Sprint Planning | Product Owner | ✅ 2026-06-09 |
| ADR-011 + LLD-006 + LLD-007 | Tech Lead | ✅ 2026-06-09 |
| Code Review | Tech Lead | ✅ 2026-06-11 — 3 NCs menores resueltas |
| QA Lead | QA Lead | ✅ 2026-06-18 |
| QA Product Owner | Product Owner | ✅ 2026-06-18 |
| Go/No-Go PROD v1.6.0 | Release Manager | ✅ 2026-06-20 |

---

## Instrucciones de despliegue

```bash
# 1. Flyway V8 — ejecutar ANTES del deploy del backend
# La migración es backward compatible (columnas con DEFAULT, tabla nueva)
# No requiere downtime

# 2. Variables de entorno nuevas
ACCOUNT_LOCK_MAX_ATTEMPTS=10
ACCOUNT_LOCK_WARNING_THRESHOLD=7
ACCOUNT_LOCK_WINDOW_HOURS=24
ACCOUNT_UNLOCK_HMAC_KEY=<secret>
ACCOUNT_UNLOCK_TTL_MINUTES=60
CONTEXT_CONFIRM_HMAC_KEY=<secret>
CONTEXT_CONFIRM_TTL_MINUTES=15
LOGIN_CONTEXT_ENABLED=true

# 3. Deploy backend → frontend (orden estándar)
kubectl set image deployment/bankportal-backend bankportal-backend=bankportal-backend:v1.6.0
kubectl set image deployment/bankportal-frontend bankportal-frontend=bankportal-frontend:v1.6.0

# 4. Verificar post-deploy
curl -f https://api.bankportal.meridian.com/v1/actuator/health
```

---

## Rollback

En caso de incidente en PROD, rollback a v1.5.0:
```bash
kubectl set image deployment/bankportal-backend bankportal-backend=bankportal-backend:v1.5.0
kubectl set image deployment/bankportal-frontend bankportal-frontend=bankportal-frontend:v1.5.0
# Flyway V8 no requiere rollback — las nuevas columnas son nullable/con DEFAULT
```

---

*SOFIA DevOps Agent · BankPortal · Release v1.6.0 · 2026-06-20*
*🔒 Go/No-Go APPROVED — Release Manager · 2026-06-20*
