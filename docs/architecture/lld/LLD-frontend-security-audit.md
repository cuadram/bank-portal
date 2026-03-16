# LLD — Frontend: Panel de Auditoría de Seguridad

## Metadata

| Campo | Valor |
|---|---|
| **Documento** | LLD-frontend-security-audit |
| **Feature** | FEAT-005 — Panel de Auditoría |
| **Sprint** | 6 |
| **Autor** | SOFIA Architect Agent |
| **Fecha** | 2026-05-26 |
| **Versión** | 1.0.0 |
| **Framework** | Angular 17 — Standalone + Signals |
| **Relacionado** | LLD-backend-security-audit.md |

---

## 1. Estructura de archivos

```
apps/frontend-portal/src/app/features/security-audit/
├── security-dashboard.component.ts    ← US-401 — dashboard resumen
├── security-export.component.ts       ← US-402 — exportación PDF/CSV
├── security-preferences.component.ts  ← US-403 — preferencias unificadas
├── security-audit.service.ts          ← HTTP client para los 4 endpoints
└── security-audit.routes.ts           ← lazy routes: /security/audit
```

---

## 2. SecurityDashboardComponent (US-401)

### Estructura visual

```
┌──────────────────────────────────────────────────┐
│ Estado de seguridad: [●SEGURA | ⚠REVISAR | 🔴ALERTA]│
├────────┬────────┬──────────────┬──────────────────┤
│Logins  │Sesiones│Dispositivos  │Notificaciones    │
│30d: 42 │activas:│de confianza: │sin leer:         │
│        │ 2      │ 3            │ 1                │
├────────┴────────┴──────────────┴──────────────────┤
│ Gráfico de actividad diaria (barras, 30 días)      │
├────────────────────────────────────────────────────┤
│ Actividad reciente (últimos 10 eventos)            │
│ ● Login nuevo dispositivo · Chrome Windows · hace 2h│
│ ● Sesión cerrada remotamente · hace 1 día          │
└────────────────────────────────────────────────────┘
```

### Estado local (Signals)

```typescript
summary  = signal<SecurityDashboardResponse | null>(null);
loading  = signal(false);
error    = signal<string | null>(null);

// Computed
securityScoreColor = computed(() => {
  switch (summary()?.securityScore) {
    case 'SECURE': return 'var(--color-text-success)';
    case 'REVIEW': return 'var(--color-text-warning)';
    case 'ALERT':  return 'var(--color-text-danger)';
    default: return 'var(--color-text-secondary)';
  }
});
```

### Gráfico de actividad

Usando Chart.js (disponible en el proyecto) — gráfico de barras simple:
- Eje X: últimos 30 días (formato DD/MM)
- Eje Y: número de eventos
- Color: `var(--color-background-info)` para barras

No usar librerías adicionales — Chart.js ya está en el proyecto.

---

## 3. SecurityExportComponent (US-402)

### Flujo UX

```
Usuario selecciona:
  ○ PDF   ○ CSV
  Período: [30 días ▼] / [60 días] / [90 días]

[Exportar historial]
  → loading spinner
  → HTTP GET /api/v1/security/export?format=pdf&days=30
      Si 204: mostrar mensaje "No hay eventos en el período seleccionado"
      Si 200: trigger descarga automática del archivo
  → success: "Archivo descargado correctamente"
```

### Descarga automática del archivo

```typescript
async export(format: 'pdf' | 'csv', days: number): Promise<void> {
  this.loading.set(true);
  try {
    const response = await firstValueFrom(
      this.auditService.exportHistory(format, days)
    );
    if (response.status === 204) {
      this.message.set('No hay eventos en el período seleccionado.');
      return;
    }
    // Trigger descarga desde Blob
    const blob = response.body!;
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `seguridad-${format}-${days}d-${new Date().toISOString().slice(0,10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    this.message.set('Archivo descargado correctamente.');
  } catch {
    this.error.set('Error al generar la exportación. Inténtalo de nuevo.');
  } finally {
    this.loading.set(false);
  }
}
```

**HTTP Service — observeResponse para capturar status 204:**
```typescript
exportHistory(format: string, days: number): Observable<HttpResponse<Blob>> {
  return this.http.get(`/api/v1/security/export`, {
    params: { format, days: days.toString() },
    responseType: 'blob',
    observe: 'response',
  });
}
```

---

## 4. SecurityPreferencesComponent (US-403)

### Estructura visual — secciones colapsables

```
▼ Verificación en dos pasos (2FA)
  Estado: ✅ Activo | ⚠️ Inactivo → [Activar 2FA]

▼ Tiempo de inactividad
  [selector 15 / 30 / 60 min] — guarda automáticamente al cambiar

▼ Dispositivos de confianza
  3 dispositivos registrados · [Gestionar →]

▼ Notificaciones de seguridad
  ☑ Nuevo acceso desde dispositivo desconocido
  ☑ Sesión cerrada remotamente
  ☑ Verificación en dos pasos desactivada
  ☐ Acceso desde dispositivo de confianza
  [Guardar preferencias]
```

### Estado local (Signals)

```typescript
preferences  = signal<SecurityPreferencesResponse | null>(null);
saving       = signal(false);
saveSuccess  = signal(false);

// Formulario reactivo para notificationsByType
notifPrefsForm = new FormGroup({ /* un FormControl por SecurityEventType */ });
```

### R-F5-003 — separación visible vs audit_log

La UI muestra claramente el disclaimer:
```html
<p class="preferences__disclaimer">
  Desactivar un tipo de notificación solo afecta a los mensajes visibles en este panel.
  Los registros de auditoría de seguridad se mantienen siempre activos por requisitos legales.
</p>
```

---

## 5. SecurityAuditService

```typescript
@Injectable({ providedIn: 'root' })
export class SecurityAuditService {
  private readonly base = '/api/v1/security';

  getDashboard(): Observable<SecurityDashboardResponse> {
    return this.http.get<SecurityDashboardResponse>(`${this.base}/dashboard`);
  }

  exportHistory(format: string, days: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.base}/export`, {
      params: { format, days: days.toString() },
      responseType: 'blob', observe: 'response',
    });
  }

  getPreferences(): Observable<SecurityPreferencesResponse> {
    return this.http.get<SecurityPreferencesResponse>(`${this.base}/preferences`);
  }

  updatePreferences(req: UpdateSecurityPreferencesRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/preferences`, req);
  }
}
```

---

## 6. Rutas lazy

```typescript
export const SECURITY_AUDIT_ROUTES: Routes = [
  { path: '',        component: SecurityDashboardComponent,    title: 'Panel de Seguridad' },
  { path: 'export',  component: SecurityExportComponent,       title: 'Exportar Historial' },
  { path: 'prefs',   component: SecurityPreferencesComponent,  title: 'Preferencias de Seguridad' },
];
// Montadas bajo /security/audit/*
```

---

## 7. Accesibilidad WCAG 2.1 AA

| Elemento | Control |
|---|---|
| Tarjetas KPI | `role="region"` + `aria-label` con el nombre del KPI |
| Estado de seguridad | `role="status"` + color no es el único indicador (también texto) |
| Gráfico de actividad | `role="img"` + `aria-label="Gráfico de actividad de los últimos 30 días"` |
| Botón exportar | `aria-busy` durante la descarga |
| Checkboxes preferencias | `aria-describedby` apuntando al disclaimer R-F5-003 |
| Secciones colapsables | `aria-expanded` + `aria-controls` |

---

## 8. Tests requeridos (DoD Sprint 6)

| Test | Tipo | Escenarios |
|---|---|---|
| `SecurityDashboardComponent.spec.ts` | Unit | carga KPIs + score color + gráfico presente |
| `SecurityExportComponent.spec.ts` | Unit | trigger descarga · 204 → mensaje · error handling |
| `SecurityPreferencesComponent.spec.ts` | Unit | carga preferencias · guarda · disclaimer visible |
| `SecurityAuditService.spec.ts` | Unit | 4 métodos HTTP con mocks |

---

*SOFIA Architect Agent · BankPortal · FEAT-005 · LLD Frontend · 2026-05-26 (ACT-22)*
