# SPRINT 22 — Planning
**Feature:** FEAT-020 — Gestión de Préstamos Personales
**Versión objetivo:** v1.22.0
**Capacidad:** 24 SP | **Velocidad referencia:** 23.7 SP/sprint
**Gate G-1 aprobado:** 2026-04-02 — Product Owner (Angel)
**Confluence:** https://nemtec.atlassian.net/wiki/spaces/SOFIA/pages/7307265
**SOFIA:** v2.6 | **Pipeline steps:** 17 | **Agentes:** 23

---

## Sprint Goal

> *Permitir al usuario de Banco Meridian consultar sus préstamos activos, simular nuevas financiaciones y solicitar un préstamo personal de forma digital, con cuadro de amortización y cumplimiento PSD2 / Ley 16/2011 de crédito al consumo.*

---

## Backlog Sprint 22

| Issue | Descripción | SP | Tipo | Componente |
|---|---|---|---|---|
| SCRUM-114 | Arquitectura + modelo dominio Préstamos | 2 | Feature | Arq. |
| SCRUM-115 | Backend: listado y detalle de préstamos activos | 3 | Feature | Backend |
| SCRUM-116 | Backend: simulador préstamo (método francés + TAE) | 3 | Feature | Backend |
| SCRUM-117 | Backend: solicitud préstamo con pre-scoring y 2FA | 4 | Feature | Backend/Sec |
| SCRUM-118 | Backend: cuadro amortización y cancelación | 3 | Feature | Backend |
| SCRUM-119 | Frontend Angular: módulo Préstamos completo | 5 | Feature | Frontend |
| SCRUM-120 | DEBT-043: GET /profile/notifications y /sessions 404 | 2 | Deuda | Backend |
| SCRUM-121 | DEBT-036+037: IBAN audit log + Regex PAN Maestro | 2 | Deuda | Backend/Sec |
| **TOTAL** | | **24 SP** | 19F + 5D | |

---

## Dominios técnicos nuevos

### Modelo de dominio
```
Loan {id, userId, tipo, importeOriginal, importePendiente, plazo, tae, cuotaMensual, estado, fechaInicio, fechaFin}
LoanApplication {id, userId, importe, plazo, finalidad, estado, scoringResult, createdAt}
AmortizationSchedule {loanId, cuotas: [{n, fecha, capital, intereses, cuotaTotal, saldoPendiente}]}
LoanStatus: ACTIVE | PENDING | APPROVED | REJECTED | PAID_OFF | CANCELLED
LoanPurpose: CONSUMO | VEHICULO | REFORMA | OTROS
```

### API endpoints FEAT-020
```
GET    /api/v1/loans                      → lista préstamos activos del usuario
GET    /api/v1/loans/{id}                 → detalle préstamo
GET    /api/v1/loans/{id}/amortization    → cuadro de amortización
POST   /api/v1/loans/simulate             → simulación stateless (no persiste)
POST   /api/v1/loans/applications         → crear solicitud (OTP 2FA obligatorio)
GET    /api/v1/loans/applications/{id}    → estado solicitud
DELETE /api/v1/loans/applications/{id}    → cancelar solicitud PENDING
```

### Flyway
- V24__loans_and_applications.sql — tablas `loans`, `loan_applications`

### ADR-034
- Cálculo TAE: método francés, BigDecimal escala 10, HALF_EVEN rounding
- Directiva 2008/48/CE: fórmula estándar europea de crédito al consumo

---

## Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| RSK-022-01 | CoreBanking scoring no disponible en STG | Alta | Alto | Mock determinista: hash(userId) % 1000 → score |
| RSK-022-02 | Precisión BigDecimal en cálculo TAE | Media | Medio | 5 tests regulatorios antes de G-4 |
| RSK-022-03 | DEBT-043 más complejo de lo estimado | Baja | Bajo | Cap 3 SP — renegociar si supera |

---

## Deuda técnica asignada

| ID | Descripción | SP | Target |
|---|---|---|---|
| DEBT-043 | GET /profile/notifications y /sessions → 404 en STG | 2 | SCRUM-120 |
| DEBT-036 | IBAN real en export_audit_log | 1 | SCRUM-121 |
| DEBT-037 | Regex PAN Maestro 19 dígitos (CVSS 2.1) | 1 | SCRUM-121 |

---

## Pipeline SOFIA v2.6 — Steps activos

```
1 → 2 → 2b → 2c → 3 → 3b → 4 → 5 → 5b → 5c* → 6 → 7 → 7b* → 8 → 8b → 9
                                              ↑Performance NEW    ↑Jenkins NEW
```

**Guardrails:** GR-001..GR-010 (GR-010 = anti-deuda-vencida en G-9, LA-022-01)
**LA-021-03:** 17 documentos CMMI obligatorios en Step 8 (bloqueante desde S22)

---

## Estado inicial

- **Sprint:** 22 | **Feature:** FEAT-020 | **Status:** in_progress
- **Jira:** SCRUM-114..121 creados (Por hacer)
- **Confluence:** page 7307265 publicada
- **Semáforo:** GREEN | **SOFIA:** v2.6

*Generado por SOFIA v2.6 — Orchestrator Step 1 — 2026-04-02*
