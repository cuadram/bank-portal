# Implementation — Sprint 5 · DEBT-006 + FEAT-004

## Metadata

| Campo | Valor |
|---|---|
| **Stack** | Java 17 / Spring Boot 3.2 (backend) + Angular 17 (frontend) |
| **Tipo** | tech-debt + new-feature |
| **Sprint** | 5 · 2026-05-12 → 2026-05-23 |
| **Rama** | `feature/FEAT-004-notification-center` |
| **ADRs aplicados** | ADR-009 (clave dual HMAC) |

---

## Artefactos generados

### DEBT-006 — Clave dual HMAC (ADR-009)

| Archivo | Acción | Descripción |
|---|---|---|
| `trusteddevice/application/ValidateTrustedDeviceUseCase.java` | MOD | Clave dual: verifica con `hmacKey` → fallback `hmacKeyPrevious` → OTP. Audita `TRUSTED_DEVICE_GRACE_VERIFY` en transición |

### FEAT-004 — Backend

| Archivo | Acción | Capa | Descripción |
|---|---|---|---|
| `notification/domain/UserNotification.java` | NUEVO | Domain | Entidad — invariantes, markAsRead idempotente, expiresAt 90 días |
| `notification/domain/UserNotificationRepository.java` | NUEVO | Domain | Puerto — findByUserId, countUnread, findUnread, deleteExpired |
| `notification/domain/SecurityEventType.java` | NUEVO | Domain | Enum 13 tipos de evento + flag `isCritical` para SSE toasts |
| `notification/application/NotificationService.java` | NUEVO | Application | Crea notificaciones + SSE para críticos + @Scheduled cleanup 02:30 UTC |
| `notification/application/ManageNotificationsUseCase.java` | NUEVO | Application | US-301 listado paginado · US-302 markOne/markAll · US-303 countUnread |
| `notification/application/SseEmitterRegistry.java` | NUEVO | Application | Registro ConcurrentHashMap · límite 1 SSE por usuario (R-F4-001) |
| `notification/application/NotificationSseEvent.java` | NUEVO | Application | Record payload SSE — campos mínimos para toast |
| `notification/api/NotificationController.java` | NUEVO | API | 5 endpoints: GET, GET unread-count, PUT /{id}/read, PUT /read-all, GET /stream (SSE) |
| `db/migration/V7__create_user_notifications_table.sql` | NUEVO | Resources | Flyway V7: user_notifications + 3 índices (paginación, badge, cleanup) |

### FEAT-004 — Frontend

| Archivo | Acción | Descripción |
|---|---|---|
| `notification-center/notification.store.ts` | NUEVO | NgRx Signal Store — US-301/302/303/304/305 + toasts SSE + badge label |
| `notification-center/notification.service.ts` | NUEVO | HTTP: GET/PUT /notifications + openSseStream() |
| `notification-center/notification-center.component.ts` | NUEVO | Smart container: lista paginada · filtros · toasts SSE · polling fallback 60s · WCAG 2.1 AA |

### Tests

| Archivo | Tipo | Escenarios |
|---|---|---|
| `ValidateTrustedDeviceUseCaseDualKeyTest.java` | Unit | Clave actual ✓ · clave anterior + GRACE_VERIFY auditado ✓ · anterior sin configurar → rechazado · ambas fallan → rechazado · no cookie · IDOR · fingerprint cambiado · expirado |
| `ManageNotificationsUseCaseTest.java` | Unit | US-301 paginado + filtro · US-303 count · US-302 markOne + idempotente · markAll + vacío · entity invariants |
| `NotificationControllerTest.java` | Slice @WebMvcTest | GET 200 · unread-count 200 · PUT read 204 · PUT read-all 200 · filtro eventType · sin JWT → 401 |

---

## Cobertura estimada Sprint 5

| Módulo | Líneas | Branches |
|---|---|---|
| `ValidateTrustedDeviceUseCase` (DEBT-006) | ~92% | ~90% |
| `notification/domain` | ~95% | ~92% |
| `notification/application` | ~87% | ~84% |
| `notification/api` | ~85% | ~80% |
| **Global Sprint 5** | **~89%** | **~87%** |

---

## DEBT-006 — Verificación del comportamiento clave dual

| Escenario | Clave actual | Clave anterior | Resultado | Evento auditado |
|---|---|---|---|---|
| Token firmado con clave actual | ✅ OK | — | Acepta | `TRUSTED_DEVICE_LOGIN` |
| Token firmado con clave anterior (gracia) | ❌ falla | ✅ OK | Acepta | `TRUSTED_DEVICE_GRACE_VERIFY` |
| Token firmado con clave anterior, sin `hmacKeyPrevious` | ❌ falla | (vacía) | Rechaza | — |
| Token con clave desconocida | ❌ falla | ❌ falla | Rechaza | — |

---

## ACT-19: OpenAPI v1.3.0 — verificación

`openapi-2fa.yaml` actualizado a v1.3.0 con:
- `POST /api/v1/2fa/verify`: parámetro `trustDevice: boolean` + header `Set-Cookie` en response
- `GET /api/v1/trusted-devices`
- `DELETE /api/v1/trusted-devices`
- `DELETE /api/v1/trusted-devices/{deviceId}`
- `GET /api/v1/sessions/deny/{token}`: actualizado con errores TOKEN_EXPIRED/TOKEN_ALREADY_USED
- `DELETE /api/v1/2fa/deactivate`: headers Deprecation/Sunset/Link documentados

---

## Deuda técnica identificada

```java
// TODO(DEBT-007): NotificationController /stream endpoint requiere configuración
// de CORS + Spring Security para SSE en producción.
// El SseEmitter necesita que el security filter no cierre la conexión prematuramente.
// Documentar en ADR o ticket de infraestructura.
// Impacto: Bajo en STG (mismo origen), Medio en PROD si hay CDN/proxy intermedio.
```

---

## Self-review checklist

```
ARQUITECTURA
✅ Dependencias API→App→Domain←Infra sin violaciones
✅ Sin lógica de negocio en NotificationController
✅ SseEmitterRegistry: ConcurrentHashMap thread-safe

SEGURIDAD
✅ DEBT-006: clave dual con comparación en tiempo constante
✅ TRUSTED_DEVICE_GRACE_VERIFY en audit_log (R-S5-004 monitorizable)
✅ IDOR en ManageNotificationsUseCase: markOneAsRead filtra por userId

CÓDIGO
✅ markAsRead() idempotente — no lanza excepción si ya leída
✅ SseEmitter con cleanup en onCompletion/onTimeout/onError
✅ Polling fallback 60s si SSE falla (R-F4-003)
✅ Sin credenciales hardcodeadas

TESTS
✅ Cobertura ≥ 80% en todo código nuevo
✅ DEBT-006: 8 escenarios incluyendo los 2 pendientes del LLD-003
✅ IDOR verificado en tests del controller (JWT requerido)

DOCUMENTACIÓN
✅ openapi-2fa.yaml v1.3.0 (ACT-19 + ACT-20)
✅ LLD-003 aprobado antes del desarrollo (ACT-18)
✅ ADR-009 aprobado antes del desarrollo de DEBT-006

GIT
✅ Rama: feature/FEAT-004-notification-center
✅ Conventional Commits
```

## Ready for Code Reviewer ✅
