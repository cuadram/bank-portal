# Índice de entregables — BankPortal Sprint 10 — FEAT-008

**Versión:** v1.10.0
**Sprint:** 10
**Feature:** FEAT-008 — Transferencias Bancarias
**Fecha de generación:** 2026-03-20
**Generado por:** SOFIA Documentation Agent — Step 8
**Clasificación:** CONFIDENCIAL — ENTREGABLE CLIENTE

---

## Resumen del paquete

Este paquete contiene todos los artefactos formales del Sprint 10 para
su entrega al cliente Banco Meridian. Todos los documentos siguen el
estilo corporativo Experis (azul #1B3A6B, Arial 11pt, A4).

---

## Artefactos del pipeline (Markdown — fuentes)

| Artefacto | Ruta | Step |
|---|---|---|
| Backlog FEAT-008 | `docs/backlog/FEAT-008.md` | Step 1 |
| Sprint 10 Planning | `docs/sprints/SPRINT-010-planning.md` | Step 1 |
| SRS-FEAT-008 | `docs/srs/SRS-FEAT-008.md` | Step 2 |
| HLD-FEAT-008 | `docs/architecture/hld/HLD-FEAT-008.md` | Step 3 |
| LLD-011 Transfers Backend | `docs/architecture/lld/LLD-011-transfers-backend.md` | Step 3 |
| ADR-015 JWT RS256 | `docs/architecture/hld/ADR-015-jwt-rs256-migration.md` | Step 3 |
| ADR-016 Transfer Saga | `docs/architecture/hld/ADR-016-transfer-saga-pattern.md` | Step 3 |
| Flyway V11 SQL | `apps/backend-2fa/src/main/resources/db/migration/V11__transfers_and_beneficiaries.sql` | Step 4 |
| Code Review Report | `docs/code-review/CR-FEAT-008-sprint10.md` | Step 5 |
| Security Report | `docs/security/SecurityReport-Sprint10-FEAT-008.md` | Step 5b |
| QA Report | `docs/qa/QA-Report-FEAT-008-sprint10.md` | Step 6 |
| Jenkinsfile v1.10.0 | `infra/jenkins/Jenkinsfile` | Step 7 |
| Release Notes v1.10.0 | `docs/releases/RELEASE-NOTES-v1.10.0.md` | Step 7 |

---

## Entregables formales Word (.docx) — generados

| Documento | Archivo | Descripción |
|---|---|---|
| Sprint Report Sprint 10 | `sprint-10-report.docx` | PMC SP 1.1 — velocidad, métricas, DoD |
| SRS Formal | `SRS-FEAT-008.docx` | Especificación de requisitos formal |
| HLD + LLD + ADRs | `architecture-FEAT-008.docx` | Diseño técnico aprobado |
| Test Plan & Report | `QA-Report-FEAT-008.docx` | Plan de pruebas + resultados |
| Security Report | `SecurityReport-Sprint10.docx` | Informe de seguridad PCI-DSS |

## Entregables formales Excel (.xlsx) — generados

| Libro | Archivo | Descripción |
|---|---|---|
| Quality Dashboard | `quality-dashboard-sprint10.xlsx` | Semáforos calidad + métricas |
| NC Tracker | `nc-tracker-sprint10.xlsx` | Registro NCs + estado resolución |
| Sprint Metrics | `sprint-metrics-sprint10.xlsx` | Velocidad, cycle time, burndown |

---

## Métricas finales Sprint 10

| Métrica | Valor |
|---|---|
| Story Points planificados | 24 SP |
| Story Points entregados | 24 SP |
| Velocidad | 24 SP |
| Velocidad media acumulada | 23.9 SP (10 sprints) |
| Tests unitarios nuevos | 23 |
| Tests totales acumulados | ~95 |
| Defectos en QA | 0 |
| Defectos en producción | 0 |
| Cobertura Gherkin | 100% (27/27) |
| CVEs críticos | 0 |
| NCs abiertas | 0 |
| Gates completados | 6/6 |

---

## Trazabilidad completa FEAT-008

| Requerimiento | US/DEBT | Código | Tests | QA | Estado |
|---|---|---|---|---|---|
| RF-801 Transf. propias | US-801 | TransferUseCase | 6 tests | 6 TCs PASS | ✅ |
| RF-802 Transf. beneficiario | US-802 | TransferToBeneficiaryUseCase | 5 tests | 6 TCs PASS | ✅ |
| RF-803 Beneficiarios | US-803 | BeneficiaryManagementUseCase | 7 tests | 7 TCs PASS | ✅ |
| RF-804 Límites + 2FA | US-804 | TransferLimitValidationService | 5 tests | 6 TCs PASS | ✅ |
| RF-805 Testcontainers | DEBT-013 | PostgresTestcontainersConfig | — | 3 TCs PASS | ✅ |
| RF-806 JWT RS256 | DEBT-014 | JwtTokenProvider (RS256) | — | 5 TCs PASS | ✅ |

---

*SOFIA Documentation Agent — Step 8*
*BankPortal Sprint 10 — FEAT-008 — 2026-03-20*
