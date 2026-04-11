---
sofia_version: "2.6"
updated: "2026-04-02"
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

## ⛔ GUARDRAILS — Ejecutar ANTES de escribir cualquier fichero Java

Estos checks son BLOQUEANTES. Si fallan, no se escribe código.

### GR-001 — Verificación de paquete raíz (LA-020-09)

```bash
# PASO 1: Leer el paquete raíz REAL desde disco
cat apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/BackendTwoFactorApplication.java | head -1
# → package com.experis.sofia.bankportal.twofa;
# Paquete raíz = com.experis.sofia.bankportal

# PASO 2: Confirmar estructura
ls apps/backend-2fa/src/main/java/
# → Debe mostrar SOLO 'com'
```

**REGLA: TODOS los ficheros nuevos deben empezar con el paquete leído en PASO 1.**
**NUNCA inferir el paquete del nombre del cliente, LLD o memoria.**

### GR-002 — Verificar API Surface antes de usar cualquier clase existente (LA-020-09)

```bash
# Antes de llamar a métodos de una entidad existente, leerla desde disco:
cat apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/Transaction.java
# Métodos REALES: getTransactionDate(), getConcept(), getAmount(), getBalanceAfter(), getType()
# INEXISTENTES: getValueDate(), getDescription(), getBalance(), getCurrency()
#
# Regla: si usas X.getY(), hacer grep "getY" en la clase X antes de escribirlo.
```

### GR-003 — SpringContextIT obligatorio en G-4b (LA-020-11)

```bash
# Verificar que existe:
ls apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/SpringContextIT.java
# Si NO existe → crearlo es el PRIMER artefacto del sprint, antes que cualquier clase de negocio.
# Plantilla: .sofia/skills/java-developer/SKILL.md → sección SpringContextIT
```

### GR-004 — mvn compile antes de declarar G-4b (LA-020-11)

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn compile -q -f apps/backend-2fa/pom.xml
# EXIT 0 obligatorio. Si falla → corregir antes de declarar G-4b.
# Un test unitario que pasa NO equivale a compilación exitosa.
```

---

## Instrucción de inicio obligatoria

**Antes de escribir cualquier línea de código:**
1. **Ejecutar GR-001 a GR-004** (sección anterior) — BLOQUEANTE
2. Leer `developer-core/SKILL.md` → principios universales, proceso, checklist
3. Leer `developer-core/references/java.md` → convenciones Spring Boot, JUnit 5, Maven

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

---

## GUARDRAIL LA-021-02 — IntegrationTestBase: fixtures comunes en la clase base (2026-04-01)

Al crear cualquier IT (Integration Test) que use UUIDs de fixtures de entidades:

```java
// IntegrationTestBase.java — declarar TODOS los UUIDs de fixtures comunes
public abstract class IntegrationTestBase {
    protected static final UUID testUserId    = UUID.fromString("00000000-0000-0000-0000-000000000001");
    protected static final UUID testAccountId = UUID.fromString("00000000-0000-0000-0000-000000000002");
    // Añadir cualquier UUID usado en > 1 IT antes de crear el segundo test que lo usa
}

// Si una clase hija declara el mismo UUID que la base → duplicado silencioso
// Si una clase hija referencia un campo no declarado en la base → error de compilación
// que bloquea mvn test ENTERO
```

**Checklist G-4:** al crear un IT que use UUIDs de fixture, verificar que el campo está en `IntegrationTestBase` antes de compilar.

---

## GUARDRAILS DE TIPO — Lecciones LA-TEST-001..004 (2026-03-31)

### LA-TEST-001 — Atributos JWT en HttpServletRequest
Antes de usar `request.getAttribute(nombre)`, verificar que el nombre coincide exactamente con lo que escribe `JwtAuthenticationFilter`:
- ✅ Correcto: `request.getAttribute("authenticatedUserId")`
- ❌ Incorrecto: `request.getAttribute("userId")`

### LA-TEST-002 — `type` vs `category` en Transaction
| Campo | Valores | Uso |
|---|---|---|
| `type` | `CARGO` / `ABONO` | Dirección financiera |
| `category` | `DOMICILIACION`, `PAGO_TARJETA`, `INGRESO`, `COMISION`, `TRANSFERENCIA_EMITIDA`, `TRANSFERENCIA_RECIBIDA` | Clasificación de negocio |

Nunca filtrar por `category` usando `t.type` ni viceversa.

### LA-TEST-003 — Excepciones de dominio → handler HTTP obligatorio
Toda `RuntimeException` custom debe tener en el mismo PR:
- `@ResponseStatus(HttpStatus.XXX)` en la clase, o
- entrada en `@ControllerAdvice` / `@RestControllerAdvice` con código HTTP explícito

### LA-TEST-004 — Tipos Java para columnas temporales PostgreSQL vía JdbcClient
| Columna PostgreSQL | Tipo Java en params() |
|---|---|
| `TIMESTAMP without time zone` | `Timestamp.from(instant)` o `LocalDateTime` |
| `TIMESTAMPTZ` | `OffsetDateTime` |
| `DATE` | `LocalDate` |

Nunca pasar `Instant` directamente — JdbcClient Spring 6 no lo convierte.


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

### Verificacion Step 3b antes de escribir codigo (LA-022-07)

PRIMER paso antes de crear cualquier fichero Java:
  node -e "const s=JSON.parse(require('fs').readFileSync('.sofia/session.json'));
           if(!s.completed_steps.includes('3b'))
             {console.error('BLOQUEANTE: Step 3b ausente — notificar al Architect');process.exit(1);}
           console.log('Step 3b verificado OK');"

