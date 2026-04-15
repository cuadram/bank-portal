# LLD Frontend — FEAT-022: Bizum P2P
**Sprint 24 · Angular 17 · SOFIA v2.7**

---

## Estructura de módulo Angular

```
apps/frontend-portal/src/app/features/bizum/
├── bizum.module.ts                    // BizumModule — lazy loaded
├── bizum-routing.module.ts            // /bizum rutas internas
├── models/
│   └── bizum.model.ts                 // BizumPayment, BizumRequest, BizumStatus, BizumActivation
├── services/
│   └── bizum.service.ts               // HTTP client — /api/v1/bizum/*
└── components/
    ├── bizum-home/                    // Pantalla inicio — hero + acciones + últimas ops
    │   ├── bizum-home.component.ts
    │   ├── bizum-home.component.html
    │   └── bizum-home.component.scss
    ├── bizum-send/                    // Stepper envío — paso 1: datos
    │   ├── bizum-send.component.ts
    │   └── bizum-send.component.html
    ├── bizum-otp/                     // Stepper envío — paso 2: OTP + confirmación
    │   ├── bizum-otp.component.ts
    │   └── bizum-otp.component.html
    ├── bizum-request/                 // Solicitar dinero + gestión solicitudes recibidas
    │   ├── bizum-request.component.ts
    │   └── bizum-request.component.html
    ├── bizum-history/                 // Historial paginado con filtros
    │   ├── bizum-history.component.ts
    │   └── bizum-history.component.html
    └── bizum-settings/                // Configuración — toggles + límites + desactivar
        ├── bizum-settings.component.ts
        └── bizum-settings.component.html
```

---

## Registro en router — OBLIGATORIO (LA-FRONT-001)

```typescript
// app-routing.module.ts — añadir ruta lazy
{
  path: 'bizum',
  loadChildren: () => import('./features/bizum/bizum.module')
    .then(m => m.BizumModule)
}

// bizum-routing.module.ts — rutas internas
const routes: Routes = [
  { path: '', component: BizumHomeComponent },
  { path: 'enviar', component: BizumSendComponent },
  { path: 'solicitar', component: BizumRequestComponent },
  { path: 'historial', component: BizumHistoryComponent },
  { path: 'configuracion', component: BizumSettingsComponent },
];
```

## Nav item — shell.component.ts — OBLIGATORIO (LA-FRONT-001)

```typescript
// Añadir después del item Depósitos
{ label: 'Bizum', icon: '💸', route: '/bizum' }
```

## Navegación interna — NUNCA [href] (LA-023-01)

```typescript
// CORRECTO — siempre Router.navigateByUrl()
constructor(private router: Router) {}
navigateTo(path: string) { this.router.navigateByUrl(path); }

// En template — NUNCA <a [href]="...">
// CORRECTO:
// <button (click)="navigateTo('/bizum/enviar')">Enviar</button>
```

---

## bizum.service.ts — contrato HTTP

```typescript
@Injectable({ providedIn: 'root' })
export class BizumService {
  private readonly API = '/api/v1/bizum';

  activate(req: ActivateBizumRequest): Observable<ActivateBizumResponse>
  sendPayment(req: SendPaymentRequest): Observable<SendPaymentResponse>
  requestMoney(req: RequestMoneyRequest): Observable<RequestMoneyResponse>
  resolveRequest(id: string, req: ResolveRequestRequest): Observable<void>
  getTransactions(page: number, filter?: BizumFilter): Observable<PagedResult<BizumTransactionDTO>>
  getStatus(): Observable<BizumStatusResponse>  // activación + límites restantes
}
```

## catchError — NUNCA EMPTY en forkJoin (LA-STG-001)

```typescript
// CORRECTO
this.bizumService.getStatus().pipe(
  catchError(() => of({ active: false, dailyUsed: 0, dailyLimit: 2000 }))
)

// INCORRECTO — deadlock silencioso
this.bizumService.getStatus().pipe(
  catchError(() => EMPTY)  // NUNCA en forkJoin
)
```

---

## Verificación de fidelidad al prototipo (LA-023-02)

El Developer debe contrastar componente a componente contra `PROTO-FEAT-022-sprint24.html`:

| Componente | Verificar contra pantalla PROTO |
|---|---|
| BizumHomeComponent | screen-bizum-home — hero navy, grid acciones, lista operaciones |
| BizumSendComponent | screen-bizum-send — stepper paso 1, barra límite, resumen previo |
| BizumOtpComponent | screen-bizum-otp — stepper paso 2, OTP inputs, alerta irreversible |
| BizumRequestComponent | screen-bizum-request — form + solicitudes pendientes |
| BizumHistoryComponent | screen-bizum-history — chips filtro, timeline agrupado fecha |
| BizumSettingsComponent | screen-bizum-settings — número vinculado, toggles, límites |

---

## actionUrl notificaciones — SOLO rutas registradas (LA-023-01)

```typescript
// seeds user_notifications — actionUrl debe existir en app-routing.module.ts
// CORRECTO
actionUrl: '/bizum/historial'   // ruta registrada
actionUrl: '/bizum/solicitar'   // ruta registrada

// INCORRECTO — causa navigateByUrl silencioso sin navegación
actionUrl: '/bizum/requests'    // ruta no registrada
```

---

*LLD Frontend generado por Architect Agent — SOFIA v2.7 — Step 3 — Sprint 24*
