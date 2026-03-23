# Sprint 11 — Planning

## Metadata CMMI (PP SP 2.1)

| Campo | Valor |
|---|---|
| Sprint | 11 |
| Proyecto | BankPortal — Banco Meridian |
| Feature | FEAT-009 — Core Bancario Real + Pagos de Servicios |
| Sprint Goal | Conectar el core bancario real sustituyendo el mock de FEAT-008, añadir protección de rate limiting en transferencias, e iniciar la funcionalidad de pagos de servicios (recibos y facturas) |
| Período | 2026-03-21 → 2026-04-04 (14 días) |
| Capacidad | 20 SP (sprint conservador) |
| Release objetivo | v1.11.0 |
| Rama | `feature/FEAT-009-sprint11` |
| Fecha planning | 2026-03-21 |
| Jira Epic | pendiente — Gate 1 |

---

## Revisión de mejoras Sprint 10 (ACT-10 — Ritual de kick-off)

| Acción | Estado | Efecto observado |
|---|---|---|
| DEBT-014 JWT RS256 migrado | Completado | JWT RS256 activo en STG — HS256 rechazado correctamente |
| DEBT-013 Testcontainers integración | Completado | Suite IT con PostgreSQL real operativa en perfil `integration` |
| RV-001 TransferLimitPort en dominio | Completado (CR fix) | Arquitectura hexagonal correcta — infra desacoplada de application |
| R-SEC-003 Rate limiting pendiente | Pendiente → DEBT-016 Sprint 11 | Identificado en Security Report — abordado este sprint |

---

## Cálculo de capacidad (PP SP 2.2)

| Concepto | Valor |
|---|---|
| Días hábiles del sprint | 10 días |
| Velocidad histórica media | 23.9 SP/sprint (10 sprints) |
| Capacidad acordada Sprint 11 | **20 SP** (conservador — integración con sistema externo real) |
| Reducción vs media | -16% — justificado por riesgo R-F9-001 (API core bancario) |

---

## Sprint Backlog

| # | ID | Título | Tipo | SP | Prioridad | Semana | Dependencias |
|---|---|---|---|---|---|---|---|
| 1 | DEBT-015 | Merge FEAT-008-sprint10 → develop | Tech Debt | 1 | Must Have | S1 día 1 | BLOQUEANTE |
| 2 | DEBT-016 | Rate limiting Bucket4j en transferencias | Tech Debt | 3 | Must Have | S1 | DEBT-015 |
| 3 | US-901 | BankCoreRestAdapter — core bancario real | Feature | 5 | Must Have | S1 | DEBT-015 |
| 4 | US-902 | Circuit breaker + retry + timeout (Resilience4j) | Feature | 3 | Must Have | S1 | US-901 |
| 5 | US-903 | Pago de recibo domiciliado guardado | Feature | 4 | Must Have | S2 | US-901, US-902 |
| 6 | US-904 | Pago de factura con referencia | Feature | 4 | Must Have | S2 | US-901, US-902 |
| | | **TOTAL** | | **20 SP** | | | |

---

## Distribución por semana

### Semana 1 (2026-03-21 → 2026-03-27) — 12 SP
| ID | Título | SP |
|---|---|---|
| DEBT-015 | Merge FEAT-008 → develop (día 1 bloqueante) | 1 |
| DEBT-016 | Rate limiting Bucket4j | 3 |
| US-901 | BankCoreRestAdapter | 5 |
| US-902 | Resilience4j circuit breaker + retry + timeout | 3 |

### Semana 2 (2026-03-28 → 2026-04-04) — 8 SP
| ID | Título | SP |
|---|---|---|
| US-903 | Pago de recibo domiciliado | 4 |
| US-904 | Pago de factura con referencia | 4 |

---

## Dependencias críticas

```
DEBT-015 (merge)  ←── BLOQUEANTE para todo lo demás
    └── DEBT-016 (rate limiting)
    └── US-901 (core real)
            └── US-902 (Resilience4j)
                    └── US-903 (pago recibo)
                    └── US-904 (pago factura)
```

---

## Pre-requisitos Día 1 (bloqueantes)

- [ ] **DEBT-015**: `git merge feature/FEAT-008-sprint10` ejecutado en local — primer commit del sprint
- [ ] **ADR-017**: decisión Resilience4j documentada antes de US-902
- [ ] **Flyway V12 diseñado**: tablas `bills` + `bill_payments`
- [ ] **Contrato API core bancario**: URL + autenticación confirmados con Banco Meridian
- [ ] **Nuevo credential Jenkins**: `bankportal-core-api-url` + `bankportal-core-api-key`

---

## Riesgos del sprint

| ID | Riesgo | Exposición | Acción |
|---|---|---|---|
| R-F9-001 | API core bancario no disponible | Alta | Mock temporal si API no está lista en S1 |
| R-F9-002 | Latencia core > 2s p95 | Media | Circuit breaker 5s + benchmark STG |
| R-F9-003 | Rate limiting bloquea usuarios legítimos | Media | Límites ajustables via config |
| R-F9-004 | Flyway V12 conflicto sin DEBT-015 | Alta | DEBT-015 es el primer commit — sin excepción |
| R-F9-005 | Overhead Resilience4j en latencia | Media | Benchmark target < 10ms overhead |

---

## Definition of Done (DoD) — Sprint 11

Además del DoD base (CLAUDE.md):

- [ ] DEBT-015: `mvn test` pasa en develop con todos los tests de Sprint 10 incluidos
- [ ] DEBT-016: endpoints de transferencia retornan 429 al superar límite · fail-open si Redis falla
- [ ] US-901: `BankCoreRestAdapter` activo con perfil `production` · `BankCoreMockAdapter` desactivado
- [ ] US-902: circuit breaker abre tras 5 fallos · retry en errores transitorios · timeout 5s
- [ ] US-903/904: OTP obligatorio en todo pago · audit_log `BILL_PAYMENT_COMPLETED`
- [ ] Flyway V12 aplicada limpiamente en STG

---

## Métricas históricas (PMC SP 1.1)

| Sprint | SP plan | SP real | Velocidad | Deuda generada |
|---|---|---|---|---|
| Sprint 1 | 21 | 21 | 21 | 0 |
| Sprint 2-9 | 24 avg | 24 avg | 24 avg | 0 |
| Sprint 10 | 24 | 24 | 24 | 0 |
| **Sprint 11** | **20** | — | — | — |
| **Media** | **23.9** | **23.9** | **23.9** | — |

*Nota: Sprint 11 reducido a 20 SP intencionalmente por riesgo de integración con core externo.*

---

*Generado por SOFIA Scrum Master Agent — Step 1 Gate 1*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · PMC SP 1.1*
*BankPortal Sprint 11 Planning — 2026-03-21*
