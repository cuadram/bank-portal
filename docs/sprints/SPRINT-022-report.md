# SPRINT-022 — Informe de Cierre
## BankPortal · Banco Meridian · FEAT-020 Gestión de Préstamos Personales

**Generado:** 2026-04-04  
**Versión:** v1.22.0  
**Sprint:** 22 | **Story Points:** 24 | **SP Acumulados:** 521  
**Estado:** ✅ CERRADO — G-1..G-9 aprobados

---

## Objetivo del Sprint

Permitir al usuario de Banco Meridian consultar sus préstamos activos, simular nuevas financiaciones y solicitar un préstamo personal de forma digital, con cuadro de amortización y cumplimiento PSD2 / Ley 16/2011 de crédito al consumo.

---

## Entrega

| Componente | Detalle |
|---|---|
| Feature | FEAT-020 Gestión de Préstamos Personales |
| Release | v1.22.0 |
| Tag Git | v1.22.0 |
| Flyway | V24__loans_and_applications.sql |
| Jira | SCRUM-114..121 (8 issues → Finalizada) |
| Confluence | Sprint 22 Resultados #7634945 · Retrospectiva #7667713 |

---

## Métricas de Calidad

| Métrica | Sprint 22 | Acumulado |
|---|---|---|
| Story Points | 24 | 521 |
| Tests totales | 51 | 906 |
| Tests PASS | 51 (100%) | — |
| Cobertura | 88% | 88% |
| Defectos PRD | 0 | 0 |
| NCs bloqueantes | 0 | — |
| CVEs críticos | 0 | — |
| Semáforo seg. | GREEN | — |

---

## Arquitectura implementada (Step 4)

**Backend (Java 21 / Spring Boot 3.3.4):**
- `loan/domain/model`: Loan, LoanApplication, LoanStatus, LoanPurpose, AmortizationRow
- `loan/domain/service`: AmortizationCalculator (BigDecimal HALF_EVEN, ADR-034)
- `loan/application/usecase`: List, GetDetail, Simulate, Apply, GetAmortization, Cancel (6 UC)
- `loan/infrastructure/persistence`: JPA adapters + entities (2+2)
- `loan/infrastructure/scoring`: CoreBankingMockScoringClient (ADR-035)
- `loan/api`: LoanController + LoanExceptionHandler

**Frontend (Angular 17):**
- `features/loans`: LoansModule, LoansRoutingModule
- Componentes: LoanList, LoanDetail, LoanSimulator, LoanApplicationForm, AmortizationTable
- Ruta `/prestamos` registrada en app-routing + nav item Préstamos 🏛

**Deuda cerrada:** DEBT-043 (ProfileController /notifications → 200 OK)

---

## Gates aprobados

| Gate | Step | Aprobador | Fecha |
|---|---|---|---|
| G-1 | 1 | Product Owner | 2026-04-02T09:56 |
| G-2 | 2 | Product Owner | 2026-04-02T10:20 |
| HITL-PO-TL | 2c | PO + Tech Lead | 2026-04-02T10:44 |
| G-4 | 4 | Tech Lead | 2026-04-02T19:11 |
| G-5 | 5 | Tech Lead | 2026-04-02T19:28 |
| G-6 | 6 | QA Lead + PO | 2026-04-02T19:35 |
| G-7 | 7 | Release Manager | 2026-04-02T19:37 |
| G-8 | 8 | Project Manager | 2026-04-02T20:18 |
| G-9 | 9 | Product Owner | 2026-04-02T21:18 |

---

## Verificación STG (v1.22.0)

- **Smoke test:** 15/17 OK, 0 FAIL, 2 SKIP
- **Flyway V24:** 24/24 migrations OK
- **Bug detectado y corregido:** BUG-STG-022-002 — `LoanExceptionHandler` scope no cubría `InvalidOtpException` → HTTP 500 corregido a 401
- **DEBT-043 CLOSED:** `/profile/notifications` → 200 OK (8 notificaciones)

---

## Entregables CMMI (17 DOCX + 3 XLSX)

Ruta: `docs/deliverables/sprint-22-FEAT-020/word/` y `/excel/`

| # | Documento |
|---|---|
| 1 | SRS-FEAT-020-Sprint22.docx |
| 2 | HLD-FEAT-020-Sprint22.docx |
| 3 | LLD-FEAT-020-Backend-Sprint22.docx |
| 4 | LLD-FEAT-020-Frontend-Sprint22.docx |
| 5 | QA-Report-FEAT-020-Sprint22.docx |
| 6 | Code-Review-FEAT-020-Sprint22.docx |
| 7 | Security-Report-FEAT-020-Sprint22.docx |
| 8 | Release-Notes-v1.22.0-Sprint22.docx |
| 9 | Runbook-v1.22.0-Sprint22.docx |
| 10 | Sprint-22-Report-PMC.docx |
| 11 | CMMI-Evidence-Sprint22.docx |
| 12 | MEETING-MINUTES-Sprint22.docx |
| 13 | PROJECT-PLAN-v1.22.docx |
| 14 | QUALITY-SUMMARY-Sprint22.docx |
| 15 | RISK-REGISTER-Sprint22.docx |
| 16 | TRACEABILITY-FEAT-020-Sprint22.docx |
| 17 | sprint22-planning-doc.docx |
| E1 | NC-Tracker-Sprint22.xlsx |
| E2 | Decision-Log-Sprint22.xlsx |
| E3 | Quality-Dashboard-Sprint22.xlsx |

---

## Lessons Learned registradas en Sprint 22

- **LA-022-01** · Security: GR-010 bloqueante para deudas CVSS≥4.0 vencidas
- **LA-022-02** · Process: LESSONS_LEARNED.md regenerado en Step 9 (gen-lessons-learned.py)
- **LA-022-03** · Process: agentes sin gate se formalizan o archivan
- **LA-022-04** · Security: open_debts deduplicación por id en GR-010
- **LA-022-05** · Dashboard: GR-011 bloqueante si dashboard desactualizado
- **LA-022-06** · Dashboard: gate_pending normalizado string→objeto + parseArg()
- **LA-022-07** · Process: Step 3b OBLIGATORIO post G-3
- **LA-022-08** · Process: Doc Agent genera DOCX/XLSX binarios reales
- **LA-022-09** · DevOps: seeds Flyway siempre vía stack, nunca psql directo
- **LA-023-01** · Frontend: [href] nativo causa full page reload en Angular

---

## Deuda técnica activa al cierre

| ID | Área | CVSS | Target | Descripción |
|---|---|---|---|---|
| DEBT-037 | Security | 2.1 | S22 | Regex PAN Maestro 19d |
| DEBT-044 | Backend | N/A | S23 | TAE externalizar a application.properties |

**FA-BankPortal-Banco-Meridian.docx:** v3.0 · 70KB · 78 funcionalidades · 188 reglas de negocio · S1–S22

---

*Generado automáticamente por SOFIA v2.6 · sprint-closed 2026-04-02T21:18:00Z*
