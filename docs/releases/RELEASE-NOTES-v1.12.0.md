# Release Notes — BankPortal v1.12.0
## Sprint 12 — FEAT-010 Dashboard Analítico de Gastos y Movimientos

**Versión:** v1.12.0 | **Fecha:** 2026-03-22 | **Sprint:** 12 | **Jira:** SCRUM-33

---

## Resumen

BankPortal v1.12.0 introduce el Dashboard Analítico de Gastos — la primera funcionalidad de inteligencia financiera del portal. Los usuarios pueden ahora consultar su resumen financiero mensual, ver sus gastos categorizados automáticamente, analizar su evolución en los últimos 6 meses, comparar mes a mes y recibir alertas cuando se acercan a su presupuesto mensual. Adicionalmente se salda toda la deuda técnica acumulada en Sprints 10-11.

---

## Nuevas funcionalidades

### US-1001 — Resumen financiero mensual
- `GET /api/v1/dashboard/summary?period=current_month` — ingresos, gastos y saldo neto del período

### US-1002 — Gastos por categoría y top comercios
- `GET /api/v1/dashboard/categories` — 5 categorías (ALIMENTACION, TRANSPORTE, SERVICIOS, OCIO, OTROS) con % del total
- `GET /api/v1/dashboard/top-merchants?limit=5` — emisores donde más se gasta
- Categorización automática por keywords sobre concepto/emisor del pago
- Caché materializada en `spending_categories` (ADR-019) — p95 ≤ 100ms tras primer cálculo

### US-1003 — Evolución mensual últimos 6 meses
- `GET /api/v1/dashboard/evolution?months=6` — serie temporal completa (meses vacíos = 0, nunca omitidos)

### US-1004 — Comparativa mes actual vs anterior
- `GET /api/v1/dashboard/comparison` — variación porcentual de gastos e ingresos · protección contra división por cero

### US-1005 — Alertas de presupuesto
- `GET /api/v1/dashboard/alerts` — alertas cuando se supera el 80% del presupuesto mensual
- Notificación via SSE + email · sin duplicados por período (UNIQUE constraint)

---

## Deuda técnica resuelta

### DEBT-017 — Null check `getAvailableBalance()`
- `BankCoreRestAdapter.safeBalance()` — devuelve `BigDecimal.ZERO` + log WARN si el core responde con body nulo

### DEBT-018 — `BillLookupResult` clase independiente
- Extraída de `BillPaymentPort` como clase top-level en `bill/domain/`
- Imports actualizados en `BillController`, `BillLookupAndPayUseCase` y `BillCoreAdapter`

### DEBT-019 — Validación referencia de factura unificada
- `validateReference()` eliminado de `BillLookupAndPayUseCase`
- Único punto de validación: `@Pattern(regexp = "\\d{20}")` en `BillController` → HTTP 400 consistente

---

## Modelo de datos

### Flyway V13 — Nuevas tablas
- `spending_categories` — caché de gastos categorizados por usuario/período (ADR-019)
- `budget_alerts` — alertas de presupuesto con `CHECK(monthly_budget > 0)` y `UNIQUE(user_id, period)`

---

## ⚠️ Notas de despliegue

```bash
# Sin nuevas variables de entorno en v1.12.0
# Flyway V13 se aplica automáticamente al arrancar

SPRING_PROFILES_ACTIVE=staging docker compose up -d --build backend

# Verificar V13 aplicada
docker exec bankportal-postgres psql -U bankportal -d bankportal \
  -c "SELECT version, description, success FROM flyway_schema_history WHERE version='13';"
```

---

## Métricas del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 24/24 (100%) |
| Tests unitarios nuevos | 23 |
| Tests totales acumulados | ~137 |
| Defectos en QA | 0 |
| CVEs críticos | 0 |
| Cobertura Gherkin | 100% (22/22) |
| Velocidad acumulada | ~23.5 SP/sprint (12 sprints · 283 SP) |

---

*BankPortal v1.12.0 — SOFIA DevOps Agent — Sprint 12 — 2026-03-22*
