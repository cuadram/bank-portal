# LLD Frontend - FEAT-024 · Objetivos de Ahorro

## Metadata
- **Feature:** FEAT-024 | **Sprint:** 26 | **Version:** 1.0 | **Estado:** DRAFT
- **Stack:** Angular 17 (standalone modules) + RxJS 7 + TypeScript 5.4
- **Architect Agent:** SOFIA v2.7 · 2026-04-27
- **Documento companero:** HLD-FEAT-024-sprint26.md, LLD-backend-FEAT-024-sprint26.md
- **UX:** UX-FEAT-024-sprint26.md, PROTO-FEAT-024-sprint26.html (5 pantallas, 18 componentes)

---

## 1. Estructura de paquetes

```
apps/frontend-portal/src/app/features/savings/
├─ savings.module.ts                 # NgModule lazy
├─ savings-routing.module.ts         # rutas /objetivos/**
├─ models/
│  └─ savings.models.ts              # interfaces + enums
├─ services/
│  └─ savings.service.ts             # HttpClient + tipados strict
├─ components/
│  ├─ savings-page/
│  │  ├─ savings-page.component.ts
│  │  ├─ savings-page.component.html
│  │  └─ savings-page.component.scss
│  ├─ goal-list/
│  ├─ goal-card/
│  ├─ goal-create-form/
│  ├─ goal-edit-form/
│  ├─ goal-detail/
│  ├─ goal-progress-bar/
│  ├─ goal-projection-banner/
│  ├─ contribution-modal/
│  ├─ contribution-history/
│  ├─ auto-rule-form/
│  ├─ auto-rule-summary/
│  ├─ goal-close-modal/              # con flujo SCA RN-F024-11
│  ├─ category-icon/
│  ├─ milestone-toast/
│  ├─ savings-widget/                # consumido por dashboard
│  ├─ savings-empty-state/
│  └─ category-picker/
└─ guards/
   └─ goal-owner.guard.ts            # protege rutas /objetivos/:id
```

**Modificaciones fuera del modulo savings:**
- `app-routing.module.ts` — registrar lazy `/objetivos` (LA-FRONT-001).
- `shell.component.ts` — anadir nav item "Mis Objetivos" con icono.
- `dashboard.component.ts` — anadir slot `<app-savings-widget>` debajo de PFM widget.
- `dashboard.module.ts` — declarar `SavingsWidgetComponent` o importar `SavingsModule`.

---

## 2. Routing (lazy)

```typescript
// savings-routing.module.ts
const routes: Routes = [
  { path: '', component: SavingsPageComponent, children: [
    { path: '', component: GoalListComponent },
    { path: 'nuevo', component: GoalCreateFormComponent },
    { path: ':id', component: GoalDetailComponent, canActivate: [GoalOwnerGuard] },
    { path: ':id/editar', component: GoalEditFormComponent, canActivate: [GoalOwnerGuard] },
    { path: ':id/aportar', component: ContributionModalComponent, canActivate: [GoalOwnerGuard] },
    { path: ':id/auto', component: AutoRuleFormComponent, canActivate: [GoalOwnerGuard] },
  ]}
];
```

Registro en `app-routing.module.ts`:
```typescript
{
  path: 'objetivos',
  loadChildren: () => import('./features/savings/savings.module').then(m => m.SavingsModule),
  canActivate: [AuthGuard]
}
```

**LA-FRONT-001**: la ruta `/objetivos` debe existir en `app-routing.module.ts` antes de que cualquier seed de notificacion la referencie.

---

## 3. Models (TypeScript)

```typescript
// savings.models.ts
export type GoalCategory = 'VIAJE' | 'HOGAR' | 'VEHICULO' | 'EMERGENCIA' | 'EDUCACION' | 'OTROS';
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'COMPLETED';
export type AllocationType = 'MANUAL' | 'AUTO';
export type AllocationStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  reservedAmount: number;
  targetDate: string;            // ISO date YYYY-MM-DD
  category: GoalCategory;
  customCategory?: string;
  icon?: string;
  color?: string;
  status: GoalStatus;
  sourceAccountId?: string;
  createdAt: string;             // ISO instant
  progressPct: number;           // 0-100
  suggestedMonthlyContribution: number;
  projectionRisk: boolean;
}

export interface Allocation {
  id: string;
  amount: number;
  type: AllocationType;
  sourceAccountId: string;
  allocationMonth?: string;      // YYYY-MM
  status: AllocationStatus;
  failureReason?: string;
  executedAt: string;            // ISO instant
}

export interface AutoRule {
  id: string;
  amount: number;
  dayOfMonth: number;            // 1-28
  sourceAccountId: string;
  active: boolean;
  nextExecutionAt: string;
  lastExecutionAt?: string;
}

export interface Milestone {
  id: string;
  percent: 25 | 50 | 75 | 100;
  reachedAt: string;
}

export interface GoalDetail {
  goal: SavingsGoal;
  recentAllocations: Allocation[];
  milestones: Milestone[];
  autoRule?: AutoRule;
}

export interface CloseResult {
  goalId: string;
  returnedAmount: number;
  returnAccountId: string;
  closedAt: string;
}

export interface SavingsWidget {
  activeGoalsCount: number;
  totalReserved: number;
  totalTarget: number;
  globalProgressPct: number;
  topGoals: WidgetGoalSummary[];
}

export interface WidgetGoalSummary {
  id: string;
  name: string;
  icon?: string;
  progressPct: number;
}

// Diccionarios UX (heredan tokens design system v1.1 anexo §7)
export const GOAL_CATEGORY_ICON: Record<GoalCategory, string> = {
  VIAJE: 'flight', HOGAR: 'home', VEHICULO: 'directions_car',
  EMERGENCIA: 'health_and_safety', EDUCACION: 'school', OTROS: 'savings'
};

export const GOAL_CATEGORY_COLOR: Record<GoalCategory, string> = {
  VIAJE: '#0ea5e9', HOGAR: '#84cc16', VEHICULO: '#f59e0b',
  EMERGENCIA: '#ef4444', EDUCACION: '#a855f7', OTROS: '#64748b'
};
```

---

## 4. SavingsService

```typescript
// savings.service.ts
@Injectable({ providedIn: 'root' })
export class SavingsService {
  private readonly base = `${environment.apiBaseUrl}/api/v1/savings`;

  constructor(private http: HttpClient) {}

  listGoals(status?: GoalStatus): Observable<SavingsGoal[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<SavingsGoal[]>(`${this.base}/goals`, { params });
  }

  createGoal(req: CreateGoalRequest): Observable<SavingsGoal> {
    return this.http.post<SavingsGoal>(`${this.base}/goals`, req);
  }

  getDetail(goalId: string): Observable<GoalDetail> {
    return this.http.get<GoalDetail>(`${this.base}/goals/${goalId}`);
  }

  updateGoal(goalId: string, req: UpdateGoalRequest): Observable<SavingsGoal> {
    return this.http.put<SavingsGoal>(`${this.base}/goals/${goalId}`, req);
  }

  closeGoal(goalId: string, otp?: string): Observable<CloseResult> {
    const headers = otp ? new HttpHeaders({ 'X-OTP': otp }) : undefined;
    return this.http.delete<CloseResult>(`${this.base}/goals/${goalId}`, { headers });
  }

  contribute(goalId: string, req: ContributeRequest): Observable<Allocation> {
    return this.http.post<Allocation>(`${this.base}/goals/${goalId}/contributions`, req);
  }

  contributionHistory(goalId: string, page = 0, size = 20): Observable<Page<Allocation>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Allocation>>(`${this.base}/goals/${goalId}/contributions`, { params });
  }

  configureAutoRule(goalId: string, req: AutoRuleRequest): Observable<AutoRule> {
    return this.http.put<AutoRule>(`${this.base}/goals/${goalId}/auto-rule`, req);
  }

  pauseAutoRule(goalId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/goals/${goalId}/auto-rule`);
  }

  getMilestones(goalId: string): Observable<Milestone[]> {
    return this.http.get<Milestone[]>(`${this.base}/goals/${goalId}/milestones`);
  }

  getWidget(): Observable<SavingsWidget> {
    return this.http.get<SavingsWidget>(`${this.base}/dashboard-widget`);
  }
}
```

**Reglas criticas:**
- **NO** usar `forkJoin + catchError(() => EMPTY)` (GR-007 / LA-STG-001) — siempre `catchError` que devuelve `throwError` o un valor por defecto explicito.
- **NO** usar `[href]` para navegacion interna (GR-ANGULAR-HREF-001 / LA-CORE-068) — siempre `[routerLink]` o `(click) + router.navigateByUrl()`.
- Backend devuelve montos siempre positivos en `goal_allocations.amount`; si el endpoint heredado de cuentas devolviera signo negativo, aplicar `Math.abs()` en el mapeo (LA-CORE-055, GR-API-001).

---

## 5. Inventario de componentes (18)

| Componente | Tipo | Pantalla UX | RN/US |
|---|---|---|---|
| SavingsPageComponent | container | Shell con outlet | - |
| GoalListComponent | smart | "Mis Objetivos" | US-024-02 |
| GoalCardComponent | dumb | tarjeta en lista | US-024-02 |
| GoalCreateFormComponent | smart | "Crear objetivo" | US-024-01 |
| GoalEditFormComponent | smart | "Editar objetivo" | US-024-06 |
| GoalDetailComponent | smart | "Detalle objetivo" | US-024-03 |
| GoalProgressBarComponent | dumb | barra reutilizable | US-024-02, 03, 08 |
| GoalProjectionBannerComponent | dumb | banner riesgo | RN-F024-08 |
| ContributionModalComponent | smart | modal aportacion | US-024-04 |
| ContributionHistoryComponent | smart | historico paginado | US-024-03 |
| AutoRuleFormComponent | smart | configurar regla | US-024-05 |
| AutoRuleSummaryComponent | dumb | resumen en detalle | US-024-05 |
| GoalCloseModalComponent | smart | modal cerrar (con SCA) | US-024-06, RN-F024-11 |
| CategoryIconComponent | dumb | icono + color | RN-F024-07 |
| MilestoneToastComponent | smart | toast push hito | US-024-07 |
| SavingsWidgetComponent | smart | widget dashboard | US-024-08 |
| SavingsEmptyStateComponent | dumb | sin objetivos | UX |
| CategoryPickerComponent | dumb | picker en form | RN-F024-07 |

---

## 6. Mapa pantalla -> endpoints

| Pantalla UX (PROTO-FEAT-024) | Componente raiz | Endpoints invocados |
|---|---|---|
| 1. Lista de objetivos | GoalListComponent | GET /goals?status=ACTIVE |
| 2. Crear objetivo | GoalCreateFormComponent | POST /goals |
| 3. Detalle objetivo | GoalDetailComponent | GET /goals/{id}, GET /goals/{id}/contributions, GET /goals/{id}/milestones |
| 4. Aportacion manual | ContributionModalComponent | POST /goals/{id}/contributions |
| 5. Configurar regla auto | AutoRuleFormComponent | PUT /goals/{id}/auto-rule, DELETE /goals/{id}/auto-rule |
| (overlay) Cerrar objetivo | GoalCloseModalComponent | DELETE /goals/{id} (con X-OTP si >30EUR) |
| (dashboard) Widget | SavingsWidgetComponent | GET /dashboard-widget |

---

## 7. Manejo del flujo SCA (RN-F024-11)

```typescript
// goal-close-modal.component.ts (extracto)
onConfirmClose() {
  this.savingsService.closeGoal(this.goalId).subscribe({
    next: result => this.handleSuccess(result),
    error: (err: HttpErrorResponse) => {
      if (err.status === 401 && err.error?.code === 'OTP_REQUIRED') {
        this.requestOtp();   // muestra paso 2FA
      } else {
        this.handleError(err);
      }
    }
  });
}

onOtpEntered(otp: string) {
  this.savingsService.closeGoal(this.goalId, otp).subscribe({
    next: result => this.handleSuccess(result),
    error: err => this.handleOtpError(err)
  });
}
```

Componente OTP heredado de FEAT-001 (no hay que reimplementarlo).

---

## 8. Fidelidad al prototipo (LA-CORE-056 BLOQUEANTE en G-4)

Cada componente Angular debe ser **pixel-perfect** respecto al prototipo aprobado en G-2c (`docs/ux-ui/prototypes/PROTO-FEAT-024-sprint26.html`):

- **Tokens CSS**: heredan del design system v1.1 (anexo §7 FEAT-024). NO redefinir colores ni espaciados.
- **Estructura DOM**: respetar exactamente la jerarquia del prototipo. Cada `proto-screen` corresponde a 1 componente raiz.
- **Estados**: hover, active, disabled, loading, empty — todos definidos en el prototipo, no inventar.
- **Tipografia**: `font-variant-numeric: tabular-nums` en montos (LA-023-02).

**Checklist Developer pre-G-4:**
1. Para cada componente, abrir prototipo + screenshot + componente Angular en paralelo.
2. Diff visual >5% bloquea el commit.
3. Marcar en LLD cualquier desviacion intencional con justificacion.

---

## 9. Estado y reactividad

- **Sin store global** (NgRx/Akita): el modulo savings usa servicios + RxJS BehaviorSubject locales.
- **Patron**: cada componente smart tiene `goal$ = this.goalSubject.asObservable()`; las mutaciones invocan el servicio y al SUCCESS hacen `goalSubject.next(...)`.
- **Optimistic updates**: NO. Tras un POST/PUT, esperar respuesta antes de actualizar UI (RN-F024-15 invariante saldo).

---

## 10. Performance frontend

| Componente | Estrategia |
|---|---|
| GoalListComponent | OnPush change detection + trackBy goalId |
| ContributionHistoryComponent | virtual scroll (cdk-virtual-scroll) si >50 entradas |
| SavingsWidgetComponent | shareReplay(1) en getWidget() para no re-pegar al backend |
| GoalProgressBarComponent | pure pipe `progressPct` para evitar re-render |

---

## 11. Accesibilidad WCAG 2.1 AA (RNF-F024-04)

- Hereda checklist de UX-FEAT-024-sprint26.md §WCAG.
- **Contraste**: tokens del design system ya validados contra fondo claro/oscuro.
- **Foco**: navegacion por teclado en formularios, modal trap focus.
- **Screen reader**: aria-label en CategoryIcon (no solo color), aria-live en MilestoneToast.
- **Form errors**: vinculados via aria-describedby al input afectado.

---

## 12. Testing frontend

| Capa | Test | Cobertura |
|---|---|---|
| Unitario service | savings.service.spec.ts | 12 endpoints, errores HTTP, headers |
| Unitario componente | goal-list.component.spec.ts | render, empty state, click handlers |
| Unitario componente | contribution-modal.component.spec.ts | validation, submit, error 422 |
| Unitario componente | goal-close-modal.component.spec.ts | flujo SCA (401 -> OTP -> 200) |
| Integracion | savings-flow.spec.ts | crear -> aportar -> cerrar (TestBed con HttpTestingController) |
| E2E | TC-F024-020 (Playwright outline) | flujo completo desde login |

Cobertura objetivo: >=85%.

---

## 13. Modificaciones en componentes existentes

### dashboard.component.ts
```html
<!-- justo despues del slot PFM -->
<div class="dashboard-card">
  <app-savings-widget></app-savings-widget>
</div>
```

### shell.component.ts
```typescript
const NAV_ITEMS = [
  // ... existentes
  { label: 'Mis Objetivos', route: '/objetivos', icon: 'savings', order: 5 }
];
```

### app-routing.module.ts
Anadir lazy route `/objetivos` (ver §2).

---

## 14. Trazabilidad

| Componente Angular | US | Prototipo (PROTO-FEAT-024) |
|---|---|---|
| GoalListComponent + GoalCardComponent | US-024-02 | screen-1 |
| GoalCreateFormComponent + CategoryPicker | US-024-01 | screen-2 |
| GoalDetailComponent + GoalProgressBar + ContributionHistory | US-024-03 | screen-3 |
| ContributionModalComponent | US-024-04 | screen-4 |
| AutoRuleFormComponent | US-024-05 | screen-5 |
| GoalEditFormComponent + GoalCloseModalComponent | US-024-06 | (overlays sobre screen-3) |
| MilestoneToastComponent | US-024-07 | (overlay global) |
| SavingsWidgetComponent | US-024-08 | (en dashboard FEAT-014) |

---

## 15. Handoff Step 4

- Frontend developer recibe: este LLD + LLD-backend (DTOs JSON) + prototipo HTML + design system v1.1.
- Pre-G-4 frontend: GR-007 (forkJoin+catchError), GR-008 (no version hardcoded), GR-009 (endpoints existen en backend).
- Pre-G-5: smoke test grep cruzado URLs frontend vs @RequestMapping (heredado GR-SMOKE-001 anticipado).
