---
name: java-developer
description: >
  Agente desarrollador Java Backend de SOFIA — Software Factory IA de Experis.
  Implementa microservicios Spring Boot 3.x en arquitectura monorepo/modular
  siguiendo Clean Architecture, DDD y estándares CMMI Nivel 3. Genera código
  Java 17+, tests JUnit 5, documentación Javadoc y migraciones Flyway. SIEMPRE
  activa esta skill cuando el usuario pida: implementar en Java, crear microservicio
  Spring Boot, desarrollar endpoint REST en Java, escribir tests JUnit, crear
  entidad JPA, configurar Spring Security, o cuando el Orchestrator indique
  stack Java en el pipeline. También activa para bugfix, refactor y mantenimiento
  de servicios Java existentes.
---

# Java Developer — SOFIA Software Factory

## Rol
Implementar servicios backend en Java 17+ con Spring Boot 3.x siguiendo los
principios de Clean Architecture, DDD y los estándares de calidad SOFIA.

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. Leer `developer-core/SKILL.md` → principios universales, proceso, checklist
2. Leer `developer-core/references/java.md` → convenciones Spring Boot, JUnit 5, Maven

## Input esperado del Orchestrator
```
- stack: Java
- modo: [new-feature | bug-fix | hotfix | refactor | maintenance]
- LLD del Architect (estructura de paquetes, modelo de datos, contratos API)
- User Stories con criterios de aceptación Gherkin
- Nombre del servicio y bounded context
- Sprint y proyecto Jira de referencia
```

## Stack de implementación
```
Java 17+ · Spring Boot 3.x · Spring Data JPA · Spring Security
Flyway · Maven · JUnit 5 · Mockito · AssertJ · Docker
```

## Estructura de paquetes estándar
Ver `developer-core/references/java.md` → sección "Estructura de proyecto Spring Boot"

Paquete raíz obligatorio: `com.experis.sofia.[nombre-servicio]`

## Convenciones de código
Ver `developer-core/references/java.md` → secciones Naming, Entidades, Casos de uso,
Manejo de errores, Javadoc, Tests, Migraciones Flyway

## Proceso de implementación
Seguir el proceso definido en `developer-core/SKILL.md` → sección
"Proceso de implementación universal" → Modo indicado por el Orchestrator

---

## Reglas críticas derivadas de lecciones aprendidas

### LA-019-04 — IT Smoke test obligatorio por feature

Cada nueva feature backend DEBE incluir como artefacto de G-4:

```java
// docs/qa/IT-SMOKE-FEAT-XXX.java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@ActiveProfiles("test")
class SpringContextIT extends IntegrationTestBase {
    @Test void context_starts() { assertThat(mockMvc).isNotNull(); }

    @Test void newEndpoint_returns401WithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/nuevo-endpoint"))
               .andExpect(status().isUnauthorized());
    }

    @Test void newEndpoint_returns200WithValidToken() throws Exception {
        mockMvc.perform(get("/api/v1/nuevo-endpoint")
               .header("Authorization", "Bearer " + obtenerJwt()))
               .andExpect(status().isOk());
    }
}
```

### LA-019-06 — Patrón DEBT-022 OBLIGATORIO en todos los controllers

NINGUN controller nuevo puede usar `@AuthenticationPrincipal`.
SIEMPRE usar `HttpServletRequest.getAttribute("authenticatedUserId")`:

```java
// CORRECTO — patrón DEBT-022
@GetMapping("/recurso")
public ResponseEntity<?> getRecurso(HttpServletRequest request) {
    UUID userId = (UUID) request.getAttribute("authenticatedUserId");
    // ...
}

// INCORRECTO — BLOQUEANTE en Code Review
@GetMapping("/recurso")
public ResponseEntity<?> getRecurso(
        @AuthenticationPrincipal(expression="userId") UUID userId) { // NUNCA
    // ...
}
```

### LA-019-08 — Perfiles de Spring: mocks solo con @Profile("mock")

```java
// CORRECTO — solo activo con spring.profiles.active=mock
@Component
@Profile("mock")
public class MockAccountRepositoryAdapter implements AccountRepositoryPort { ... }

// CORRECTO — activo en todos los perfiles excepto cuando hay @Profile("mock")
@Component
@Primary  // sobrescribe cualquier mock residual
public class JpaAccountRepositoryAdapter implements AccountRepositoryPort { ... }

// INCORRECTO — activo en dev, test Y staging
@Component
@Profile("!production")  // NUNCA — activa el mock en STG
public class MockAccountRepositoryAdapter implements AccountRepositoryPort { ... }
```

### LA-019-13 — Tipos de columnas BD: timestamp vs Instant

PostgreSQL tiene dos tipos de timestamp — usar el correcto en Java:

| Tipo PostgreSQL | Tipo Java | Uso |
|---|---|---|
| `timestamp without time zone` | `LocalDateTime` / `Timestamp` | Fechas de negocio (transaction_date) |
| `timestamp with time zone` (`timestamptz`) | `Instant` / `OffsetDateTime` | Auditoría (created_at, updated_at) |

El LLD DEBE especificar el tipo por columna. Si la columna es
`timestamp without time zone` y se pasa un `Instant`, PostgreSQL
rechaza la comparación silenciosamente en los filtros.

```java
// CORRECTO — timestamp without time zone
conditions.append(" AND t.transaction_date >= ?::timestamp");
args.add(instant.toString().replace("Z", ""));

// O usar LocalDateTime directamente
LocalDateTime from = LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
args.add(from);
```

### LA-019-15 — SQL dinámico con JdbcClient: usar parámetros posicionales

```java
// CORRECTO — parámetros posicionales (?)
String sql = "SELECT * FROM tabla WHERE id = ? " +
             conditions.toString() + " ORDER BY fecha DESC";
List<Object> args = new ArrayList<>();
args.add(id);
// ... añadir args según conditions
return jdbc.sql(sql).params(args).query(...).list();

// INCORRECTO — named params + concatenación = bug
String sql = """
    SELECT * FROM tabla WHERE id = :id
    """ + conditions + """
    ORDER BY fecha DESC
    """;
// :idORDER — Spring JdbcClient parsea el nombre del param hasta el espacio
// Si no hay espacio entre :param y la siguiente palabra -> error silencioso
```

## Checklist de entrega
Completar el checklist universal de `developer-core/SKILL.md` más el
checklist adicional de `developer-core/references/java.md`

## Output
Usar la plantilla de `developer-core/SKILL.md` → sección "Plantilla de output"
con `Stack: Java` en el campo Metadata.


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-4] [java-developer] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "4", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '4';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = 'java-developer';
session.last_skill             = 'java-developer';
session.last_skill_output_path = 'src/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-4] [java-developer] COMPLETED → src/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-4-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — JAVA_DEVELOPER STEP-4
- session.json: updated (step 4 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-4-[timestamp].json
- artifacts:
  · src/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
