# LLD — FEAT-014: Notificaciones Push & In-App — Frontend Angular

**BankPortal · Banco Meridian · Sprint 16**

| Campo | Valor |
|---|---|
| Servicio | `frontend-portal` (módulo `notifications`) |
| Stack | Angular 17 · TypeScript · Service Worker |
| Feature | FEAT-014 |
| Versión | 1.0 |
| Estado | DRAFT — Gate 3 pendiente Tech Lead |
| CMMI | TS SP 2.1 · TS SP 2.2 |

---

## Estructura de módulo

```
apps/frontend-portal/src/app/
├── features/
│   └── notifications/                         ← módulo nuevo (lazy-loaded)
│       ├── notifications.module.ts
│       ├── notifications-routing.module.ts    # ruta /settings/notifications
│       ├── services/
│       │   └── notification.service.ts        # SSE + REST + push suscripción
│       ├── components/
│       │   ├── notification-bell/
│       │   │   ├── notification-bell.component.ts
│       │   │   ├── notification-bell.component.html
│       │   │   └── notification-bell.component.spec.ts
│       │   ├── notification-panel/
│       │   │   ├── notification-panel.component.ts
│       │   │   ├── notification-panel.component.html
│       │   │   └── notification-panel.component.spec.ts
│       │   └── notification-settings/
│       │       ├── notification-settings.component.ts
│       │       ├── notification-settings.component.html
│       │       └── notification-settings.component.spec.ts
│       └── models/
│           └── notification.model.ts          # Interfaces TypeScript
├── core/
│   └── services/
│       └── push-registration.service.ts      # Singleton VAPID subscription
└── (Service Worker)
    └── ngsw-worker.js                         # @angular/service-worker (existente)
    └── push-event-handler.ts                  # handler evento 'push'
```

---

## Diagrama de componentes Angular

```mermaid
classDiagram
  class NotificationService {
    -notifications$ BehaviorSubject~NotificationDto[]~
    -unreadCount$ BehaviorSubject~number~
    -eventSource EventSource
    +notifications$ Observable~NotificationDto[]~
    +unreadCount$ Observable~number~
    +connectSSE(categories?: string[]) void
    +disconnectSSE() void
    +markAsRead(id: string) Observable~void~
    +markAllRead() Observable~void~
    +getNotifications(page, category) Observable~Page~
    +updatePreferences(patch: PreferencePatchDto) Observable~void~
    +getPreferences() Observable~NotificationPreferenceDto[]~
  }

  class PushRegistrationService {
    -subscriptionId string
    +isSupported() boolean
    +requestAndSubscribe() Promise~void~
    +unsubscribe(id: string) Observable~void~
    -getVapidPublicKey() string
  }

  class NotificationBellComponent {
    +unreadCount$ Observable~number~
    +isPanelOpen boolean
    +togglePanel() void
  }

  class NotificationPanelComponent {
    +notifications$ Observable~NotificationDto[]~
    +activeFilter NotificationCategory
    +isLoading boolean
    +setFilter(category) void
    +markAsRead(id) void
    +markAllRead() void
    +onScrollEnd() void
    +requestPushPermission() void
  }

  class NotificationSettingsComponent {
    +preferences$ Observable~NotificationPreferenceDto[]~
    +isSaving boolean
    +onToggle(pref, channel) void
  }

  NotificationBellComponent --> NotificationService : inject
  NotificationPanelComponent --> NotificationService : inject
  NotificationPanelComponent --> PushRegistrationService : inject
  NotificationSettingsComponent --> NotificationService : inject
```

---

## Diagrama de secuencia — Angular recibe push notification (SW)

```mermaid
sequenceDiagram
  participant Backend as Spring Boot Backend
  participant PS as Push Service (browser)
  participant SW as ngsw-worker (Service Worker)
  participant FE as Angular App (si activa)
  participant OS as Sistema Operativo

  Backend->>PS: HTTP POST endpoint (payload VAPID cifrado AES-128-GCM)
  PS->>SW: push event { data: decrypted payload }
  SW->>SW: self.addEventListener('push', handler)
  SW->>OS: self.registration.showNotification(title, { body, icon, badge, data })
  OS-->>Usuario: Notification popup
  alt App Angular activa
    SW->>FE: postMessage({ type: 'PUSH_RECEIVED', payload })
    FE->>FE: NotificationService.onPushReceived() → actualiza unreadCount$
  end
  Usuario->>OS: Clic en notificación
  OS->>SW: notificationclick event
  SW->>FE: clients.openWindow('/notifications') ó focus tab
```

---

## Diagrama de secuencia — Carga inicial y SSE

```mermaid
sequenceDiagram
  participant U as Usuario
  participant Bell as NotificationBellComponent
  participant NS as NotificationService
  participant BE as Backend REST + SSE

  U->>Bell: ngOnInit (Dashboard cargado)
  Bell->>NS: unreadCount$ (subscribe)
  NS->>BE: GET /api/v1/notifications/unread-count
  BE-->>NS: { count: 3 }
  NS-->>Bell: unreadCount$ = 3
  Bell-->>U: Badge "3"

  NS->>BE: GET /api/v1/notifications/stream?categories=TRANSACTION,SECURITY\n(EventSource connection)
  Note over NS,BE: Conexión SSE persistente

  loop Evento en tiempo real
    BE-->>NS: id: evt-503\nevent: TRANSFER_COMPLETED\ndata: {...}
    NS->>NS: actualiza notifications$ + incrementa unreadCount$
    NS-->>Bell: unreadCount$ = 4
    Bell-->>U: Badge "4" (sin reload)
  end
```

---

## Interfaces TypeScript

```typescript
// notification.model.ts

export type NotificationCategory = 'TRANSACTION' | 'SECURITY' | 'KYC' | 'SYSTEM' | 'ALL';
export type NotificationSeverity = 'INFO' | 'HIGH';
export type NotificationEventType =
  | 'TRANSFER_COMPLETED' | 'TRANSFER_RECEIVED'
  | 'PAYMENT_COMPLETED' | 'BILL_PAID'
  | 'SECURITY_NEW_DEVICE' | 'SECURITY_PASSWORD_CHANGED'
  | 'SECURITY_2FA_FAILED' | 'SECURITY_PHONE_CHANGED'
  | 'KYC_APPROVED' | 'KYC_REJECTED';

export interface NotificationDto {
  id: string;
  type: NotificationEventType;
  category: NotificationCategory;
  title: string;
  body: string;
  read: boolean;
  readAt: string | null;
  severity: NotificationSeverity;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferenceDto {
  eventType: NotificationEventType;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

export interface PreferencePatchDto {
  eventType: NotificationEventType;
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
}

export interface PushSubscribeRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
```

---

## Accesibilidad WCAG 2.1 AA

| Elemento | Requisito | Implementación |
|---|---|---|
| Panel lateral (drawer) | `role="complementary"` | `<aside role="complementary" aria-label="Notificaciones">` |
| Badge contador | `aria-label` dinámico | `aria-label="3 notificaciones no leídas"` |
| Botón campana | Accesible por teclado | `<button>` nativo con `aria-expanded` |
| Lista notificaciones | `role="list"` | `<ul role="list">` + `<li role="listitem">` |
| Filtros categoría | `role="tablist"` | Tabs accesibles con `aria-selected` |
| Tiempo relativo | `<time datetime="">` | `datetime="2026-03-24T10:30:00Z"` con texto "hace 5 min" |
| Notificación no leída | Contraste visual | Fondo diferenciado con ratio ≥ 4.5:1 |

---

## Checklist de implementación para el Developer

- [ ] `NotificationModule` lazy-loaded registrado en `AppRoutingModule` en `/settings/notifications`
- [ ] `NotificationService` — SSE `EventSource` con reconexión automática y `lastEventId`
- [ ] `NotificationBellComponent` — badge reactivo via `unreadCount$`
- [ ] `NotificationPanelComponent` — drawer, filtros, infinite scroll, mark-read
- [ ] `NotificationSettingsComponent` — toggles preferencias por canal
- [ ] `PushRegistrationService` — `requestPermission()` + `subscribe()` + POST al backend
- [ ] `push-event-handler.ts` — listener `push` en Service Worker → `showNotification()`
- [ ] Flag `localStorage.push_permission_asked` — solicitar permiso solo 1ª vez
- [ ] Accesibilidad WCAG 2.1 AA verificada con axe-core
- [ ] Tests Karma/Jest ≥ 5 escenarios por componente

---

*SOFIA Architect Agent — Step 3 | Sprint 16 · FEAT-014*
*CMMI Level 3 — TS SP 2.1 · TS SP 2.2*
*BankPortal — Banco Meridian — 2026-03-24*
