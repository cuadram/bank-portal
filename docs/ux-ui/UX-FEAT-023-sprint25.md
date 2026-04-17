# UX/UI Design — FEAT-023 · Mi Dinero (PFM) · Sprint 25

**Versión:** 1.0 | **Fecha:** 2026-04-16 | **Agente:** UX/UI Designer Agent v2.0
**Sprint:** 25 | **Feature:** FEAT-023 | **Prototipo:** docs/ux-ui/prototypes/PROTO-FEAT-023-sprint25.html
**Estado:** PENDIENTE APROBACIÓN PO/TL

---

## 1. Resumen de Diseño

Mi Dinero introduce el primer módulo PFM nativo de BankPortal. Principio rector: **progresión de complejidad** — la entrada muestra el resumen mensual; el usuario profundiza por tabs según su interés.

Pantallas diseñadas: 8 | Flujos completos: 3 | Estados cubiertos: datos/vacío/error/cargando

## 2. Actores

| Actor | Contexto | Dispositivo |
|---|---|---|
| Cliente Banco Meridian | Revisión diaria de gastos, control presupuesto | Desktop >70% + mobile |
| Sistema Notificaciones | Emisión BUDGET_ALERT (FEAT-014) | Backend |

## 3. User Flows

### Flujo A — Configurar presupuesto
Dashboard widget → Mi Dinero overview → Presupuestos → Nuevo presupuesto (form validado) → Toast éxito → Lista presupuestos

### Flujo B — Recategorizar movimiento
Overview movimientos → Click ✏️ → Modal selector 14 categorías → Confirmar → Toast + regla guardada

### Flujo C — Análisis comparativo
Tab Análisis → Vista mes actual vs anterior → Navegar mes (◀/▶) → Click categoría → Detalle movimientos

## 4. Arquitectura de Información

```
/pfm                    → Overview: KPIs + movimientos categorizados
/pfm?tab=presupuestos   → Lista presupuestos + barras semafóricas
/pfm?tab=analisis       → Barras dobles comparativo mensual
/pfm?tab=distribucion   → Donut distribución + top-10 comercios
```

Tabs con shallow routing (query params), NO rutas hijas separadas.

## 5. Inventario de Componentes Angular

| Componente | Tipo | Notas |
|---|---|---|
| PfmPageComponent | Smart | Tabs + estado global |
| PfmOverviewComponent | Smart | KPI cards + movimientos |
| PfmMovimientoRowComponent | Presentational | @Input movimiento+categoria |
| CategoryEditModalComponent | Overlay | MatDialog, 14 categorías |
| BudgetListComponent | Smart | Lista + API |
| BudgetProgressBarComponent | Presentational | @Input budget/spent/threshold |
| BudgetFormComponent | Smart | ReactiveForm, max 10 |
| PfmAnalysisComponent | Smart | Barras dobles, nav meses |
| PfmDistributionComponent | Smart | Donut CSS + top comercios |
| PfmWidgetComponent | Presentational | Dashboard, async + degradación |

## 6. Design Tokens PFM

```scss
--pfm-alimentacion: #4CAF50;  --pfm-transporte:   #2196F3;
--pfm-restaurantes: #FF9800;  --pfm-salud:        #E91E63;
--pfm-hogar:        #9C27B0;  --pfm-suministros:  #00BCD4;
--pfm-ocio:         #FF5722;  --pfm-otros:        #607D8B;
--pfm-budget-ok:    #00897B;  // ≤80%
--pfm-budget-warn:  #F57F17;  // 81-99%
--pfm-budget-danger:#E53935;  // ≥100%
// Importes (LA-023-02): width:7rem; text-align:right; font-variant-numeric:tabular-nums
```

## 7. Accesibilidad WCAG 2.1 AA

- Barras presupuesto: aria-valuenow/min/max/label
- Gráfico distribución: tabla alternativa role="table"
- Modal categoría: focus trap + Escape + aria-modal="true"
- Tabs: role="tablist" + role="tab" + aria-selected
- Variaciones: texto descriptivo además de color (↑/↓)
- Widget: aria-busy="true" durante carga

## 8. Notas para Angular Developer

- Ruta lazy `/pfm` + nav "Mi Dinero 📊" en shell.component.ts
- Navegación: SIEMPRE Router.navigateByUrl() — NUNCA [href] (LA-023-01)
- Widget: catchError → of(null), NUNCA EMPTY (LA-STG-001)
- Importes: width:7rem; text-align:right; font-variant-numeric:tabular-nums (LA-023-02)
- Top comercios: unificar bill_payments + transactions (DEBT-047)
- Verificar techo 10 presupuestos en BudgetService.create() antes de persistir

---
*UX/UI Designer Agent v2.0 · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian*
