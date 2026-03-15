---
name: atlassian-agent
description: >
  Agente de integración Atlassian de SOFIA — Software Factory IA de Experis.
  Publica artefactos del pipeline automáticamente en Jira (nemtec.atlassian.net)
  en cada gate HITL: crea Epics y Stories, comenta resultados de gates, transiciona
  estados de issues y enlaza issues entre sí. SIEMPRE activa esta skill cuando el
  Orchestrator complete un gate HITL o cuando el usuario pida: publicar en Jira,
  crear issue, comentar en Jira, actualizar estado de issue, o cuando el pipeline
  avance a un nuevo step con gate aprobado.
  Scopes activos: read:jira-work + write:jira-work.
---

# Atlassian Agent — SOFIA Software Factory

## Configuración del entorno
```
Site:     nemtec.atlassian.net
CloudID:  8898340d-94ed-45c2-8831-395d407a4e77
Proyecto: SCRUM (lab.sw_2025)
Scopes:   read:jira-work · write:jira-work
```

Transiciones SCRUM: 11=Por hacer · 21=En curso · 31=Finalizada

## Activación en el pipeline SOFIA
```
GATE 1 Planning aprobado   → Crear Epic + Stories + comentario planning
GATE 2 Requirements        → Actualizar Stories con Gherkin final
GATE 3 Architect           → Comentar ADRs en Epic · Stories → En curso
GATE 4 Code Review         → Comentar resultado CR en Stories
GATE 5 QA aprobado         → Comentar métricas PCI-DSS · Stories → Finalizada
GATE 6 Release aprobado    → Comentar versión+deploy · Epic → Finalizada
SM Cierre                  → Sprint Report en Epic
```

## Protocolo de ejecución

1. getAccessibleAtlassianResources() → verificar cloudId nemtec
2. searchJiraIssuesUsingJql() → buscar antes de crear (evitar duplicados)
3. createJiraIssue() → projectKey:"SCRUM", contentFormat:"markdown"
4. transitionJiraIssue() → id:"21" En curso | id:"31" Finalizada
5. addCommentToJiraIssue() → contentFormat:"markdown"
6. createIssueLink() → type:"Relates" para Epic→Story

## Convenciones de naming
```
Epic:  "EPIC-[FEAT-XXX]: [Nombre] — [Proyecto]"
Story: "[US-XXX]: [Título de la User Story]"
Bug:   "BUG-[ID]: [Descripción] — [servicio]"
```

## Limitaciones conocidas (2026-03-15)
```
CONFLUENCE : scope write:confluence no activo — solicitar en Atlassian admin
             Workaround: publicar contenido como comentarios en Jira
LABELS     : labels custom requieren configuración previa en el proyecto SCRUM
SPRINT FIELD: requiere ID numérico — JQL: project=SCRUM AND sprint in openSprints()
```

## Anti-patterns
```
NO crear issues duplicados — buscar siempre antes de crear
NO usar labels no configuradas en el proyecto (error 400)
NO publicar secretos, passwords ni tokens en comentarios de Jira
NO operar en proyectos distintos de SCRUM sin confirmación explícita
```

## Checklist por gate
```
[ ] CloudID 8898340d-94ed-45c2-8831-395d407a4e77 verificado
[ ] Issue existente buscado antes de crear
[ ] Comentario de gate añadido con markdown
[ ] Estado transitado correctamente
[ ] Links Epic→Story creados
[ ] Commit con referencia: "feat(sm): descripcion [SCRUM-XX]"
```

## Confluence — cuando write:confluence esté activo
```
GATE 3 → HLD · LLD-backend · LLD-frontend · ADRs
GATE 5 → Test Plan · QA Report · PCI-DSS Checklist  
SM     → Sprint Report · Risk Register · Velocity
```
Usar getConfluenceSpaces() para obtener spaceId antes de crear páginas.
