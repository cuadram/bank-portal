# Bug Report — FEAT-023 Mi Dinero PFM · Revisión Visual PO
## Auditoría pantalla a pantalla vs PROTO-FEAT-023-sprint25.html

**Fecha:** 2026-04-16 · **Revisado por:** Product Owner (Angel de la Cuadra)
**Método:** Comparación directa real vs prototipo aprobado — 5 pantallas
**Sprint:** 25 · **Release:** v1.25.0 (pre-release, stack STG activo)

---

## Resumen ejecutivo

| Severidad | Total |
|---|---|
| 🔴 Crítico | 9 |
| 🟠 Mayor | 14 |
| 🟡 Menor | 13 |
| **TOTAL** | **36** |

**Bug raíz transversal identificado:** Los importes CARGO llegan del backend con signo negativo y el frontend no aplica `Math.abs()` antes de renderizarlos. Este único bug corrompe todos los cálculos derivados en Overview, Presupuestos y Análisis (porcentajes, semáforos, variaciones, totales).

**Release bloqueado:** Los 9 bugs críticos impiden el release de v1.25.0 hasta su corrección.

---

## BUG-PO-001 🔴 CRÍTICO — Importes negativos transversal en todo el módulo PFM

**Pantallas afectadas:** Overview · Presupuestos · Análisis
**Componentes Angular:** `PfmOverviewComponent` · `BudgetListComponent` · `PfmAnalysisComponent`
**Descripción:** Los importes CARGO se muestran con signo negativo en toda la UI (-66,58 € / -151,65 € / -283,23 €). El backend devuelve los valores negativos (correcto para CARGO) pero el frontend no aplica valor absoluto antes de renderizarlos. Esto corrompe los cálculos de porcentaje (-44%, -18%), semáforo (siempre verde), variación (-122,7% vs +14,5% esperado) y totales.

**Causa raíz probable:** En `pfm.service.ts`, al mapear la respuesta del backend, los campos `amount` y `spent` no pasan por `Math.abs()`.

**Acción correctiva:**
```typescript
// pfm.service.ts — mapeo de movimientos y presupuestos
movements = response.movements.map(m => ({
  ...m,
  amount: Math.abs(m.amount)  // CARGO siempre positivo en UI
}));

budgets = response.budgets.map(b => ({
  ...b,
  spent: Math.abs(b.spent),
  percentConsumed: Math.abs(b.percentConsumed)
}));
```
También revisar `PfmAnalysisComponent`: `currentTotal` y `previousTotal` deben ser `Math.abs()` antes de calcular variación.

**Impacto:** Bloquea completamente la funcionalidad de Presupuestos y Análisis.

---

## BUG-PO-002 🔴 CRÍTICO — KPI cards Overview incorrectas

**Pantalla:** Overview
**Componente:** `PfmOverviewComponent`
**Descripción:** Las 3 KPI cards no corresponden al prototipo aprobado:
- Card 2 muestra "Ingresos · 0,00 €" en lugar de "Presupuestos activos · 4/10 · semáforo ●●●"
- Card 3 muestra "Movimientos · 13" en lugar de "Categorías detectadas · 8 de 14 posibles"
- Card 1 falta el subíndice "↑ +14,5% vs marzo" en rojo

**Acción correctiva:** Reemplazar las KPIs en `PfmOverviewComponent` según el prototipo:
```typescript
// pfm-overview.component.ts
kpis = [
  { label: 'Gasto total mes', value: this.overview.totalSpent, sub: this.overview.variationVsPrev },
  { label: 'Presupuestos activos', value: `${this.overview.activeBudgets} / 10`, semaphore: true },
  { label: 'Categorías detectadas', value: this.overview.categoriesCount, sub: 'de 14 posibles este mes' }
];
```
Eliminar los campos "Ingresos" y "Movimientos" de las KPIs — no están en el prototipo aprobado.

---

## BUG-PO-003 🔴 CRÍTICO — Semáforo presupuestos no implementado

**Pantalla:** Presupuestos
**Componente:** `BudgetProgressBarComponent`
**Descripción:** Todas las barras de progreso aparecen en verde independientemente del % consumido. La lógica semáforo (verde ≤80% · naranja 81-99% · rojo ≥100%) no está aplicada. Tampoco el `border-left:4px solid` lateral por color.

**Acción correctiva:**
```typescript
// budget-progress-bar.component.ts
get barColor(): string {
  const pct = Math.abs(this.percentConsumed);
  if (pct >= 100) return 'var(--pfm-danger)';   // #E53935
  if (pct >= 80)  return 'var(--pfm-warn)';    // #F57F17
  return 'var(--pfm-ok)';                       // #00897B
}

get statusText(): string {
  const pct = Math.abs(this.percentConsumed);
  const remaining = this.amountLimit - Math.abs(this.spent);
  if (pct >= 100) return `✗ Excedido en ${(Math.abs(this.spent) - this.amountLimit).toFixed(2)} €`;
  if (pct >= 80)  return `⚠ Quedan ${remaining.toFixed(2)} €`;
  return `✓ Quedan ${remaining.toFixed(2)} €`;
}
```
Añadir `[style.border-left]="'4px solid ' + barColor"` al `.budget-card`.

---

## BUG-PO-004 🔴 CRÍTICO — Layout card presupuesto completamente diferente al prototipo

**Pantalla:** Presupuestos
**Componente:** `BudgetListComponent` + `BudgetProgressBarComponent`
**Descripción:** El layout real es una línea minimalista (nombre · barra · "Quedan X€" · porcentaje). El prototipo aprobado define una card estructurada con cabecera de dos columnas (nombre izquierda · importe consumido/límite derecha), barra, estado + badge pill.

**Acción correctiva:** Reescribir el template de `budget-list.component.html` siguiendo la estructura del prototipo:
```html
<div class="budget-card" [style.border-left]="'4px solid ' + barColor(budget)">
  <div class="budget-header">
    <div class="budget-name">{{ budget.categoryIcon }} {{ budget.categoryLabel }}</div>
    <div class="budget-amounts">
      <div [style.color]="barColor(budget)">{{ spent(budget) }} € / {{ budget.amountLimit }} €</div>
      <div [style.color]="barColor(budget)">{{ pct(budget) }}% consumido</div>
    </div>
  </div>
  <div class="budget-bar-bg">
    <div class="budget-bar-fill" [style.width]="pct(budget) + '%'" [style.background]="barColor(budget)"></div>
  </div>
  <div class="flex items-center justify-between">
    <div class="budget-status" [style.color]="barColor(budget)">{{ statusText(budget) }}</div>
    <span class="badge" [ngClass]="badgeClass(budget)">{{ badgeLabel(budget) }}</span>
  </div>
</div>
```

---

## BUG-PO-005 🔴 CRÍTICO — Formato fecha técnico ISO en Análisis

**Pantalla:** Análisis
**Componente:** `PfmAnalysisComponent`
**Descripción:** El periodo se muestra como "2026-04 vs 2026-03" (formato `YearMonth.toString()` del backend) en lugar de "Abril 2026" (formato legible). El botón ▶ del mes actual no está deshabilitado.

**Acción correctiva:**
```typescript
// pfm-analysis.component.ts
formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

get isCurrentMonth(): boolean {
  const now = new Date();
  return this.currentMonth === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
}
```
Template: `[disabled]="isCurrentMonth"` + `[style.opacity]="isCurrentMonth ? '0.4' : '1'"` en botón ▶.

---

## BUG-PO-006 🔴 CRÍTICO — Gráfico donut ausente en Distribución

**Pantalla:** Distribución
**Componente:** `PfmDistributionComponent`
**Descripción:** El gráfico de tarta CSS (`conic-gradient`) es el elemento visual central de la pantalla y está completamente ausente. Solo se renderiza la leyenda de texto.

**Acción correctiva:** Añadir el donut en `pfm-distribution.component.html`:
```html
<div class="donut-chart"
     [style.background]="buildConicGradient(categories)">
</div>
```
```typescript
buildConicGradient(cats: CategoryDist[]): string {
  let pct = 0;
  const segments = cats.map(c => {
    const from = pct;
    pct += c.percentage;
    return `var(--pfm-${c.code.toLowerCase()}) ${from}% ${pct}%`;
  });
  return `conic-gradient(${segments.join(',')})`;
}
```
CSS: `width:180px; height:180px; border-radius:50%; box-shadow:0 4px 20px rgba(0,0,0,.12)`.

---

## BUG-PO-007 🔴 CRÍTICO — KPI cards Análisis ausentes; layout diferente

**Pantalla:** Análisis
**Componente:** `PfmAnalysisComponent`
**Descripción:** El prototipo define 3 KPI cards superiores ("Total abril" · "Total marzo" · "Variación global") como cards blancas independientes. La implementación muestra una sola línea de texto plano sin cards.

**Acción correctiva:** Añadir el grid de KPI cards antes de la tabla comparativa:
```html
<div class="analysis-summary">
  <div class="kpi-card">
    <div class="kpi-label">Total {{ formatMonth(currentMonth) }}</div>
    <div class="kpi-value">{{ currentTotal | currency:'EUR' }}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Total {{ formatMonth(previousMonth) }}</div>
    <div class="kpi-value">{{ previousTotal | currency:'EUR' }}</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-label">Variación global</div>
    <div class="kpi-value" [class.delta-up]="variation > 0" [class.delta-down]="variation < 0">
      {{ variation > 0 ? '↑' : '↓' }} {{ variation | percent }}
    </div>
  </div>
</div>
```

---

## BUG-PO-008 🔴 CRÍTICO — Formulario nuevo presupuesto inline en lugar de pantalla propia

**Pantalla:** Nuevo Presupuesto
**Componente:** `BudgetFormComponent` / `BudgetListComponent`
**Descripción:** El formulario se expande inline dentro de la lista de presupuestos. El prototipo aprobado lo presenta como una pantalla/card independiente de máx. 580px que ocupa la vista principal.

**Acción correctiva:** Convertir `BudgetFormComponent` en una vista separada activada por routing o por un flag de estado en `PfmPageComponent` que oculte la lista y muestre el formulario en su lugar, sin solapamiento:
```typescript
// pfm-page.component.ts
showNewBudgetForm = false;

openNewBudget() { this.showNewBudgetForm = true; }
closeNewBudget() { this.showNewBudgetForm = false; }
```
```html
<app-budget-list *ngIf="!showNewBudgetForm" (onNew)="openNewBudget()"></app-budget-list>
<app-budget-form *ngIf="showNewBudgetForm" (onCancel)="closeNewBudget()" (onSave)="closeNewBudget()"></app-budget-form>
```

---

## BUG-PO-009 🔴 CRÍTICO — Slider umbral sustituido por input numérico

**Pantalla:** Nuevo Presupuesto
**Componente:** `BudgetFormComponent`
**Descripción:** El control del umbral de alerta es un input numérico simple. El prototipo aprobado especifica un slider `type=range` (min=50, max=95, step=5) con preview en tiempo real del importe equivalente en euros.

**Acción correctiva:**
```html
<!-- budget-form.component.html -->
<div class="range-wrap">
  <input type="range" class="range-input"
         min="50" max="95" step="5"
         [(ngModel)]="threshold"
         (input)="updatePreview()">
  <div class="range-value">{{ threshold }}%</div>
</div>
<div class="form-hint">
  Recibirás alerta push al alcanzar
  <strong>{{ (amountLimit * threshold / 100) | currency:'EUR' }}</strong>
  de {{ amountLimit | currency:'EUR' }}
</div>
```

---

## BUG-PO-010 🟠 MAYOR — Icono cuadrado por categoría ausente en filas de movimientos

**Pantalla:** Overview
**Componente:** `PfmMovimientoRowComponent`
**Descripción:** Cada fila de movimiento debería tener un icono cuadrado 36×36px con fondo de color suave por categoría y emoji. Solo se muestra el badge de texto.

**Acción correctiva:** Añadir `.mv-icon` antes del `.mv-info` en cada fila:
```html
<div class="mv-icon" [style.background]="categoryBgColor(movement.category)">
  {{ categoryEmoji(movement.category) }}
</div>
```
```typescript
categoryBgColor(cat: string): string {
  const map: Record<string, string> = {
    'ALIMENTACION': '#E8F5E9', 'TRANSPORTE': '#E3F2FD',
    'RESTAURANTES': '#FFF3E0', 'HOGAR': '#F3E5F5',
    'SALUD': '#FCE4EC', 'OCIO': '#FBE9E7', 'OTROS': '#F5F5F5'
  };
  return map[cat] ?? '#F5F5F5';
}
```

---

## BUG-PO-011 🟠 MAYOR — Botón ✏️ editar categoría ausente en movimientos

**Pantalla:** Overview
**Componente:** `PfmMovimientoRowComponent`
**Descripción:** Cada fila de movimiento CARGO debe tener un botón ✏️ a la derecha para recategorizar. Ausente en la implementación.

**Acción correctiva:** Añadir `<button class="mv-edit" (click)="openEditModal(movement)">✏️</button>` al final de cada `.mv-row`. Para ABONO: `[disabled]="movement.type === 'CREDIT'"` con `opacity:.3; cursor:not-allowed`.

---

## BUG-PO-012 🟠 MAYOR — Fecha del movimiento ausente en mv-meta

**Pantalla:** Overview
**Componente:** `PfmMovimientoRowComponent`
**Descripción:** Bajo el badge de categoría debe aparecer la fecha del movimiento (ej: "14 abr 2026"). No se renderiza.

**Acción correctiva:**
```html
<div class="mv-meta">
  <span class="cat-badge" [style.background]="categoryColor(m.category)">{{ m.categoryLabel }}</span>
  &nbsp;{{ m.date | date:'d MMM yyyy':'':'es' }}
</div>
```

---

## BUG-PO-013 🟠 MAYOR — Filtro desplegable "Todas las categorías" ausente

**Pantalla:** Overview
**Componente:** `PfmOverviewComponent`
**Descripción:** El prototipo muestra un select "Todas las categorías" sobre la lista de movimientos para filtrar por categoría. Ausente.

**Acción correctiva:** Añadir select de filtro sobre `mv-list` con `(change)="filterByCategory($event.target.value)"` y lógica de filtrado en el componente.

---

## BUG-PO-014 🟠 MAYOR — Subtítulo y "Última actualización" ausentes en Overview

**Pantalla:** Overview
**Componente:** `PfmOverviewComponent`
**Descripción:** Falta el subtítulo "Resumen financiero · Abril 2026" y el texto "Última actualización: hace 2 min" en la cabecera derecha.

**Acción correctiva:** Añadir en el template:
```html
<div class="page-sub">Resumen financiero · {{ currentMonthLabel }}</div>
<!-- cabecera derecha -->
<span class="last-update">Última actualización: {{ lastUpdate | timeAgo }}</span>
```

---

## BUG-PO-015 🟠 MAYOR — "Mostrando X de Y · Ver todos" ausente

**Pantalla:** Overview
**Componente:** `PfmOverviewComponent`
**Descripción:** Falta el pie de lista con paginación "Mostrando 6 de 47 movimientos · Ver todos".

**Acción correctiva:** Añadir al pie de `.mv-list`:
```html
<div class="mv-pagination">
  Mostrando {{ movements.length }} de {{ totalMovements }} movimientos ·
  <a (click)="loadAll()">Ver todos</a>
</div>
```

---

## BUG-PO-016 🟠 MAYOR — Subtítulo contador presupuestos ausente

**Pantalla:** Presupuestos
**Componente:** `BudgetListComponent`
**Descripción:** Falta "Abril 2026 · 4 activos · máx. 10" bajo el título de la pantalla.

**Acción correctiva:** Añadir `<div class="page-sub">{{ currentMonthLabel }} · {{ budgets.length }} activos · máx. 10</div>` bajo el `page-title`.

---

## BUG-PO-017 🟠 MAYOR — Badge estado (Bien/Atención/Excedido) ausente en presupuestos

**Pantalla:** Presupuestos
**Componente:** `BudgetProgressBarComponent`
**Descripción:** Cada presupuesto debe mostrar un badge pill "Bien" / "Atención" / "Excedido" alineado a la derecha. Ausente.

**Acción correctiva:** Añadir `<span class="badge" [ngClass]="badgeClass">{{ badgeLabel }}</span>` en el footer de cada budget-card.

---

## BUG-PO-018 🟠 MAYOR — Leyenda colores y card contenedor ausentes en Análisis

**Pantalla:** Análisis
**Componente:** `PfmAnalysisComponent`
**Descripción:** La tabla de análisis debe estar dentro de una `.card` con `.card-header` "Comparativa por categoría" + leyenda de colores (cuadrado azul "Abril" · cuadrado gris "Marzo"). Ambos ausentes.

**Acción correctiva:** Envolver la tabla en `.card` y añadir leyenda en el `.card-header`.

---

## BUG-PO-019 🟠 MAYOR — Top-3 comercios sin badge azul distintivo

**Pantalla:** Distribución
**Componente:** `PfmDistributionComponent`
**Descripción:** Las posiciones 1, 2, 3 deben tener badge circular azul `var(--color-primary)` con texto blanco. Todas las posiciones tienen el mismo estilo gris.

**Acción correctiva:**
```html
<div class="merchant-rank" [class.top3]="i < 3">{{ i + 1 }}</div>
```
CSS: `.merchant-rank.top3 { background: var(--color-primary); color: #fff; }`.

---

## BUG-PO-020 🟠 MAYOR — Card "Resumen" ausente en Distribución

**Pantalla:** Distribución
**Componente:** `PfmDistributionComponent`
**Descripción:** El prototipo define una card derecha con total de gasto + mayor categoría destacada. Ausente en la implementación.

**Acción correctiva:** Añadir card de resumen al lado del donut con total gasto y `topCategory` highlight.

---

## BUG-PO-021 🟠 MAYOR — Lógica variación Análisis invertida/errónea

**Pantalla:** Análisis
**Componente:** `PfmAnalysisComponent`
**Descripción:** Los deltas por categoría muestran valores absurdos (-203,5%, -200%, -204,7%). La variación global "-122,7%" es incorrecta. El color también está invertido (verde cuando debería ser rojo si el gasto sube).

**Acción correctiva:**
```typescript
variation(current: number, previous: number): number {
  if (previous === 0) return 100; // "Nuevo"
  return ((Math.abs(current) - Math.abs(previous)) / Math.abs(previous)) * 100;
}

deltaColor(variation: number): string {
  return variation > 0 ? 'var(--color-error)' : 'var(--color-success)';
}
```

---

## BUG-PO-022 🟠 MAYOR — Tokenización agresiva nombres comercios

**Pantalla:** Distribución
**Componente:** `JdbcPfmTransactionReadAdapter` (backend)
**Descripción:** "RECIBO ALQUILER ABRIL" → "RECIBO" · "CANAL DE ISABEL II" → "CANAL". El primer token > 4 chars es demasiado genérico en muchos casos. RN-F023-20 necesita refinamiento.

**Acción correctiva:** Añadir lista de palabras genéricas a excluir como primer token: `RECIBO`, `PAGO`, `CARGO`, `ABONO`, `CUOTA`, `FACTURA`. Si el primer token está en la lista excluir, usar el segundo:
```java
private static final Set<String> GENERIC_TOKENS =
    Set.of("RECIBO","PAGO","CARGO","ABONO","CUOTA","FACTURA","TRANSFERENCIA");

private String extractMerchantName(String concept) {
    String[] tokens = concept.toUpperCase().trim().split("\\s+");
    for (String t : tokens) {
        if (t.length() > 4 && !GENERIC_TOKENS.contains(t)) return t;
    }
    return tokens[0];
}
```

---

## Bugs menores (🟡) — listado

| ID | Pantalla | Descripción | Componente |
|---|---|---|---|
| BUG-PO-023 | Overview | Subtítulo "Gestiona tus finanzas personales" → "Resumen financiero · Abril 2026" | `PfmPageComponent` |
| BUG-PO-024 | Overview | Badges categoría color gris uniforme → aplicar `--pfm-*` por categoría | `PfmMovimientoRowComponent` |
| BUG-PO-025 | Presupuestos | Label "Alerta al (%)" → "Umbral de alerta push" | `BudgetFormComponent` |
| BUG-PO-026 | Presupuestos | Label "Límite mensual" → "Importe mensual (€)" + asterisco + hint rango | `BudgetFormComponent` |
| BUG-PO-027 | Presupuestos | Botón "Guardar" → "Crear presupuesto" | `BudgetFormComponent` |
| BUG-PO-028 | Presupuestos | Select categorías sin emojis → añadir emoji por categoría | `BudgetFormComponent` |
| BUG-PO-029 | Presupuestos | Alert-info "reinicio automático" ausente | `BudgetFormComponent` |
| BUG-PO-030 | Análisis | Título "Análisis mensual" ausente sobre tabs | `PfmAnalysisComponent` |
| BUG-PO-031 | Análisis | Hover fila categoría no implementado | `PfmAnalysisComponent` |
| BUG-PO-032 | Distribución | Título "Distribución de gasto · Abril 2026" ausente | `PfmDistributionComponent` |
| BUG-PO-033 | Distribución | Link "Ver los 10 comercios →" ausente | `PfmDistributionComponent` |
| BUG-PO-034 | Distribución | Hover fila comercio no implementado | `PfmDistributionComponent` |
| BUG-PO-035 | All | Subtítulo fijo "Gestiona tus finanzas personales" en todas las tabs → debería cambiar por tab | `PfmPageComponent` |

---

## Plan de corrección propuesto

### Sprint 25 — Corrección urgente pre-release (bloquea v1.25.0)

**Prioridad 1 — Bug raíz (resuelve múltiples bugs):**
- BUG-PO-001 `Math.abs()` en `pfm.service.ts` → resuelve automáticamente importes, porcentajes y semáforos

**Prioridad 2 — Críticos independientes:**
- BUG-PO-002 KPI cards Overview
- BUG-PO-003 + BUG-PO-004 Semáforo + layout presupuestos
- BUG-PO-005 Formato fecha ISO → nombre mes
- BUG-PO-006 Gráfico donut distribución
- BUG-PO-007 KPI cards análisis
- BUG-PO-008 + BUG-PO-009 Formulario presupuesto inline + slider

**Estimación corrección críticos:** 2–3 días de desarrollo · re-QA parcial obligatorio

### Sprint 26 — Corrección mayores y menores
- BUG-PO-010 al BUG-PO-022 (mayores) + BUG-PO-023 al BUG-PO-035 (menores)

---

*Bug Report PO · SOFIA v2.7 · Sprint 25 · FEAT-023 · BankPortal · Banco Meridian · 2026-04-16*
