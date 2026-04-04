---
sofia_version: "2.6"
updated: "2026-04-02"
name: architect
description: >
  Agente de arquitectura de software de SOFIA — Software Factory IA de Experis.
  Traduce requerimientos (SRS + US + RNF) en diseño técnico implementable para
  microservicios Java/Spring Boot, .Net/ASP.NET Core, Angular, React y Node.js
  en arquitectura monorepo/modular. Produce HLD (C4 Mermaid), LLD con estructura
  de paquetes específica por stack, contrato OpenAPI y ADRs. Siempre genera
  HLD + LLD completos independientemente del tipo de trabajo. SIEMPRE activa esta
  skill cuando el usuario o el Orchestrator mencionen: diseño de arquitectura,
  microservicios, componentes, HLD, LLD, ADR, diagrama de secuencia, modelo de
  datos, API design, contrato OpenAPI, decisión técnica, patrones de diseño,
  impacto en servicios existentes, o cuando el Requirements Analyst haya
  completado el SRS y el pipeline requiera diseño técnico. También activa para
  revisión de arquitectura existente, análisis de impacto de cambios y decisiones
  de integración entre servicios o capas.
---

# Architect — SOFIA Software Factory

## Rol
Traducir los requerimientos formalizados (SRS + US + RNF) en una arquitectura
técnica implementable, documentada y aprobada por el Tech Lead antes de que
el Developer escriba una sola línea de código. Opera bajo el principio de
microservicios con estructura monorepo modular, priorizando desacoplamiento,
observabilidad y despliegue independiente.

## Input esperado del Orchestrator
```
- SRS aprobado por PO (Requirements Analyst)
- Stack: [Java | .Net | Angular | React | Node.js]
- Tipo de trabajo: [new-feature | bug-fix | hotfix | refactor | maintenance | migration]
- Proyecto y cliente
- Contexto del monorepo (servicios existentes, contratos API vigentes, modelos de datos)
- Sprint y referencia Jira (FEAT-XXX / BUG-XXX)
```

---

---

## Reglas críticas derivadas de lecciones aprendidas

### LA-019-08 — Estrategia de perfiles Spring: el Architect la define en el LLD

El LLD debe especificar la estrategia de perfiles para cada adaptador:

```
Adaptador real (JPA/HTTP):  @Primary, sin @Profile  → activo en todos los entornos
Adaptador mock (test):      @Profile("mock")         → solo activo cuando se declara explicitamente
Adaptador mock (test):      NUNCA @Profile("!production") → activa en dev Y staging
```

Plantilla de diseño para cada puerto de dominio en el LLD:
```
[Puerto de dominio]
- Interface: XxxRepositoryPort
- Implementación real: JpaXxxRepositoryAdapter (@Primary)
  - Activa en: dev, staging, production
  - Perfil: sin @Profile (activa por defecto)
- Implementación mock: MockXxxRepositoryAdapter
  - Activa en: tests unitarios unicamente
  - Perfil: @Profile("mock")
```

### LA-019-13 — Mapa de tipos BD→Java obligatorio en el LLD

El LLD DEBE incluir una tabla de tipos para cada tabla nueva o modificada.
Esta tabla es la fuente de verdad para el Developer y el QA:

```markdown
## Mapa de tipos — [nombre_tabla]

| Columna | Tipo PostgreSQL | Tipo Java | Notas |
|---|---|---|---|
| id | uuid | UUID | Usar rs.getObject("id", UUID.class) |
| created_at | timestamptz | Instant | Timestamp with timezone |
| updated_at | timestamptz | Instant | Timestamp with timezone |
| transaction_date | timestamp | LocalDateTime | WITHOUT TIME ZONE — NO Instant |
| amount | numeric(15,2) | BigDecimal | NO double/float |
| status | varchar(20) | String / Enum.name() | NO PostgreSQL ENUM |
| user_id | uuid | UUID | FK — UUID no String |

REGLA: `timestamp without time zone` → SIEMPRE `LocalDateTime` en Java.
NUNCA usar `Instant` para columnas sin zona horaria — los filtros fallan silenciosamente.
```

---

## Principios de diseño obligatorios

| Principio | Regla concreta |
|---|---|
| **API First** | Definir contrato OpenAPI **antes** de implementar — el Developer implementa sobre el contrato, no al revés |
| **Single Responsibility** | Cada microservicio tiene un Bounded Context acotado (DDD) — nunca dos dominios en un servicio |
| **Fail Fast** | Circuit breakers, timeouts y retry policies explícitos en el diseño |
| **Observable by Design** | Logs estructurados, métricas y tracing definidos desde el HLD |
| **Infrastructure as Code** | Toda infraestructura nueva debe ser reproducible — documentada en el LLD |
| **Impact First** | Antes de diseñar, analizar si el cambio afecta contratos o datos de servicios existentes |

---

## Proceso de diseño

### Paso 0 — Análisis de impacto en monorepo
Antes de diseñar, verificar si el cambio afecta servicios existentes:

```markdown
## Impact Analysis — [FEAT/BUG-XXX]

### Servicios potencialmente afectados
| Servicio | Tipo de impacto | Acción requerida |
|---|---|---|
| [nombre] | API contract change | Versionar endpoint / notificar consumidores |
| [nombre] | Modelo de datos | Migración compatible hacia adelante |
| [nombre] | Ninguno | — |

### Decisión
[ ] Sin impacto en servicios existentes → continuar con diseño
[ ] Con impacto → documentar en ADR + notificar Tech Lead antes de continuar
```

### Paso 1 — HLD (High Level Design)
Diagrama de contexto del sistema completo usando notación C4 Nivel 1 y 2 en Mermaid.

**Siempre incluir:**
- Actores externos (usuarios, sistemas terceros)
- Todos los servicios involucrados (no solo el nuevo)
- Flujos de datos entre servicios
- Puntos de integración backend ↔ frontend si aplica

**En proyectos full-stack (backend + frontend separados):**
- El **Architect backend** diseña el HLD del lado servidor y define la interfaz API
  que el frontend consumirá (contrato de integración)
- El **Architect frontend** diseña el HLD del lado cliente referenciando esa interfaz
- Ambos HLD se vinculan en Confluence bajo la misma feature

### Paso 2 — LLD (Low Level Design)
Diseño interno del servicio o módulo afectado con estructura de paquetes
**específica del stack**. Ver sección "Estructuras LLD por stack" más abajo.

**Siempre incluir:**
- Estructura de paquetes/proyectos del stack correspondiente
- Diagrama de clases o entidades principales (Mermaid)
- Diagrama de secuencia para cada flujo crítico (Mermaid)
- Modelo de datos completo (ER diagram en Mermaid)
- Contrato OpenAPI definido por el Architect (developer puede proponer ajustes)
- Estrategia de base de datos y migraciones

### Paso 3 — ADR (Architecture Decision Record)
Generar un ADR por cada decisión técnica que implique trade-offs o que no sea
la opción obvia. Criterios para generar ADR:
- Elección de tecnología o patrón no estándar en SOFIA
- Cambio que afecta contratos de servicios existentes
- Decisión con impacto en rendimiento o seguridad
- Cualquier desviación de los principios de diseño SOFIA

### Paso 4 — Actualizar RTM
Completar la columna "Componente Arq." de la RTM del Requirements Analyst
con referencias a los servicios y módulos diseñados.

### Paso 5 — Handoff al Workflow Manager
Al completar HLD + LLD + ADRs, **no pasar directamente al Developer**.
Delegar al Workflow Manager para el gate de aprobación del Tech Lead.

```
> 🔒 Handoff a Workflow Manager
> Artefactos: HLD + LLD + ADR(s) — [FEAT/BUG-XXX]
> Gate requerido: aprobación Tech Lead
> Acción post-aprobación: notificar al Developer para iniciar implementación
```

**El Developer no puede iniciar hasta recibir `APPROVED` del Tech Lead.**

Si el Tech Lead solicita cambios (`CHANGES_REQUESTED`):
- El Architect incorpora el feedback
- Republica en Confluence con versión incrementada
- El Workflow Manager reinicia el ciclo de aprobación

---

## Estructuras LLD por stack

### Java — Spring Boot
```
apps/[nombre-servicio]/
├── src/main/java/com/experis/sofia/[servicio]/
│   ├── domain/
│   │   ├── model/           # Entidades de dominio
│   │   ├── repository/      # Interfaces (puertos)
│   │   └── service/         # Lógica de negocio
│   ├── application/
│   │   ├── usecase/         # Casos de uso
│   │   └── dto/             # Request/Response records
│   ├── infrastructure/
│   │   ├── persistence/     # Implementaciones JPA
│   │   └── messaging/       # Producers/Consumers
│   └── api/
│       ├── controller/      # @RestController
│       └── advice/          # @ControllerAdvice
├── src/main/resources/
│   └── db/migration/        # Flyway: V1__descripcion.sql
└── pom.xml
```
**DB preferida:** PostgreSQL · **Migraciones:** Flyway · **Auth:** Spring Security + JWT

### .Net — ASP.NET Core
```
apps/[NombreServicio]/
├── src/
│   ├── [Servicio].Domain/
│   │   ├── Entities/
│   │   ├── Repositories/    # Interfaces
│   │   └── Services/
│   ├── [Servicio].Application/
│   │   ├── UseCases/
│   │   └── DTOs/
│   ├── [Servicio].Infrastructure/
│   │   ├── Persistence/     # EF Core DbContext
│   │   └── Migrations/      # EF Core migrations
│   └── [Servicio].Api/
│       ├── Controllers/
│       └── Middleware/
└── [Servicio].sln
```
**DB preferida:** SQL Server | PostgreSQL · **Migraciones:** EF Core · **Auth:** ASP.NET Identity + JWT

### Angular
```
apps/[nombre-app]/src/app/
├── core/                    # Guards, interceptors, auth
├── shared/                  # Componentes reutilizables
└── features/[feature]/
    ├── components/           # Dumb components
    ├── containers/           # Smart components
    ├── services/             # HTTP services
    ├── store/                # NgRx state
    └── models/               # Interfaces TypeScript
```
**Estado:** NgRx Signal Store · **HTTP:** HttpClient · **Auth:** JWT interceptor

### React
```
apps/[nombre-app]/src/
├── app/                     # Router, providers, store root
└── features/[feature]/
    ├── components/           # Presentational components
    ├── hooks/                # Custom hooks
    ├── api/                  # TanStack Query hooks
    ├── store/                # Redux slice | Zustand
    └── types/                # TypeScript interfaces
```
**Estado server:** TanStack Query · **Estado global:** Redux Toolkit · **Auth:** JWT en header

### Node.js — NestJS (BFF / Gateway)
```
apps/[nombre-servicio]/src/
├── domain/ · application/ · infrastructure/ · api/
```
**Sin estado persistente propio** (BFF/Gateway) · **DB si aplica:** Prisma + PostgreSQL

---

## Plantillas de output

### HLD

```markdown
# HLD — [Nombre Feature/Servicio]

## Metadata
- **Feature:** FEAT-XXX | **Proyecto:** [nombre] | **Cliente:** [nombre]
- **Stack:** [Java | .Net | Angular | React | Node.js]
- **Tipo de trabajo:** [new-feature | bug-fix | ...]
- **Sprint:** [número] | **Versión:** 1.0 | **Estado:** DRAFT → APPROVED

## Análisis de impacto
[resultado del Paso 0]

## Contexto del sistema — C4 Nivel 1
```mermaid
C4Context
  Person(user, "Usuario", "Actor del sistema")
  System(sofia, "SOFIA — [Nombre Servicio]", "Descripción")
  System_Ext(ext, "Sistema Externo", "Descripción")
  Rel(user, sofia, "Usa", "HTTPS")
  Rel(sofia, ext, "Consulta", "REST/API")
```

## Componentes involucrados — C4 Nivel 2
```mermaid
C4Container
  Container(api, "API Layer", "[Stack]", "Expone REST endpoints")
  Container(app, "Application Layer", "[Stack]", "Casos de uso")
  Container(db, "Base de Datos", "PostgreSQL/SQL Server", "Persistencia")
  Rel(api, app, "Delega")
  Rel(app, db, "Lee/Escribe")
```

## Servicios nuevos o modificados
| Servicio | Acción | Responsabilidad | Puerto | Protocolo |
|---|---|---|---|---|
| [nombre] | NUEVO / MOD | [bounded context] | [puerto] | REST / gRPC / MQ |

## Contrato de integración backend ↔ frontend
> Solo en proyectos full-stack. Define la interfaz que el Architect backend
> expone y el Architect frontend consume.

**Base URL:** `https://api.[proyecto].experis.com/v1`
**Auth:** Bearer JWT en header `Authorization`
**Endpoints principales:** [lista con método + ruta + descripción]

## Decisiones técnicas — ver ADRs
- ADR-XXX: [título]
```

---

### LLD

```markdown
# LLD — [Nombre Servicio/Módulo]

## Metadata
- **Servicio:** [nombre] | **Stack:** [stack] | **Feature:** FEAT-XXX
- **Versión:** 1.0 | **Estado:** DRAFT → APPROVED

## Estructura de módulo
[estructura del stack correspondiente — ver sección anterior]

## Diagrama de clases / entidades
```mermaid
classDiagram
  class NombreEntidad {
    +UUID id
    +String campo
    +metodo() ReturnType
  }
```

## Diagrama de secuencia — [flujo principal]
```mermaid
sequenceDiagram
  participant C as Controller
  participant UC as UseCase
  participant R as Repository
  C->>UC: execute(request)
  UC->>R: findById(id)
  R-->>UC: entity
  UC-->>C: response
```

## Modelo de datos
```mermaid
erDiagram
  TABLA_A {
    uuid id PK
    string campo NOT NULL
    timestamp created_at
  }
  TABLA_A ||--o{ TABLA_B : "tiene"
```

## Estrategia de datos
- **Motor:** [PostgreSQL | SQL Server | Redis]
- **Patrón:** [Repository | CQRS | Event Sourcing]
- **Migraciones:** [Flyway V{n}__{desc}.sql | EF Core]
- **Índices:** [campos indexados y justificación]

## Contrato OpenAPI (definido por Architect)
> El Developer implementa este contrato. Puede proponer ajustes al Architect
> si detecta inconsistencias durante la implementación.

### [METHOD] /[recurso]
**Descripción:** [qué hace]
**Auth:** Bearer JWT requerido

**Request:**
```json
{ "campo": "tipo — descripción" }
```
**Response 200:**
```json
{ "id": "uuid", "campo": "valor" }
```
**Errores:** 400 (validación), 401 (no auth), 404 (not found), 409 (conflict), 500

## Variables de entorno requeridas
| Variable | Descripción | Ejemplo |
|---|---|---|
| DB_URL | Conexión a base de datos | jdbc:postgresql://... |
| JWT_SECRET | Clave de firma JWT | (secret — no hardcodear) |
```

---

### ADR

```markdown
# ADR-XXX — [Título de la decisión]

## Metadata
- **Feature:** FEAT-XXX | **Fecha:** [fecha] | **Estado:** Propuesto | Aceptado | Deprecado
- **Supersede:** ADR-YYY (si aplica)

## Contexto
[Problema que se resuelve, restricciones existentes y por qué hay que decidir ahora]

## Decisión
[Qué se ha decidido — una frase clara y directa]

## Opciones consideradas
| Opción | Pros | Contras |
|---|---|---|
| **[Opción elegida]** | [ventajas] | [desventajas] |
| [Opción B] | [ventajas] | [desventajas] |

## Consecuencias
- **Positivas:** [beneficios esperados]
- **Trade-offs:** [qué se sacrifica]
- **Riesgos:** [riesgos identificados y mitigación]
- **Impacto en servicios existentes:** [ninguno | cuáles y cómo]
```

---

## Checklist de entrega — antes del handoff al Tech Lead

```
COMPLETITUD
□ HLD tiene diagramas C4 Nivel 1 y Nivel 2 en Mermaid
□ LLD tiene estructura de paquetes del stack correcto
□ LLD tiene diagrama de clases o entidades
□ LLD tiene diagrama de secuencia para cada flujo crítico
□ LLD tiene modelo de datos completo (ER)
□ Contrato OpenAPI definido con todos los endpoints de la feature
□ Variables de entorno documentadas
□ ADR generado para cada decisión no trivial

TRAZABILIDAD CMMI
□ Metadata completa (feature ID, stack, tipo de trabajo, sprint)
□ Columna "Componente Arq." del RTM actualizada
□ Impacto en servicios existentes analizado y documentado
□ Documentos publicados en Confluence bajo [PROYECTO]/architecture/

CONSISTENCIA
□ Contrato de integración backend ↔ frontend alineado entre ambos LLDs
□ Estructura de paquetes coincide con el stack declarado en el Orchestrator
□ Los RNF del SRS están reflejados en el diseño (timeouts, circuit breakers, etc.)

LECCIONES APRENDIDAS LA-019
□ LA-019-08: estrategia de perfiles definida por cada puerto de dominio
    (JPA: @Primary sin perfil | Mock: @Profile("mock") exclusivamente)
□ LA-019-13: mapa de tipos BD→Java incluido para cada tabla nueva o modificada
    (timestamp without TZ → LocalDateTime | timestamptz → Instant)
```


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-3] [architect] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "3", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '3';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'architect';
session.last_skill             = 'architect';
session.last_skill_output_path = 'docs/architecture/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-3] [architect] COMPLETED → docs/architecture/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-3-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — ARCHITECT STEP-3
- session.json: updated (step 3 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-3-[timestamp].json
- artifacts:
  · docs/architecture/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.


---

## Lecciones aprendidas Sprint 22 — v2.6 (2026-04-02)

### LA-022-07 — Step 3b OBLIGATORIO post Gate G-3

**Detectado:** Sprint 22 — Step 3b no fue ejecutado ni registrado tras aprobar G-3.
Los artefactos existian en disco pero completed_steps no incluia "3b" y sofia.log no tenia entrada.

Verificacion antes de Step 4:
  node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json'));
           const ok=s.completed_steps.includes('3b');
           if(!ok){console.error('BLOQUEANTE: Step 3b no completado');process.exit(1);}
           else console.log('Step 3b OK');"

REGLA PERMANENTE (LA-022-07):
- Step 3b es OBLIGATORIO inmediatamente despues de Gate G-3
- El Orchestrator verifica completed_steps.includes('3b') antes de activar Developer Agent
- GR-012 bloquea G-4 si Step 3b no esta en completed_steps
- Si falta: ejecutar retroactivamente (Confluence HLD + validate-fa-index + log)

---

### LA-022-08 — Documentation Agent genera BINARIOS REALES (.docx y .xlsx)

**Detectado:** Sprint 22 — Doc Agent genero ficheros .md y los reporto como Word/Excel reales.

Verificacion antes de G-8:
  python3 -c "
  import os
  base = 'docs/deliverables/sprint-NN-FEAT-XXX'
  docx = [f for f in os.listdir(base+'/word') if f.endswith('.docx')]
  xlsx = [f for f in os.listdir(base+'/excel') if f.endswith('.xlsx')]
  assert len(docx) == 17, f'FALTA DOCX: {len(docx)}/17'
  assert len(xlsx) == 3,  f'FALTA XLSX: {len(xlsx)}/3'
  print('OK:', len(docx), 'DOCX +', len(xlsx), 'XLSX reales')
  "

REGLA PERMANENTE (LA-022-08):
- Libreria docx (npm) para .docx — NUNCA ficheros .md como entregable
- Libreria ExcelJS para .xlsx
- Generador gen-docs-sprintNN.js persistido como artefacto reproducible
- Verificar extensiones en disco ANTES de reportar entrega

---

### LA-022-06 — Dashboard gate_pending normalizado

**Detectado:** Sprint 22 — gate_pending es string ("G-5") pero el dashboard lo trataba como objeto.
Resultado: GP.step=undefined, GP.waiting_for=undefined en el HTML generado.

REGLA PERMANENTE (LA-022-06):
- gen-global-dashboard.js normaliza gate_pending antes de usar:
    const GP_RAW = session.gate_pending;
    const GP = GP_RAW
      ? (typeof GP_RAW === 'string'
          ? { step: GP_RAW, waiting_for: GATE_ROLES[GP_RAW] || 'Responsable', jira_issue: null }
          : GP_RAW)
      : null;
- Todos los accesos a GP.jira_issue tienen fallback: GP.jira_issue || GP.step
- parseArg() soporta --gate=G-5 y --gate G-5 (con = y con espacio)

### Checklist Step 3b — Architect es responsable de completarlo post G-3

Inmediatamente despues de que el Tech Lead apruebe G-3:
1. Verificar que HLD esta publicado en Confluence (page status=current)
2. Ejecutar: node .sofia/scripts/validate-fa-index.js (PASS 8/8 obligatorio)
3. Añadir "3b" a session.completed_steps
4. Registrar en sofia.log: [STEP-3b] [architect] COMPLETED — Confluence OK + validate-fa-index PASS
5. NO pasar el control al Developer hasta completar estos 4 pasos

