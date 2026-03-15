---
name: atlassian-agent
description: >
  Agente de integración Atlassian de SOFIA — Software Factory IA de Experis.
  Publica artefactos del pipeline en Jira y Confluence (nemtec.atlassian.net)
  en cada gate HITL. Activa cuando el Orchestrator complete un gate o el usuario
  pida: publicar en Jira/Confluence, crear issue/página, comentar, transicionar
  estado, o cuando el pipeline avance con gate aprobado.
---

# Atlassian Agent — SOFIA Software Factory

## Entorno
```
CloudID:  8898340d-94ed-45c2-8831-395d407a4e77
Jira:     SCRUM (lab.sw_2025) · read:jira-work · write:jira-work
Confluence spaceId: 393220 (SOFIA) · write:page · read:page · search
```

**Árbol Confluence:**
```
393383 (homepage)
├── 229379  BankPortal — Banco Meridian
│   ├── 65958   Arquitectura
│   │   └── 262421  HLD — FEAT-001 2FA TOTP
│   ├── 229398  Requisitos
│   ├── 262402  QA
│   └── 98309   Sprints
└── 196831  SOFIA v1.2
```

**Transiciones Jira:** 11=Por hacer · 21=En curso · 31=Finalizada

## Activación por gate
```
GATE 1  → Jira: Epic + Stories + comentario planning
GATE 2  → Jira: Stories actualizadas · Confluence: SRS (parentId: 229398)
GATE 3  → Jira: comentario ADRs · Stories→En curso
          Confluence: HLD (parentId: 65958) · LLD-backend · LLD-frontend
GATE 4  → Jira: comentario CR en Stories
GATE 5  → Jira: comentario QA + PCI-DSS · Stories→Finalizada
          Confluence: QA Report (parentId: 262402)
GATE 6  → Jira: comentario release · Epic→Finalizada
SM Cierre → Jira: Sprint Report en Epic
            Confluence: Sprint Report (parentId: 98309)
```

## Reglas críticas

- spaceId SIEMPRE numérico: "393220" — nunca "SOFIA" (error 400)
- Buscar antes de crear (no duplicados)
- contentFormat: "markdown" en Jira y Confluence
- Sin secretos/passwords en comentarios ni páginas
- parentId correcto según árbol de páginas

## Checklist
```
[ ] CloudID 8898340d-94ed-45c2-8831-395d407a4e77 verificado
[ ] spaceId "393220" (numérico) para Confluence
[ ] parentId correcto según árbol
[ ] Issue/página existente buscada antes de crear
[ ] Comentario de gate con markdown añadido
[ ] Estado Jira transitado
[ ] URLs informadas al usuario
[ ] Commit: "feat(tipo): desc [SCRUM-XX]"
```
