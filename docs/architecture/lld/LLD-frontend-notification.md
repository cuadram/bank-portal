# LLD — Frontend: Centro de Notificaciones de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-frontend-notification |
| **Feature** | FEAT-004 — Centro de Notificaciones |
| **Sprint** | 5 (implementado) / 6 (LLD formalizado — ACT-22) |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-26 |
| **Versión** | 1.0.0 |
| **Framework** | Angular 17 — Standalone + NgRx Signal Store |
| **Relacionado** | LLD-backend-notification.md · LLD-frontend-security-audit.md |

---

## 1. Estructura de archivos

```
apps/frontend-portal/src/app/features/notification-center/
├── notification.store.ts          ← NgRx Signal Store (estado global)
├── notification.service.ts        ← HTTP + openSseStream()
└── notification-center.component.ts ← Smart container US-301/302/303/304/305
```

---

## 2. Signal Store — NotificationStore

**Estado:**
```typescript
{
  notifications: SecurityNotification[];  // página actual
  totalElements: number;
  currentPage: number;
  totalPages: number;
  unreadCount: number;          // badge
  eventTypeFilter: string | null;
  loading: boolean;
  error: string | null;
  toasts: SecurityNotification[]; // SSE en tiempo real
}
```

**Computed signals:**
```typescript
unreadNotifications = computed(() => notifications().filter(n => !n.read))
showBadge           = computed(() => unreadCount() > 0)
badgeLabel          = computed(() => count > 99 ? '99+' : String(count))
```

**Métodos:**
| Método | US | Descripción |
|---|---|---|
| `loadNotifications(page)` | 301 | GET /api/v1/notifications paginado |
| `loadUnreadCount()` | 303 | GET /api/v1/notifications/unread-count |
| `markOneAsRead(id)` | 302 | PUT /{id}/read + decrementa unreadCount |
| `markAllAsRead()` | 302 | PUT /read-all + sets unreadCount=0 |
| `setEventTypeFilter(f)` | 301 | Aplica filtro y recarga |
| `addToast(n)` | 305 | Añade toast SSE + incrementa badge |
| `dismissToast(id)` | 305 | Elimina toast del array |

---

## 3. Flujo SSE — US-305

```
NotificationCenterComponent.ngOnInit()
  → loadNotifications() + loadUnreadCount()
  → initSse()
      new EventSource('/api/v1/notifications/stream')
      addEventListener('security-notification', handler)
      onerror → startPollingFallback()   // R-F4-003

handler(event):
  notification = JSON.parse(event.data)
  store.addToast(notification)           // toast visible
  setTimeout(dismissToast, 8000)         // auto-dismiss

startPollingFallback():
  setInterval(() => store.loadUnreadCount(), 60_000)  // 60s

ngOnDestroy():
  sseSource.close()
  clearInterval(pollingInterval)
```

**ADR-010 aplicado:** el `EventSource` nativo del browser respeta los headers
`Cache-Control: no-cache` y reconecta automáticamente si la conexión se interrumpe
(comportamiento estándar del EventSource API — el browser reintenta con back-off).

---

## 4. Integración badge en header del portal

El `NotificationStore` es `providedIn: 'root'` — el badge en el header del portal
lee `store.unreadCount()` y `store.showBadge()` directamente sin prop drilling:

```typescript
// HeaderComponent (componente existente)
readonly notifStore = inject(NotificationStore);

// Template:
@if (notifStore.showBadge()) {
  <span class="badge" aria-live="polite">{{ notifStore.badgeLabel() }}</span>
}
```

`HeaderComponent.ngOnInit()` llama a `notifStore.loadUnreadCount()` para inicializar
el badge en cualquier página del portal, no solo en el centro de notificaciones.

---

## 5. Deep-links US-304

Los `actionUrl` del backend (e.g. `/security/sessions`) se usan directamente con
`[routerLink]` en el template. Al hacer click:
1. Angular Router navega a la ruta.
2. `onNotificationClick(n)` marca la notificación como leída (si no lo estaba).

---

## 6. Accesibilidad WCAG 2.1 AA

| Elemento | Control |
|---|---|
| Lista de notificaciones | `role="feed"` (ARIA live region para contenido dinámico) |
| Badge | `aria-live="polite"` + `aria-label="{N} notificaciones sin leer"` |
| Toasts críticos | `aria-live="assertive"` + `role="alert"` |
| Filtros | `role="group"` + `aria-label="Filtrar notificaciones"` |
| Botón marcar todas | `aria-label` explícito |
| Deep-links | `aria-label="Ir a {título de notificación}"` |
| Icono de evento | `aria-hidden="true"` (decorativo) |
| Punto de no leída | `aria-hidden="true"` (decorativo — el estado está en `aria-label` del article) |

---

## 7. Tests pendientes Sprint 6

El componente `NotificationCenterComponent` necesita spec formal (ACT-22 pattern):

| Test | Tipo | Escenario |
|---|---|---|
| Carga inicial | Unit | ngOnInit → loadNotifications + loadUnreadCount llamados |
| SSE toast | Unit | addToast() → toast visible + badge incrementado |
| Auto-dismiss | Unit (fakeAsync) | setTimeout 8s → dismissToast llamado |
| Polling fallback | Unit | sseSource.onerror → setInterval 60s activo |
| Marcar leída al click | Unit | onNotificationClick → markOneAsRead llamado |
| Filtro | Unit | applyFilter → setEventTypeFilter + loadNotifications(0) |
| Paginación | Unit | loadPage → loadNotifications(n) llamado |
| Cleanup | Unit | ngOnDestroy → sseSource.close + clearInterval |

---

*SOFIA Architect Agent · BankPortal · FEAT-004 · LLD Frontend · 2026-05-26 (ACT-22)*
