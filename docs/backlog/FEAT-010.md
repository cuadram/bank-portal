# FEAT-010 — Dashboard Analítico de Gastos y Movimientos

## Metadata

| Campo | Valor |
|---|---|
| Feature ID | FEAT-010 |
| Proyecto | BankPortal — Banco Meridian |
| Prioridad | ALTA (P1) |
| Estado | READY FOR SPRINT |
| Epic | Inteligencia Financiera |
| Sprint | 12 |
| Rama git | `feature/FEAT-010-sprint12` |
| Fecha creación | 2026-03-21 |
| Stack | Java/Spring Boot (backend) + Angular 17 (frontend) |

---

## Descripción de negocio

Sprint 12 entrega el **Dashboard Analítico de Gastos y Movimientos** — la primera
funcionalidad de inteligencia financiera de BankPortal. Permite al usuario visualizar
su actividad financiera consolidada: gastos categorizados, evolución mensual, comparativa
entre períodos y alertas de gasto. Adicionalmente se salda toda la deuda técnica acumulada
en Sprints 10-11.

**Valor:** El 68% de los usuarios de banca digital abandona la app por falta de visibilidad
sobre sus finanzas (estudio Banco Meridian Q1-2026). El dashboard reduce esta tasa
y aumenta la sesión media de 2 a 8 minutos.

---

## Alcance funcional

### Incluido en FEAT-010
- Resumen financiero mensual del usuario (ingresos vs gastos)
- Gastos agrupados por categoría (alimentación, transporte, servicios, ocio, otros)
- Gráfico de evolución mensual — últimos 6 meses
- Comparativa mes actual vs mes anterior
- Top 5 comercios / emisores donde más se gasta
- Alertas de gasto: notificación si supera el 80% del presupuesto mensual

### Deuda técnica incluida
- DEBT-017: R-SEC-004 — Null check `getAvailableBalance()` en `BankCoreRestAdapter`
- DEBT-018: R-SEC-005 — `BillLookupResult` a clase independiente en domain
- DEBT-019: RV-004 — Unificar validación referencia en controller (eliminar doble validación)

### Excluido (backlog futuro)
- Exportación del dashboard a PDF/Excel (FEAT-011)
- Presupuestos personalizados por categoría (FEAT-011)
- Recomendaciones de ahorro con IA (FEAT-012)
- Transferencias internacionales SEPA/SWIFT (FEAT-012)

---

## Dependencias técnicas

| Dependencia | Estado |
|---|---|
| `bill_payments` (FEAT-009 Flyway V12) | ✅ Sprint 11 |
| `transfers` + `beneficiaries` (FEAT-008 Flyway V11) | ✅ Sprint 10 |
| `audit_log` con eventos financieros | ✅ Sprints anteriores |
| Angular 17 + módulo `accounts` (FEAT-007) | ✅ Sprint 9 |
| JWT RS256 (DEBT-014) | ✅ Sprint 10 |
| Flyway V13: tabla `spending_categories` + `budget_alerts` | ⚠️ Sprint 12 día 1 |
| Chart.js 4 via Angular wrapper (ng2-charts) | ⚠️ Añadir a package.json frontend |

---

## User Stories

| ID | Título | SP | Prioridad | Semana |
|---|---|---|---|---|
| DEBT-017 | Null check `getAvailableBalance()` | 1 | Must Have | S1 día 1 |
| DEBT-018 | `BillLookupResult` como clase independiente | 1 | Must Have | S1 día 1 |
| DEBT-019 | Unificar validación referencia en controller | 1 | Must Have | S1 día 1 |
| US-1001 | Resumen financiero mensual (backend) | 5 | Must Have | S1 |
| US-1002 | Gastos por categoría + top comercios | 4 | Must Have | S1 |
| US-1003 | Evolución mensual — últimos 6 meses | 4 | Must Have | S2 |
| US-1004 | Comparativa mes actual vs anterior | 3 | Must Have | S2 |
| US-1005 | Alertas de gasto (80% presupuesto) | 3 | Should Have | S2 |
| US-1006 | Dashboard Angular — componentes visuales | 2 | Must Have | S2 |

**Total: 24 SP**

---

## User Stories — detalle

---

### DEBT-017 — Null check `getAvailableBalance()`

**Como** equipo de desarrollo,
**quiero** proteger `BankCoreRestAdapter.getAvailableBalance()` ante respuestas malformadas del core,
**para** evitar NullPointerExceptions en producción (R-SEC-006 Security Report Sprint 11).

**Estimación:** 1 SP | **Prioridad:** Must Have | **Semana:** S1 día 1

```gherkin
Escenario 1: Core devuelve body nulo → saldo 0.00 con log de warning
  Dado que el core responde con body malformado o nulo
  Cuando se consulta el saldo de una cuenta
  Entonces getAvailableBalance() devuelve BigDecimal.ZERO
  Y se registra un log WARN con el accountId

Escenario 2: Core responde correctamente → saldo real
  Dado que el core responde con balance válido
  Cuando se consulta el saldo
  Entonces getAvailableBalance() devuelve el saldo real sin modificar
```

---

### DEBT-018 — `BillLookupResult` como clase independiente

**Como** equipo de desarrollo,
**quiero** mover `BillLookupResult` de record anidado en `BillPaymentPort` a clase independiente,
**para** mejorar la legibilidad y coherencia del dominio (RV-005 Code Review Sprint 11).

**Estimación:** 1 SP | **Prioridad:** Must Have | **Semana:** S1 día 1

```gherkin
Escenario 1: BillLookupResult importable directamente
  Dado que BillLookupResult es una clase top-level en bill/domain/
  Cuando se usa en BillLookupAndPayUseCase y BillController
  Entonces el import es com.experis.sofia.bankportal.bill.domain.BillLookupResult
  Y no requiere BillPaymentPort.BillLookupResult
```

---

### DEBT-019 — Unificar validación referencia en controller

**Como** equipo de desarrollo,
**quiero** eliminar la doble validación de referencia de factura,
**para** tener un único punto de validación y comportamiento HTTP consistente (RV-004 CR Sprint 11).

**Estimación:** 1 SP | **Prioridad:** Must Have | **Semana:** S1 día 1

```gherkin
Escenario 1: Referencia inválida → HTTP 400 desde Bean Validation
  Dado que @Pattern(regexp="\\d{20}") está en el controller
  Cuando se envía referencia incorrecta
  Entonces retorna HTTP 400 (Bean Validation) en todos los endpoints
  Y validateReference() en el use case se elimina (ya no es necesaria)
```

---

### US-1001 — Resumen financiero mensual (backend)

**Como** usuario autenticado,
**quiero** un endpoint que devuelva mi resumen financiero del mes actual,
**para** ver de un vistazo mis ingresos, gastos totales y saldo neto del período.

**Estimación:** 5 SP | **Prioridad:** Must Have | **Semana:** S1

```gherkin
Escenario 1: Resumen del mes actual
  Dado que el usuario tiene transacciones en el mes actual
  Cuando llama a GET /api/v1/dashboard/summary?period=current_month
  Entonces recibe totalIncome, totalExpenses, netBalance, transactionCount
  Y los datos incluyen transferencias + pagos de recibos + facturas

Escenario 2: Mes sin actividad → valores en cero
  Dado que el usuario no tiene transacciones en el período
  Cuando llama al endpoint
  Entonces recibe un objeto con todos los campos en 0.00 (no error)

Escenario 3: Resumen de mes anterior
  Dado el parámetro period=previous_month
  Cuando llama al endpoint
  Entonces recibe el resumen del mes anterior completo

Escenario 4: Acceso sin autenticación → 401
  Dado que no hay JWT en el request
  Cuando llama al endpoint
  Entonces recibe HTTP 401
```

---

### US-1002 — Gastos por categoría + top comercios

**Como** usuario autenticado,
**quiero** ver mis gastos agrupados por categoría y los 5 comercios donde más gasto,
**para** identificar dónde va mi dinero y tomar decisiones de ahorro.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S1

```gherkin
Escenario 1: Gastos categorizados del mes
  Dado que el usuario tiene pagos y transferencias del mes
  Cuando llama a GET /api/v1/dashboard/categories?period=current_month
  Entonces recibe lista de {category, amount, percentage, transactionCount}
  Y la suma de todos los amounts = totalExpenses del resumen

Escenario 2: Top 5 comercios/emisores
  Dado que el usuario tiene pagos a distintos emisores
  Cuando llama a GET /api/v1/dashboard/top-merchants?period=current_month&limit=5
  Entonces recibe lista ordenada por importe DESC de {issuer, totalAmount, count}

Escenario 3: Categorización automática por concepto
  Dado que un pago tiene concepto "Mercadona"
  Cuando se categoriza
  Entonces se asigna categoría ALIMENTACION automáticamente
```

---

### US-1003 — Evolución mensual últimos 6 meses

**Como** usuario autenticado,
**quiero** ver la evolución de mis gastos e ingresos en los últimos 6 meses,
**para** detectar tendencias y comparar mi comportamiento financiero a lo largo del tiempo.

**Estimación:** 4 SP | **Prioridad:** Must Have | **Semana:** S2

```gherkin
Escenario 1: Serie temporal de 6 meses
  Dado que el usuario tiene historial de transacciones
  Cuando llama a GET /api/v1/dashboard/evolution?months=6
  Entonces recibe array de 6 objetos {month, year, totalIncome, totalExpenses, netBalance}
  Y están ordenados cronológicamente (más antiguo primero)

Escenario 2: Meses sin actividad incluidos como cero
  Dado que algún mes no tiene transacciones
  Cuando se solicita la evolución
  Entonces ese mes aparece con valores en 0.00 (no se omite)

Escenario 3: Menos de 6 meses de historial
  Dado que el usuario tiene solo 3 meses de historial
  Cuando solicita 6 meses
  Entonces recibe 3 meses con datos y 3 con cero
```

---

### US-1004 — Comparativa mes actual vs anterior

**Como** usuario autenticado,
**quiero** ver cuánto he gastado este mes comparado con el mes pasado,
**para** saber si estoy controlando mejor o peor mis gastos.

**Estimación:** 3 SP | **Prioridad:** Must Have | **Semana:** S2

```gherkin
Escenario 1: Comparativa con variación porcentual
  Dado que el usuario tiene datos de los dos últimos meses
  Cuando llama a GET /api/v1/dashboard/comparison
  Entonces recibe currentMonth, previousMonth y variationPercent para expenses e income
  Y variationPercent es positivo si gasta más este mes, negativo si gasta menos

Escenario 2: Sin mes anterior → variación null
  Dado que es el primer mes del usuario
  Cuando solicita la comparativa
  Entonces previousMonth = null y variationPercent = null (no error)
```

---

### US-1005 — Alertas de gasto

**Como** usuario autenticado,
**quiero** recibir una alerta cuando supero el 80% de mi presupuesto mensual,
**para** poder ajustar mis gastos antes de fin de mes.

**Estimación:** 3 SP | **Prioridad:** Should Have | **Semana:** S2

```gherkin
Escenario 1: Alerta al superar umbral del 80%
  Dado que el usuario tiene presupuesto mensual configurado de 1500€
  Cuando sus gastos alcanzan 1200€ (80%)
  Entonces se genera evento BUDGET_ALERT_80_PERCENT
  Y se envía notificación SSE + email al usuario

Escenario 2: Sin presupuesto configurado → no hay alerta
  Dado que el usuario no ha configurado presupuesto
  Cuando realiza gastos
  Entonces no se generan alertas de presupuesto

Escenario 3: Consulta de alertas activas
  Dado que se ha disparado una alerta
  Cuando llama a GET /api/v1/dashboard/alerts
  Entonces recibe lista de alertas con {type, threshold, currentAmount, triggeredAt}
```

---

### US-1006 — Dashboard Angular — componentes visuales

**Como** usuario,
**quiero** ver el dashboard como una página visual con gráficos interactivos,
**para** entender mi situación financiera de forma intuitiva sin leer tablas de datos.

**Estimación:** 2 SP | **Prioridad:** Must Have | **Semana:** S2

```gherkin
Escenario 1: Dashboard carga con datos reales
  Dado que el usuario accede a /dashboard
  Cuando la página carga
  Entonces muestra: resumen financiero, gráfico de donut de categorías,
    gráfico de barras de evolución 6 meses, comparativa mes vs mes anterior

Escenario 2: Estado de carga mientras se obtienen datos
  Dado que las llamadas API están en curso
  Cuando la página carga
  Entonces muestra skeleton loaders (no pantalla en blanco)

Escenario 3: Error de conectividad → mensaje informativo
  Dado que el backend no está disponible
  Cuando el dashboard intenta cargar
  Entonces muestra mensaje "No se pueden cargar los datos ahora mismo" sin romper la app
```

---

## Riesgos FEAT-010

| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| R-F10-001 | Queries de agregación lentas sobre tablas grandes | M | M | Índices en `paid_at` + `user_id` ya presentes. Query plan en STG antes de producción |
| R-F10-002 | Categorización automática por concepto imprecisa | M | B | MVP con regex básicas. ML en FEAT-012 |
| R-F10-003 | Chart.js/ng2-charts aumenta bundle Angular | B | B | Lazy loading del módulo dashboard |
| R-F10-004 | Tres DEBTs en día 1 retrasan inicio de features | M | M | DEBTs son cambios pequeños (3 SP total) · 1 desarrollador · mañana completo |

---

## Definition of Ready ✅

- [x] 9 ítems con Gherkin completo
- [x] 24 SP = capacidad del sprint
- [x] DEBTs identificadas como bloqueantes día 1 (3 SP, fáciles)
- [x] Flyway V13 diseñado (spending_categories + budget_alerts)
- [x] Stack frontend definido (Angular 17 + Chart.js 4 via ng2-charts)
- [x] Dependencias de sprints anteriores confirmadas (V11 + V12)

---

*Generado por SOFIA Scrum Master Agent · BankPortal Sprint 12 · 2026-03-21*
*CMMI Level 3 — PP SP 2.1 · PP SP 2.2 · REQM SP 1.1*
