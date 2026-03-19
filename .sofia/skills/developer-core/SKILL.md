---
name: developer-core
description: >
  Base compartida de todos los agentes desarrolladores de SOFIA — Software Factory
  IA de Experis. Define los principios universales de implementación: Clean
  Architecture, DDD, SOLID, OWASP, convenciones Git, protocolo hotfix, y gestión
  de deuda técnica en Jira. NO se usa directamente — es la base que leen los
  agentes java-developer, dotnet-developer, angular-developer, react-developer y
  nodejs-developer antes de implementar. SIEMPRE consultar este core cuando se
  implementa código en cualquier stack de SOFIA.
---

# Developer Core — SOFIA Software Factory

## Propósito
Este documento define los principios y protocolos que aplican a TODOS los agentes
desarrolladores de SOFIA, independientemente del stack. Cada agente especializado
DEBE leer este core antes de generar código y aplicar sus reglas sin excepción.

Para convenciones específicas de cada stack, leer el reference file correspondiente:
- Java + Spring Boot → leer `references/java.md`
- .Net + ASP.NET Core → leer `references/dotnet.md`
- Angular → leer `references/angular.md`
- React → leer `references/react.md`
- Node.js → leer `references/nodejs.md`

---

## Detección de modo de trabajo

Lo primero que hace el agente es identificar el modo recibido del Orchestrator:

| Modo | Comportamiento |
|---|---|
| `new-feature` | Scaffolding completo → dominio → casos de uso → infraestructura → API → tests |
| `bug-fix` | Entender código existente → identificar causa raíz → mínimo cambio necesario → test de regresión |
| `hotfix` | Rama `hotfix/PROD-XXX` → fix quirúrgico → test mínimo → documentar causa → PR urgente |
| `refactor` | Sin cambio funcional → mejorar estructura → cobertura de tests antes de refactorizar |
| `maintenance` | Revisar impacto antes de tocar → cambio conservador → no introducir deuda nueva |
| `tech-debt` | Documentar estado actual → implementar mejora → validar que no rompe contratos |

---

## Arquitectura obligatoria: Clean Architecture + DDD

Todos los microservicios de SOFIA siguen esta estructura de capas sin excepción:

```
┌─────────────────────────────────┐
│           API Layer             │  Controllers, endpoints, serialización
├─────────────────────────────────┤
│       Application Layer         │  Casos de uso, DTOs, orquestación
├─────────────────────────────────┤
│         Domain Layer            │  Entidades, value objects, interfaces
├─────────────────────────────────┤
│      Infrastructure Layer       │  DB, HTTP, messaging, implementaciones
└─────────────────────────────────┘
```

### Reglas de dependencia (nunca violar)
- Las dependencias SOLO apuntan hacia adentro (API → App → Domain ← Infra)
- Domain NO conoce frameworks, ORM, ni detalles de infraestructura
- Los controllers NO tienen lógica de negocio — solo delegan a casos de uso
- Los repositorios en Domain son interfaces (puertos); las implementaciones van en Infrastructure

### Bounded Contexts
Cada microservicio debe tener un Bounded Context claramente definido en su README.
Si un microservicio necesita datos de otro, usa:
1. Llamada a API (HTTP/REST) con circuit breaker
2. Evento de dominio (mensajería asíncrona)
Nunca acceso directo a la base de datos de otro servicio.

---

## Principios SOLID — aplicación obligatoria

| Principio | Regla concreta en SOFIA |
|---|---|
| **S** — Single Responsibility | Una clase = una razón para cambiar. Máx. 200 líneas por clase |
| **O** — Open/Closed | Extender por herencia/composición, no modificar clases existentes |
| **L** — Liskov | Los subtipos deben sustituir a sus tipos base sin romper comportamiento |
| **I** — Interface Segregation | Interfaces pequeñas y específicas; nunca forzar implementar métodos no usados |
| **D** — Dependency Inversion | Depender de abstracciones (interfaces), nunca de implementaciones concretas |

---

## Estándares de seguridad OWASP — obligatorios en todo código

### Top prioridades para SOFIA

```
RIESGO                    REGLA OBLIGATORIA
─────────────────────────────────────────────────────────────────
Injection (SQL/NoSQL)     Usar ORM/prepared statements, NUNCA concatenar queries
Broken Auth               JWT con expiración corta + refresh token; no almacenar en localStorage
Sensitive Data            Cifrar en reposo y en tránsito; nunca loguear datos sensibles
XXE / XSS                 Sanitizar y validar todos los inputs antes de procesarlos
Security Misconfiguration No exponer stack traces; configurar CORS explícitamente
Vulnerable Dependencies   Revisar CVEs antes de agregar dependencia; usar versiones LTS
Insufficient Logging      Loguear eventos de seguridad (login fail, acceso denegado)
```

### Validación de inputs — regla universal
Todo input externo (request body, query params, path params, headers) debe:
1. Ser validado en la capa API (tipo, formato, longitud máxima)
2. Ser sanitizado antes de llegar al dominio
3. Fallar rápido con error descriptivo al cliente (sin exponer internos)

---

## Convenciones Git — SOFIA estándar

### Naming de ramas
```
feature/US-XXX-descripcion-corta       → nueva funcionalidad
fix/BUG-XXX-descripcion-corta          → corrección de defecto
hotfix/PROD-XXX-descripcion-corta      → fix urgente en producción
refactor/TECH-XXX-descripcion-corta    → refactor técnico
release/v1.2.0                         → rama de release
```

### Formato de commit (Conventional Commits)
```
<tipo>(<scope>): <descripción en imperativo, minúscula>

feat(user-service): add email verification flow
fix(payment): handle null card expiry date
refactor(auth): extract token validation to middleware
test(order): add edge cases for zero-quantity items
docs(api): update OpenAPI spec for /orders endpoint
chore(deps): upgrade spring-boot to 3.2.1
```

### Reglas de PR
- Máximo 400 líneas modificadas por PR (si supera, dividir)
- Todo PR referencia el ticket Jira: `Resolves: US-XXX`
- No mergear sin al menos 1 aprobación del Code Reviewer

---

## Proceso de implementación universal

### Modo new-feature
```
1. Leer LLD del Architect → entender estructura esperada
2. Leer User Stories → entender criterios de aceptación
3. Scaffolding → crear estructura de directorios
4. Domain first → entidades, value objects, interfaces de repositorio
5. Casos de uso → un archivo por caso de uso, método execute()
6. Infrastructure → implementaciones de repositorios, clientes HTTP, mensajería
7. API → controllers, validators, middlewares
8. Tests → unit (AAA pattern), integration donde aplique
9. Documentación → inline + README actualizado
10. Self-review checklist → antes de marcar como listo para Code Reviewer
```

### Modo bug-fix / hotfix
```
1. Reproducir el bug con un test que falle
2. Identificar causa raíz (no solo síntoma)
3. Implementar fix mínimo y quirúrgico
4. Verificar que el test ahora pasa
5. Revisar si hay casos similares en el mismo componente
6. Documentar causa raíz en el commit message
```

### Modo refactor
```
1. PRIMERO escribir tests que cubran el comportamiento actual
2. Verificar que todos pasan (baseline verde)
3. Refactorizar en pasos pequeños
4. Verificar que todos los tests siguen en verde después de cada paso
5. No introducir cambio funcional — si algo cambia, es un bug
```

---

## Tests — estándares universales

### Cobertura mínima obligatoria
- Código nuevo: **≥ 80%** líneas y branches
- Código modificado (fix/refactor): **≥ 80%** del componente modificado
- Hotfix: mínimo test que reproduce y verifica el fix

### Patrón AAA (obligatorio)
```
// Arrange — preparar datos de entrada y mocks
// Act — ejecutar la unidad bajo prueba
// Assert — verificar resultado esperado
```

### Qué testear obligatoriamente
- Happy path de cada caso de uso
- Error path: inputs inválidos, entidad no encontrada, error de infraestructura
- Edge cases: valores nulos, límites, concurrencia si aplica
- Nunca testear implementación interna — testear comportamiento observable

### Qué NO testear
- Getters/setters triviales
- Métodos de terceros (frameworks, librerías) — son responsabilidad de sus autores
- Configuración de infraestructura

---

## Gestión de deuda técnica → Jira

Cuando durante la implementación se identifique deuda técnica:

**En el código:**
```
// TODO(TECH-DEBT): [descripción clara del problema]
// Impacto: Alto | Medio | Bajo
// Ticket: DEBT-XXX
```

**En Jira:** crear issue con:
- Type: `Tech Debt`
- Label: `tech-debt`, `[componente afectado]`
- Priority: según impacto
- Linked to: US o feature origen

**Regla:** nunca resolver deuda técnica dentro de una tarea de feature sin
informar al Scrum Master — puede afectar la estimación del sprint.

---

## Self-review checklist — antes de enviar a Code Reviewer

```
ARQUITECTURA
□ Las dependencias fluyen en la dirección correcta (API→App→Domain←Infra)
□ No hay lógica de negocio en controllers ni en infraestructura
□ No hay acceso directo a DB de otro microservicio

CÓDIGO
□ Ninguna función supera 20 líneas
□ No hay código duplicado (DRY)
□ No hay console.log / print de debug
□ No hay credenciales o secrets hardcodeados
□ Todos los inputs externos están validados

TESTS
□ Cobertura ≥ 80% en código nuevo
□ Happy path, error path y edge case cubiertos
□ Tests son independientes entre sí

DOCUMENTACIÓN
□ Todos los métodos públicos documentados (Javadoc / XML doc / JSDoc)
□ README actualizado si aplica
□ Variables de entorno nuevas documentadas

GIT
□ Rama con naming correcto (feature/US-XXX-...)
□ Commits en formato Conventional Commits
□ PR referencia el ticket Jira
□ PR ≤ 400 líneas modificadas
```

---

## Patrones de seguridad validados en producción SOFIA

Estos patrones surgieron del dry run FEAT-001 (BankPortal). Aplicar siempre
en los stacks indicados.

### Patrón 1 — Secreto temporal en cache server-side (Java/Node.js)

Cuando un flujo de N pasos necesita pasar un valor sensible entre el paso 1 y el paso 2,
nunca debe viajar en un request del cliente. Almacenar en cache con TTL.

```java
// ANTI-PATTERN: recibir el secreto del cliente en un header
@RequestHeader("X-Secret-Value") String secret  // NUNCA

// CORRECTO: cache server-side con TTL (Caffeine / Redis)
private final Cache<UUID, String> pendingCache = Caffeine.newBuilder()
    .expireAfterWrite(5, TimeUnit.MINUTES).maximumSize(1000).build();

// Paso 1: almacenar en cache
pendingCache.put(userId, sensitiveValue);

// Paso 2: recuperar e invalidar
String value = Optional.ofNullable(pendingCache.getIfPresent(userId))
    .map(v -> { pendingCache.invalidate(userId); return v; })
    .orElseThrow(() -> new IllegalStateException("Sesión expirada"));
```

**Deuda técnica escalonada:** para multi-réplica, migrar el cache a Redis (Bucket4j + Lettuce).
Registrar como DEBT con impacto MEDIO antes de escalar horizontalmente.

---

### Patrón 2 — Inmutabilidad de tablas de auditoría en PostgreSQL

PCI-DSS y regulaciones similares exigen que los logs de auditoría sean inmutables.
Doble protección: REVOKE de permisos + trigger PostgreSQL.

```sql
-- Revocar permisos al usuario de aplicación
REVOKE UPDATE, DELETE ON audit_log FROM app_user;

-- Trigger como segunda barrera (cubre acceso de superusuario accidental)
CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS TRIGGER AS $
BEGIN
  RAISE EXCEPTION 'audit_log is immutable — no UPDATE or DELETE allowed';
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
```

**Test obligatorio en QA:** ejecutar `DELETE FROM audit_log LIMIT 1` como el usuario
de aplicación y verificar que falla con `permission denied`. Documentar en el QA Report.

---

### Patrón 3 — JWT en dos fases para flujos multi-paso (Java/Node.js/.Net)

Cuando un flujo requiere N verificaciones antes de emitir una sesión completa,
usar tokens con scope limitado entre cada paso.

```
PASO 1: usuario + contraseña → JWT parcial (scope: "step1-complete", TTL: 5 min)
PASO 2: segundo factor (OTP, SMS, biometría) → JWT completo (scope: "full-session", TTL: 8h)
```

Reglas:
- El JWT parcial da acceso SOLO al endpoint del paso 2 — ningun otro endpoint
- El JWT completo se emite SOLO tras verificar el paso 2 exitosamente
- TTL del parcial: máximo 5 minutos (ventana de ataque mínima)
- Algoritmo: RS256 con keypair RSA-2048 en producción (nunca HS256)
- Generar keypair: `openssl genrsa -out jwt-private.pem 2048`

```java
// Verificar scope del JWT antes de procesar
String scope = jwt.getClaim("scope").asString();
if (!"step1-complete".equals(scope))
    throw new UnauthorizedException("Token scope incorrecto para esta operación");
```

---

### Patrón 4 — Rate limiting escalable (Java/Node.js)

Implementar en dos fases para no bloquear el sprint inicial:

**Fase 1 (Sprint inicial):** Caffeine cache in-process — simple, sin dependencias
```java
// Documentar la limitación con TODO
// TODO(TECH-DEBT): multi-réplica requiere migrar a Bucket4j + Redis — DEBT-XXX
private final Cache<String, AtomicInteger> failures = Caffeine.newBuilder()
    .expireAfterWrite(blockMinutes, TimeUnit.MINUTES).build();
```

**Fase 2 (siguiente sprint):** Bucket4j + Redis Lettuce — distribuido
```java
@Bean
public ProxyManager<String> bucketProxyManager(
        StatefulRedisConnection<String, byte[]> conn) {
    return LettuceBasedProxyManager.builderFor(conn).build();
}
// Key: "rl:[feature]:[userId]:[ip]" → aislamiento correcto
```

Registrar la migración como DEBT de impacto MEDIO al crear la Fase 1.

---

## Plantilla de output obligatoria

```markdown
# Implementation — [US-XXX: Título]

## Metadata
- **Stack:** [Java | .Net | Angular | React | Node.js]
- **Modo:** [new-feature | bug-fix | hotfix | refactor]
- **Sprint:** [número]
- **Rama:** [feature/US-XXX-descripcion]

## Archivos generados/modificados
| Archivo | Acción | Capa | Descripción |
|---|---|---|---|
| [path] | NUEVO/MOD | [domain/app/infra/api] | [qué hace] |

## Código implementado
[bloques de código por archivo, con documentación inline]

## Tests
[bloques de código de tests con cobertura estimada]

## Cobertura estimada
- Líneas: [X]%  Branches: [X]%  Funciones: [X]%

## Deuda técnica identificada
[lista de TODOs o "Ninguna"]

## Self-review checklist
[checklist completado]

## Ready for Code Reviewer ✅
```


---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-4] [developer-core] STARTED → descripción breve
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
session.pipeline_step_name     = 'developer-core';
session.last_skill             = 'developer-core';
session.last_skill_output_path = 'src/';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${now}] [STEP-4] [developer-core] COMPLETED → src/ | <detalles>\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-4-${Date.now()}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — DEVELOPER_CORE STEP-4
- session.json: updated (step 4 added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-4-[timestamp].json
- artifacts:
  · src/<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
