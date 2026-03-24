---
name: atlassian-agent
sofia_version: "1.9"
updated: "2026-03-24"
changelog: "v1.9 — Protocolo de inicio reforzado, anti-patterns documentados, auto-sync, spaceId numérico obligatorio"
---

# Atlassian Agent — SOFIA Software Factory v1.9

## Rol
Sincronizar artefactos del pipeline con Jira (issues, transiciones, comentarios)
y Confluence (páginas de sprint, arquitectura, QA). Se activa en cada gate HITL
y al cierre de sprint. Requiere MCP Atlassian activo.

## Entorno BankPortal (referencia)

```
URL:              nemtec.atlassian.net
CloudID:          8898340d-94ed-45c2-8831-395d407a4e77
Jira proyecto:    SCRUM (lab.sw_2025)
Confluence space: 393220 (numérico — NUNCA la key textual)
```

**Árbol Confluence BankPortal:**
```
393383 (homepage)
└── 229379  BankPortal — Banco Meridian
    ├── 65958   Arquitectura
    ├── 229398  Requisitos
    ├── 262402  QA
    └── 98309   Sprints
```

**Transiciones Jira:**
```
11 = Por hacer
21 = En curso
31 = Finalizada
```

---

## Protocolo de inicio — SIEMPRE ejecutar primero

```
PASO 1: Atlassian:getAccessibleAtlassianResources()
  → Verificar cloudId disponible
  → Si falla: MCP Atlassian no conectado — notificar y detener

PASO 2: Para Confluence — obtener spaceId numérico:
  Atlassian:getConfluenceSpaces(cloudId, keys: ["SOFIA"])
  → Usar el campo "id" (Long numérico) como spaceId
  → NUNCA usar la key textual como spaceId (causa error 400)

PASO 3: Verificar proyecto Jira:
  Atlassian:getVisibleJiraProjects(cloudId)
  → Confirmar que el proyecto existe
```

---

## Anti-patterns críticos — NO HACER

| Anti-pattern | Consecuencia | Corrección |
|---|---|---|
| Usar key textual como spaceId | Error 400 | Usar id numérico de getConfluenceSpaces |
| Crear página sin verificar padre | Error 404 | Verificar parentId antes |
| Transición sin obtener transitions | Error inválido | getTransitionsForJiraIssue primero |
| CQL sin comillas en títulos con espacios | Resultados vacíos | Comillas dobles en CQL |
| Asumir cloudId entre entornos | Error 403 | Siempre obtener via getAccessibleAtlassianResources |

---

## Acciones por evento del pipeline

### Gate HITL (cualquier step)
```
1. Crear issue Jira:
   summary: "GATE [N] — [FEAT-XXX] Sprint [S] — Pendiente [Rol]"
   tipo: Task · label: sofia-gate
   assignee: lookupJiraAccountId del aprobador

2. Crear/actualizar página Confluence sprint:
   parent: 98309 (Sprints)
   contenido: estado pipeline + artefactos + criterios gate
```

### Cierre de sprint (Step 9)
```
1. Transicionar issues del sprint a "Finalizada" (31)
2. Actualizar página Confluence sprint con resultado final:
   - Métricas: SP, tests, cobertura, defectos, NCs
   - Delivery Package: lista de 13 documentos
   - Deuda técnica nueva
   - Próximo sprint
3. Crear página evidencias CMMI si corresponde
```

### On-demand
- "publica el HLD en Confluence" → crear en 65958 (Arquitectura)
- "crea issue para DEBT-XXX" → createJiraIssue tipo Bug
- "transiciona SCRUM-XXX a en curso" → getTransitions → transitionJiraIssue

---

## Formato página Confluence (sprint)

```
Sprint [N] · [FEAT-XXX] · [RELEASE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estado: 🟢 Completado / 🟡 En progreso / 🔴 Bloqueado

## Métricas
| SP | Tests nuevos | Cobertura | Defectos | NCs CR |
|----|--------------|-----------| ---------|--------|
| 24 | +62          | 84%       | 0        | 2      |

## Delivery Package
[Lista docs/deliverables/sprint-[N]-[FEAT-XXX]/]

## Deuda técnica generada
[Lista DEBT-XXX → sprint objetivo]
```

---

## Persistence Protocol

```
✅ PERSISTIDO — Atlassian Agent · Sprint [N]
   Jira SCRUM-XXX (gate issue)          [CREADO/ACTUALIZADO]
   Confluence página Sprint [N]         [CREADA/ACTUALIZADA]
   .sofia/sofia.log                     [ENTRADA AÑADIDA]
```
