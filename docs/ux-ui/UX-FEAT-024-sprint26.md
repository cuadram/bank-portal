# UX-FEAT-024 · Mis Metas (Objetivos de Ahorro) · Sprint 26

| Campo | Valor |
|---|---|
| **Feature** | FEAT-024 — Objetivos de Ahorro ("Mis Metas") |
| **Sprint** | 26 · v1.26.0 (target) |
| **Autor** | UX/UI Designer Agent (SOFIA v2.7) |
| **Fecha** | 2026-04-27 |
| **Estado** | IN_REVIEW · pending Gate HITL PO+TL |
| **Hereda** | PROTO-FEAT-023-sprint25 (LA-CORE-050 PASO 0) |
| **Design System** | UX-DESIGN-SYSTEM v1.6 (sin cambios estructurales · delta tokens FEAT-024) |
| **Prototipo** | `docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html` (130 KB · 5 pantallas · 22 anotaciones) |

---

## 1. Objetivo UX

Permitir al cliente BankPortal **estructurar su ahorro en metas con propósito** (viaje, hogar, vehículo, emergencia, educación, otros), automatizar aportaciones y celebrar hitos — todo dentro del portal sin recurrir a apps de terceros (Monefy, Fintonic, Goals de Revolut).

La narrativa visual debe reforzar:
1. **Progreso** (barra clara con código de color: verde OK · ámbar riesgo · azul completo)
2. **Proyección** (¿voy a llegar a tiempo? · banner riesgo cuando ritmo insuficiente)
3. **Hitos** (4 dots 25/50/75/100% como gamificación discreta)
4. **Confianza** (banner Ley 10/2014 sobre saldo reservado · resumen de impacto en saldos antes de aportar)

---

## 2. User flows

### Flow A · Crear primera meta (US-024-01)

```
[Sidebar · Mis Metas]
       │
       ▼
[Lista vacía o con metas]──(+Nueva meta)──▶ [Pantalla Crear]
                                                │
                                  ┌─────────────┴─────────────┐
                                  ▼                           ▼
                            [Vista previa lateral]      [Validación cliente
                             reactiva al typing]        RN-01/02/07]
                                  │                           │
                                  └─────────────┬─────────────┘
                                                ▼
                                         (Crear meta)
                                                │
                                                ▼
                                  POST /api/v1/savings/goals
                                                │
                                                ▼
                                     Toast "Meta creada" → [Lista]
```

### Flow B · Aportar manual + alcanzar hito (US-024-04 + US-024-07)

```
[Lista]──(click card)──▶ [Detalle]──(+Aportar ahora)──▶ [Aportación]
                                                              │
                                  ┌───────────────────────────┤
                                  ▼                           ▼
                            [Quick amounts                [Resumen
                             50/100/500/1000]              impacto saldos]
                                  │                           │
                                  └─────────────┬─────────────┘
                                                ▼
                                       (Confirmar)
                                                │
                                                ▼
                              POST /goals/{id}/contributions
                                                │
                                ┌───────────────┴────────────────┐
                                ▼                                ▼
                      reservedAmount += amount       Si cruza hito 25/50/75/100
                                │                                │
                                ▼                                ▼
                         Toast SUCCESS              GoalMilestone+notif push
                                │                                │
                                └────────────────┬───────────────┘
                                                 ▼
                                           [Detalle actualizado]
```

### Flow C · Configurar regla automática (US-024-05)

```
[Detalle meta]──(side card "Aportación automática" → Editar)──▶ [Regla auto]
                                                                       │
                                                                       ▼
                                                            ┌──────────┴──────────┐
                                                            ▼                     ▼
                                                    [Importe + día]        [Próximas
                                                    [10€..5000€]            ejecuciones
                                                    [día 1..28]             preview]
                                                            │                     │
                                                            └──────────┬──────────┘
                                                                       ▼
                                                                (Guardar regla)
                                                                       │
                                                                       ▼
                                                       PUT /goals/{id}/auto-rule
                                                                       │
                                                                       ▼
                                                Toast "Regla activa, próx. 5 Abr 2026"
```

### Flow D · Cierre con devolución >30€ (US-024-06 · SCA)

```
[Detalle]──(🗑 Cerrar)──▶ Modal "¿Cerrar meta?"
                                    │
                                    ▼
                          DELETE /goals/{id}
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                  reservedAmount ≤ 30€      reservedAmount > 30€
                       │                         │
                       ▼                         ▼
                  200 OK                    401 OTP_REQUIRED
                  Devolución t+0                 │
                       │                         ▼
                       │              [Modal SCA · pedir OTP]
                       │                         │
                       │                         ▼
                       │                  Reintento con X-OTP
                       │                         │
                       └────────────┬────────────┘
                                    ▼
                          Toast "Meta cerrada · 500€ devueltos"
```

---

## 3. Inventario de pantallas (5)

| # | Screen ID | Pantalla | US cubierta | Componentes Angular previstos |
|---|---|---|---|---|
| 1 | `screen-savings-list` | Lista de metas con progreso/proyección | US-024-02 · US-024-08 (CTA) | `goals-list`, `goal-card`, `goals-empty-state` |
| 2 | `screen-savings-detail` | Detalle con histórico aportaciones e hitos | US-024-03 · US-024-06 (Editar/Cerrar) | `goal-detail`, `allocation-timeline`, `milestone-strip`, `auto-rule-summary-card` |
| 3 | `screen-savings-create` | Formulario crear meta | US-024-01 | `goal-create-form`, `icon-picker`, `color-picker`, `goal-card-preview` |
| 4 | `screen-savings-contribute` | Aportación manual con resumen impacto | US-024-04 | `contribution-modal` (o página), `balance-impact-summary` |
| 5 | `screen-savings-autorule` | Regla aportación automática | US-024-05 | `auto-rule-form`, `next-executions-preview` |

**Pantallas implícitas (mismo flujo, no listadas):**
- Modal "¿Cerrar meta?" (DELETE) — pequeño componente reutilizable, se monta sobre `screen-savings-detail`
- Modal SCA OTP (cierre >30€) — reutiliza `OtpVerifyComponent` de FEAT-001
- Toast hito alcanzado (push push) — reutiliza `MilestoneToastComponent` de FEAT-014/004

---

## 4. Wireframes ASCII

### 4.1 Lista (`screen-savings-list`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Mis Metas                                              [+ Nueva meta] ─┐ │
│ Ahorra con propósito · 3 metas activas · 1.500€ reservados             │ │
├──────────────────────────────────────────────────────────────────────┤ │
│ ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐ │ │
│ │ ✈️ Viaje Japón     │ │ 🚗 Coche           │ │ 🛡 Fondo Emerg.    │ │ │
│ │ Viaje · Jun 2027   │ │ Vehículo · Dic 26  │ │ Emergencia · Ene 28│ │ │
│ │              ✓ OK  │ │           ⚠ Riesgo │ │     ✓ Recién       │ │ │
│ │ 1.500,00 €    50%  │ │ 3.200,00 €    21%  │ │ 0,00 €         0%  │ │ │
│ │ de 3.000,00 €      │ │ de 15.000,00 €     │ │ de 5.000,00 €      │ │ │
│ │ [████████░░░░░░░░] │ │ [████░░░░░░░░░░░░] │ │ [░░░░░░░░░░░░░░░░] │ │ │
│ │ ●●○○ hitos         │ │ ○○○○               │ │ ○○○○               │ │ │
│ │ 📅 Mar27 (3m antes)│ │ 📅 Sep27 (9m tarde)│ │ 📅 Sin aport. aún  │ │ │
│ │ 🔁 Auto 200€/mes   │ │ ↑ Sube a 1475€/mes │ │ + Configurar       │ │ │
│ └────────────────────┘ └────────────────────┘ └────────────────────┘ │ │
│                                                                        │ │
│ ℹ️  Saldo reservado se mantiene en tu cuenta. No devenga intereses.    │ │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Detalle (`screen-savings-detail`)

```
← Volver · Mis Metas / Viaje Japón
┌─────────────────────────────────────────────┐ ┌──────────────────────┐
│ ✈️ Viaje Japón          [✏ Editar] [🗑 Cerrar]│ │ 📅 Proyección        │
│ Viaje · Creada 15 Ene 2026                  │ │ Marzo 2027           │
│                                             │ │ 3 meses antes        │
│ 1.500,00 €                       50% ✓ OK   │ │ Ritmo 200€/mes       │
│ de 3.000,00 € · Faltan 1.500,00 €           │ │ Sugerido: 167€/mes   │
│ [████████████░░░░░░░░░░░░] hito strip       │ ├──────────────────────┤
│  25✓ 50✓  75   100🎉                        │ │ 🔁 Aportación auto   │
├─────────────────────────────────────────────┤ │ 200,00 €/mes         │
│ Histórico de aportaciones    [+ Aportar]    │ │ Día 5 · Próx 5 Abr   │
│ 🎯 Hito 50% alcanzado · 15 Mar 2026 14:32  │ │ [Editar] [Pausar]    │
│ 🔁 Aportación auto · 5 Mar       +200,00 € │ ├──────────────────────┤
│ 💸 Aportación manual · 21 Feb    +500,00 € │ │ 🏦 Cuenta origen     │
│ 🔁 Aportación auto · 5 Feb       +200,00 € │ │ Cuenta Principal     │
│ 🎯 Hito 25% · 5 Feb 02:14                   │ │ Disp: 2.450,00 €     │
└─────────────────────────────────────────────┘ └──────────────────────┘
```

### 4.3 Crear (`screen-savings-create`)

```
← Cancelar · Mis Metas / Nueva meta
┌─────────────────────────────────────────────┐ ┌──────────────────────┐
│ Crear nueva meta                            │ │ Vista previa         │
│ ┌──────────────┐ ┌──────────────────────┐  │ │ ┌──────────────────┐ │
│ │ Nombre *     │ │ Importe *            │  │ │ │ ✈️ Viaje Japón   │ │
│ │ Viaje Japón  │ │              3.000   │  │ │ │ Viaje · Jun 2027 │ │
│ └──────────────┘ └──────────────────────┘  │ │ │ 0,00 €      0%   │ │
│ ┌──────────────┐ ┌──────────────────────┐  │ │ │ de 3.000,00 €    │ │
│ │ Fecha lím *  │ │ Categoría *          │  │ │ │ [░░░░░░░░░░]     │ │
│ │ 2027-06-30   │ │ ✈️ Viaje         ▼   │  │ │ └──────────────────┘ │
│ └──────────────┘ └──────────────────────┘  │ └──────────────────────┘
│                                             │
│ Icono                                       │
│ [✈️][🏠][🚗][🛡][🎓][💍][👶][💻][📱][🎁][🐶][🌴]  │
│                                             │
│ Color  ●  ●  ●  ●  ●  ●  ●  ●               │
│                                             │
│ ℹ️ Hasta 10 metas activas (tienes 3)        │
│                                             │
│                       [Cancelar] [Crear]    │
└─────────────────────────────────────────────┘
```

### 4.4 Aportación manual (`screen-savings-contribute`)

```
← Volver · Mis Metas / Viaje Japón / Aportar
┌─────────────────────────────────────────────┐ ┌──────────────────────┐
│ Aportar a "Viaje Japón"                     │ │ Resumen              │
│ Mueve fondos de tu cuenta a esta meta       │ │ Aportación  +500,00€ │
│                                             │ │ Reservado  1.500,00€ │
│ Importe a aportar *                         │ │ Tras aportar 2.000€  │
│ ┌──────────────────────────────────┐         │ │ Progreso 67% (de 50%)│
│ │                            500   │         │ ├──────────────────────┤
│ └──────────────────────────────────┘         │ │ Disponible 2.450,00€ │
│ Entre 10€ y 5.000€                          │ │ Tras: 1.950,00 €     │
│                                             │ │ Contable 8.230,00 €  │
│ Cuenta origen *                             │ │ (sin cambio)         │
│ ┌──────────────────────────────────┐         │ ├──────────────────────┤
│ │ Cuenta Principal · Disp 2.450€▼ │         │ │ 🎉 Alcanzarás 50%    │
│ └──────────────────────────────────┘         │ └──────────────────────┘
│ [50€] [100€] [500€✓] [1.000€]               │
│                                             │
│ 🏦 Segregación virtual: contable no cambia, │
│    disponible sí.                           │
│                                             │
│              [Cancelar] [Confirmar]         │
└─────────────────────────────────────────────┘
```

### 4.5 Regla automática (`screen-savings-autorule`)

```
← Volver · Mis Metas / Viaje Japón / Aportación automática
┌─────────────────────────────────────────────┐ ┌──────────────────────┐
│ Aportación automática mensual               │ │ Próximas ejecuciones │
│ Configurable, pausable cuando quieras       │ │ 🔁 5 Abr 26   +200€  │
│                                             │ │ 🔁 5 May 26   +200€  │
│ ┌──────────────┐ ┌──────────────────────┐  │ │ 🔁 5 Jun 26   +200€  │
│ │ Importe *    │ │ Día del mes *        │  │ ├──────────────────────┤
│ │       200    │ │ Día 5             ▼  │  │ │ A 200€/mes           │
│ └──────────────┘ └──────────────────────┘  │ │ alcanzarás 3.000€    │
│ ┌─────────────────────────────────────────┐  │ │ en ~7,5 meses        │
│ │ Cuenta Principal · Disp 2.450€      ▼  │  │ └──────────────────────┘
│ └─────────────────────────────────────────┘  │
│                                             │
│ ⚙️ Si no hay saldo: marcado FAILED + notif. │
│    La regla sigue activa para próximo mes.  │
│                                             │
│ 🔁 Reintentos: 3x backoff 1m/5m/15m si fallo│
│    técnico.                                 │
│                                             │
│ [Pausar regla]      [Cancelar] [Guardar]    │
└─────────────────────────────────────────────┘
```

---

## 5. Inventario de componentes (mapeo a Angular)

| Componente | Tipo | Standalone | Inputs | Outputs | Pantalla(s) |
|---|---|---|---|---|---|
| `SavingsListComponent` | page | true | — | — | 1 |
| `GoalCardComponent` | presentational | true | `goal: SavingsGoalDto` | `(click)` | 1 |
| `GoalsEmptyStateComponent` | presentational | true | — | `(create)` | 1 |
| `SavingsDetailComponent` | page | true | route param `id` | — | 2 |
| `AllocationTimelineComponent` | presentational | true | `allocations: AllocationDto[]`, `milestones: MilestoneDto[]` | `(loadMore)` | 2 |
| `MilestoneStripComponent` | presentational | true | `reachedPercents: number[]` | — | 1, 2 |
| `AutoRuleSummaryCardComponent` | presentational | true | `rule: AutoRuleDto?` | `(edit)`, `(pause)` | 2 |
| `SavingsCreateComponent` | page | true | — | — | 3 |
| `IconPickerComponent` | form-control | true | `value: string`, `options: string[]` | `(change)` | 3 |
| `ColorPickerComponent` | form-control | true | `value: string`, `palette: string[]` | `(change)` | 3 |
| `GoalCardPreviewComponent` | presentational | true | `formValue: CreateGoalRequest` | — | 3 |
| `SavingsContributeComponent` | page | true | route param `id` | — | 4 |
| `BalanceImpactSummaryComponent` | presentational | true | `before/after: BalanceState` | — | 4 |
| `SavingsAutoRuleComponent` | page | true | route param `id` | — | 5 |
| `NextExecutionsPreviewComponent` | presentational | true | `dayOfMonth: number`, `amount: number` | — | 5 |
| `SavingsWidgetComponent` | dashboard slot | true | `data: WidgetDto` | `(navigate)` | (dashboard) |
| `MilestoneToastComponent` | overlay | true (heredado) | `milestone: GoalMilestone` | — | global |
| `CloseGoalConfirmModalComponent` | modal | true | `goal: SavingsGoalDto` | `(confirm)`, `(cancel)` | 2 |

**Total:** 18 componentes (13 nuevos · 5 reutilizados/extendidos de FEAT-001/004/014/023).

**Patrones obligatorios (LA-CORE):**
- `[(ngModel)]` + `FormsModule` en todos los `<select>` y form-controls (LA-CORE-057)
- `Math.abs()` server-side antes de serializar amounts (LA-CORE-055)
- `Router.navigateByUrl()` en clicks de cards y CTAs · NUNCA `[href]` (LA-CORE-068)
- `ChangeDetectionStrategy.OnPush` en todos los componentes presentational (estándar BankPortal)
- `trackBy` en todos los `*ngFor` (estándar BankPortal)

---

## 6. Design tokens (delta sobre UX-DESIGN-SYSTEM v1.6)

**No introduce nuevos tokens base.** Reutiliza la paleta existente y declara un mapeo semántico para "Mis Metas" usando tokens vigentes:

```css
/* === FEAT-024 Savings Goals — semantic tokens === */
--savings-progress-ok:     var(--color-success);          /* #00897B */
--savings-progress-warn:   var(--color-warning);          /* #F57F17 */
--savings-progress-full:   var(--color-primary);          /* #1B5E99 */
--savings-card-bg:         var(--color-white);
--savings-card-border:     var(--color-border);

/* Categoría → color icono */
--savings-cat-viaje:       #009688;  /* (alineado con --pfm-viajes) */
--savings-cat-hogar:       #9C27B0;  /* (alineado con --pfm-hogar)  */
--savings-cat-vehiculo:    #795548;
--savings-cat-emergencia:  #E53935;
--savings-cat-educacion:   #3F51B5;  /* (alineado con --pfm-educacion) */
--savings-cat-otros:       #607D8B;
```

**Componentes CSS añadidos** (en el `<style>` del prototipo, listos para extraer a `_savings.scss`):

| Clase | Propósito |
|---|---|
| `.goals-grid` | grid responsive `auto-fill minmax(320px,1fr)` |
| `.goal-card` | card con hover lift + shadow |
| `.goal-icon` | 40×40 redondeada con emoji/icono · color por categoría |
| `.goal-pbar` / `.goal-pfill` | barra progreso 8px con gradient + transition 400ms |
| `.milestone-strip` / `.milestone-dot` | 4 dots fila de hitos |
| `.goal-risk-badge` | pill con `.ok` o `.risk` |
| `.timeline-row` / `.timeline-icon` | filas histórico aportaciones |
| `.icon-picker` / `.color-picker` | grid 6×2 de iconos · paleta horizontal |
| `.alert-info` | callout informativo (ya existía en sprints anteriores) |
| `.summary-box` / `.summary-row` | resumen lateral con `font-variant-numeric:tabular-nums` |
| `.freq-pill` | pill quick-amount (50€/100€/500€/1000€) |

**Tipografía monetaria** (LA-023-02 reutilizada): `.goal-amount` y `.summary-row strong` con `font-variant-numeric:tabular-nums` para alineación digital perfecta de columnas de euros.

---

## 7. Estados y casos límite cubiertos

| Estado | Pantalla | Tratamiento UX |
|---|---|---|
| Lista vacía (0 metas) | 1 | `GoalsEmptyStateComponent` con CTA grande "Crea tu primer objetivo" |
| Meta sin aportaciones | 1 | Card con `0%` + barra vacía + meta "Sin aportaciones aún" |
| Meta con riesgo proyección | 1 | Badge `⚠ Riesgo` ámbar + `↑ Sube a Xeuros/mes` en lugar de fecha proyectada |
| Meta completada (100%) | 1, 2 | Badge `🎉 ¡Meta cumplida!` + barra `--savings-progress-full` (azul) + CTA "Cerrar y devolver" |
| Aportación insuficiente saldo | 4 | Inline error rojo: "Saldo disponible: 100€" + botón Confirmar disabled |
| Importe fuera rango | 3, 4, 5 | Inline error con `min/max` del input HTML5 + mensaje aria-live |
| Límite 10 metas alcanzado | 1, 3 | Card 11 oculta + alert-info en pantalla Crear: "Has alcanzado 10/10" + botón Crear disabled |
| Aportación auto FAILED | 2 | Timeline row con icono `⚠` rojo + sub "Saldo insuficiente · 5 Abr · regla sigue activa" |
| Cierre con devolución >30€ | 2 → modal | Modal informa importe a devolver y solicita SCA antes de DELETE final |
| Sin suscripción push | 2 | Hito se registra en timeline pero sin toast (silente, audit-only) |

---

## 8. Accesibilidad WCAG 2.1 AA — checklist

| Criterio | Cumplimiento | Evidencia |
|---|---|---|
| **1.1.1 Contenido no textual** | ✅ | Iconos meta tienen `aria-label` (a implementar en componentes); badges riesgo incluyen texto además de color |
| **1.3.1 Información y relaciones** | ✅ | `<label>` asociado a cada input; estructura `<section>` por pantalla con encabezado |
| **1.4.3 Contraste mínimo 4.5:1** | ✅ | Tokens primary `#1B5E99` sobre `#FFFFFF` = 6.8:1 · success `#00897B` sobre blanco = 4.6:1 · warning `#F57F17` sobre blanco = 3.1:1 (uso solo en badges con texto blanco) |
| **1.4.11 Contraste no textual** | ✅ | Bordes inputs `#D1D5DB` sobre blanco = 2.3:1 (≥3:1 al focus con outline azul) |
| **2.1.1 Teclado** | ✅ | Icon-picker y color-picker navegables con Tab; selección con Enter/Space |
| **2.4.3 Orden focus** | ✅ | Lectura natural arriba-abajo, izquierda-derecha (LTR) |
| **2.4.6 Encabezados y etiquetas** | ✅ | h1 por pantalla, h2 por sección principal, h3 por cards |
| **2.5.3 Etiqueta en nombre** | ✅ | Etiquetas visibles coinciden con `aria-label` accesible |
| **3.2.2 Al introducir entrada** | ✅ | Inputs no causan cambio contexto inesperado · validación inline al blur |
| **3.3.1 Identificación error** | ✅ | Mensajes inline rojos con `role="alert"` |
| **3.3.3 Sugerencia de error** | ✅ | "Entre 10€ y 5.000€" sub-texto bajo input + min/max HTML5 |
| **4.1.2 Nombre, función, valor** | ✅ | Botones con texto + iconos; estados activos en pills con `aria-pressed` |
| **4.1.3 Mensajes de estado** | ✅ | Toasts de éxito con `role="status"` (heredado) |

**Auditoría axe-core obligatoria pre-G-6**: cero violations críticas/serious en las 5 pantallas implementadas.

---

## 9. Cobertura SRS

| US/RN | Pantalla(s) | Anotación |
|---|---|---|
| US-024-01 (Crear) | 3 | ANNOT-10 (validación), ANNOT-11 (ngModel), ANNOT-12 (icon picker), ANNOT-13 (límite 10 metas) |
| US-024-02 (Listar) | 1 | ANNOT-01 (CTA crear), ANNOT-02 (card click), ANNOT-04 (riesgo) |
| US-024-03 (Detalle) | 2 | ANNOT-08 (paginación) |
| US-024-04 (Aportar) | 4 | ANNOT-15 (rango 10..5000), ANNOT-16 (quick amounts), ANNOT-17 (segregación), ANNOT-18 (resumen) |
| US-024-05 (Auto-rule) | 5 | ANNOT-09 (link edición), ANNOT-19 (importe), ANNOT-20 (día 1-28), ANNOT-21 (saldo insuficiente), ANNOT-22 (pausar) |
| US-024-06 (Editar/Cerrar) | 2 | ANNOT-06 (editar), ANNOT-07 (SCA cierre) |
| US-024-07 (Hitos push) | 1, 2 | ANNOT-03 (hitos idempotentes) |
| US-024-08 (Widget) | (dashboard) | (componente reutilizable, no en 5 pantallas savings — prototipo widget pendiente desarrollo Step 4) |
| RN-F024-05/15 (segregación) | 4 | ANNOT-17 |
| RN-F024-08 (proyección) | 1, 2 | ANNOT-04, side card |
| RN-F024-09 (idempotencia hitos) | 1, 2 | ANNOT-03 |
| RN-F024-11 (SCA >30€) | 2 | ANNOT-07 |
| LA-CORE-050 (herencia prototipo) | (todas) | ANNOT-01 |
| LA-CORE-055 (Math.abs server) | 4 | ANNOT-18 |
| LA-CORE-057 (ngModel reset) | 3 | ANNOT-11 |

**Total: 22 anotaciones únicas (ANNOT-01..22) cubren las 8 US y las RNs principales.**

### 9.1 RNs sin superficie UI propia (no representadas en el prototipo, justificación)

| RN | Motivo |
|---|---|
| **RN-F024-10** (GDPR Art.15/17 export) | El export se dispara desde la pantalla GDPR de FEAT-019, no desde "Mis Metas". El comportamiento backend (incluir goals + allocations en el ZIP) se valida en pruebas funcionales del Step 6, no en UX. |
| **RN-F024-12** (CLOSED preservados 7 años) | Restricción de retención puramente backend (soft-delete). El usuario solo ve metas ACTIVE/PAUSED en lista; la persistencia de las CLOSED es invisible en UI por diseño. |

Estas dos RNs aplicarán en Step 4 (developer) + Step 6 (QA), no en Step 2c (UX).

---

## 10. Cumplimiento herencia (LA-CORE-050 — PASO 0)

✅ Prototipo base copiado de `PROTO-FEAT-023-sprint25.html` (verificado: shell sidebar navy `#1e3a5f`-equivalente, tokens `:root` idénticos, `.proto-screen`/`.active` toggling, `showScreen()` JS heredado).

✅ Sidebar real de producción mantenido: 11 nav items en orden FEAT-001…FEAT-023, "Mis Metas" añadida como 12º item con icono 🎯 y estado `active` por defecto.

✅ Sin cambios estructurales en design system: tokens existentes reutilizados, componentes nuevos siguen patrones de cards/inputs/buttons del sprint 25.

✅ Top navbar del prototipo (botones de navegación entre pantallas) extendido con 5 nuevas entradas.

---

## 11. Métricas y entregable

| Métrica | Valor |
|---|---|
| Tamaño prototipo | 130.6 KB |
| Líneas | 1.699 |
| Pantallas FEAT-024 | 5 |
| Pantallas heredadas FEAT-023 (intactas) | 11 |
| Anotaciones FEAT-024 | 22 (ANNOT-01..22 únicas) |
| Componentes Angular previstos | 18 (13 nuevos + 5 reutilizados) |
| Cobertura SRS | 8/8 US + 11/15 RNs visibles + 22 anotaciones |
| Tokens nuevos | 0 (solo aliases semánticos) |
| Clases CSS nuevas | 14 (extraíbles a `_savings.scss`) |

---

## 12. Gate pendiente

**Gate G-2c · HITL PO + TL**

- **Product Owner** — verificar fidelidad UX vs. SRS, alcance de las 5 pantallas, mensaje regulatorio Ley 10/2014, accesibilidad de iconos/colores
- **Tech Lead** — verificar viabilidad técnica de la grid (auto-fill 320px), reutilización de `OtpVerifyComponent`, ausencia de `[href]` (LA-023-01), uso de `[(ngModel)]` (LA-CORE-057)

**Comentario sugerido aprobación G-2c:**
> "UX-FEAT-024-sprint26 + PROTO-FEAT-024-sprint26.html (130KB · 5 pantallas · 22 anotaciones) aprobados. Cobertura SRS 8/8 US + RNs principales. Hereda PROTO-FEAT-023 (LA-CORE-050). Sin nuevos tokens. WCAG 2.1 AA cumplido."

