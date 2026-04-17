# SRS — FEAT-023 · Mi Dinero (Gestor de Finanzas Personales)

## 1. Metadata

| Campo | Valor |
|---|---|
| **ID Feature** | FEAT-023 |
| **Nombre** | Mi Dinero — Gestor de Finanzas Personales (PFM) |
| **Proyecto** | BankPortal · **Cliente:** Banco Meridian |
| **Stack** | Java + Angular + PostgreSQL |
| **Tipo** | new-feature · **Sprint:** 25 · **Release:** v1.25.0 |
| **Versión** | 1.0 · **Estado:** IN_REVIEW · **Fecha:** 2026-04-16 |

## 2. Contexto

BankPortal es el portal bancario digital de Banco Meridian. FEAT-023 introduce el módulo **"Mi Dinero"** (PFM): categorización automática de movimientos, presupuestos por categoría, alertas configurables, análisis mensual comparativo y widget de resumen en dashboard. Posiciona a BankPortal en el segmento de banca digital inteligente frente a N26, Revolut y Monzo.

## 3. Alcance

**Incluido:** categorización por reglas · presupuestos (máx 10/usuario) · alertas push · análisis 12 meses · widget dashboard · edición manual con aprendizaje · distribución + top-10 comercios · cierre DEBT-047

**Excluido:** ML/IA de categorización · exportación PDF/Excel · Open Banking AIS · metas de ahorro

## 4. Épica

**EPIC-023: Inteligencia Financiera Personal** — Dotar a los clientes de herramientas de control financiero nativas, eliminando la necesidad de apps de terceros y aumentando el tiempo de uso activo del portal.

## 5. User Stories

### US-F023-01 · Categorización automática de movimientos (3 SP)

**Como** cliente **Quiero** que mis movimientos se categoricen automáticamente **Para** entender mi gasto sin clasificar manualmente

**Categorías:** Alimentación · Transporte · Restaurantes · Salud · Hogar · Suministros · Comunicaciones · Ocio · Educación · Viajes · Seguros · Nómina · Transferencias · Otros

```gherkin
Scenario: Movimiento categorizado por concepto
  Given un CARGO de -45.20 EUR con concepto "COMPRA MERCADONA SA"
  When accedo a Mi Dinero > Movimientos
  Then el movimiento aparece con categoría "Alimentación" e icono

Scenario: Movimiento sin categoría conocida
  Given un CARGO con concepto "EMPRESA XYZ SL REF0001"
  When accedo a Mi Dinero > Movimientos
  Then aparece con categoría "Otros" y es editable (US-F023-06)

Scenario: Ingreso de nómina
  Given un ABONO de +2.400 EUR concepto "NOMINA ABRIL"
  When accedo a Mi Dinero
  Then aparece categoría "Nómina" y NO suma a ningún presupuesto de gasto

Scenario: Transferencia interna
  Given una transferencia a cuenta propia
  When accedo a Mi Dinero
  Then aparece categoría "Transferencias" y se excluye del análisis de gasto
```

**RN-F023-01:** Categorización por ILIKE sobre `concept`. Reglas usuario > reglas sistema.
**RN-F023-02:** Solo movimientos CARGO cuentan en presupuestos y análisis.
**RN-F023-03:** Categoría calculada en tiempo de consulta; solo se persiste el override manual.

---

### US-F023-02 · Gestión de presupuestos mensuales por categoría (3 SP)

**Como** cliente **Quiero** crear presupuestos mensuales por categoría **Para** controlar mis límites de gasto

```gherkin
Scenario: Crear presupuesto
  Given no tengo presupuesto para "Alimentación"
  When creo uno de 300.00 EUR
  Then queda creado con barra de progreso al % consumido real

Scenario: Presupuesto >80%
  Given presupuesto 300 EUR · gastado 245 EUR (81.7%)
  When accedo a Presupuestos
  Then barra naranja "Quedan 55.00 € · 81% consumido"

Scenario: Presupuesto excedido
  Given presupuesto 300 EUR · gastado 315 EUR
  When accedo a Presupuestos
  Then barra roja "Excedido 15.00 €"

Scenario: Límite máximo
  Given 10 presupuestos activos
  When intento crear uno más
  Then "Has alcanzado el máximo de 10 presupuestos"
```

**RN-F023-04:** Máx 10 presupuestos/usuario. **RN-F023-05:** 1 presupuesto/categoría/mes.
**RN-F023-06:** Importe > 0 EUR ≤ 99.999,99 EUR · BigDecimal HALF_EVEN (ADR-034).
**RN-F023-07:** Presupuestos mensuales — consumo se resetea al inicio de cada mes.

---

### US-F023-03 · Alertas de gasto por umbral configurable (3 SP)

**Como** cliente **Quiero** alertas push al alcanzar un % configurable de mi presupuesto **Para** actuar antes de superarlo

```gherkin
Scenario: Configurar umbral
  Given presupuesto 300 EUR para "Alimentación"
  When configuro alerta al 80%
  Then "Recibirás alerta al alcanzar 240.00 €"

Scenario: Alerta push al superar umbral
  Given presupuesto 300 EUR · alerta 80% · gastado 235 EUR
  When entra nuevo movimiento -10 EUR (total 245 EUR = 81.7%)
  Then push "⚠️ Alimentación: has consumido el 81% de tu presupuesto de 300,00 €"
  And alerta NO se repite hasta el mes siguiente

Scenario: Umbral fuera de rango
  Given configuro umbral al 120%
  Then "El umbral debe estar entre 50% y 95%"
```

**RN-F023-08:** Umbral 50%–95% en incrementos de 5%. **RN-F023-09:** 1 alerta/presupuesto/mes.
**RN-F023-10:** Tipo notificación `BUDGET_ALERT`, acción `/pfm/presupuestos` (integra FEAT-014).
**RN-F023-11:** Evaluación síncrona al registrar cada movimiento.

---

### US-F023-04 · Análisis mensual comparativo con gráficos (3 SP)

**Como** cliente **Quiero** análisis visual de gasto por categoría comparado mes a mes **Para** identificar tendencias

```gherkin
Scenario: Ver análisis mes actual
  Given tengo movimientos categorizados este mes
  When accedo a Mi Dinero > Análisis
  Then veo gráfico de barras dobles (mes actual vs anterior) por categoría
  And veo total mes actual, total mes anterior y % variación global

Scenario: Categoría con aumento de gasto
  Given "Restaurantes": 180 EUR este mes vs 100 EUR el anterior
  Then aparece variación "+80% ↑" en rojo

Scenario: Navegar mes anterior
  Given viendo análisis abril 2026
  When pulso "< Mes anterior"
  Then veo análisis marzo 2026 vs febrero 2026
```

**RN-F023-12:** Historial 12 meses. **RN-F023-13:** Solo categorías con ≥1 CARGO.
**RN-F023-14:** Importes EUR 2 decimales · tabular-nums (LA-023-02).

---

### US-F023-05 · Widget "¿Cómo voy este mes?" en dashboard (2 SP)

**Como** cliente **Quiero** ver resumen de mis finanzas en el dashboard principal **Para** visibilidad inmediata sin entrar en Mi Dinero

```gherkin
Scenario: Widget con presupuestos
  Given tengo presupuestos y movimientos este mes
  When accedo al dashboard
  Then veo widget "Mi Dinero": gasto total + top 3 categorías + semáforo (verde/naranja/rojo)
  And enlace "Ver detalle →" navega a /pfm

Scenario: Sin presupuestos configurados
  Given no tengo presupuestos
  When accedo al dashboard
  Then widget muestra CTA "Configura tus presupuestos" → /pfm/presupuestos
```

**RN-F023-15:** Widget asíncrono — degradación elegante si falla, sin romper dashboard.
**RN-F023-16:** Navegación con `Router.navigateByUrl()` nunca `[href]` (LA-023-01).

---

### US-F023-06 · Edición manual de categoría de movimiento (2 SP)

**Como** cliente **Quiero** corregir la categoría de un movimiento **Para** mantener precisión y que el sistema aprenda

```gherkin
Scenario: Recategorizar movimiento
  Given movimiento "FLOWERTOPIA SL" categorizado como "Otros"
  When selecciono "Hogar" y confirmo
  Then queda categorizado como "Hogar" y análisis se recalcula

Scenario: Sistema aprende la regla
  Given he categorizado "FLOWERTOPIA SL" como "Hogar"
  When entra nuevo movimiento "FLOWERTOPIA SL"
  Then se categoriza automáticamente como "Hogar" (regla usuario > sistema)

Scenario: ABONO no recategorizable
  Given tengo un ABONO de nómina
  When intento editar su categoría
  Then "Los ingresos no pueden recategorizarse como gasto"
```

**RN-F023-17:** Reglas en `pfm_user_rules (user_id, concept_pattern, category_code)`.
**RN-F023-18:** Máx 50 reglas/usuario. **RN-F023-19:** Solo CARGO son recategorizables.

---

### US-F023-07 · Distribución de gasto y top comercios (3 SP)

**Como** cliente **Quiero** ver distribución porcentual por categoría y ranking de comercios **Para** identificar dónde concentro mi dinero

```gherkin
Scenario: Gráfico de distribución
  Given tengo movimientos CARGO este mes
  When accedo a Mi Dinero > Distribución
  Then veo gráfico de tarta por categoría (nombre + importe + %)
  And sectores suman 100% excluyendo Transferencias y Nómina

Scenario: Top comercios
  Given movimientos en distintos comercios
  When accedo a Top Comercios
  Then veo top-10 por importe: nombre + nº transacciones + importe total
  And ranking incluye bill_payments Y transactions CARGO

Scenario: Drill-down comercio
  Given "MERCADONA" aparece con 3 transacciones · 134.50 €
  When pulso sobre él
  Then veo las 3 transacciones con fecha, concepto e importe
```

**RN-F023-20:** Top comercios unifica `bill_payments.biller_name` + `transactions.concept` (primer token >4 chars). **Cierra DEBT-047.**
**RN-F023-21:** Excluir transferencias entre cuentas propias y pagos AEAT/TGSS/SUMA.
**RN-F023-22:** Paleta de 8 colores complementarios del design system (prototipo UX).

---

## 6. RNF Delta

| ID | Categoría | Descripción | Criterio |
|---|---|---|---|
| RNF-D023-01 | Rendimiento | Carga Mi Dinero (movimientos + categorías) | p95 < 400ms |
| RNF-D023-02 | Rendimiento | Cálculo totales por categoría mes en curso | p95 < 300ms |
| RNF-D023-03 | Rendimiento | Widget dashboard asíncrono | Widget < 600ms; dashboard visible < 200ms |
| RNF-D023-04 | Privacidad | `pfm_user_rules` sujeta a GDPR derecho al olvido | Eliminación en flujo FEAT-019 |
| RNF-D023-05 | Usabilidad | Gráficos accesibles | Valores en texto alternativo (WCAG 1.1.1) |
| RNF-D023-06 | Escalabilidad | Historial 12 meses | Estable con ≤ 5.000 transacciones/usuario |

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-F023-01 | Tecnología | Paquete `com.experis.sofia.bankportal` · arquitectura hexagonal |
| RR-F023-02 | Tecnología | Módulo Angular lazy `/pfm` · Router.navigateByUrl() (LA-023-01) |
| RR-F023-03 | Tecnología | BigDecimal HALF_EVEN (ADR-034) |
| RR-F023-04 | Normativa | GDPR — datos financieros personales · derecho supresión |
| RR-F023-05 | Normativa | PSD2 — solo datos del propio titular |
| RR-F023-06 | Diseño | Fidelidad prototipo UX verificada en G-4/G-5 (LA-023-02) |
| RR-F023-07 | Base de datos | Flyway V28 para tablas PFM nuevas |

## 8. Supuestos y dependencias

**Supuestos:** transactions históricas disponibles para 12 meses · seed ≥50 reglas de categorización en Flyway · notificaciones push operativas (FEAT-014)

**Orden de implementación:** US-01 → US-06 → US-02 → US-03 → US-04 → US-07 → US-05

## 9. RTM

| ID US | RF / RN | Componente Arq. | TC | Estado |
|---|---|---|---|---|
| US-F023-01 | RN-F023-01/02/03 | `PfmCategorizationService` · `pfm_category_rules` · `pfm_user_rules` | TC-F023-001..004 | DRAFT |
| US-F023-02 | RN-F023-04/05/06/07 | `BudgetService` · `pfm_budgets` | TC-F023-005..010 | DRAFT |
| US-F023-03 | RN-F023-08..11 | `BudgetAlertService` · `NotificationService` | TC-F023-011..015 | DRAFT |
| US-F023-04 | RN-F023-12/13/14 | `PfmAnalysisService` · `PfmController` | TC-F023-016..020 | DRAFT |
| US-F023-05 | RN-F023-15/16 | `DashboardComponent` · `PfmWidgetComponent` | TC-F023-021..023 | DRAFT |
| US-F023-06 | RN-F023-17/18/19 | `UserRuleService` · `pfm_user_rules` | TC-F023-024..027 | DRAFT |
| US-F023-07 | RN-F023-20/21/22 · DEBT-047 | `PfmDistributionService` · `DashboardJpaAdapter` | TC-F023-028..032 | DRAFT |

## 10. DoD

- [ ] Código implementado y revisado (G-5)
- [ ] Tests unitarios ≥80% en servicios de dominio
- [ ] Tests integración `@SpringBootTest` categorización y presupuestos
- [ ] Prototipo UX verificado componente a componente (LA-023-02 / LA-CORE-043)
- [ ] HLD + LLD actualizados (Step 3)
- [ ] QA: ≥90% TCs PASS, 0 críticos (G-6)
- [ ] BUILD SUCCESS · Pipeline verde (G-4b)
- [ ] Seed categorías ≥50 reglas en Flyway V28
- [ ] Widget degradación elegante verificada
- [ ] `pfm_user_rules` en flujo GDPR derecho al olvido
- [ ] DEBT-047 cerrado · findTopMerchants unificado (TC-F023-031)
- [ ] FA-Agent actualizado Step 8b

---
*Requirements Analyst · SOFIA v2.7 · 2026-04-16 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
