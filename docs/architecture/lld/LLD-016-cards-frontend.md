# LLD Frontend — FEAT-016 Gestión de Tarjetas (Angular 17)

## Metadata
| Campo | Valor |
|---|---|
| Documento | LLD-016-cards-frontend v1.0 |
| Sprint | 18 · v1.18.0 |
| Autor | SOFIA Architect Agent |
| Fecha | 2026-03-25 |

---

## Módulo CardsModule — Estructura

```
src/app/features/cards/
├── cards.module.ts              (lazy-loaded)
├── cards-routing.module.ts      (/cards, /cards/:id)
├── components/
│   ├── card-list/
│   │   ├── card-list.component.ts
│   │   ├── card-list.component.html
│   │   └── card-list.component.scss
│   ├── card-detail/
│   │   ├── card-detail.component.ts
│   │   ├── card-detail.component.html
│   │   └── card-detail.component.scss
│   ├── card-limits-form/
│   │   └── card-limits-form.component.ts   (Reactive Forms + sliders)
│   └── card-pin-form/
│       └── card-pin-form.component.ts
├── services/
│   └── card.service.ts          (HTTP + SSE integration)
├── models/
│   └── card.model.ts
└── guards/
    └── card-owner.guard.ts
```

---

## Modelo TypeScript

```typescript
export type CardType   = 'DEBIT' | 'CREDIT';
export type CardStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CANCELLED';

export interface Card {
  id: string;
  panMasked: string;
  cardType: CardType;
  status: CardStatus;
  expirationDate: string;
  accountId: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyLimitMin: number;
  dailyLimitMax: number;
  monthlyLimitMin: number;
  monthlyLimitMax: number;
}

export interface UpdateLimitsRequest { dailyLimit: number; monthlyLimit: number; otpCode: string; }
export interface ChangePinRequest    { newPin: string; otpCode: string; }
```

---

## CardService — HTTP + SSE

```typescript
@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly baseUrl = '/api/v1/cards';

  getCards(): Observable<Card[]>             { return this.http.get<Card[]>(this.baseUrl); }
  getCard(id: string): Observable<Card>      { return this.http.get<Card>(`${this.baseUrl}/${id}`); }
  blockCard(id: string, otp: string)         { return this.http.post(`${this.baseUrl}/${id}/block`,   { otpCode: otp }); }
  unblockCard(id: string, otp: string)       { return this.http.post(`${this.baseUrl}/${id}/unblock`, { otpCode: otp }); }
  updateLimits(id: string, r: UpdateLimitsRequest) { return this.http.put(`${this.baseUrl}/${id}/limits`, r); }
  changePin(id: string, r: ChangePinRequest)       { return this.http.post(`${this.baseUrl}/${id}/pin`, r); }

  // SSE: eventos CARD_BLOCKED/CARD_UNBLOCKED desde NotificationHubStream
  // Reutiliza SseService (FEAT-014) filtrado por tipo CARD_*
}
```

---

## CardListComponent — Badge estados

```typescript
statusBadge(status: CardStatus): { label: string; css: string } {
  const map: Record<CardStatus, { label: string; css: string }> = {
    ACTIVE:    { label: 'Activa',    css: 'badge--green'  },
    BLOCKED:   { label: 'Bloqueada', css: 'badge--red'    },
    EXPIRED:   { label: 'Expirada',  css: 'badge--gray'   },
    CANCELLED: { label: 'Cancelada', css: 'badge--gray'   },
  };
  return map[status];
}

// SSE subscription en ngOnInit
ngOnInit() {
  this.cards$ = this.cardService.getCards();
  this.sseService.events$
    .pipe(filter(e => e.type === 'CARD_BLOCKED' || e.type === 'CARD_UNBLOCKED'))
    .subscribe(event => this.updateCardStatus(event.cardId, event.type));
}
```

---

## CardLimitsFormComponent — Reactive Forms + Sliders

```typescript
initForm(card: Card): FormGroup {
  return this.fb.group({
    dailyLimit: [card.dailyLimit, [
      Validators.required,
      Validators.min(card.dailyLimitMin),
      Validators.max(card.dailyLimitMax)
    ]],
    monthlyLimit: [card.monthlyLimit, [
      Validators.required,
      Validators.min(card.monthlyLimitMin),
      Validators.max(card.monthlyLimitMax)
    ]],
    otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  }, { validators: this.monthlyAboveDailyValidator });
}

monthlyAboveDailyValidator(group: AbstractControl): ValidationErrors | null {
  const daily = group.get('dailyLimit')?.value;
  const monthly = group.get('monthlyLimit')?.value;
  return monthly < daily ? { monthlyBelowDaily: true } : null;
}
```

---

## CardPinFormComponent — Seguridad

```html
<!-- input type=password, autocomplete=new-password, sin clipboard -->
<input type="password" formControlName="newPin"
  autocomplete="new-password"
  maxlength="4" inputmode="numeric"
  aria-label="Nuevo PIN de 4 dígitos"
  (paste)="$event.preventDefault()">
```
```typescript
pinValidator(ctrl: AbstractControl): ValidationErrors | null {
  const val = ctrl.value;
  const trivial = /^(\d)\1{3}$|^1234$|^4321$|^0000$|^9999$/;
  return trivial.test(val) ? { pinTrivial: true } : null;
}
```

---

## Routing

```typescript
const routes: Routes = [
  { path: '',    component: CardListComponent },
  { path: ':id', component: CardDetailComponent, canActivate: [AuthGuard] }
];
// Lazy load en app-routing.module.ts:
{ path: 'cards', loadChildren: () => import('./features/cards/cards.module').then(m => m.CardsModule) }
```

---

## WCAG 2.1 AA — Checklist

| Criterio | Implementación |
|---|---|
| 1.4.3 Contraste | Badge colors: ratio ≥ 4.5:1 verificado |
| 2.4.7 Focus visible | outline: 2px offset en todos los controles interactivos |
| 4.1.2 Name/Role/Value | aria-label en inputs PIN, aria-live en badge de estado |
| 1.3.1 Info y relaciones | Labels explícitos en formularios |

---

*Generado por SOFIA Architect Agent — Sprint 18 — 2026-03-25*
*BankPortal — Banco Meridian · v1.18.0*
