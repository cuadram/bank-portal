# Traceability Log — FEAT-005 + FEAT-004 cont. + ACT-23/25 + DEBT-007 · Sprint 6

## Metadata

| Campo | Valor |
|---|---|
| **Scope** | ACT-23/25/26 · DEBT-007 · FEAT-004 cont. · FEAT-005 US-401/402 |
| **Sprint** | 6 · 2026-05-26 → 2026-06-06 |
| **Release** | v1.5.0 |

---

## Pipeline completo

| Step | Agente | Artefacto | Gate | Aprobador |
|---|---|---|---|---|
| 1 | SM | SPRINT-006-planning.md + FEAT-005.md | PO | ✅ |
| 3 | Architect | ADR-010 + LLD-004 + LLD-005 (4 LLDs) | Tech Lead | ✅ |
| 4 | Developer | 12 Java + 5 TS + 1 spec Angular | — | — |
| 5 | Code Reviewer | CR-FEAT-005-sprint6.md (2 NCs menores) | Tech Lead | ✅ |
| 6 | QA Tester | QA-FEAT-005-sprint6.md (58 TC · 0 NCs) | QA Lead + PO | ✅ |
| 7 | DevOps | RELEASE-v1.5.0.md + deployment v1.5.0 | Release Manager | ✅ |
| 8 | SM | SPRINT-006-report.md + Traceability | — | — |

---

## Trazabilidad US → Implementación → Tests

| Item | Implementación | TCs | Gate |
|---|---|---|---|
| ACT-23 | `TrustedDevicesComponent.spec.ts` — 8 tests Angular | TC-A23-01→08 | ✅ |
| ACT-25 | `HmacKeyRotationMonitorJob` — @Scheduled 03:00 UTC | TC-A25-01→03 | ✅ |
| DEBT-007 | `NotificationController` — headers ADR-010 en `/stream` | TC-D7-01/02 + E2E-S6-03 | ✅ |
| FEAT-004 cont. | `NotificationService.buildBody()` exhaustivo × 12 tipos | TC-F4C-01→12 + E2E-S6-14/15 | ✅ |
| US-401 | `SecurityDashboardUseCase` + `SecurityDashboardComponent` | TC-401-01→05 + E2E-S6-05→08 | ✅ |
| US-402 | `ExportSecurityHistoryUseCase` + `SecurityExportComponent` | TC-402-01→06 + E2E-S6-09→12 | ✅ |

---

## Trazabilidad ADR → Implementación

| ADR | Implementación | Verificado |
|---|---|---|
| ADR-010 | `NotificationController.streamNotifications()` — `X-Accel-Buffering: no` + `Cache-Control: no-cache, no-store` | ✅ TC-D7-01 + runbook STG |
| ADR-004 | `AuditLogQueryRepository` — solo lectura, sin writes | ✅ revisión de código |

---

## Trazabilidad NCs → Correcciones

| NC | Corrección | Verificado en QA |
|---|---|---|
| RV-S6-001 | Import `TrustedDeviceRepository` eliminado de `HmacKeyRotationMonitorJob` | ✅ compilación sin warnings |
| RV-S6-002 | Import `@Async` eliminado de `ExportSecurityHistoryUseCase` | ✅ compilación sin warnings |

---

## Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| REQM | FEAT-005.md · US-401/402 con Gherkin · trazabilidad completa |
| PP | SPRINT-006-planning.md · 22 SP + 2 buffer · risks · ACT-10 |
| PMC | SPRINT-006-report.md · 6 sprints · DEBT-008 nuevo · R-S5-004 monitored |
| VER | QA-FEAT-005-sprint6.md · 58 TCs · 0 NCs · ADR-010 verificado en STG |
| VAL | 16 E2E Playwright · PDF/CSV descargados en browser real |
| CM | `feature/FEAT-005-security-audit-panel` → `main` · tag `v1.5.0` · ADR-010 · 4 LLDs |
| OPF | ACT-22→26 verificadas 5/5 · 4 sprints consecutivos 100% efectividad |
| QPM | SP 22/22 · NCs menores 2 (imports residuales, causa raíz diferente a S5) · Defectos 0×6 |
| CAR | RV-S6-001/002 — imports residuales sin LLD como causa raíz (diferente de S5) |
| MA | 6 sprints · velocidad media 23.7 SP · 0 defectos QA · 34 gates HITL completados |

---

*SOFIA SM Agent · BankPortal · Sprint 6 · 2026-06-06*
