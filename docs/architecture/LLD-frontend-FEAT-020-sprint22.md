# LLD Frontend — FEAT-020 Gestión de Préstamos Personales
## BankPortal · Banco Meridian · Sprint 22

**Módulo:** Angular 17 | **Stack:** Angular 17 + NgRx + Angular Material  
**Feature:** FEAT-020 | **Versión:** 1.0 | **Estado:** APPROVED

---

## 1. Estructura de módulo Angular

```
apps/frontend/src/app/features/loans/
├── loans.module.ts                    # NgModule lazy
├── loans-routing.module.ts            # Rutas del módulo
├── models/
│   ├── loan.model.ts                  # Interface Loan, LoanSummary
│   ├── loan-application.model.ts      # Interface LoanApplication
│   ├── simulation.model.ts            # Interface SimulateRequest, SimulationResponse
│   └── amortization.model.ts          # Interface AmortizationRow
├── services/
│   └── loan.service.ts                # HttpClient — todos los endpoints
├── components/
│   ├── loan-list/
│   │   ├── loan-list.component.ts
│   │   └── loan-list.component.html
│   ├── loan-detail/
│   │   ├── loan-detail.component.ts
│   │   └── loan-detail.component.html
│   ├── loan-simulator/
│   │   ├── loan-simulator.component.ts
│   │   └── loan-simulator.component.html
│   ├── loan-application-form/
│   │   ├── loan-application-form.component.ts   # Stepper 3 pasos
│   │   └── loan-application-form.component.html
│   ├── amortization-table/
│   │   ├── amortization-table.component.ts
│   │   └── amortization-table.component.html
│   └── loan-cancel-dialog/
│       └── loan-cancel-dialog.component.ts
```

---

## 2. Routing (LA-FRONT-001 — OBLIGATORIO registrar ruta + nav item)

```typescript
// app-routing.module.ts — añadir ruta lazy
{
  path: 'prestamos',
  loadChildren: () =>
    import('./features/loans/loans.module').then(m => m.LoansModule),
  canActivate: [AuthGuard]
}

// loans-routing.module.ts
const routes: Routes = [
  { path: '',           component: LoanListComponent },
  { path: 'simular',   component: LoanSimulatorComponent },
  { path: 'solicitar', component: LoanApplicationFormComponent },
  { path: ':id',       component: LoanDetailComponent },
];
```

```typescript
// shell.component.ts — añadir nav item (LA-FRONT-001)
navItems = [
  // ... existentes
  { label: 'Préstamos', icon: '🏛', route: '/prestamos' }  // AÑADIR
];
```

---

## 3. LoanService — contrato HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly base = '/api/v1/loans';

  constructor(private http: HttpClient) {}

  listLoans(params?: any): Observable<Page<LoanSummary>> {
    return this.http.get<Page<LoanSummary>>(this.base, { params });
  }

  getLoan(id: string): Observable<LoanDetail> {
    return this.http.get<LoanDetail>(`${this.base}/${id}`);
  }

  getAmortization(id: string): Observable<AmortizationRow[]> {
    return this.http.get<AmortizationRow[]>(`${this.base}/${id}/amortization`);
  }

  simulate(req: SimulateRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(`${this.base}/simulate`, req);
  }

  apply(req: ApplyLoanRequest): Observable<LoanApplicationResponse> {
    return this.http.post<LoanApplicationResponse>(`${this.base}/applications`, req);
  }

  cancelApplication(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/applications/${id}`);
  }
}
```

---

## 4. Patrones críticos Angular (lecciones aprendidas)

### LA-STG-001 — catchError NUNCA EMPTY en forkJoin

```typescript
// LoanDetailComponent — carga paralela detail + amortización
ngOnInit(): void {
  forkJoin({
    loan: this.loanService.getLoan(this.id).pipe(
      catchError(() => of(null))            // ✅ CORRECTO — of(null) no of(EMPTY)
    ),
    schedule: this.loanService.getAmortization(this.id).pipe(
      catchError(() => of([]))              // ✅ CORRECTO
    )
  }).subscribe(({ loan, schedule }) => {
    this.loan = loan;
    this.schedule = schedule;
  });
}
```

### LA-STG-002 — versión/sprint desde environment.ts

```typescript
// environment.ts y environment.prod.ts — ambos sincronizados
export const environment = {
  production: false,
  appVersion: 'v1.22.0',       // ✅ SIEMPRE desde env — NUNCA hardcodeado en template
  sprint: 22,
  envLabel: 'STG'
};
```

### LA-FRONT-001 — verificar backend antes de registrar ruta

Antes de registrar `/prestamos/:id` verificar que `GET /api/v1/loans/{id}` existe.  
Todos los endpoints de FEAT-020 están definidos en LLD backend — verificado ✅.

### LA-FRONT-004 — no exposer rutas con endpoints inexistentes

`/profile/notifications` y `/profile/sessions` se habilitan con la entrega de DEBT-043.  
El componente Mi Perfil reutiliza `catchError(() => of([]))` para ambos.

---

## 5. TypeScript Models

```typescript
// loan.model.ts
export interface LoanSummary {
  id: string;
  tipo: 'PERSONAL' | 'VEHICULO' | 'REFORMA';
  importeOriginal: number;
  importePendiente: number;
  cuotaMensual: number;
  tae: number;
  estado: LoanStatus;
  proximaCuota: string;        // ISO date
}

export interface LoanDetail extends LoanSummary {
  plazo: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  fechaInicio: string;
  fechaFin: string;
  capitalAmortizado: number;
  interesesPagados: number;
  costeTotal: number;
}

export type LoanStatus = 'ACTIVE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID_OFF' | 'CANCELLED';

// simulation.model.ts
export interface SimulateRequest {
  importe: number;
  plazo: number;
  finalidad: 'CONSUMO' | 'VEHICULO' | 'REFORMA' | 'OTROS';
}

export interface SimulationResponse {
  cuotaMensual: number;
  tae: number;
  costeTotal: number;
  interesesTotales: number;
  schedule: AmortizationRow[];
}

// amortization.model.ts
export interface AmortizationRow {
  n: number;
  fecha: string;
  capital: number;
  intereses: number;
  cuotaTotal: number;
  saldoPendiente: number;
}
```

---

## 6. Componente OtpInputComponent — reutilizar de shared/

Si existe en `app/shared/components/otp-input/`, reutilizar.  
Si no existe, crear en `shared/` con las siguientes características:
- 6 `<input>` separados, `maxlength="1"`, `type="text"`, `inputmode="numeric"`
- Auto-advance al siguiente input en `keyup`
- Emite `@Output() completed = new EventEmitter<string>()` al completar 6 dígitos
- `aria-label="Dígito N de 6"` en cada input (WCAG 2.1 AA)

---

*Architect Agent · SOFIA v2.6 · BankPortal — Banco Meridian · Sprint 22 · 2026-04-02*
