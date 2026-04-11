# Post-Mortem — Sprint 20 · FEAT-018 · v1.20.0
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **Fecha cierre:** 2026-03-30 | **SOFIA:** v2.3  

---

## Estado final

| Métrica | Valor |
|---|---|
| SP entregados | 24/24 (100%) |
| NCS | 0 |
| Defectos producción | 0 |
| Cobertura | 88% |
| SP acumulados | 473 |
| Velocidad media S1-S20 | 23.65 SP/sprint |

---

## Lecciones aprendidas S20

| ID | Tipo | Descripción | Corrección |
|---|---|---|---|
| LA-020-01 | Proceso | Jira no actualizado automáticamente en cada step | Transición automática en cada gate — regla permanente |
| LA-020-02 | Seguridad | Hallazgos CVSS ≥ 4.0 diferibles | Resueltos en mismo sprint de detección — no diferir |
| LA-020-03 | Arquitectura | Audit log con proxy IBAN en lugar de dato real | DEBT-036: inyectar AccountRepository en ExportAuditService |
| LA-020-04 | DevOps | Workflow Jira sin estados SOFIA desde inicio | Checklist onboarding: configurar workflow antes de Sprint 1 |
| LA-020-05 | Proceso CRÍTICO | Documentation Agent no ejecutado en Step 8 (DOCX+XLSX+dashboard omitidos) | Bloqueante para Gate G-9 desde Sprint 21 |
| LA-020-06 | Proceso | sprint-NN-planning-doc.docx faltaba en S18, S19, S20 | Bloqueante para Gate G-8 — verificar estructura canónica vs sprint anterior |
| LA-020-07 | Dashboard | Dashboard solo se regeneraba al cierre de sprint, no en cada gate | gate-dashboard-hook.js invocado en cada gate. dashboard_on_every_gate:true |

---

## Deuda técnica pendiente → Sprint 21

| ID | Descripción | CVSS | Prioridad |
|---|---|---|---|
| DEBT-036 | IBAN real en audit log desde AccountRepository | — | Media |
| DEBT-037 | Regex PAN ampliar a Maestro 19 dígitos | 2.1 | Baja |

---

## Checklist de cierre verificado

- [x] SCRUM-98..105 en estado Finalizada en Jira
- [x] Confluence: Sprint 20 Resultados (5996545) + Retrospectiva (6029313)
- [x] `docs/deliverables/sprint-20-FEAT-018/word/` — 11 DOCX + planning-doc
- [x] `docs/deliverables/sprint-20-FEAT-018/excel/` — 3 XLSX
- [x] `docs/dashboard/bankportal-global-dashboard.html` — actualizado con luces CMMI
- [x] `docs/sprints/SPRINT-020-data.json` — métricas para dashboard global
- [x] `docs/functional-analysis/fa-index.json` — FEAT-018 + DEBT-035 DELIVERED, 63 funcionalidades
- [x] `docs/sprints/SPRINT-020-retrospectiva.md` — 7 LAs registradas (LA-020-01..07)
- [x] `.sofia/session.json` — status: completed, sprint_closed: true
- [x] `.sofia/sofia.log` — auditado

---

*SOFIA v2.3 · Workflow Manager · Sprint 20 cerrado · 2026-03-30*
