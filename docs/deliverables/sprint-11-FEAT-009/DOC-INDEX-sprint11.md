# Índice de entregables — BankPortal Sprint 11 — FEAT-009

**Versión:** v1.11.0 | **Sprint:** 11 | **Feature:** FEAT-009 | **Fecha:** 2026-03-21
**Generado por:** SOFIA Documentation Agent — Step 8

---

## Artefactos del pipeline

| Step | Artefacto | Ruta |
|---|---|---|
| 1 | Backlog FEAT-009 | `docs/backlog/FEAT-009.md` |
| 1 | Sprint 11 Planning | `docs/sprints/SPRINT-011-planning.md` |
| 2 | SRS-FEAT-009 | `docs/srs/SRS-FEAT-009.md` |
| 3 | HLD-FEAT-009 | `docs/architecture/hld/HLD-FEAT-009.md` |
| 3 | LLD-012 | `docs/architecture/lld/LLD-012-core-integration-bills.md` |
| 3 | ADR-017 Resilience4j | `docs/architecture/hld/ADR-017-resilience4j-core-integration.md` |
| 3 | ADR-018 Bucket4j | `docs/architecture/hld/ADR-018-bucket4j-rate-limiting.md` |
| 4 | Flyway V12 | `apps/backend-2fa/src/main/resources/db/migration/V12__bills_and_payments.sql` |
| 5 | Code Review Report | `docs/code-review/CR-FEAT-009-sprint11.md` |
| 5b | Security Report | `docs/security/SecurityReport-Sprint11-FEAT-009.md` |
| 6 | QA Report | `docs/qa/QA-Report-FEAT-009-sprint11.md` |
| 7 | Jenkinsfile | `infra/jenkins/Jenkinsfile` |
| 7 | Release Notes | `docs/releases/RELEASE-NOTES-v1.11.0.md` |

---

## Métricas finales Sprint 11

| Métrica | Valor |
|---|---|
| SP planificados / entregados | 20 / 20 (100%) |
| Velocidad media acumulada (11 sprints) | ~23.5 SP/sprint |
| SP totales acumulados | 259 SP |
| Tests unitarios nuevos | 15 |
| Tests totales acumulados | ~110 |
| Defectos QA | 0 |
| CVEs críticos | 0 |
| NCs abiertas | 0 |
| Gates completados | 7/7 |

---

## Trazabilidad FEAT-009

| Req. | US/DEBT | Código | Tests | QA |
|---|---|---|---|---|
| RF-901 BankCoreRestAdapter | US-901 | BankCoreRestAdapter | — | 5 TCs ✅ |
| RF-902 Resilience4j | US-902 | ResilienceConfig | — | 5 TCs ✅ |
| RF-903 Rate limiting | DEBT-016 | RateLimitFilter | 5 tests | 6 TCs ✅ |
| RF-904 Pago recibo | US-903 | BillPaymentUseCase | 5 tests | 6 TCs ✅ |
| RF-905 Pago factura | US-904 | BillLookupAndPayUseCase | 5 tests | 6 TCs ✅ |
| RF-906 Merge develop | DEBT-015 | git merge | — | 2 TCs ✅ |

---

*SOFIA Documentation Agent — Step 8 · BankPortal Sprint 11 — 2026-03-21*
