# ADR-042 · Contrato OpenAPI 3.1 generado por springdoc-openapi 2.3

| Campo | Valor |
|---|---|
| **ID** | ADR-042 |
| **Status** | ACCEPTED |
| **Date** | 2026-04-27 |
| **Sprint** | 26 |
| **Feature** | FEAT-024 - Objetivos de Ahorro |
| **Author** | Architect Agent · SOFIA v2.7 |
| **Approvers** | Tech Lead (G-3) |
| **Related** | RNF-F024-06, RNF-F024-07, DEBT-048, DEBT-049, DEBT-050, GR-SMOKE-001, LA-CORE-064 |

## Contexto

LA-CORE-064 (LA-025-13 promovida) instaura el guardrail GR-SMOKE-001:
"pre-gate G-7 debe validar que toda URL absoluta del smoke test corresponde
a un handler @RequestMapping existente en los controllers del proyecto".

La validacion automatizada de GR-SMOKE-001 requiere una **fuente de verdad
maquina-legible** del contrato API que pueda ser comparada con los checks del
smoke test. Las opciones son:
- Parsear anotaciones Spring desde el classpath (fragil, requiere reflexion).
- Mantener un OpenAPI YAML escrito a mano (deriva inevitable con el codigo).
- **Generar el OpenAPI desde anotaciones via springdoc** (esta ADR).

RNF-F024-06 ya exige OpenAPI 3.1 auto-generado. RNF-F024-07 exige cobertura
retroactiva de todos los endpoints pre-FEAT-024. DEBT-048 (SCRUM-171) es la
tarea de implementacion.

## Decision

**Adoptar springdoc-openapi 2.3.0 como motor de generacion del contrato OpenAPI 3.1**.

Componentes:
- Dependencia Maven: springdoc-openapi-starter-webmvc-ui:2.3.0
- Endpoint expuesto: GET /v3/api-docs (JSON) + GET /swagger-ui.html (UI dev only).
- Anotaciones por controller: @Operation, @ApiResponse, @Parameter, @Tag.
- Configuracion centralizada: OpenApiConfig en config/ con @OpenAPIDefinition
  declarando info, servers, security schemes (Bearer JWT).
- Dump a disco: el pipeline DevOps (Step 7) ejecuta
  curl http://localhost:8080/v3/api-docs.yaml > docs/api/openapi-v1.26.0.yaml
  como parte del smoke test pre-G-7.

Cobertura:
- **FEAT-024 nativa**: SavingsController anotado completamente desde Step 4.
- **Retroactiva (RNF-F024-07)**: SCRUM-171 (DEBT-048) cubre los controllers
  existentes (Auth, Account, Transaction, Bizum, Deposit, Pfm, etc.).
  Estimado 4 SP. Se ejecuta en paralelo con FEAT-024.

## Habilitacion de GR-SMOKE-001

DEBT-049 (SCRUM-172) crea el script .sofia/scripts/validate-smoke-vs-openapi.js
que cruza los endpoints declarados en docs/api/openapi-v1.26.0.yaml contra las
URLs del smoke test infra/compose/smoke-test-v1.26.0.sh.

DEBT-050 (SCRUM-173) actualiza .sofia/skills/devops/SKILL.md para invocar
validate-smoke-vs-openapi.js como check obligatorio pre-G-7.

Cadena de habilitacion:
ADR-042 -> springdoc en pom -> /v3/api-docs operativo -> dump YAML -> 
validate-smoke-vs-openapi.js -> GR-SMOKE-001 activo -> bloqueo de G-7 si drift.

## Consecuencias

### Positivas
- **Sin deriva controlador<->contrato**: el YAML se regenera en cada build,
  imposible que diverja del codigo.
- **DX mejorada**: swagger-ui en local acelera el desarrollo frontend (Step 4).
- **Cumplimiento RNF-F024-06/07** sin esfuerzo manual recurrente.
- **Habilita GR-SMOKE-001 sin parsing fragil de Spring annotations**.

### Negativas / mitigaciones
- **Anadir 1 dependencia + 23 anotaciones existentes a re-decorar**:
  ~4 SP one-shot.
  -> Mitigacion: SCRUM-171 ya planificado y aprobado en G-1 Sprint 26.
- **swagger-ui expuesto en produccion seria un leak de superficie API**.
  -> Mitigacion: deshabilitar swagger-ui en perfil prod via property
     springdoc.swagger-ui.enabled=false (solo dev/staging).
     /v3/api-docs queda accesible solo desde la red interna del cluster.
- **springdoc 2.x requiere Spring Boot 3.x** (compatible, ya estamos en 3.x).

### Neutrales
- El YAML versionado en docs/api/ pasa a ser artefacto auditable CMMI L3
  (Process Area TS - Technical Solution).

## Alternativas rechazadas

### Alt-1: OpenAPI YAML escrito a mano + validador @Path
Mantener el YAML como source-of-truth y validarlo en CI contra los controllers.
- **Rechazada**: alto coste de mantenimiento, deriva inevitable, doble fuente
  de verdad. springdoc invierte la dependencia y elimina el problema.

### Alt-2: Spring REST Docs
Genera contrato a partir de tests de integracion.
- **Rechazada**: requiere re-escribir tests para cubrir todos los endpoints
  con MockMvc. Coste estimado >10 SP retroactivos. Desproporcionado.

### Alt-3: GraphQL Schema
Migrar a GraphQL para tener un schema explicito.
- **Rechazada**: cambio de paradigma, no alineado con FEAT-024 ni con la
  arquitectura REST consolidada de BankPortal.

## Implementacion - handoff Step 4 / Step 7

Step 4 (Developer):
- Anadir springdoc-openapi-starter-webmvc-ui:2.3.0 al pom.xml.
- Crear config/OpenApiConfig.java con @OpenAPIDefinition.
- Decorar SavingsController con @Tag, @Operation, @ApiResponse, @Parameter.
- DEBT-048 (SCRUM-171): decorar controllers retroactivos.

Step 7 (DevOps):
- Anadir al smoke test: curl /v3/api-docs.yaml > docs/api/openapi-v1.26.0.yaml.
- Anadir al pipeline pre-G-7: node .sofia/scripts/validate-smoke-vs-openapi.js
  (DEBT-049 SCRUM-172, DEBT-050 SCRUM-173).

## Referencias
- LA-CORE-064 / GR-SMOKE-001 - guardrail que esta ADR habilita.
- DEBT-048/049/050 - tareas tecnicas asociadas.
- RNF-F024-06, RNF-F024-07 - requisitos no funcionales que cubre.
