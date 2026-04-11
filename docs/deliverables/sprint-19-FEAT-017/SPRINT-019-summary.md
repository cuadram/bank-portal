# Sprint Summary — Sprint 19 · FEAT-017

**BankPortal · Banco Meridian · SOFIA v2.2**

| Campo | Valor |
|---|---|
| Sprint | 19 |
| Período | 2026-05-08 → 2026-05-22 |
| Feature | FEAT-017 Domiciliaciones y Recibos SEPA Direct Debit |
| Release | v1.19.0 |
| Velocity | 24 SP / 24 SP planificados |
| Estado | COMPLETADO |
| Generado | 2026-03-27T13:52:53.876977Z |

---

## Sprint Goal — cumplido

> Permitir al cliente de Banco Meridian gestionar sus domiciliaciones bancarias directamente desde el portal: consultar recibos pendientes y cobrados, dar de alta nuevas domiciliaciones, anular mandatos existentes y recibir notificaciones push en cada cobro, con pleno cumplimiento del esquema SEPA Direct Debit Core.

**Estado: OBJETIVO ALCANZADO AL 100%**

---

## Story Points completados

| US / Item | SP | Estado |
|---|---|---|
| DEBT-031 Rate limiting /cards/pin | 2 | DONE |
| US-1701 Flyway V19 modelo datos | 3 | DONE |
| US-1702 Consulta mandatos y recibos | 4 | DONE |
| US-1703 Alta domiciliación SEPA | 4 | DONE |
| US-1704 Anulación mandato PSD2 D-2 | 3 | DONE |
| US-1705 Notificaciones push | 4 | DONE |
| US-1706 Frontend Angular | 4 | DONE |
| **TOTAL** | **24** | **24/24** |

---

## Métricas de calidad

| Métrica | Valor |
|---|---|
| Tests totales Sprint 19 | 31 nuevos |
| Total acumulado BankPortal | 708 tests |
| Cobertura unitaria | 87% |
| Defectos en producción | 0 |
| NCS (New Critical/Showstopper) | 0 |
| OWASP Top 10 | 10/10 PASS |
| Verificaciones normativas | 7/7 PASS |
| Semáforo seguridad | GREEN |

---

## Entregables generados

| Artefacto | Ruta |
|---|---|
| Sprint Planning | docs/sprints/SPRINT-019-planning.md |
| SRS FEAT-017 | docs/requirements/SRS-FEAT-017-sprint19.md |
| Análisis Funcional | docs/functional-analysis/FA-FEAT-017-sprint19.md |
| HLD Arquitectura | docs/architecture/hld/HLD-FEAT-017.md |
| LLD Backend | docs/architecture/lld/LLD-FEAT-017-backend.md |
| LLD Frontend | docs/architecture/lld/LLD-FEAT-017-frontend.md |
| ADR-029 SEPA Storage | docs/architecture/adr/ADR-029-sepa-mandate-storage.md |
| OpenAPI Contract | docs/architecture/openapi/openapi-direct-debits-v1.yaml |
| Code Review | docs/code-review/CR-FEAT-017-sprint19.md |
| Security Report | docs/security/SEC-FEAT-017-sprint19.md |
| Test Execution Log | docs/qa/TEST-EXECUTION-FEAT-017-sprint19.md |
| QA Report | docs/qa/QA-FEAT-017-sprint19.md |
| Release Notes v1.19.0 | docs/releases/RELEASE-NOTES-v1.19.0.md |
| Runbook v1.19.0 | docs/runbooks/RUNBOOK-backend-2fa-v1.19.0.md |

---

## Decisiones técnicas tomadas

| ADR | Decisión |
|---|---|
| ADR-029 | BD propia PostgreSQL 16 para mandatos SEPA (vs delegación CoreBanking) |
| ADR-018 (vigente) | Bucket4j rate limiting — extendido para DEBT-031 /cards/pin |
| ADR-028 (vigente) | ShedLock scheduler — reutilizado para SimulaCobroJob |

---

## Métricas acumuladas BankPortal (S1–S19)

| Métrica | Valor |
|---|---|
| Story Points totales | 449 SP |
| Sprints completados | 19 |
| Velocity media | 23.6 SP/sprint |
| Tests automatizados | 708 |
| Cobertura | 87% |
| Defectos en producción | 0 |
| CVE críticos | 0 |
| CMMI Level | 3 |

---

*Documentation Agent · CMMI PP SP 3.3 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19*