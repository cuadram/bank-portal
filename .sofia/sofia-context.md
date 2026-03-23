# SOFIA Context — Contexto compartido v1.7
# Este archivo es la fuente canónica del contexto SOFIA.
# El Orchestrator lo inyecta en cada delegación a skills.
# Ningún skill debe replicar este contenido internamente.

---

## Identidad del sistema

**SOFIA** es la Software Factory IA de **Experis**.
Automatiza y orquesta el ciclo de vida completo de entrega de software,
desde planning hasta aceptación del cliente, con gobernanza CMMI Nivel 3.

---

## Stack tecnológico soportado

| Capa | Tecnologías |
|------|------------|
| Backend | Java 17+ (Spring Boot 3.x) · .Net 8 (C#) · Node.js 20+ (NestJS) |
| Frontend | Angular 17+ · React 18+ |
| Arquitectura | Microservicios · Monorepo modular |
| Base de datos | PostgreSQL · MySQL · MongoDB · Redis |
| Mensajería | Kafka · RabbitMQ |
| Contenedores | Docker · Kubernetes (AKS/EKS) |
| CI/CD | Jenkins · GitHub Actions |

---

## Metodología y gobierno

| Aspecto | Valor |
|---------|-------|
| Metodología | Scrumban (sprints + flujo continuo Kanban) |
| Sprint length | 14 días (configurable en sofia-config.json) |
| Gobierno | CMMI Nivel 3 |
| Estimación | Story Points (Fibonacci) |
| Velocidad referencia | 23.875 SP/sprint (BankPortal, 8 sprints) |

---

## Herramientas del ecosistema

| Herramienta | Uso |
|-------------|-----|
| Jira | Backlog, sprints, gates, NCs |
| Confluence | Documentación, artefactos, sprint reviews |
| Microsoft Teams | Notificaciones de gates y eventos |
| Email | Comunicaciones formales con cliente |
| Git | Control de versiones (rama feature/FEAT-XXX) |
| Jenkins | CI/CD pipeline |
| SonarQube | Calidad de código (target: cobertura ≥ 80%) |

---

## Estructura de proyecto

```
[repo]/
├── src/                    ← código fuente
├── docs/
│   ├── architecture/       ← HLD, LLD, ADRs
│   ├── requirements/       ← US, RTM
│   ├── quality/            ← code review, QA reports, dashboard
│   ├── security/           ← security reports
│   ├── deliverables/       ← paquetes cliente por sprint/feature
│   └── backlog/            ← backlog items por feature
├── infra/                  ← IaC, pipelines CI/CD
└── .sofia/
    ├── session.json        ← estado activo del pipeline
    ← sofia.log            ← audit trail
    ├── sofia-config.json   ← configuración del proyecto
    ├── PERSISTENCE_PROTOCOL.md
    ├── sofia-context.md    ← este archivo
    ├── snapshots/          ← backups por step
    ├── gates/              ← estado de gates de aprobación
    ├── sync/               ← prompts Atlassian pendientes
    └── skills/             ← 18 skills SOFIA
```

---

## Pipeline de entrega (9 pasos)

```
[1] Scrum Master          → 🔒 GATE: product-owner
[2] Requirements Analyst  → 🔒 GATE: product-owner
[3] Architect             → 🔒 GATE: tech-lead
[3b] Documentation Agent  (automático, sin gate)
[4] Developer             (sin gate propio)
[5] Code Reviewer         → 🔒 GATE: tech-lead (NCs resueltas)
[5b] Security Agent       → 🔒 GATE BLOQUEANTE: CVEs críticos
[6] QA Tester             → 🔒 GATE: qa-lead + product-owner
[7] DevOps                → 🔒 GATE: release-manager
[8] Documentation Agent   → 🔒 GATE: PM
[9] Workflow Manager      → 🔒 GATE: cliente
```

---

## Tipos de pipeline

| Tipo | Steps activos |
|------|--------------|
| new-feature | 1 → 2 → 3 → 3b → 4 → 5 → 5b → 6 → 7 → 8 → 9 |
| bug-fix | 4 → 5 → 5b → 6 |
| hotfix | 4 → 5 → gate release-manager |
| refactor | 3 → 4 → 5 → 5b → docs |
| tech-debt | 1 → 3 → 4 → 5 → 5b → docs |
| maintenance | 4 → 5 |
| migration | completo + ADR obligatorio |
| documentation | documentation-agent directo |

---

## Estándares de calidad (Definition of Done)

- Cobertura de tests unitarios ≥ 80%
- Zero NCs abiertas tras code review
- Zero CVEs críticos en security scan
- Documentación actualizada en Confluence
- Todos los artefactos registrados en session.json
- Jira US en estado Done
- Gate humano aprobado (donde aplica)

---

## Estilo corporativo Experis (documentos)

- Color primario: `#1B3A6B` (azul Experis)
- Fuente: Arial 11pt
- Formato papel: A4
- Logo: Experis + cliente en portada
- Idioma documentos: Español (excepto código: Inglés)

---

## Convenciones de nomenclatura

| Artefacto | Patrón |
|-----------|--------|
| Features | FEAT-NNN |
| User Stories | US-NNN |
| Sprints | Sprint N |
| Ramas Git | feature/FEAT-NNN-sprint-N-descripcion |
| No Conformidades | NC-[step]-[timestamp4] |
| Deliverables | docs/deliverables/sprint-N-FEAT-NNN/ |
| Snapshots | .sofia/snapshots/step-N-[timestamp].json |
| Gates Jira | [GATE] Sprint N — FEAT-NNN — Step N: nombre |

---

## Instrucción de inyección para el Orchestrator

Al delegar a cualquier skill, incluir al inicio del prompt:

```
## Contexto SOFIA (leer de .sofia/sofia-context.md)
- Proyecto: [project_name de sofia-config.json]
- Cliente: [client de sofia-config.json]
- Stack: [stack de sofia-config.json]
- Sprint: [sprint de session.json]
- Feature: [feature de session.json]
- Metodología: Scrumban | Gobierno: CMMI L3
- Herramientas: Jira + Confluence + Jenkins + Teams

[contenido específico de la delegación]

## Persistence Protocol (obligatorio)
Antes de retornar, actualizar session.json y sofia.log
según .sofia/PERSISTENCE_PROTOCOL.md e incluir
el bloque ✅ PERSISTENCE CONFIRMED.
```
