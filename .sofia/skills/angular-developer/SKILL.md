---
name: angular-developer
sofia_version: "2.4"
version: "2.1"
updated: "2026-04-01"
changelog: |
  v2.1 (2026-04-01) — LA-STG-001/002/003 incorporadas post-verificacion STG v1.21.0.
    - LA-STG-001: forkJoin + catchError EMPTY = deadlock silencioso → usar of([])
    - LA-STG-002: version string hardcodeada en template prohibida → usar environment.ts
    - LA-STG-003: verificar endpoint backend existe antes de forkJoin multi-llamada
  v2.0 (2026-04-01) — LA-FRONT-001..005 incorporadas (Sprint 21 FEAT-019).
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

### ⚡ LA-STG-001 [v2.1] — forkJoin + catchError: NUNCA retornar EMPTY

**Detectado en:** Verificación STG v1.21.0 — Mi Perfil skeleton infinito (BUG-VER-001)

`forkJoin` requiere que TODOS sus observables emitan al menos un valor antes de emitir.
Si cualquier observable completa sin emitir (como `EMPTY`), `forkJoin` NUNCA emite.
Resultado: componente bloqueado en skeleton eterno, sin error visible.

```typescript
// ❌ INCORRECTO — EMPTY en forkJoin = deadlock silencioso
getNotifications(): Observable<NotificationPreference[]> {
  return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
    catchError(err => { console.error(err); return EMPTY; }) // DEADLOCK si API falla
  );
}

// ✅ CORRECTO — of([]) emite array vacío → forkJoin puede completar
getNotifications(): Observable<NotificationPreference[]> {
  return this.http.get<NotificationPreference[]>(`${this.base}/notifications`).pipe(
    catchError(err => { console.error(err); return of([]); }) // forkJoin recibe []
  );
}

// ✅ ALTERNATIVA — forkJoin con defaultIfEmpty explícito
forkJoin({
  profile:       this.profileSvc.getProfile(),
  notifications: this.profileSvc.getNotifications().pipe(defaultIfEmpty([])),
  sessions:      this.profileSvc.getSessions().pipe(defaultIfEmpty([]))
})
```

**REGLA PERMANENTE:** En servicios cuyos métodos se usan en `forkJoin`:
- `catchError` DEBE retornar `of(valorDefecto)` donde `valorDefecto` es el tipo correcto vacío:
  - Array → `of([])`
  - Objeto → `of(null)` o `of({} as T)`
  - `EMPTY` solo es válido si el observable NO participa en `forkJoin`/`combineLatest`/`zip`

**Verificación obligatoria en G-4:**
```bash
# Buscar EMPTY en catchError de servicios que se consumen en forkJoin
node -e "
const fs = require('fs'), path = require('path');
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.service.ts') || f.endsWith('.component.ts')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('forkJoin') || c.includes('return EMPTY')) {
        console.log('REVISAR:', p);
        // Verificar que EMPTY no sea el catchError de un observable en forkJoin
      }
    }
  });
}
walk('src');
"
```

---

### ⚡ LA-STG-002 [v2.1] — Versión/Sprint NUNCA hardcodeados en templates

**Detectado en:** Verificación STG v1.21.0 — Footer Login muestra Sprint 13 v1.13.0 (BUG-VER-002)

Hardcodear versiones en templates Angular produce deuda acumulativa: cada sprint
el texto queda obsoleto y genera desconfianza en el usuario del portal.

```typescript
// ❌ INCORRECTO — hardcoded en template (queda obsoleto en cada sprint)
template: `
  <small>🔧 Entorno STG · Sprint 13 · v1.13.0</small>
`

// ✅ CORRECTO — leer de environment.ts (actualizado automáticamente)
// environment.ts
export const environment = {
  production: false,
  version: '1.21.0',
  sprint: 21,
  envLabel: 'STG'
};

// component.ts
import { environment } from '../../../environments/environment';
readonly version = environment.version;
readonly sprint  = environment.sprint;
readonly env     = environment.envLabel;

// template
template: `
  <small>🔧 Entorno {{ env }} · Sprint {{ sprint }} · v{{ version }}</small>
`
```

**REGLA PERMANENTE:**
- Cualquier cadena de versión, sprint o entorno en template DEBE interpolarse desde `environment.ts`
- `environment.ts` y `environment.prod.ts` DEBEN tener campos `version`, `sprint`, `envLabel`
- El Developer Agent actualiza estos campos en CADA sprint al inicio del Step 4

**Verificación obligatoria en G-4:**
```bash
# Buscar versiones hardcodeadas (patrón v\d+\.\d+\.\d+ o Sprint \d+ en templates)
node -e "
const fs = require('fs'), path = require('path');
const HARDCODED = /v\d+\.\d+\.\d+|Sprint \d+/g;
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.component.ts') || f.endsWith('.html')) {
      const c = fs.readFileSync(p, 'utf8');
      const matches = c.match(HARDCODED);
      if (matches) console.log('HARDCODED VERSION en', p, ':', matches);
    }
  });
}
walk('src');
"
```

---

### ⚡ LA-STG-003 [v2.1] — Verificar existencia de endpoints antes de forkJoin multi-llamada

**Detectado en:** Verificación STG v1.21.0 — /profile/notifications y /profile/sessions devuelven 404 (DEBT-043)

Cuando un componente llama a múltiples endpoints en `forkJoin`, TODOS deben estar
implementados. Un endpoint 404 + `catchError → EMPTY` = componente en blanco silencioso.

```typescript
// PROCESO OBLIGATORIO antes de implementar un servicio multi-endpoint:
// 1. Verificar en la OpenAPI/LLD que TODOS los endpoints están implementados en backend
// 2. Si alguno NO está implementado → registrar DEBT-XXX + implementar stub en backend
//    O usar catchError → of(valorDefecto) como workaround temporal explícito

// Verificación en STG antes de G-4b:
const token = localStorage.getItem('access_token');
const endpoints = [
  '/api/v1/profile',
  '/api/v1/profile/notifications',  // ← verificar que devuelve 200, no 404
  '/api/v1/profile/sessions'         // ← verificar que devuelve 200, no 404
];
// Todos deben devolver 2xx para que forkJoin funcione correctamente
```

**REGLA PERMANENTE:**
- El Developer Agent DEBE listar en el PR description todos los endpoints que consume el componente
- El Code Reviewer DEBE verificar que cada endpoint listado existe en `@RequestMapping` del backend
- Si un endpoint no existe → BLOQUEANTE para G-5 (Code Review)

**Verificación cruzada frontend↔backend obligatoria en G-5:**
```bash
# Extraer endpoints consumidos en services Angular
node -e "
const fs = require('fs'), path = require('path');
const API_CALL = /this\.http\.(get|post|patch|put|delete)<[^>]*>\(\`?(\/api\/v1\/[^'\`\s,)]+)/g;
function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.service.ts')) {
      const c = fs.readFileSync(p, 'utf8');
      let m; while ((m = API_CALL.exec(c)) !== null)
        console.log(m[1].toUpperCase(), m[2], '->', p);
    }
  });
}
walk('apps/frontend-portal/src');
"
# Resultado: lista de GET/POST/PATCH /api/v1/... que deben existir en backend
# Verificar manualmente contra @RequestMapping en controllers Java
```

---

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
  apiUrl: '/api/v1',
  version: '1.21.0',   // ← NUEVO campo obligatorio desde v2.1
  sprint: 21,           // ← NUEVO campo obligatorio desde v2.1
  envLabel: 'STG'       // ← NUEVO campo obligatorio desde v2.1
};

// environment.prod.ts — DEBE tener TODOS los mismos campos
export const environment = {
  production: true,
  apiUrl: '',
  version: '1.21.0',
  sprint: 21,
  envLabel: 'PRD'
};
```

### LA-019-10 — Nuevos módulos DEBEN registrarse en app-routing.module.ts

```typescript
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

### LA-019-11 — Componentes de ruta NO usan @Input para parámetros

```typescript
// CORRECTO — usar ActivatedRoute con suscripción a paramMap
this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
  this.id = params.get('id')!;
  this.resetAndLoad();
});
```

### LA-019-12 — UUIDs en seeds SQL deben ser hex válidos

```sql
-- CORRECTO: solo [0-9a-f]
'ca000001-0000-0000-0000-000000000001'
-- INCORRECTO: 'r', 'g' u otras letras no hex
'card0001-0000-0000-0000-000000000001'
```

### LA-019-14 — ChangeDetectionStrategy.OnPush: usar con precaución

```typescript
// OnPush + paramMap: requiere markForCheck() explícitamente
this.route.paramMap.subscribe(params => {
  this.id = params.get('id')!;
  this.cdr.markForCheck(); // OBLIGATORIO con OnPush
});
```

### LA-FRONT-001 — Módulo Angular nuevo: ruta + nav item obligatorios en el mismo step

```typescript
// AL CREAR cualquier módulo en features/ → en el MISMO step:
// 1. app-routing.module.ts: añadir ruta lazy con AuthGuard
// 2. shell.component.ts: añadir nav item con label, route, icon
```

### LA-FRONT-002 — Placeholder prohibido si existe endpoint backend

```typescript
// ANTES de crear placeholder → verificar si GET /api/v1/[feature] existe
// Si existe → implementar componente funcional (NUNCA placeholder a Docker prod)
```

### LA-FRONT-003 — Import paths en componentes anidados

```typescript
// Componente en features/X/components/Y/ → servicio en features/X/services/
// CORRECTO: import from '../../services/x.service' (2 niveles)
// INCORRECTO: import from '../services/x.service'   (1 nivel — falla en build)
```

### LA-FRONT-004 — Ruta Angular solo si existe endpoint backend

```typescript
// Si NO existe endpoint real → comentar ruta + DEBT-XXX
// Página en blanco silenciosa es peor que 404
```

### LA-FRONT-005 — Docker compose build obligatorio en cualquier cambio Angular

```bash
docker compose build --no-cache frontend && docker compose up -d --no-deps frontend
# docker compose up sin build → sirve imagen anterior (bug silencioso)
```

---

## Proceso de implementación

Seguir el proceso definido en `developer-core/SKILL.md` → sección
"Proceso de implementación universal" → Modo indicado por el Orchestrator.

**Adaptación frontend para new-feature:**
```
1. Revisar contratos de API del Architect (OpenAPI)
2. Verificar que TODOS los endpoints existen en backend (LA-STG-003)
3. Actualizar environment.ts + environment.prod.ts con version/sprint/envLabel (LA-STG-002)
4. Definir interfaces TypeScript de los modelos
5. Implementar servicio de API (HttpClient) — catchError → of([]) en forkJoin (LA-STG-001)
6. Implementar store (NgRx Signal Store o NgRx)
7. Implementar componentes: dumb primero, luego smart
8. Implementar routing y lazy loading — registrar en app-routing.module.ts
9. Tests de componentes y hooks
10. Documentación JSDoc en servicios y componentes públicos
11. Verificar build de producción: docker compose build --no-cache frontend
```

---

## Checklist de entrega G-4

```
RXJS / API
[ ] forkJoin: catchError retorna of(valorDefecto) NUNCA EMPTY (LA-STG-001) ← NUEVO v2.1
[ ] TODOS los endpoints consumidos en forkJoin existen en backend (LA-STG-003) ← NUEVO v2.1

VERSIONING
[ ] environment.ts y environment.prod.ts tienen version, sprint, envLabel (LA-STG-002) ← NUEVO v2.1
[ ] Templates usan interpolación {{ version }} en lugar de string hardcodeado (LA-STG-002) ← NUEVO v2.1
[ ] environment.prod.ts sincronizado con environment.ts (LA-019-09)

ROUTING Y MÓDULOS
[ ] Módulo registrado en app-routing.module.ts (LA-019-10 / LA-FRONT-001)
[ ] Nav item añadido en shell.component.ts (LA-FRONT-001)
[ ] Endpoint backend verificado antes de registrar ruta (LA-FRONT-004)
[ ] Sin placeholders si existe endpoint real (LA-FRONT-002)

CÓDIGO
[ ] Import paths calculados desde ubicación real del fichero (LA-FRONT-003)
[ ] Componentes de ruta usan ActivatedRoute.paramMap, no @Input (LA-019-11)
[ ] UUIDs en seeds validados con regex hex (LA-019-12)
[ ] OnPush solo si markForCheck() garantizado en todos los observables (LA-019-14)

BUILD
[ ] docker compose build --no-cache frontend exitoso (LA-019-05 / LA-FRONT-005)
```

## Checklist de Code Review G-5 (verificaciones cruzadas)

```
[ ] Listar todos los endpoints consumidos por nuevos services (LA-STG-003)
[ ] Verificar que cada endpoint existe en @RequestMapping del backend
[ ] Buscar EMPTY en catchError de observables en forkJoin (LA-STG-001)
[ ] Verificar interpolación de versión — no strings hardcodeados (LA-STG-002)
[ ] Script de detección: node .sofia/scripts/stg-pre-check.js (si existe)
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
