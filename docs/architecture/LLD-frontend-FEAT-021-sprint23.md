# LLD Frontend — FEAT-021: Depósitos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · Architect Agent · SOFIA v2.7**

---

## 1. Estructura Angular

```
frontend-portal/src/app/features/deposits/
├── deposits.module.ts
├── deposits-routing.module.ts
├── models/
│   └── deposit.model.ts
├── services/
│   └── deposit.service.ts
└── components/
    ├── deposit-list/
    │   ├── deposit-list.component.ts
    │   ├── deposit-list.component.html
    │   └── deposit-list.component.scss
    ├── deposit-detail/
    │   ├── deposit-detail.component.ts
    │   └── deposit-detail.component.html
    ├── deposit-simulator/
    │   ├── deposit-simulator.component.ts
    │   └── deposit-simulator.component.html
    ├── deposit-application-form/
    │   ├── deposit-application-form.component.ts
    │   └── deposit-application-form.component.html
    └── renewal-selector/
        ├── renewal-selector.component.ts
        └── renewal-selector.component.html
```

---

## 2. Rutas (LA-FRONT-001)

### deposits-routing.module.ts
```typescript
const routes: Routes = [
  { path: '',         component: DepositListComponent },
  { path: 'simulate', component: DepositSimulatorComponent },
  { path: ':id',      component: DepositDetailComponent },
  { path: 'new',      component: DepositApplicationFormComponent },
];
```

### app-routing.module.ts — ruta lazy a añadir
```typescript
{ path: 'deposits', loadChildren: () =>
    import('./features/deposits/deposits.module')
      .then(m => m.DepositsModule) }
```

### shell.component.ts — nav item a añadir (LA-FRONT-001)
```typescript
{ path: '/deposits', label: 'Depósitos', icon: '💰' }
```

---

## 3. deposit.model.ts
```typescript
export type DepositStatus       = 'ACTIVE' | 'MATURED' | 'CANCELLED';
export type RenewalInstruction  = 'RENEW_AUTO' | 'RENEW_MANUAL' | 'CANCEL_AT_MATURITY';

export interface Deposit {
  id: string;
  importe: number;
  plazoMeses: number;
  tin: number;
  tae: number;
  estado: DepositStatus;
  renovacion: RenewalInstruction;
  cuentaOrigenId: string;
  fechaApertura: string;
  fechaVencimiento: string;
  penalizacion?: number;
  createdAt: string;
}

export interface SimulateRequest   { importe: number; plazoMeses: number; }
export interface SimulationResponse {
  tin: number; tae: number;
  interesesBrutos: number; retencionIrpf: number;
  interesesNetos: number;  totalVencimiento: number;
}
export interface OpenDepositRequest {
  importe: number; plazoMeses: number;
  cuentaOrigenId: string; renovacion: RenewalInstruction; otp: string;
}
export interface CancellationResult {
  importeAbonado: number; penalizacion: number; interesesDevengados: number;
}
```

---

## 4. deposit.service.ts (LA-STG-001)
```typescript
@Injectable({ providedIn: 'root' })
export class DepositService {
  private base = '/api/v1/deposits';

  getDeposits(page=0, size=10): Observable<Page<Deposit>> {
    return this.http.get<Page<Deposit>>(this.base, { params: { page, size } });
  }
  getDepositById(id: string): Observable<DepositDetailDTO> {
    return this.http.get<DepositDetailDTO>(`${this.base}/${id}`);
  }
  simulate(req: SimulateRequest): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(`${this.base}/simulate`, req);
  }
  openDeposit(req: OpenDepositRequest): Observable<Deposit> {
    return this.http.post<Deposit>(this.base, req);
  }
  setRenewal(id: string, instruction: RenewalInstruction): Observable<Deposit> {
    return this.http.patch<Deposit>(`${this.base}/${id}/renewal`, { instruction });
  }
  cancelDeposit(id: string, otp: string): Observable<CancellationResult> {
    return this.http.post<CancellationResult>(`${this.base}/${id}/cancel`, { otp });
  }
}
```

---

## 5. Reglas críticas de implementación

| Regla | Origen | Aplicación |
|---|---|---|
| Rutas lazy registradas en `app-routing.module.ts` | LA-FRONT-001 | `deposits` lazy |
| Nav item en `shell.component.ts` | LA-FRONT-001 | `💰 Depósitos` → `/deposits` |
| `catchError` en forkJoin devuelve `of(default)` — NUNCA `EMPTY` | LA-STG-001 | `DepositListComponent` |
| `routerLink` o `router.navigateByUrl()` — NUNCA `[href]` interno | LA-023-01 | Links en componentes |
| `environment.ts` para version/sprint | LA-STG-002 | Sin hardcode |
| Paths relativos correctos en subdirectorios | LA-FRONT-003 | `../../services/` desde `components/nombre/` |

---

*LLD Frontend generado por Architect Agent — SOFIA v2.7 — Sprint 23 — 2026-04-06*
