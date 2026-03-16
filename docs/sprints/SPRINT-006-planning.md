# Sprint Planning — Sprint 6 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 6 |
| **Período** | 2026-05-26 → 2026-06-06 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Ritual de kick-off — Revisión de acciones Sprint 5 Retro (ACT-10)

| Acción | Estado | Verificación |
|---|---|---|
| ACT-22 LLD módulo `notification` antes del código | ⏳ Aplicar desde hoy | Gate arquitectura actualizado abajo |
| ACT-23 `TrustedDevicesComponent.spec.ts` en backlog con SP | ⏳ Planificado | 2 SP en backlog Sprint 6 |
| ACT-24 DEBT-007: SSE + CORS + CDN | ⏳ En backlog Sprint 6 | 3 SP planificados |
| ACT-25 Job @Scheduled HMAC_KEY_PREVIOUS cleanup | ⏳ En backlog Sprint 6 | 2 SP planificados |
| ACT-26 `buildBody()` completo al integrar FEAT-001/002/003 | ⏳ Integrado en FEAT-004 cont. | Parte del trabajo de integración |

---

## Sprint Goal

> **"Completar FEAT-004 al 100% (integración NotificationService + buildBody), arrancar FEAT-005 (Panel de Auditoría: dashboard + exportación + preferencias), saldar deuda operativa (DEBT-007 + HMAC cleanup + tests Angular pendientes)."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad S1–S5 | 24 SP × 5 (máxima confianza) |
| Factor Sprint 6 | 1.0 |
| **Capacidad comprometida** | **24 SP** |

---

## Backlog del Sprint 6

| ID | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|
| ACT-23 | `TrustedDevicesComponent.spec.ts` + cobertura unitaria Angular Sprint 4 | 2 | tests-deuda | Media | FEAT-003 ✅ |
| ACT-25 | Job @Scheduled HMAC_KEY_PREVIOUS vaciar tras 30 días + alerta audit_log | 2 | operabilidad | Media | DEBT-006 ✅ |
| DEBT-007 | SSE + CORS + Spring Security para CDN/proxy en PROD · ADR-010 | 3 | tech-debt | Media | FEAT-004 ✅ |
| FEAT-004 cont. | Integración `NotificationService` con FEAT-001/002/003 · `buildBody()` 13 tipos | 5 | feature | Alta | FEAT-001/002/003 ✅ |
| US-401 | Dashboard de seguridad con resumen visual (30 días + estado cuenta) | 4 | feature | Must Have | audit_log ✅ |
| US-402 | Exportar historial en PDF y CSV (hash integridad SHA-256) | 3 | feature | Must Have | US-401 |
| US-403 | Preferencias de seguridad unificadas (2FA + sesión + dispositivos + notifs) | 3 | feature | Should Have | FEAT-001/002/003/004 ✅ |
| **Total** | | **22 SP** | | | |

> **Nota:** 22 SP planificados dejando 2 SP de buffer para gestión de riesgos R-S6-002
> (integración NotificationService puede ser más compleja de lo estimado).

---

## Orden de ejecución y dependencias

```
Día 1 — prerrequisitos antes del primer commit de código:
  ADR-010 → decisión SSE + CORS + Spring Security (DEBT-007)
  LLD-004 → LLD-backend-notification.md + LLD-frontend-notification.md (ACT-22)
  LLD-005 → LLD-backend-security-audit.md + LLD-frontend-security-audit.md (FEAT-005 ACT-22)

Semana 1:
  ACT-23   → TrustedDevicesComponent.spec.ts          [2 SP · Angular Dev]
  ACT-25   → HMAC_KEY_PREVIOUS cleanup @Scheduled      [2 SP · Backend Dev]
  DEBT-007 → SSE CORS Spring Security config           [3 SP · Backend Dev]
  FEAT-004 cont. → Integración + buildBody()            [5 SP · Backend Dev]
    └─► Flyway V8 si requiere columna de preferencias de notificaciones

Semana 2:
  US-401   → Dashboard seguridad                       [4 SP · Backend + Angular]
  US-402   → Exportación PDF + CSV                     [3 SP · Backend]
    └─► Añadir dependencia OpenPDF a pom.xml
  US-403   → Preferencias de seguridad unificadas      [3 SP · Angular]
    └─► depende de US-401
```

---

## Pre-requisitos técnicos día 1 (ACT-22 pattern)

| Pre-requisito | Responsable | Bloqueante para | Estado |
|---|---|---|---|
| ADR-010: SSE + CORS + Spring Security (DEBT-007) | Architect | DEBT-007 | ⏳ día 1 |
| LLD-004: LLD-backend + LLD-frontend módulo `notification` | Architect | FEAT-004 cont. | ⏳ día 1 |
| LLD-005: LLD-backend + LLD-frontend FEAT-005 | Architect | US-401/402/403 | ⏳ día 1 |
| Dependencia `openpdf` o `itext` en `pom.xml` | Backend Dev | US-402 | ⏳ día 1 |

---

## Migración Flyway V8 (condicional)

Si la integración de `NotificationService` con preferencias de notificaciones (US-403 Escenario 2)
requiere persistir preferencias por tipo de evento:

```sql
-- V8__add_notification_preferences.sql (si aplica)
CREATE TABLE user_notification_preferences (
    user_id       UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type    VARCHAR(64) NOT NULL,
    enabled       BOOLEAN    NOT NULL DEFAULT true,
    updated_at    TIMESTAMP  NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_type)
);
```

Decisión: confirmar en el LLD-004/005 si es necesario.

---

## FEAT-004 cont. — Integración NotificationService

Los use cases de FEAT-001/002/003 deben llamar a `NotificationService.createNotification()`
tras cada evento relevante. Mapeo de integraciones requeridas:

| Módulo | Evento | Call a NotificationService |
|---|---|---|
| `AuthService.login()` (FEAT-001) | Login desde dispositivo nuevo | `LOGIN_NEW_DEVICE` |
| `AuthService.login()` (FEAT-001) | Intentos fallidos > umbral | `LOGIN_FAILED_ATTEMPTS` |
| `RevokeSessionUseCase` (FEAT-002) | Sesión revocada | `SESSION_REVOKED` |
| `RevokeAllSessionsUseCase` (FEAT-002) | Todas revocadas | `SESSION_REVOKED_ALL` |
| `CreateSessionOnLoginUseCase` (FEAT-002) | Sesión eviccionada | `SESSION_EVICTED` |
| `DenySessionByLinkUseCase` (FEAT-002) | Sesión denegada por email | `SESSION_DENIED_BY_USER` |
| `MarkDeviceAsTrustedUseCase` (FEAT-003) | Dispositivo marcado confiable | `TRUSTED_DEVICE_CREATED` |
| `ManageTrustedDevicesUseCase` (FEAT-003) | Dispositivo revocado | `TRUSTED_DEVICE_REVOKED` |
| `TwoFactorService` (FEAT-001) | 2FA activado | `TWO_FA_ACTIVATED` |
| `TwoFactorService` (FEAT-001) | 2FA desactivado | `TWO_FA_DEACTIVATED` |

**Total:** 10 puntos de integración + completar `buildBody()` con los 10 tipos restantes.

---

## Risk Register — Sprint 6

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| R-S5-004 | HMAC_KEY_PREVIOUS no vaciada | M | B | 🟢 | ACT-25 — job @Scheduled que alerta |
| R-S6-001 | SSE bloqueado por CDN/proxy PROD | M | M | 🟡 | ADR-010 día 1 bloqueante para DEBT-007 |
| R-S6-002 | Integración NotificationService scope > estimado | M | M | 🟡 | 2 SP buffer · spike técnico día 1 |
| R-S6-003 | Cobertura unitaria Angular < 80% | B | M | 🟢 | ACT-23 planificado como ítem explícito |
| R-F5-001 | PDF generación síncrona bloquea thread | M | B | 🟢 | @Async + streaming; timeout 30s |
| R-F5-003 | Preferencias notificación desactivan eventos PCI-DSS | M | M | 🟡 | Separar visible vs audit_log (siempre activo) |

---

## Gates HITL Sprint 6

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 ADR-010 + LLD-004 + LLD-005 | ADR-010 + 4 LLDs | Tech Lead | 24 h |
| 🔒 Code Review | CR-FEAT-005-sprint6.md | Tech Lead | 24 h/NC |
| 🔒 QA Doble Gate | QA-FEAT-005-sprint6.md | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.5.0 | RELEASE-v1.5.0.md | Release Manager | 4 h |

---

## Definición de Hecho — Sprint 6

Además del DoD base y los criterios ACT-18/20/22:
- [ ] LLD-004 (notification backend + frontend) aprobado antes del código (ACT-22)
- [ ] LLD-005 (security-audit backend + frontend) aprobado antes del código (ACT-22)
- [ ] ADR-010 aprobado antes del desarrollo de DEBT-007
- [ ] `TrustedDevicesComponent.spec.ts` con cobertura ≥ 80% (ACT-23)
- [ ] HMAC_KEY_PREVIOUS job: alerta en audit_log si GRACE_VERIFY persiste > 35 días (ACT-25)
- [ ] DEBT-007: SSE operativo con CDN/proxy en STG (prueba de carga mínima)
- [ ] `NotificationService` integrada con 10 puntos de FEAT-001/002/003 (FEAT-004 cont.)
- [ ] `buildBody()` con los 13 tipos de evento completos (ACT-26)
- [ ] US-401: dashboard con 4 tarjetas + gráfico + actividad reciente (10 eventos)
- [ ] US-402: PDF con hash SHA-256 + CSV descargas operativas
- [ ] US-403: preferencias unificadas — separación visible vs audit_log verificada (R-F5-003)
- [ ] **OpenAPI actualizada a v1.4.0** con endpoints nuevos de FEAT-005 (ACT-20)
- [ ] Playwright E2E ≥ 12 tests nuevos PASS en Jenkins

---

## Proyección de releases

| Release | Contenido | Fecha estimada |
|---|---|---|
| v1.5.0 | FEAT-004 completa + FEAT-005 + DEBT-007 + ACT-23/25 | 2026-06-06 |
| v1.6.0 | FEAT-006 (por definir tras Sprint 6 Review) | 2026-06-20 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-05-26*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 6*
