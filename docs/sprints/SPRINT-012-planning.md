# Sprint 12 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 12 |
| Proyecto | BankPortal — Banco Meridian |
| Feature | FEAT-010 — Dashboard Analítico de Gastos y Movimientos |
| Sprint Goal | Entregar el dashboard analítico financiero del usuario con categorización de gastos, evolución mensual y alertas de presupuesto, saldando toda la deuda técnica acumulada en Sprints 10-11 |
| Período | 2026-03-22 → 2026-04-05 (14 días) |
| Capacidad | 24 SP (recuperación a velocidad media) |
| Release objetivo | v1.12.0 |
| Rama | `feature/FEAT-010-sprint12` |
| Fecha planning | 2026-03-21 |
| Jira Epic | pendiente — Gate 1 |

---

## Revisión de mejoras Sprint 11 (ACT-10)

| Acción | Estado | Efecto |
|---|---|---|
| BankCoreRestAdapter activo en production | ✅ | Core real integrado — mock solo en staging |
| Resilience4j CB+Retry+Timeout | ✅ | Resiliencia ante fallos del core |
| Rate limiting DEBT-016 | ✅ | Endpoints financieros protegidos |
| RV-001 OTP antes de INITIATED | ✅ | PCI-DSS audit trail correcto |
| RV-002 Persistencia bill_payments | ✅ | Trazabilidad completa de pagos |
| R-SEC-004 Null check → DEBT-017 | Pendiente → Sprint 12 día 1 | Riesgo NPE en producción mitigado |
| RV-005 BillLookupResult → DEBT-018 | Pendiente → Sprint 12 día 1 | Limpieza de dominio |
| RV-004 Doble validación → DEBT-019 | Pendiente → Sprint 12 día 1 | Comportamiento HTTP consistente |

---

## Cálculo de capacidad (PP SP 2.2)

| Concepto | Valor |
|---|---|
| Días hábiles | 10 días |
| Velocidad media Sprint 10 | 24 SP |
| Velocidad media Sprint 11 | 20 SP (reducido por riesgo integración core) |
| Velocidad media 11 sprints | ~23.5 SP |
| Capacidad acordada Sprint 12 | **24 SP** — sin riesgos de integración externa nuevos |

---

## Sprint Backlog

| # | ID | Título | Tipo | SP | Prioridad | Semana | Bloquea |
|---|---|---|---|---|---|---|---|
| 1 | DEBT-017 | Null check `getAvailableBalance()` | Tech Debt | 1 | Must Have | S1 día 1 | — |
| 2 | DEBT-018 | `BillLookupResult` clase independiente | Tech Debt | 1 | Must Have | S1 día 1 | — |
| 3 | DEBT-019 | Unificar validación referencia | Tech Debt | 1 | Must Have | S1 día 1 | — |
| 4 | US-1001 | Resumen financiero mensual (backend) | Feature | 5 | Must Have | S1 | US-1003/1004 |
| 5 | US-1002 | Gastos por categoría + top comercios | Feature | 4 | Must Have | S1 | US-1006 |
| 6 | US-1003 | Evolución mensual 6 meses | Feature | 4 | Must Have | S2 | US-1006 |
| 7 | US-1004 | Comparativa mes actual vs anterior | Feature | 3 | Must Have | S2 | US-1006 |
| 8 | US-1005 | Alertas de gasto (80% presupuesto) | Feature | 3 | Should Have | S2 | — |
| 9 | US-1006 | Dashboard Angular — componentes visuales | Feature | 2 | Must Have | S2 | — |
| | | **TOTAL** | | **24 SP** | | | |

---

## Distribución por semana

### Semana 1 (2026-03-22 → 2026-03-28) — 12 SP
| ID | Título | SP |
|---|---|---|
| DEBT-017/018/019 | 3 deudas técnicas (día 1) | 3 |
| US-1001 | Resumen financiero mensual backend | 5 |
| US-1002 | Gastos por categoría + top comercios | 4 |

### Semana 2 (2026-03-29 → 2026-04-05) — 12 SP
| ID | Título | SP |
|---|---|---|
| US-1003 | Evolución mensual 6 meses | 4 |
| US-1004 | Comparativa mes vs mes anterior | 3 |
| US-1005 | Alertas de gasto 80% presupuesto | 3 |
| US-1006 | Dashboard Angular — componentes visuales | 2 |

---

## Pre-requisitos Día 1

- [ ] **DEBT-017/018/019**: 3 fixes rápidos — primer commit del sprint
- [ ] **Flyway V13**: tablas `spending_categories` + `budget_alerts` diseñadas
- [ ] **ng2-charts** añadido a `package.json` del frontend Angular
- [ ] **Índices BD**: confirmar índices en `bill_payments.paid_at` y `transfers.created_at`

---

## Riesgos del sprint

| ID | Riesgo | Exposición | Acción |
|---|---|---|---|
| R-F10-001 | Queries agregación lentas | Media | Índices + query plan en STG |
| R-F10-002 | Categorización imprecisa | Baja | MVP con regex — ML en FEAT-012 |
| R-F10-003 | Bundle Angular crece con Chart.js | Baja | Lazy loading del módulo |
| R-F10-004 | DEBTs retrasan features | Media | 3 SP día 1 — manejable |

---

## Definition of Done Sprint 12

- [ ] DEBT-017/018/019 completadas y verificadas en tests
- [ ] `GET /api/v1/dashboard/summary` funcional con datos reales
- [ ] `GET /api/v1/dashboard/categories` con categorización automática
- [ ] `GET /api/v1/dashboard/evolution` con serie de 6 meses
- [ ] `GET /api/v1/dashboard/comparison` con variación porcentual
- [ ] `GET /api/v1/dashboard/alerts` con alertas de presupuesto
- [ ] Dashboard Angular con gráficos Chart.js cargando datos reales
- [ ] Flyway V13 aplicada en STG
- [ ] Cobertura ≥ 80% en `dashboard/application`
- [ ] 0 defectos críticos ni altos en QA

---

## Métricas históricas (PMC SP 1.1)

| Sprint | SP plan | SP real | Feature |
|---|---|---|---|
| Sprint 9 | 23 | 23 | FEAT-007 Consulta cuentas |
| Sprint 10 | 24 | 24 | FEAT-008 Transferencias |
| Sprint 11 | 20 | 20 | FEAT-009 Core real + Pagos |
| **Sprint 12** | **24** | — | FEAT-010 Dashboard analítico |
| **Media** | **~23.5** | **~23.5** | — |

---

*Generado por SOFIA Scrum Master Agent — Step 1 Gate 1*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 12 — 2026-03-21*
