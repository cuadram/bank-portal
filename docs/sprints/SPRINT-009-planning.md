# Sprint 9 — Planning
## BankPortal · FEAT-007 Consulta de Cuentas y Movimientos + DEBT-011/012
*SOFIA Scrum Master Agent · 2026-03-19*

## Sprint Goal
> "Permitir al usuario consultar su posición financiera completa: saldo de cuentas,
> historial de movimientos con búsqueda y filtros avanzados, y descarga de extractos;
> consolidando la infraestructura SSE para escenarios multi-pod con Redis Pub/Sub."

## Métricas de referencia
| Indicador | Valor |
|---|---|
| Velocidad media (8 sprints) | 23.875 SP |
| σ | ±0.9 SP |
| Capacidad Sprint 9 | 24 SP |
| SP planificados | 23 SP (buffer 1 SP) |
| Período | 2026-03-20 → 2026-04-02 |
| Release objetivo | v1.9.0 — 2026-04-14 |

## Backlog del sprint
| ID | Descripción | SP | Tipo | Prioridad | Semana |
|---|---|---|---|---|---|
| DEBT-011 | Redis Pub/Sub para SSE multi-pod | 3 | Tech Debt | Must Have | S1 |
| DEBT-012 | Job de purga automática notificaciones 90d | 2 | Tech Debt | Must Have | S1 |
| ACT-32 | OpenAPI v1.6.0: endpoints FEAT-007 documentados | 1 | Documental | Must Have | S1 |
| V10 Flyway | accounts + transactions + statements tables | 2 | Infra | Must Have | S1 |
| US-701 | Consultar listado de cuentas con saldo actualizado | 3 | Feature | Must Have | S1 |
| US-702 | Ver historial de movimientos paginado con filtros | 4 | Feature | Must Have | S2 |
| US-703 | Búsqueda de movimientos por importe, fecha y concepto | 3 | Feature | Must Have | S2 |
| US-704 | Descarga de extracto PDF (30/90/365 días) | 3 | Feature | Should Have | S2 |
| US-705 | Resumen visual de gastos por categoría | 2 | Feature | Could Have | S2 |
| **Total** | | **23 SP** | | | |

## Distribución por semana

### Semana 1 — 11 SP
- DEBT-011 [3 SP]: Redis Pub/Sub channel por userId; migración SseEmitter → RedisMessageListenerContainer
- DEBT-012 [2 SP]: @Scheduled nightly job purga notifications > 90d
- ACT-32 [1 SP]: OpenAPI v1.6.0 spec /accounts, /accounts/{id}/transactions, /statements
- V10 [2 SP]: Flyway accounts, transactions, statements (schema Banco Meridian)
- US-701 [3 SP]: AccountService + Angular AccountListComponent + saldo tiempo real

### Semana 2 — 12 SP
- US-702 [4 SP]: TransactionHistoryUseCase + paginación cursor-based + Angular TransactionListComponent
- US-703 [3 SP]: TransactionSearchService (JPA Specification) + Angular SearchFormComponent
- US-704 [3 SP]: StatementGeneratorService (JasperReports/PDF) + descarga signed URL
- US-705 [2 SP]: CategorySummaryService + Angular ChartComponent

## Riesgos
| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| R-S9-001 | Redis Pub/Sub latencia > 100ms en STG | B | M | Test de carga día 3; fallback polling 30s |
| R-S9-002 | Volumen transacciones sin índices | M | A | Índices en transactions(account_id, date) en Flyway V10 |
| R-S9-003 | JasperReports curva de aprendizaje | M | M | Template base reutilizable; alternativa iText |
| R-S9-004 | Datos financieros reales en STG — PCI/GDPR | A | A | Solo datos sintéticos en STG; checklist PCI-DSS req 3.4 |

## Definition of Done Sprint 9
- [ ] DEBT-011: SSE operativo en cluster multi-pod vía Redis Pub/Sub
- [ ] DEBT-012: job de purga ejecutado en STG, logs verificados
- [ ] US-701: listado cuentas con saldo, loading skeleton, empty state
- [ ] US-702: historial paginado cursor-based, filtros fecha/tipo, infinite scroll
- [ ] US-703: búsqueda full-text debounce 300ms, highlights en resultados
- [ ] US-704: PDF descargable firmado, 3 rangos de fecha, formato Banco Meridian
- [ ] US-705: gráfico categorías interactivo, top-5 + otros
- [ ] Flyway V10 ejecutado en STG sin errores
- [ ] OpenAPI v1.6.0 publicada (ACT-32)
- [ ] Tests: ≥ 65 nuevos (unit + IT + E2E)
- [ ] 0 defectos críticos · 5/5 gates HITL aprobados
- [ ] Datos sensibles en STG únicamente sintéticos (R-S9-004)

## Gates HITL Sprint 9
| Gate | Responsable | Contenido |
|---|---|---|
| Gate 1 — Planning | Product Owner | Este documento |
| Gate 2 — Arquitectura | Tech Lead | ADR-013 (Redis Pub/Sub) + LLD-010 + LLD-011 |
| Gate 3 — Code Review S1 | Tech Lead | DEBT-011/012 + US-701 |
| Gate 4 — Code Review S2 | Tech Lead | US-702/703/704/705 |
| Gate 5 — QA | QA Lead | ≥65 tests, 0 defectos críticos |

## Velocidad acumulada (9 sprints)
| Sprint | SP | Feature |
|---|---|---|
| Sprint 1 | 22 | FEAT-001 parcial |
| Sprint 2 | 24 | FEAT-001 cierre |
| Sprint 3 | 23 | FEAT-002 |
| Sprint 4 | 25 | FEAT-003 |
| Sprint 5 | 24 | FEAT-004 parcial |
| Sprint 6 | 23 | FEAT-005 |
| Sprint 7 | 24 | FEAT-006 |
| Sprint 8 | 24 | FEAT-004 cierre |
| Sprint 9 | 23 | FEAT-007 (en curso) |
| **Total** | **212 SP** | |
| **Velocidad media** | **23.67 SP/sprint** | |

*SOFIA Scrum Master Agent · BankPortal Sprint 9 · 2026-03-19*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1 · REQM SP 1.3*
*Scrumban: Sprint planificado + flujo continuo Kanban intra-sprint*
