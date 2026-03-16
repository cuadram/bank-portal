# LLD — Frontend: Historial de Cambios de Configuración de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-frontend-config-history |
| **Feature** | FEAT-006 — Autenticación Contextual |
| **US** | US-604 — Historial de cambios de configuración de seguridad |
| **Sprint** | 7 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-06-09 |
| **Versión** | 1.0.0 |
| **Estado** | 🔒 PROPUESTO — Pendiente aprobación Tech Lead |
| **Framework** | Angular 17 — Standalone + Signals |
| **Relacionado** | LLD-frontend-security-audit.md · LLD-backend-security-audit.md · US-401 |

---

## 1. Contexto y alcance

US-604 expone al usuario un historial filtrado del `audit_log` donde `event_category = 'CONFIG_CHANGE'`.
Esto incluye eventos como: activación/desactivación de 2FA, cambios de timeout de sesión,
adición/revocación de dispositivos de confianza y cambios en preferencias de notificación.

El componente se integra en el Panel de Auditoría de Seguridad (`/security/audit`) como
una pestaña adicional junto al dashboard (US-401) y la exportación (US-402).

**Dependencia:** el backend expone los eventos de configuración a través de un nuevo
endpoint `GET /api/v1/security/config-history` paginado (extensión del contrato OpenAPI v1.4.0).

---

## 2. Estructura de archivos

```
apps/frontend-portal/src/app/features/security-audit/
├── config-history/
│   ├── config-history.component.ts         ← componente principal US-604
│   ├── config-history.component.html        ← plantilla
│   ├── config-history.component.scss        ← estilos
│   ├── config-history.component.spec.ts     ← tests unitarios
│   └── config-history-item.component.ts     ← componente presentacional por fila
├── security-audit.service.ts               ← añadir getConfigHistory()
└── security-audit.routes.ts               ← añadir ruta /security/audit/config-history
```

---

## 3. Modelo de datos

### ConfigChangeEvent (interfaz TypeScript)

```typescript
export interface ConfigChangeEvent {
  eventId:    string;           // UUID del evento en audit_log
  eventType:  ConfigEventType;
  description: string;          // Descripción legible generada por el backend
  ipMasked:   string;           // Ej. "192.168.x.x"
  deviceInfo: string | null;    // Ej. "Chrome · macOS" (null si es acción interna)
  occurredAt: string;           // ISO 8601 date-time
}

export type ConfigEventType =
  | 'TWO_FA_ENABLED'
  | 'TWO_FA_DISABLED'
  | 'SESSION_TIMEOUT_CHANGED'
  | 'TRUSTED_DEVICE_ADDED'
  | 'TRUSTED_DEVICE_REVOKED'
  | 'ALL_TRUSTED_DEVICES_REVOKED'
  | 'NOTIFICATION_PREFS_CHANGED'
  | 'RECOVERY_CODES_REGENERATED'
  | 'ACCOUNT_UNLOCKED';

export interface ConfigHistoryPage {
  content:       ConfigChangeEvent[];
  totalElements: number;
  totalPages:    number;
  number:        number;   // página actual (0-indexed)
  size:          number;
}
```

---

## 4. ConfigHistoryComponent

### Estado local (Signals)

```typescript
@Component({
  selector:    'bp-config-history',
  standalone:  true,
  templateUrl: './config-history.component.html',
  styleUrls:   ['./config-history.component.scss'],
  imports:     [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigHistoryComponent implements OnInit {
  private readonly auditService = inject(SecurityAuditService);

  events        = signal<ConfigChangeEvent[]>([]);
  loading       = signal(false);
  error         = signal<string | null>(null);
  currentPage   = signal(0);
  totalPages    = signal(0);
  totalElements = signal(0);
  readonly pageSize = 20;

  selectedType  = signal<ConfigEventType | 'ALL'>('ALL');

  isEmpty = computed(() => !this.loading() && this.events().length === 0);
  hasPrev = computed(() => this.currentPage() > 0);
  hasNext = computed(() => this.currentPage() < this.totalPages() - 1);

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.error.set(null);
    const filter = this.selectedType() === 'ALL' ? undefined : this.selectedType();

    this.auditService.getConfigHistory(page, this.pageSize, filter).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (result) => {
        this.events.set(result.content);
        this.currentPage.set(result.number);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
      },
      error: () => this.error.set('No se pudo cargar el historial. Inténtalo de nuevo.'),
    });
  }

  onFilterChange(type: ConfigEventType | 'ALL'): void {
    this.selectedType.set(type);
    this.loadPage(0);   // resetear a primera página al cambiar filtro
  }

  prevPage(): void { if (this.hasPrev()) this.loadPage(this.currentPage() - 1); }
  nextPage(): void { if (this.hasNext()) this.loadPage(this.currentPage() + 1); }
}
```

---

## 5. Estructura visual

```
┌──────────────────────────────────────────────────────────────────────┐
│ Historial de cambios de configuración                                │
│                                                                      │
│ Filtrar por tipo: [Todos ▼]                                          │
│   Opciones: Todos | 2FA | Sesión | Dispositivos | Notificaciones     │
│                                                                      │
├──────────────────────────────────────────────┬───────────────────────┤
│ Evento                                       │ Fecha y hora          │
├──────────────────────────────────────────────┼───────────────────────┤
│ 🔐 Verificación en dos pasos activada        │ 09/06/26 · 14:32      │
│    192.168.x.x · Chrome · macOS              │                       │
├──────────────────────────────────────────────┼───────────────────────┤
│ ⏱ Tiempo de inactividad cambiado a 30 min    │ 05/06/26 · 09:11      │
│    10.0.x.x · Safari · iPhone               │                       │
├──────────────────────────────────────────────┼───────────────────────┤
│ 📱 Dispositivo de confianza añadido          │ 01/06/26 · 17:45      │
│    Chrome · Windows · 172.16.x.x             │                       │
├──────────────────────────────────────────────┴───────────────────────┤
│ [← Anterior]   Página 1 de 3 (48 eventos)        [Siguiente →]      │
└──────────────────────────────────────────────────────────────────────┘
```

### Iconos por tipo de evento

```typescript
export const CONFIG_EVENT_ICONS: Record<ConfigEventType, string> = {
  TWO_FA_ENABLED:                '🔐',
  TWO_FA_DISABLED:               '🔓',
  SESSION_TIMEOUT_CHANGED:       '⏱',
  TRUSTED_DEVICE_ADDED:          '📱',
  TRUSTED_DEVICE_REVOKED:        '🚫',
  ALL_TRUSTED_DEVICES_REVOKED:   '🗑',
  NOTIFICATION_PREFS_CHANGED:    '🔔',
  RECOVERY_CODES_REGENERATED:    '🔑',
  ACCOUNT_UNLOCKED:              '✅',
};
```

### Estado vacío

```html
<!-- Cuando isEmpty() === true -->
<div class="config-history__empty" role="status" aria-live="polite">
  <span aria-hidden="true">📋</span>
  <p>No hay cambios de configuración registrados aún.</p>
</div>
```

---

## 6. ConfigHistoryItemComponent (presentacional)

```typescript
@Component({
  selector:   'bp-config-history-item',
  standalone: true,
  template: `
    <tr class="config-history__row">
      <td class="config-history__icon" aria-hidden="true">
        {{ icon() }}
      </td>
      <td class="config-history__description">
        <span class="config-history__event-desc">{{ event().description }}</span>
        <span class="config-history__meta">
          {{ event().ipMasked }}
          @if (event().deviceInfo) { · {{ event().deviceInfo }} }
        </span>
      </td>
      <td class="config-history__date">
        <time [dateTime]="event().occurredAt">
          {{ event().occurredAt | date:'dd/MM/yy · HH:mm' }}
        </time>
      </td>
    </tr>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigHistoryItemComponent {
  event = input.required<ConfigChangeEvent>();
  icon  = computed(() => CONFIG_EVENT_ICONS[this.event().eventType] ?? '⚙');
}
```

---

## 7. SecurityAuditService — extensión

```typescript
// Añadir en security-audit.service.ts:

getConfigHistory(
  page:   number = 0,
  size:   number = 20,
  type?:  ConfigEventType
): Observable<ConfigHistoryPage> {
  const params: Record<string, string> = {
    page: page.toString(),
    size: size.toString(),
  };
  if (type) params['eventType'] = type;

  return this.http.get<ConfigHistoryPage>(
    `${this.base}/config-history`,
    { params }
  );
}
```

**Endpoint backend requerido** (extensión OpenAPI v1.4.0 — añadir al yaml):

```yaml
/api/v1/security/config-history:
  get:
    tags: [audit]
    summary: Historial paginado de cambios de configuración (US-604)
    security:
      - bearerJwtFull: []
    parameters:
      - in: query
        name: eventType
        required: false
        schema: { type: string }
      - in: query
        name: page
        schema: { type: integer, default: 0 }
      - in: query
        name: size
        schema: { type: integer, default: 20, maximum: 50 }
    responses:
      '200':
        description: Página de eventos de configuración ordenados por occurredAt DESC
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ConfigHistoryPage' }
      '401': { $ref: '#/components/responses/Unauthorized' }
      '500': { $ref: '#/components/responses/InternalError' }
```

> **Nota para el Developer:** el backend filtra `audit_log` por `event_category = 'CONFIG_CHANGE'`
> reutilizando `AuditLogRepository` con un predicado JPA adicional — no se requiere tabla nueva.

---

## 8. Integración en SecurityAuditRoutes

```typescript
// security-audit.routes.ts — añadir:
{
  path: 'config-history',
  loadComponent: () =>
    import('./config-history/config-history.component')
      .then(m => m.ConfigHistoryComponent),
  title: 'Historial de Configuración',
},
```

**Acceso desde el Panel de Auditoría** — añadir pestaña en `SecurityDashboardComponent`:

```html
<nav aria-label="Secciones de seguridad">
  <a routerLink="./"               routerLinkActive="active">Panel</a>
  <a routerLink="./export"         routerLinkActive="active">Exportar</a>
  <a routerLink="./config-history" routerLinkActive="active">Configuración</a>
  <a routerLink="./prefs"          routerLinkActive="active">Preferencias</a>
</nav>
```

---

## 9. Accesibilidad WCAG 2.1 AA

| Elemento | Control |
|---|---|
| Tabla de historial | `<table>` semántica con `<caption>` descriptivo |
| Iconos de evento | `aria-hidden="true"` — decorativos; la descripción textual es suficiente |
| Timestamps | `<time [dateTime]="...">` con valor ISO en el atributo |
| Estado de carga | `aria-busy="true"` en el contenedor durante loading |
| Estado vacío | `role="status"` + `aria-live="polite"` |
| Paginación | `<nav aria-label="Paginación del historial">` + botones con `aria-label` |
| Filtro de tipo | `<label>` explícito asociado al `<select>` |

---

## 10. Tests requeridos (DoD Sprint 7)

| Test | Escenarios clave |
|---|---|
| `ConfigHistoryComponent.spec.ts` | carga primera página · paginación prev/next · filtro por tipo resetea a pág 0 · estado vacío · error handling |
| `ConfigHistoryItemComponent.spec.ts` | icono correcto por `eventType` · fecha formateada · `deviceInfo` null oculto |
| `SecurityAuditService.spec.ts` (extensión) | `getConfigHistory()` con y sin filtro `eventType` — params correctos |

---

## 11. Checklist de entrega (antes del gate Tech Lead)

```
□ Interfaces ConfigChangeEvent + ConfigHistoryPage en models/
□ CONFIG_EVENT_ICONS cubre los 9 tipos de ConfigEventType
□ ConfigHistoryComponent — paginación funcional con Signals
□ ConfigHistoryItemComponent — presentacional puro, sin inyección de servicios
□ Estado vacío visible cuando content.length === 0
□ Filtro por tipo resetea paginación a página 0
□ SecurityAuditService.getConfigHistory() implementado
□ Extensión OpenAPI v1.4.0 con /security/config-history añadida al yaml
□ Ruta lazy configurada bajo /security/audit/config-history
□ Pestaña "Configuración" añadida en SecurityDashboardComponent nav
□ WCAG 2.1 AA: tabla semántica + aria-* aplicados
□ 3 specs con escenarios del §10
```

---

*SOFIA Architect Agent · BankPortal · FEAT-006 US-604 · LLD Frontend · 2026-06-09*
*🔒 PROPUESTO — Pendiente aprobación Tech Lead · Gate: ADR-011 + LLD-006 + LLD-007 + este LLD*
