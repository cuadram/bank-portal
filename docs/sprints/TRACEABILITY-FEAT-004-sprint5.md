# Traceability Log — DEBT-006 + FEAT-004 · Sprint 5

## Metadata

| Campo | Valor |
|---|---|
| **Scope** | DEBT-006 · FEAT-004 (US-301→305) · ACT-18/19/20 · LLD-003 |
| **Sprint** | 5 · 2026-05-12 → 2026-05-23 |
| **Release** | v1.4.0 |

---

## Pipeline completo

| Step | Agente | Artefacto | Gate | Aprobador |
|---|---|---|---|---|
| 1 | SM | SPRINT-005-planning.md + FEAT-004.md | PO | Product Owner |
| 3-ADR | Architect | ADR-009-dual-hmac-key-rotation.md | Tech Lead | Tech Lead |
| 3-LLD | Architect | LLD-backend-trusted-devices.md + LLD-frontend-trusted-devices.md | Tech Lead | Tech Lead |
| 4-PRE | Developer | openapi-2fa.yaml v1.3.0 (ACT-19 — día 1) | — | — |
| 4 | Developer | 9 archivos Java + 3 TypeScript + V7 SQL | — | — |
| 5 | Code Reviewer | CR-FEAT-004-sprint5.md (2 NCs menores resueltas) | Tech Lead | Tech Lead |
| 6 | QA Tester | QA-FEAT-004-sprint5.md (52 TC · 0 NCs) | QA Lead + PO | QA Lead + PO |
| 7 | DevOps | Jenkinsfile + deployment.yaml + RELEASE-v1.4.0.md | Release Manager | Release Manager |
| 8 | SM | SPRINT-005-report.md + TRACEABILITY-FEAT-004-sprint5.md | — | — |

---

## Trazabilidad US → Implementación → Tests → Gate

| US / DEBT | Gherkin | Clases | TCs | Gate |
|---|---|---|---|---|
| DEBT-006 | 5 | `ValidateTrustedDeviceUseCase` (clave dual, `verifyWithFallback`) | TC-D6-01→05 · E2E-S5-01/02 | ✅ |
| ACT-19 | — | `openapi-2fa.yaml` v1.3.0 | Verificado en CR + QA | ✅ |
| LLD-003 | — | LLD-backend + LLD-frontend | Aprobados en gate arquitectura | ✅ |
| US-301 | 4 | `ManageNotificationsUseCase.listNotifications()` + `NotificationController.GET` | TC-301-01→04 · E2E-S5-03/04/12/13 | ✅ |
| US-302 | 5 | `ManageNotificationsUseCase.markOneAsRead/markAllAsRead()` | TC-302-01→05 · E2E-S5-05/06 | ✅ |
| US-303 | 3 | `ManageNotificationsUseCase.countUnread()` · `NotificationStore.badgeLabel()` | TC-303-01→03 · E2E-S5-06/11 | ✅ |
| US-304 | 2 | `NotificationCenterComponent` deep-links + `actionUrl` en BD | TC-304-01/02 · E2E-S5-07/08 | ✅ |
| US-305 | 5 | `SseEmitterRegistry` · `NotificationService.sendSseAsync()` · polling fallback | TC-305-01→05 · E2E-S5-09/10/14 | ✅ |

---

## Trazabilidad ADR → Implementación

| ADR | Decisión | Implementación | Verificado |
|---|---|---|---|
| ADR-009 | Clave dual HMAC — sign con actual, verify con ambas durante gracia | `ValidateTrustedDeviceUseCase.verifyHmac()` + `hmacKeyPrevious` | ✅ TC-D6-01→05 + E2E-S5-01/02 |

---

## Trazabilidad NCs Code Review → Correcciones

| NC | Descripción | Corrección | Verificado en QA |
|---|---|---|---|
| RV-S5-001 | `@Async` + `@Transactional` en mismo método | `sendSseAsync()` separado — solo `@Async`, sin acceso a BD | ✅ TC-305-01 |
| RV-S5-002 | `markOneAsRead` con `Integer.MAX_VALUE` page size | `findByIdAndUserId()` O(1) añadido al puerto | ✅ TC-302-01 + TC-302-02 |

---

## Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| REQM | FEAT-004.md — 5 US con Gherkin · trazabilidad a FEAT |
| PP | SPRINT-005-planning.md — estimación · risks · ACT-10 verificación |
| PMC | SPRINT-005-report.md — 5° sprint consecutivo 24/24 SP · R-S5-004 abierto |
| VER | QA-FEAT-004-sprint5.md — 52 TCs · 0 NCs · verificación OpenAPI v1.3.0 |
| VAL | 14 E2E Playwright — validación en browser real incluyendo DEBT-006 rotación |
| CM | rama `feature/FEAT-004-notification-center` → `main` · tag `v1.4.0` · ADR-009 · LLD-003 |
| OPF | ACT-17→21 verificadas en kick-off Sprint 5 — 5/5 efectivas |
| QPM | Velocidad 24×5 · NCs 2→0→0→0→0 mayor · Deuda: 7→1→2→1→1 controlada |
| CAR | RV-S5-001/002 — 2 causas raíz identificadas en CR · corregidas antes de QA |

---

*SOFIA SM Agent · BankPortal · Sprint 5 · 2026-05-23*
