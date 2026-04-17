# Sprint 25 Planning — FEAT-023 · Mi Dinero (PFM)
**Proyecto:** BankPortal · **Cliente:** Banco Meridian
**Sprint:** 25 · **Fecha:** 2026-04-16 · **Release objetivo:** v1.25.0
**SOFIA:** v2.7 · **Gate G-1:** Aprobado PO 2026-04-16T10:38:13Z

---

## Sprint Goal
Permitir al cliente de Banco Meridian tomar el control de sus finanzas personales
mediante categorización automática de movimientos, presupuestos configurables por
categoría, alertas de gasto y análisis mensual comparativo — posicionando BankPortal
como referente de banca digital inteligente frente a la competencia.

---

## Capacidad Sprint 25
| Concepto | SP |
|---|---|
| Velocidad referencia (últimos 3 sprints) | 24 SP |
| FEAT-023 Mi Dinero (7 US) | 19 SP |
| DEBT-047 Top merchants unificar fuentes | 2 SP |
| Task soporte + planning | 3 SP |
| **Total** | **24 SP** |

---

## User Stories — FEAT-023 Mi Dinero

### US-F023-01 · Categorización automática de movimientos (3 SP)
**Como** cliente de Banco Meridian
**Quiero** que mis movimientos se categoricen automáticamente (Alimentación, Transporte, Ocio, Salud, etc.)
**Para** entender en qué gasto mi dinero sin esfuerzo manual

**Criterios de aceptación (Gherkin):**
```gherkin
Scenario: Movimiento categorizado automáticamente
  Given tengo un movimiento de "MERCADONA SA" por -45.20 EUR
  When accedo a Mi Dinero > Movimientos
  Then el movimiento aparece con categoría "Alimentación"
  And el icono de categoría es visible

Scenario: Movimiento sin categoría conocida
  Given tengo un movimiento de "EMPRESA DESCONOCIDA XYZ" por -12.00 EUR
  When accedo a Mi Dinero > Movimientos
  Then el movimiento aparece con categoría "Otros"
```
**RN:** categorización basada en reglas por concepto/IBAN acreedor (motor de reglas extensible)

---

### US-F023-02 · Gestión de presupuestos por categoría (3 SP)
**Como** cliente
**Quiero** crear presupuestos mensuales por categoría de gasto
**Para** controlar mis gastos y no superar mis límites

**Criterios de aceptación:**
```gherkin
Scenario: Crear presupuesto
  Given estoy en Mi Dinero > Presupuestos
  When creo un presupuesto de 300 EUR para "Alimentación"
  Then el presupuesto queda registrado para el mes actual
  And veo la barra de progreso con 0% consumido

Scenario: Presupuesto excedido
  Given tengo un presupuesto de 300 EUR para "Alimentación"
  And he gastado 310 EUR en "Alimentación" este mes
  When accedo a Presupuestos
  Then el presupuesto aparece en rojo con "Excedido: 10.00 EUR"
```
**RN:** máximo 10 presupuestos activos simultáneos por usuario; un presupuesto por categoría

---

### US-F023-03 · Alertas de gasto por umbral configurable (3 SP)
**Como** cliente
**Quiero** recibir alertas cuando mi gasto en una categoría alcance un porcentaje configurable del presupuesto
**Para** actuar antes de superarlo

**Criterios de aceptación:**
```gherkin
Scenario: Alerta al 80% del presupuesto
  Given tengo un presupuesto de 300 EUR para "Alimentación" con alerta al 80%
  And he gastado 241 EUR (80.33%)
  When se registra un nuevo movimiento de "Alimentación"
  Then recibo notificación push "Has consumido el 80% de tu presupuesto de Alimentación"

Scenario: Configurar umbral de alerta
  Given estoy en detalle del presupuesto "Alimentación"
  When configuro el umbral de alerta al 75%
  Then el umbral queda guardado y la próxima alerta se disparará al 75%
```
**RN:** integración con sistema de notificaciones existente (S14); umbral configurable 50%-95%

---

### US-F023-04 · Análisis mensual comparativo con gráficos (3 SP)
**Como** cliente
**Quiero** ver un análisis visual de mi gasto mensual comparado con el mes anterior
**Para** identificar tendencias y tomar decisiones financieras

**Criterios de aceptación:**
```gherkin
Scenario: Ver análisis mensual
  Given tengo movimientos en abril y marzo
  When accedo a Mi Dinero > Análisis
  Then veo un gráfico de barras por categoría comparando ambos meses
  And veo el total gastado este mes vs mes anterior
  And veo el porcentaje de variación por categoría

Scenario: Navegación entre meses
  Given estoy en el análisis de abril
  When pulso "< Mes anterior"
  Then veo el análisis de marzo
```
**RN:** historial mínimo 12 meses; gráficos con datos reales de transactions

---

### US-F023-05 · Widget "¿Cómo voy este mes?" en dashboard (2 SP)
**Como** cliente
**Quiero** ver un resumen de mis finanzas personales directamente en el dashboard principal
**Para** tener visibilidad inmediata sin entrar en Mi Dinero

**Criterios de aceptación:**
```gherkin
Scenario: Widget visible en dashboard
  Given tengo presupuestos configurados
  When accedo al dashboard
  Then veo el widget "Mi Dinero" con gasto total del mes
  And veo las 3 categorías con mayor gasto
  And veo el semáforo de presupuestos (verde/amarillo/rojo)

Scenario: Sin presupuestos configurados
  Given no tengo presupuestos configurados
  When accedo al dashboard
  Then el widget muestra "Configura tus presupuestos" con CTA a Mi Dinero
```

---

### US-F023-06 · Edición manual de categoría de movimiento (2 SP)
**Como** cliente
**Quiero** poder cambiar la categoría de un movimiento si la automática es incorrecta
**Para** mantener mis datos financieros precisos

**Criterios de aceptación:**
```gherkin
Scenario: Recategorizar movimiento
  Given tengo un movimiento categorizado como "Otros"
  When pulso "Editar categoría" y selecciono "Restaurantes"
  Then el movimiento queda categorizado como "Restaurantes"
  And los totales del análisis se recalculan

Scenario: Recordar recategorización futura
  Given he recategorizado "RESTAURANTE PEPE SA" a "Restaurantes"
  When entra un nuevo movimiento de "RESTAURANTE PEPE SA"
  Then se categoriza automáticamente como "Restaurantes"
```
**RN:** las reglas de usuario tienen prioridad sobre las del sistema

---

### US-F023-07 · Distribución de gasto y top comercios (3 SP)
**Como** cliente
**Quiero** ver un gráfico de distribución de gasto por categoría y el ranking de comercios donde más gasto
**Para** identificar dónde concentro mi dinero

**Criterios de aceptación:**
```gherkin
Scenario: Ver distribución de gasto
  Given tengo movimientos este mes
  When accedo a Mi Dinero > Distribución
  Then veo un gráfico de tarta con el porcentaje por categoría
  And el total suma 100%

Scenario: Ver top comercios
  Given tengo movimientos en distintos comercios
  When accedo a Mi Dinero > Top Comercios
  Then veo el ranking top-10 de comercios por importe gastado
  And cada comercio muestra nombre, nº transacciones e importe total
```
**RN:** top comercios unifica bill_payments + transactions CARGO (cierra DEBT-047)

---

## Deuda técnica incluida

### DEBT-047 · Top merchants unificar fuentes (2 SP) — SCRUM-153
Corregir `DashboardJpaAdapter.findTopMerchants()` para unificar `bill_payments`
y `transactions` CARGO en el ranking. Actualmente solo lee `bill_payments`.
Ver registro en session.json `open_debts[DEBT-047]`.

---

## Issues Jira Sprint 25
| Key | Título | SP | Tipo |
|---|---|---|---|
| SCRUM-154 | SPRINT-025 Planning & Setup — Step 1 Scrum Master | 1 | Historia |
| SCRUM-155 | US-F023-01: Categorización automática de movimientos | 3 | Historia |
| SCRUM-156 | US-F023-02: Gestión de presupuestos por categoría | 3 | Historia |
| SCRUM-157 | US-F023-03: Alertas de gasto por umbral configurable | 3 | Historia |
| SCRUM-158 | US-F023-04: Análisis mensual comparativo con gráficos | 3 | Historia |
| SCRUM-159 | US-F023-05: Widget "¿Cómo voy este mes?" en dashboard | 2 | Historia |
| SCRUM-160 | US-F023-06: Edición manual de categoría de movimiento | 2 | Historia |
| SCRUM-161 | US-F023-07: Distribución de gasto y top comercios | 3 | Historia |
| SCRUM-153 | DEBT-047: Dashboard top-merchants — unificar fuentes | 2 | Historia |
| SCRUM-162 | SPRINT-025 Closure — Step 9 Workflow Manager | 1 | Historia |

**Total:** 10 issues · 24 SP

---

## Branching model
- Rama de trabajo: `feature/FEAT-023-sprint25`
- Base: `develop`
- Merge al cierre: `feature → develop → main` + tag `v1.25.0`

---

## Artefactos generados
- `docs/sprints/SPRINT-025-planning.md` (este documento)
- Issues Jira SCRUM-154..162 + SCRUM-153 en sprint
