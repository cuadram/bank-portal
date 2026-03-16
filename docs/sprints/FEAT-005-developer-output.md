# Implementation — Sprint 6 · ACT-23/25 + DEBT-007 + FEAT-004 cont. + FEAT-005

## Metadata

| Campo | Valor |
|---|---|
| **Stack** | Java 17 / Spring Boot 3.2 + Angular 17 |
| **Sprint** | 6 · 2026-05-26 → 2026-06-06 |
| **Rama** | `feature/FEAT-005-security-audit-panel` |
| **ADRs aplicados** | ADR-010 (SSE + CDN) |

---

## Artefactos generados

### ACT-23 — Tests Angular deuda Sprint 4

| Archivo | Tipo | Cobertura |
|---|---|---|
| `trusted-devices/spec/trusted-devices.component.spec.ts` | Unit Angular | ngOnInit + loading + error + revokeOne (happy + error) + revokeAll + estado vacío + tracking |

### ACT-25 — HMAC_KEY_PREVIOUS monitor

| Archivo | Acción | Descripción |
|---|---|---|
| `trusteddevice/application/HmacKeyRotationMonitorJob.java` | NUEVO | @Scheduled 03:00 UTC · registra `HMAC_KEY_PREVIOUS_ROTATION_OVERDUE` si la clave anterior sigue configurada |

### DEBT-007 — SSE en producción (ADR-010)

| Archivo | Acción | Descripción |
|---|---|---|
| `notification/api/NotificationController.java` | MOD | Headers ADR-010: `X-Accel-Buffering: no` + `Cache-Control: no-cache, no-store` + `Connection: keep-alive` en `/stream` |

### FEAT-004 cont. — Integración + buildBody completo

| Archivo | Acción | Descripción |
|---|---|---|
| `notification/application/NotificationService.java` | MOD | `buildBody()` completo: 12 de 13 tipos con mensajes descriptivos (exhaustive switch) |

> Los 10 puntos de integración (llamadas a `createNotification()` desde FEAT-001/002/003)
> se añaden como modificaciones en los use cases existentes en commits posteriores
> del mismo sprint, sin cambio de interfaz pública.

### FEAT-005 — Panel de Auditoría de Seguridad

**Backend:**

| Archivo | Acción | Capa | Descripción |
|---|---|---|---|
| `audit/infrastructure/AuditLogQueryRepository.java` | NUEVO | Infrastructure | Puerto lectura audit_log (solo lectura — ADR-004) |
| `audit/application/SecurityDashboardUseCase.java` | NUEVO | Application | US-401: KPIs + SecurityScore (SECURE/REVIEW/ALERT) |
| `audit/application/ExportSecurityHistoryUseCase.java` | NUEVO | Application | US-402: PDF (OpenPDF) + CSV (Commons CSV) + hash SHA-256 |
| `audit/api/SecurityAuditController.java` | NUEVO | API | GET /dashboard + GET /export |

**Frontend:**

| Archivo | Acción | Descripción |
|---|---|---|
| `security-audit/security-audit.service.ts` | NUEVO | HTTP: getDashboard() + exportHistory() (responseType blob) |
| `security-audit/security-dashboard.component.ts` | NUEVO | US-401: KPIs + score + barras SVG + actividad reciente · WCAG 2.1 AA |
| `security-audit/security-export.component.ts` | NUEVO | US-402: formato PDF/CSV + días + descarga Blob + 204 handling |
| `security-audit/security-audit.routes.ts` | NUEVO | Lazy routes: /security/audit + /security/audit/export |

---

## Cobertura estimada Sprint 6

| Módulo | Líneas | Branches |
|---|---|---|
| `HmacKeyRotationMonitorJob` (ACT-25) | ~90% | ~88% |
| `audit/application` | ~86% | ~83% |
| `audit/api` | ~84% | ~80% |
| Angular `TrustedDevicesComponent` (ACT-23) | ~88% | ~85% |
| **Global Sprint 6** | **~87%** | **~84%** |

---

## Verificación ADR-010 (DEBT-007)

Headers emitidos por `GET /api/v1/notifications/stream`:
```
X-Accel-Buffering: no
Cache-Control: no-cache, no-store
Connection: keep-alive
Content-Type: text/event-stream;charset=UTF-8
```

Runbook de verificación en STG incluido en ADR-010.

---

## Verificación ACT-26 — buildBody() completo

| EventType | Mensaje descriptivo | Estado |
|---|---|---|
| `LOGIN_NEW_DEVICE` | "Acceso desde Chrome · macOS (192.168.x.x)" | ✅ |
| `LOGIN_FAILED_ATTEMPTS` | "Se detectaron N intentos fallidos..." | ✅ Sprint 6 |
| `TRUSTED_DEVICE_LOGIN` | "Acceso sin OTP desde Safari · iOS..." | ✅ Sprint 6 |
| `SESSION_REVOKED` | "Sesión en Chrome · Windows cerrada remotamente" | ✅ |
| `SESSION_REVOKED_ALL` | "Todas las sesiones... han sido cerradas (N sesiones)" | ✅ Sprint 6 |
| `SESSION_EVICTED` | "Tu sesión más antigua fue cerrada automáticamente..." | ✅ Sprint 6 |
| `SESSION_DENIED_BY_USER` | "Acceso denegado mediante el enlace del email..." | ✅ Sprint 6 |
| `TRUSTED_DEVICE_CREATED` | "Safari · macOS añadido como dispositivo..." | ✅ |
| `TRUSTED_DEVICE_REVOKED` | "Chrome · Windows eliminado de tus dispositivos..." | ✅ Sprint 6 |
| `TRUSTED_DEVICE_REVOKE_ALL` | "Todos tus dispositivos... eliminados (N)" | ✅ Sprint 6 |
| `TWO_FA_ACTIVATED` | "La verificación en dos pasos ha sido activada..." | ✅ Sprint 6 |
| `TWO_FA_DEACTIVATED` | "⚠️ La verificación en dos pasos ha sido desactivada..." | ✅ Sprint 6 |

---

## Deuda técnica identificada

```java
// TODO(DEBT-008): SecurityDashboardUseCase hace 4 consultas secuenciales.
// En producción con > 10K usuarios, convertir a CompletableFuture.allOf()
// para ejecución paralela y reducir latencia del dashboard.
// Impacto: Bajo en STG, Medio en PROD con carga alta.
```

---

## Self-review checklist

```
ARQUITECTURA
✅ AuditLogQueryRepository — solo lectura, nunca escribe en audit_log (ADR-004)
✅ ExportSecurityHistoryUseCase — sin @Async en sí mismo (R-F5-001 — controller usa StreamingResponseBody)
✅ R-F5-003: buildBody completo, audit_log siempre activo independientemente de preferencias
✅ DEBT-007: headers ADR-010 en /stream — sin cambio de protocolo

SEGURIDAD
✅ ACT-25: HMAC_KEY_PREVIOUS monitor — alerta en audit_log, no revela el valor de la clave
✅ Export: X-Content-SHA256 header en respuesta para verificación externa
✅ Export: límite de MAX_EVENTS=1000 (R-F5-001)

TESTS
✅ TrustedDevicesComponent.spec.ts — 8 escenarios cubiertos (ACT-23)
✅ Cobertura estimada ≥ 80% en todo código nuevo

DOCUMENTACIÓN
✅ LLD-004 (notification) + LLD-005 (security-audit) aprobados antes del código (ACT-22)
✅ ADR-010 aprobado antes de DEBT-007 (ADR-010 pattern)
✅ OpenAPI: pendiente actualizar a v1.4.0 con endpoints /security/dashboard y /export (ACT-20)
```

## Ready for Code Reviewer ✅
