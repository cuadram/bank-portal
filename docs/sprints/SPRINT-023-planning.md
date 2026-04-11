# Sprint 23 Planning — BankPortal · Banco Meridian
**SOFIA v2.7 · Scrum Master Agent · Step 1**

---

## Metadata

| Campo | Valor |
|---|---|
| Sprint | 23 |
| Feature | FEAT-021 — Depósitos a Plazo Fijo |
| Período | 2026-04-07 → 2026-04-20 (2 semanas) |
| Capacidad | 24 SP |
| Velocidad referencia | 24 SP (S19–S22 estable) |
| Release objetivo | v1.23.0 |
| SOFIA version | v2.7 |

---

## Sprint Goal

> **"Permitir al cliente de Banco Meridian consultar, simular y contratar depósitos a plazo fijo desde el portal digital, con cálculo de rentabilidad neta, retención IRPF en origen y garantía FGD, cumpliendo la Ley 44/2002 y el Real Decreto 84/2015. Adicionalmente, cerrar la deuda técnica vencida DEBT-036, DEBT-037 y DEBT-044."**

---

## Distribución de capacidad

| Tipo | SP | % |
|---|---|---|
| New Feature (FEAT-021) | 19 | 79% |
| Tech Debt (DEBT-036/037/044) | 5 | 21% |
| **Total** | **24** | **100%** |

Ratio deuda/feature: 0.26 — dentro del umbral saludable (< 0.30).

---

## Backlog del Sprint

### FEAT-021 — Depósitos a Plazo Fijo (19 SP)

| ID | User Story | SP | Criterio de aceptación clave |
|---|---|---|---|
| US-F021-01 | Consulta de depósitos activos (lista paginada) | 3 | GET /deposits → 200 con importe, plazo, TIN, vencimiento, estado |
| US-F021-02 | Detalle de depósito y cuadro de liquidación | 3 | Detalle incluye: intereses brutos, retención IRPF 19/21/23%, intereses netos, FGD badge |
| US-F021-03 | Simulador de depósito a plazo fijo | 3 | POST /deposits/simulate → TIN, TAE, intereses brutos/netos, retención IRPF, sin autenticación |
| US-F021-04 | Apertura de depósito con confirmación 2FA | 5 | POST /deposits → valida OTP, debita cuenta origen, crea depósito en CoreBanking mock, Flyway V25 |
| US-F021-05 | Renovación automática / instrucción al vencimiento | 2 | PATCH /deposits/{id}/renewal → RENEW_AUTO \| RENEW_MANUAL \| CANCEL_AT_MATURITY |
| US-F021-06 | Cancelación anticipada con penalización | 3 | POST /deposits/{id}/cancel → calcula penalización (% sobre intereses devengados), requiere 2FA |

### Tech Debt (5 SP)

| ID | Descripción | SP | Área | CVSS |
|---|---|---|---|---|
| DEBT-036 | Enriquecer export_audit_log con IBAN real (inyectar AccountRepository en ExportAuditService) | 2 | Backend | — |
| DEBT-037 | Corregir regex PAN Maestro 19 dígitos (CWE-20 validación entrada) | 1 | Security | 2.1 |
| DEBT-044 | Externalizar TAE a application.properties (eliminar hardcode AmortizationCalculator) | 2 | Backend | — |

---

## Regulación aplicable

| Marco regulatorio | Aplicación en FEAT-021 |
|---|---|
| Ley 44/2002 de Medidas de Reforma del Sistema Financiero | Contratación de depósitos, información precontractual obligatoria |
| Real Decreto 84/2015 (solvencia entidades) | Requisitos de información al depositante |
| IRPF — Art. 25 Ley 35/2006 | Retención en origen: 19% hasta 6.000€, 21% entre 6.001–50.000€, 23% superior |
| FGD (RDL 16/2011) | Cobertura hasta 100.000€/titular/entidad — mostrar badge informativo |
| PSD2 (Dir. 2015/2366) | Débito cuenta origen para apertura — autenticación reforzada SCA |

---

## Arquitectura técnica — diseño previo (input para Step 3)

### Backend — nuevos módulos hexagonales

```
deposit/
├── domain/
│   ├── model/        Deposit, DepositApplication, DepositStatus, DepositPurpose
│   │                 RenewalInstruction, CancellationResult
│   ├── service/      DepositSimulatorService (BigDecimal HALF_EVEN, TIN/TAE/IRPF)
│   │                 IrpfRetentionCalculator, PenaltyCalculator
│   └── repository/   DepositRepositoryPort, DepositApplicationRepositoryPort
├── application/
│   └── usecase/      ListDeposits, GetDepositDetail, SimulateDeposit,
│                     OpenDeposit, SetRenewalInstruction, CancelDeposit (6 UC)
├── infrastructure/
│   ├── persistence/  DepositEntity, JpaDepositRepository, JpaDepositAdapter
│   └── corebankig/   CoreBankingMockDepositClient (patrón ADR-035)
└── api/
    ├── DepositController
    └── DepositExceptionHandler
```

### Frontend — DepositModule Angular

```
frontend-portal/features/deposits/
├── deposits.module.ts + deposits-routing.module.ts
├── models/          deposit.model.ts
├── services/        deposit.service.ts
└── components/      DepositList, DepositDetail, DepositSimulator,
                     DepositApplicationForm, LiquidationTable
```

### Flyway
- V25__deposits.sql → tablas `deposits` + `deposit_applications`

### ADRs anticipados
- ADR-036: Cálculo IRPF por tramos con BigDecimal (coherente con ADR-034 AmortizationCalculator)
- ADR-037: CoreBankingMockDepositClient — estrategia mock para STG

---

## Definition of Done (Sprint 23)

- [ ] 15 steps pipeline completados · todos los gates HITL aprobados
- [ ] 6 use cases implementados (ListDeposits → CancelDeposit)
- [ ] Flyway V25 aplicado sin errores (idempotente ON CONFLICT)
- [ ] DEBT-036/037/044 cerrados en Jira
- [ ] Smoke test v1.23.0 ≥ 17/17 PASS
- [ ] Code Review: 0 blockers · 0 major
- [ ] Security: 0 CVE críticos · 0 CVE altos
- [ ] QA: 100% casos de prueba PASS
- [ ] 17 DOCX + 3 XLSX generados (Documentation Agent)
- [ ] FA-index actualizado: funcionalities y business_rules coherentes
- [ ] validate-fa-index PASS 8/8
- [ ] Dashboard Global regenerado en cada gate
- [ ] Confluence: Sprint 23 Planning + Resultados + Retrospectiva
- [ ] Jira: todos los issues → Finalizada

---

## Riesgos identificados (Sprint 23)

| ID | Riesgo | Cat. | P | I | Exp | Plan de respuesta |
|---|---|---|---|---|---|---|
| R-S23-01 | Complejidad cálculo IRPF por tramos con BigDecimal | Técnico | M | M | M | Prototipar IrpfRetentionCalculator en Step 3 antes de Step 4 |
| R-S23-02 | DEBT-036 puede requerir migración de datos históricos en export_audit_log | Técnico | B | M | B | Verificar en Step 3 si requiere Flyway adicional |
| R-S23-03 | Regulación Ley 44/2002 — información precontractual puede añadir campos no estimados | Negocio | M | B | B | PO valida campos en Step 2 antes de arquitectura |
| R-S23-04 | CoreBankingMockDepositClient — coherencia con mock de préstamos (ADR-035) | Técnico | B | B | B | Reutilizar patrón ADR-035 directamente |

---

## Velocity histórica (referencia)

| Sprint | SP entregados | NCs | Resultado |
|---|---|---|---|
| S19 | 24 | 0 | ✅ |
| S20 | 24 | 0 | ✅ |
| S21 | 24 | 0 | ✅ |
| S22 | 24 | 0 | ✅ |
| **Media** | **24** | **0** | **estable** |

Proyección Sprint 23: **24 SP** sin buffer adicional — velocity estabilizada.

---

## Issues Jira a crear (Step 1)

| Issue | Tipo | SP | Título |
|---|---|---|---|
| SCRUM-122 | Story | 3 | [FEAT-021] Consulta de depósitos activos |
| SCRUM-123 | Story | 3 | [FEAT-021] Detalle de depósito y cuadro de liquidación IRPF |
| SCRUM-124 | Story | 3 | [FEAT-021] Simulador de depósito a plazo fijo |
| SCRUM-125 | Story | 5 | [FEAT-021] Apertura de depósito con confirmación 2FA |
| SCRUM-126 | Story | 2 | [FEAT-021] Instrucción de renovación al vencimiento |
| SCRUM-127 | Story | 3 | [FEAT-021] Cancelación anticipada con penalización |
| SCRUM-128 | Tech Debt | 2 | [DEBT-036] IBAN real en export_audit_log |
| SCRUM-129 | Tech Debt | 1 | [DEBT-037] Regex PAN Maestro 19 dígitos |
| SCRUM-130 | Tech Debt | 2 | [DEBT-044] Externalizar TAE a application.properties |

**Total: 9 issues · 24 SP**

---

*Generado por Scrum Master Agent — SOFIA v2.7 — 2026-04-06*
