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
6. Implementar routing y lazy loading
7. Tests de componentes y hooks
8. Documentación JSDoc en servicios y componentes públicos
```

## Checklist de entrega
Completar el checklist universal de `developer-core/SKILL.md` más el
checklist adicional de `developer-core/references/angular.md`

## Output
Usar la plantilla de `developer-core/SKILL.md` → sección "Plantilla de output"
con `Stack: Angular` en el campo Metadata.
