---
name: angular-developer
description: >
  Agente desarrollador Angular Frontend de SOFIA — Software Factory IA de Experis.
  Implementa aplicaciones Angular 17+ con TypeScript estricto, Standalone Components,
  RxJS, NgRx y Angular Material en arquitectura monorepo Nx. Genera componentes,
  servicios, guards, interceptors, tests Jest y documentación JSDoc. SIEMPRE activa
  esta skill cuando el usuario pida: implementar en Angular, crear componente Angular,
  desarrollar feature Angular, escribir tests Angular, configurar NgRx, crear
  servicio Angular, implementar guard o interceptor, o cuando el Orchestrator indique
  stack Angular en el pipeline. También activa para bugfix, refactor y mantenimiento
  de aplicaciones Angular existentes.
---

# Angular Developer — SOFIA Software Factory

## Rol
Implementar interfaces frontend en Angular 17+ con TypeScript estricto, siguiendo
los principios de Clean Architecture adaptados al frontend, los patrones smart/dumb
components y los estándares de calidad SOFIA.

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. Leer `developer-core/SKILL.md` → principios universales, proceso, checklist
2. Leer `developer-core/references/angular.md` → convenciones Angular, RxJS, Signals, Jest

## Input esperado del Orchestrator
```
- stack: Angular
- modo: [new-feature | bug-fix | hotfix | refactor | maintenance]
- LLD del Architect (componentes, rutas, contratos de API consumida)
- User Stories con criterios de aceptación Gherkin
- Nombre del feature y aplicación
- Sprint y proyecto Jira de referencia
```

## Stack de implementación
```
Angular 17+ · TypeScript 5+ · RxJS 7+ · Angular Signals · NgRx Signal Store
Angular Material | Tailwind · Jest · Angular Testing Library · Nx · ESLint
```

## Estructura de feature estándar
Ver `developer-core/references/angular.md` → sección "Estructura de proyecto Angular"

## Convenciones de código
Ver `developer-core/references/angular.md` → secciones Standalone Components,
Smart/Dumb, Servicios, RxJS, Signals, JSDoc, Tests, Checklist

---

## Reglas críticas derivadas de lecciones aprendidas

### LA-019-05 — Verificar build de producción antes de G-4

El build de producción activa validaciones que el desarrollo local no activa:
- Budget CSS (`anyComponentStyle`)
- `environment.prod.ts` en lugar de `environment.ts`
- TypeScript strict templates
- Errores de tipos en decoradores de componentes

```bash
# OBLIGATORIO antes de cerrar G-4
docker compose build --no-cache frontend
# Si falla -> corregir antes de pasar a G-5
```

### LA-019-09 — environment.prod.ts debe tener los mismos campos que environment.ts

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: '/api/v1',      // campo X
  featureFlag: true       // campo Y
};

// environment.prod.ts — DEBE tener TODOS los mismos campos
export const environment = {
  production: true,
  apiUrl: '',             // mismo nombre, valor diferente
  featureFlag: false      // campo Y presente
  // Si falta un campo -> undefined en prod -> fallo silencioso
};
```

Checklist de G-4:
```
[ ] environment.prod.ts tiene exactamente los mismos campos que environment.ts
[ ] Todos los servicios usan el mismo nombre de campo (apiUrl, no apiBaseUrl)
```

### LA-019-10 — Nuevos módulos DEBEN registrarse en app-routing.module.ts

Cada módulo Angular nuevo DEBE aparecer en el router principal:

```typescript
// app-routing.module.ts — OBLIGATORIO al crear un nuevo módulo
const routes: Routes = [
  {
    path: 'nueva-feature',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/nueva-feature/nueva-feature.module')
        .then(m => m.NuevaFeatureModule)
  }
];
```

Checklist de G-4:
```
[ ] NuevaFeatureModule registrado en app-routing.module.ts
[ ] Ruta accesible navegando a /nueva-feature en STG
[ ] AuthGuard aplicado si la ruta requiere autenticación
```

### LA-019-11 — Componentes de ruta NO usan @Input para parámetros de ruta

```typescript
// INCORRECTO — @Input nunca se popula en componentes de ruta
@Component({ selector: 'app-detalle' })
export class DetalleComponent implements OnInit {
  @Input() itemId!: string; // NUNCA en componente de ruta — siempre undefined
  ngOnInit() { this.load(this.itemId); }
}

// CORRECTO — usar ActivatedRoute con suscripción a paramMap
@Component({ selector: 'app-detalle' })
export class DetalleComponent implements OnInit, OnDestroy {
  private id!: string;
  private destroy$ = new Subject<void>();
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // paramMap emite cada vez que cambia el parámetro de ruta
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.id = params.get('id')!;
      this.resetAndLoad(); // siempre resetear estado antes de cargar
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
```

**Regla:** Si el componente aparece en un array `Routes[]`, sus parámetros
DEBEN leerse de `ActivatedRoute.paramMap`, nunca de `@Input()`.

### LA-019-12 — UUIDs en seeds SQL deben ser hex válidos

UUID válido: solo caracteres `[0-9a-f]` separados por guiones.

```sql
-- CORRECTO — solo hex (0-9, a-f)
'ca000001-0000-0000-0000-000000000001'
'be000001-0000-0000-0000-000000000001'

-- INCORRECTO — 'r', 'f', letras no hex
'card0001-0000-0000-0000-000000000001'  -- 'r' invalido
'benef001-0000-0000-0000-000000000001'  -- letras invalidas
```

Validación antes de ejecutar cualquier seed:
```python
import re, sys
UUID_RE = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
uuids = ['ca000001-0000-0000-0000-000000000001']  # lista de UUIDs del seed
for u in uuids:
    assert re.match(UUID_RE, u), f'UUID invalido: {u}'
```

### LA-019-14 — ChangeDetectionStrategy.OnPush: usar con precaución

```typescript
// USAR OnPush SOLO cuando se garantizan las 3 condiciones:
// 1. Todos los @Input son inmutables (primitivos o referencias nuevas)
// 2. Todos los observables llaman markForCheck() en cada emisión
// 3. No hay cambios de estado interno sin trigger de CD

// SI HAY DUDA: usar la estrategia por defecto (sin OnPush)
@Component({
  selector: 'app-mi-componente',
  // No especificar changeDetection si hay paramMap o estado mutable
  template: `...`
})

// OnPush + paramMap: requiere markForCheck() explícitamente
// Sin él, el componente no se re-renderiza al cambiar la ruta
this.route.paramMap.subscribe(params => {
  this.id = params.get('id')!;
  this.cdr.markForCheck(); // OBLIGATORIO con OnPush
});
```

---

## Proceso de implementación
Seguir el proceso definido en `developer-core/SKILL.md` → sección
"Proceso de implementación universal" → Modo indicado por el Orchestrator.

**Adaptación frontend para new-feature:**
```
1. Revisar contratos de API del Architect (OpenAPI)
2. Definir interfaces TypeScript de los modelos
3. Implementar servicio de API (HttpClient)
4. Implementar store (NgRx Signal Store o NgRx)
5. Implementar componentes: dumb primero, luego smart
6. Implementar routing y lazy loading — registrar en app-routing.module.ts
7. Tests de componentes y hooks
8. Documentación JSDoc en servicios y componentes públicos
9. Verificar build de producción: docker compose build --no-cache frontend
```

## Checklist de entrega
Completar el checklist universal de `developer-core/SKILL.md` más:

```
ANGULAR-ESPECÍFICO (LA-019)
[ ] Módulo registrado en app-routing.module.ts (LA-019-10)
[ ] environment.prod.ts sincronizado con environment.ts (LA-019-09)
[ ] Build producción exitoso: ng build --configuration=production (LA-019-05)
[ ] Componentes de ruta usan ActivatedRoute.paramMap, no @Input (LA-019-11)
[ ] UUIDs en seeds validados con regex hex (LA-019-12)
[ ] OnPush solo si markForCheck() garantizado en todos los observables (LA-019-14)
```

## Output
Usar la plantilla de `developer-core/SKILL.md` → sección "Plantilla de output"
con `Stack: Angular` en el campo Metadata.


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-4] [angular-developer] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "4", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '4';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'angular-developer';
session.last_skill             = 'angular-developer';
session.last_skill_output_path = 'src/';
session.updated_at             = now;
session.status                 = 'completed';
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

const logEntry = `[${now}] [STEP-4] [angular-developer] COMPLETED → src/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

const snapPath = `.sofia/snapshots/step-4-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación

```
---
✅ PERSISTENCE CONFIRMED — ANGULAR_DEVELOPER STEP-4
- session.json: updated (step 4 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-4-[timestamp].json
- artifacts: · src/<artefacto-principal>
---
```
