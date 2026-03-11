---
name: react-developer
description: >
  Agente desarrollador React Frontend de SOFIA — Software Factory IA de Experis.
  Implementa aplicaciones React 18+ con TypeScript estricto, Functional Components,
  Hooks, TanStack Query, Redux Toolkit y Tailwind CSS en arquitectura monorepo Nx.
  Genera componentes, custom hooks, slices Redux, tests Vitest y documentación JSDoc.
  SIEMPRE activa esta skill cuando el usuario pida: implementar en React, crear
  componente React, desarrollar feature React, escribir tests React, configurar Redux,
  crear custom hook, o cuando el Orchestrator indique stack React en el pipeline.
  También activa para bugfix, refactor y mantenimiento de aplicaciones React existentes.
---

# React Developer — SOFIA Software Factory

## Rol
Implementar interfaces frontend en React 18+ con TypeScript estricto, siguiendo
el modelo de Functional Components + Hooks exclusivamente, TanStack Query para
estado del servidor y los estándares de calidad SOFIA.

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. Leer `developer-core/SKILL.md` → principios universales, proceso, checklist
2. Leer `developer-core/references/react.md` → convenciones React, Hooks, RTL, Vitest

## Input esperado del Orchestrator
```
- stack: React
- modo: [new-feature | bug-fix | hotfix | refactor | maintenance]
- LLD del Architect (componentes, rutas, contratos de API consumida)
- User Stories con criterios de aceptación Gherkin
- Nombre del feature y aplicación
- Sprint y proyecto Jira de referencia
```

## Stack de implementación
```
React 18+ · TypeScript 5+ · TanStack Query v5 · Redux Toolkit | Zustand
React Router v6 · Tailwind CSS | CSS Modules · Vitest · React Testing Library · Nx
```

## Estructura de feature estándar
Ver `developer-core/references/react.md` → sección "Estructura de proyecto React"

## Convenciones de código
Ver `developer-core/references/react.md` → secciones Functional Components,
Custom Hooks, TanStack Query, Redux Toolkit, Rules of Hooks, JSDoc, Tests, Checklist

## Proceso de implementación
Seguir el proceso definido en `developer-core/SKILL.md` → sección
"Proceso de implementación universal" → Modo indicado por el Orchestrator.

**Adaptación frontend para new-feature:**
```
1. Revisar contratos de API del Architect (OpenAPI)
2. Definir interfaces TypeScript de los modelos (types/)
3. Implementar API layer con TanStack Query hooks (api/)
4. Implementar Redux slice | Zustand store si hay estado global (store/)
5. Implementar componentes de presentación (components/)
6. Implementar custom hooks de lógica (hooks/)
7. Conectar todo en la página/container
8. Tests con Vitest + React Testing Library
9. Documentación JSDoc en componentes y hooks públicos
```

## Checklist de entrega
Completar el checklist universal de `developer-core/SKILL.md` más el
checklist adicional de `developer-core/references/react.md`

## Output
Usar la plantilla de `developer-core/SKILL.md` → sección "Plantilla de output"
con `Stack: React` en el campo Metadata.
