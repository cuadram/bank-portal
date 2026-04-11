# SRS-FEAT-010 — Software Requirements Specification
# Dashboard Analítico de Gastos y Movimientos — BankPortal / Banco Meridian

## Metadata CMMI (RD SP 1.1 · RD SP 2.1 · RD SP 3.1)

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-010 |
| Versión | 1.0 |
| Feature | FEAT-010 — Dashboard Analítico de Gastos y Movimientos |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 12 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-21 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-33 |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de
FEAT-010. Cubre dos ámbitos: el Dashboard Analítico de Gastos (nuevo módulo de
inteligencia financiera) y la resolución de toda la deuda técnica acumulada en
Sprints 10-11 (DEBT-017, DEBT-018, DEBT-019).

### 1.2 Alcance

| Incluido | Excluido |
|---|---|
| Resumen financiero mensual via API | Exportación PDF/Excel del dashboard |
| Gastos categorizados + top comercios | Presupuestos personalizados por categoría |
| Evolución mensual últimos 6 meses | Recomendaciones IA de ahorro |
| Comparativa mes actual vs anterior | Transferencias SEPA/SWIFT |
| Alertas de presupuesto (80% umbral) | Programación de pagos recurrentes |
| Dashboard Angular con Chart.js 4 | App móvil nativa |
| DEBT-017/018/019 resueltas | — |

### 1.3 Documentos relacionados

| Documento | Versión | Relación |
|---|---|---|
| SRS-FEAT-009.md | 1.0 | `bill_payments` y `transfers` como fuentes de datos |
| LLD-012 | 1.0 | Puertos de dominio reutilizables |
| SecurityReport-Sprint11-FEAT-009.md | 1.0 | R-SEC-004/005 — origen DEBT-017/018 |
| CR-FEAT-009-sprint11.md | 1.0 | RV-004 — origen DEBT-019 |

---

## 2. Requerimientos funcionales

### RF-1001: Resumen financiero mensual

**ID:** RF-1001 | **Prioridad:** Must Have | **US:** US-1001

El sistema debe exponer un endpoint que devuelva el resumen financiero del usuario
para un período determinado (mes actual o mes anterior).

**Endpoint:**
```
GET /api/v1/dashboard/summary?period={current_month|previous_month|YYYY-MM}
Authorization: Bearer {JWT_RS256}

Response 200:
{
  "period":           "2026-03",
  "totalIncome":      3500.00,
  "totalExpenses":    2150.75,
  "netBalance":       1349.25,
  "transactionCount": 42
}
```

**Reglas de negocio:**
- `totalIncome`: suma de ingresos recibidos (transferencias entrantes) en el período
- `totalExpenses`: suma de transferencias salientes + pagos de recibos + facturas
- `netBalance`: `totalIncome - totalExpenses`
- Si no hay actividad en el período → todos los campos a 0.00 (no error)
- Sin autenticación → HTTP 401

---

### RF-1002: Gastos por categoría y top comercios

**ID:** RF-1002 | **Prioridad:** Must Have | **US:** US-1002

El sistema debe categorizar los gastos del usuario automáticamente por concepto
y exponer el ranking de emisores/comercios donde más gasta.

**Endpoint categorías:**
```
GET /api/v1/dashboard/categories?period={period}

Response 200: [
  { "category": "ALIMENTACION", "amount": 450.00, "percentage": 20.9, "count": 12 },
  { "category": "SERVICIOS",    "amount": 380.50, "percentage": 17.7, "count": 5  },
  { "category": "TRANSPORTE",   "amount": 210.00, "percentage": 9.8,  "count": 8  },
  { "category": "OCIO",         "amount": 180.25, "percentage": 8.4,  "count": 6  },
  { "category": "OTROS",        "amount": 930.00, "percentage": 43.2, "count": 11 }
]
```

**Endpoint top comercios:**
```
GET /api/v1/dashboard/top-merchants?period={period}&limit=5

Response 200: [
  { "issuer": "Mercadona",  "totalAmount": 320.00, "count": 8 },
  { "issuer": "Endesa",     "totalAmount": 145.50, "count": 2 },
  ...
]
```

**Reglas de categorización automática (MVP):**

| Palabras clave en concepto/emisor | Categoría |
|---|---|
| mercadona, carrefour, lidl, supermercado, alimentacion | ALIMENTACION |
| renfe, metro, bus, taxi, uber, cabify, gasolina | TRANSPORTE |
| endesa, iberdrola, gas natural, agua, telefonica, vodafone | SERVICIOS |
| netflix, spotify, amazon, steam, ocio, cine, restaurante | OCIO |
| (resto) | OTROS |

**Modelo de datos — Flyway V13:**
```sql
CREATE TABLE spending_categories (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id),
    period       CHAR(7)      NOT NULL,  -- formato YYYY-MM
    category     VARCHAR(32)  NOT NULL,
    amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tx_count     INTEGER       NOT NULL DEFAULT 0,
    computed_at  TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT uq_spending_cat UNIQUE (user_id, period, category)
);
CREATE INDEX idx_spending_cat_user_period ON spending_categories(user_id, period);
```

---

### RF-1003: Evolución mensual últimos N meses

**ID:** RF-1003 | **Prioridad:** Must Have | **US:** US-1003

El sistema debe devolver la serie temporal de ingresos y gastos para los últimos
N meses (por defecto 6).

**Endpoint:**
```
GET /api/v1/dashboard/evolution?months=6

Response 200: [
  { "year": 2025, "month": 10, "totalIncome": 3200.00, "totalExpenses": 1980.00, "netBalance": 1220.00 },
  { "year": 2025, "month": 11, "totalIncome": 3400.00, "totalExpenses": 2100.00, "netBalance": 1300.00 },
  { "year": 2025, "month": 12, "totalIncome": 3100.00, "totalExpenses": 2800.00, "netBalance":  300.00 },
  { "year": 2026, "month": 1,  "totalIncome": 3500.00, "totalExpenses": 2050.00, "netBalance": 1450.00 },
  { "year": 2026, "month": 2,  "totalIncome": 3500.00, "totalExpenses": 1900.00, "netBalance": 1600.00 },
  { "year": 2026, "month": 3,  "totalIncome": 3500.00, "totalExpenses": 2150.75, "netBalance": 1349.25 }
]
```

**Reglas:**
- Siempre se devuelven exactamente `months` elementos, ordenados cronológicamente
- Meses sin actividad → todos los campos a 0.00 (no se omiten)
- `months` mínimo: 1 · máximo: 24

---

### RF-1004: Comparativa mes actual vs anterior

**ID:** RF-1004 | **Prioridad:** Must Have | **US:** US-1004

El sistema debe calcular la variación porcentual de gastos e ingresos entre el
mes en curso y el mes anterior.

**Endpoint:**
```
GET /api/v1/dashboard/comparison

Response 200:
{
  "currentMonth": {
    "period": "2026-03",
    "totalIncome":   3500.00,
    "totalExpenses": 2150.75
  },
  "previousMonth": {
    "period": "2026-02",
    "totalIncome":   3500.00,
    "totalExpenses": 1900.00
  },
  "expensesVariationPercent":  13.2,
  "incomeVariationPercent":     0.0
}
```

**Reglas:**
- Variación positiva = gasta/ingresa MÁS este mes vs el anterior
- `variationPercent = ((current - previous) / previous) * 100`
- Si `previous = 0` → variationPercent = null (división por cero protegida)
- Si no hay mes anterior → previousMonth = null, variationPercents = null

---

### RF-1005: Alertas de presupuesto

**ID:** RF-1005 | **Prioridad:** Should Have | **US:** US-1005

El sistema debe detectar cuando el usuario supera el 80% de su presupuesto
mensual configurado y generar una alerta con notificación SSE + email.

**Modelo de datos — Flyway V13:**
```sql
CREATE TABLE budget_alerts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id),
    period          CHAR(7)      NOT NULL,
    monthly_budget  DECIMAL(15,2) NOT NULL,
    threshold_pct   INTEGER       NOT NULL DEFAULT 80,
    current_amount  DECIMAL(15,2) NOT NULL,
    triggered_at    TIMESTAMP     NOT NULL DEFAULT now(),
    notified        BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT uq_budget_alert UNIQUE (user_id, period)
);
```

**Endpoint consulta alertas:**
```
GET /api/v1/dashboard/alerts

Response 200: [
  {
    "type":          "BUDGET_THRESHOLD",
    "threshold":     80,
    "monthlyBudget": 1500.00,
    "currentAmount": 1220.00,
    "usedPercent":   81.3,
    "triggeredAt":   "2026-03-18T14:30:00Z"
  }
]
```

**Reglas:**
- La alerta se dispara solo si el usuario tiene `monthly_budget` configurado
- Se dispara una sola vez por período (constraint UNIQUE en BD)
- Notificación via SSE inmediata + email asíncrono
- Evento audit_log: `BUDGET_ALERT_TRIGGERED`

---

### RF-1006: Dashboard Angular — componentes visuales

**ID:** RF-1006 | **Prioridad:** Must Have | **US:** US-1006

El frontend Angular debe mostrar el dashboard con gráficos interactivos
consumiendo los endpoints del backend.

**Componentes requeridos:**
- `DashboardSummaryComponent` — tarjetas con ingresos/gastos/saldo neto del mes
- `SpendingCategoriesChartComponent` — gráfico donut con categorías (Chart.js)
- `MonthlyEvolutionChartComponent` — gráfico de barras evolución 6 meses (Chart.js)
- `MonthComparisonComponent` — comparativa visual mes vs mes con indicador de variación
- `BudgetAlertsComponent` — banner de alerta si se supera el 80%

**Ruta Angular:** `/dashboard`

**Librerías:** `ng2-charts@5` + `chart.js@4` (añadir a `package.json`)

**Comportamiento UX:**
- Skeleton loaders mientras carga (no pantalla en blanco)
- Manejo de error con mensaje amigable si el backend no responde
- Responsive: mobile-first

---

### RF-1007: DEBT-017 — Null check `getAvailableBalance()`

**ID:** RF-1007 | **Prioridad:** Must Have | **DEBT:** DEBT-017

`BankCoreRestAdapter.getAvailableBalance()` debe proteger ante respuesta nula
del core con `Objects.requireNonNullElse(response.available(), BigDecimal.ZERO)`
y registrar un log WARN con el `accountId` afectado.

---

### RF-1008: DEBT-018 — `BillLookupResult` clase independiente

**ID:** RF-1008 | **Prioridad:** Must Have | **DEBT:** DEBT-018

`BillLookupResult` debe ser una clase top-level en `bill/domain/BillLookupResult.java`,
eliminando el record anidado dentro de `BillPaymentPort`. Todos los imports
actualizados en `BillController`, `BillLookupAndPayUseCase` y `BillCoreAdapter`.

---

### RF-1009: DEBT-019 — Unificar validación referencia

**ID:** RF-1009 | **Prioridad:** Must Have | **DEBT:** DEBT-019

Eliminar `validateReference()` de `BillLookupAndPayUseCase` dejando solo
`@Pattern(regexp = "\\d{20}")` en el controller. HTTP 400 consistente desde
Bean Validation en ambos endpoints (`/lookup` y `/pay`).

---

## 3. Requerimientos no funcionales

### RNF-F10-001: Rendimiento

| Endpoint | Target p95 | Nota |
|---|---|---|
| `GET /api/v1/dashboard/summary` | ≤ 300ms | Agregación sobre `transfers` + `bill_payments` |
| `GET /api/v1/dashboard/categories` | ≤ 500ms | JOIN + GROUP BY con categorización |
| `GET /api/v1/dashboard/evolution` | ≤ 400ms | 6 meses × 2 tablas |
| `GET /api/v1/dashboard/comparison` | ≤ 300ms | 2 períodos de summary |
| Carga dashboard Angular completo | ≤ 2s | Lazy loading módulo dashboard |

### RNF-F10-002: Seguridad

- `@AuthenticationPrincipal` en todos los endpoints del dashboard
- El `userId` se extrae siempre del JWT — nunca del body o query param
- Los datos del dashboard solo muestran información del usuario autenticado

### RNF-F10-003: Accesibilidad (primer sprint con frontend)

- Gráficos Chart.js con `aria-label` descriptivo
- Contraste de texto ≥ 4.5:1 en tarjetas del dashboard (WCAG 2.1 AA)
- Navegación teclado en el dashboard funcional

### RNF-F10-004: Observabilidad

- Tiempo de respuesta de cada endpoint del dashboard en `/actuator/metrics`
- Log INFO en categorización cuando se usa categoría OTROS por defecto

---

## 4. Requerimientos de integración

### RI-F10-001: Fuentes de datos para el dashboard

| Tabla | Relación | Columnas clave |
|---|---|---|
| `transfers` | Transferencias propias y a beneficiarios | `user_id`, `amount`, `created_at`, `concept`, `status='COMPLETED'` |
| `bill_payments` | Pagos de recibos y facturas | `user_id`, `amount`, `paid_at`, `issuer` |
| `audit_log` | Ingresos recibidos (transferencias entrantes) | `user_id`, evento `TRANSFER_COMPLETED`, `details` |
| `spending_categories` | Cache de categorización por período | `user_id`, `period`, `category`, `amount` |
| `budget_alerts` | Alertas de presupuesto disparadas | `user_id`, `period`, `triggered_at` |

### RI-F10-002: Flyway V13

```sql
-- V13__dashboard_analytics.sql
-- FEAT-010 Sprint 12

CREATE TABLE spending_categories (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID          NOT NULL REFERENCES users(id),
    period       CHAR(7)       NOT NULL,
    category     VARCHAR(32)   NOT NULL,
    amount       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tx_count     INTEGER       NOT NULL DEFAULT 0,
    computed_at  TIMESTAMP     NOT NULL DEFAULT now(),
    CONSTRAINT uq_spending_cat UNIQUE (user_id, period, category)
);
CREATE INDEX idx_spending_cat_user_period ON spending_categories(user_id, period);

CREATE TABLE budget_alerts (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID          NOT NULL REFERENCES users(id),
    period          CHAR(7)       NOT NULL,
    monthly_budget  DECIMAL(15,2) NOT NULL,
    threshold_pct   INTEGER       NOT NULL DEFAULT 80,
    current_amount  DECIMAL(15,2) NOT NULL,
    triggered_at    TIMESTAMP     NOT NULL DEFAULT now(),
    notified        BOOLEAN       NOT NULL DEFAULT false,
    CONSTRAINT uq_budget_alert UNIQUE (user_id, period)
);
CREATE INDEX idx_budget_alerts_user ON budget_alerts(user_id, period);
```

---

## 5. RTM — Requirements Traceability Matrix

| Req. | US/DEBT | Sprint | Gherkin | Test | API Endpoint |
|---|---|---|---|---|---|
| RF-1001 Resumen financiero | US-1001 | S1 | 4 escenarios | DashboardSummaryUseCaseTest | GET /dashboard/summary |
| RF-1002 Categorías + top | US-1002 | S1 | 3 escenarios | SpendingCategoryServiceTest | GET /dashboard/categories · /top-merchants |
| RF-1003 Evolución mensual | US-1003 | S2 | 3 escenarios | MonthlyEvolutionUseCaseTest | GET /dashboard/evolution |
| RF-1004 Comparativa | US-1004 | S2 | 2 escenarios | MonthComparisonUseCaseTest | GET /dashboard/comparison |
| RF-1005 Alertas presupuesto | US-1005 | S2 | 3 escenarios | BudgetAlertServiceTest | GET /dashboard/alerts |
| RF-1006 Dashboard Angular | US-1006 | S2 | 3 escenarios | DashboardComponent spec | /dashboard (Angular) |
| RF-1007 DEBT-017 Null check | DEBT-017 | S1 día 1 | 2 escenarios | BankCoreRestAdapterTest | transversal |
| RF-1008 DEBT-018 BillLookupResult | DEBT-018 | S1 día 1 | 1 escenario | (refactor sin lógica nueva) | transversal |
| RF-1009 DEBT-019 Validación ref | DEBT-019 | S1 día 1 | 1 escenario | BillControllerTest | /bills/lookup · /bills/pay |

---

## 6. Criterios de aceptación globales

- [ ] 5 endpoints dashboard funcionales con datos reales de STG
- [ ] Categorización automática por keywords en concepto/emisor
- [ ] Dashboard Angular con 4 componentes Chart.js renderizando
- [ ] Alertas SSE + email al superar 80% del presupuesto mensual
- [ ] DEBT-017: `getAvailableBalance()` devuelve BigDecimal.ZERO si body nulo
- [ ] DEBT-018: import `bill.domain.BillLookupResult` directo sin prefijo
- [ ] DEBT-019: un único punto de validación de referencia (controller)
- [ ] Flyway V13 aplicada en STG sin errores
- [ ] Cobertura ≥ 80% en `dashboard/application`
- [ ] WCAG 2.1 AA verificado en gráficos del dashboard

---

*Generado por SOFIA Requirements Analyst Agent — Step 2*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1 · REQM SP 1.5*
*BankPortal Sprint 12 — FEAT-010 — 2026-03-21 — v1.0 PENDING APPROVAL*
