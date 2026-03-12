# Code Review Report — FEAT-001: Backend 2FA (Sprint 01)

> **Artefacto:** Code Review Report  
> **Proceso CMMI:** VER — Verification  
> **Generado por:** SOFIA — Code Reviewer Agent  
> **Fecha:** 2026-03-12  
> **Versión:** 1.0 | **Estado:** RECHAZADO

---

## Metadata

| Campo | Valor |
|---|---|
| Proyecto | BankPortal |
| Cliente | Banco Meridian |
| Stack | Java 21 / Spring Boot 3.3.4 |
| Sprint | Sprint 01 |
| Rama | `feature/FEAT-001-autenticacion-2fa` |
| HEAD revisado | `874c206` |
| US revisadas | US-001, US-002, US-003, US-004, US-005, US-006, US-007 |
| Archivos Java presentes en filesystem | **24 / ~70+ esperados** |
| Archivos Java en test | 0 visibles |
| Líneas revisadas | ~750 (código verificable) |

---

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 2 | 0 | 0 | 0 |
| Compilación / Dependencias | 2 | 0 | 0 | 0 |
| Seguridad | 1 | 1 | 0 | 0 |
| Calidad de Código | 0 | 2 | 3 | 3 |
| Tests | 0 | 0 | 0 | 0 |
| Documentación | 0 | 0 | 1 | 0 |
| Convenciones Git | 0 | 0 | 0 | 0 |
| **TOTAL** | **5** | **3** | **4** | **3** |

---

## Veredicto

# 🔴 RECHAZADO

**5 hallazgos BLOQUEANTES.** El pipeline queda en estado `BLOCKED`.  
Cada BLOQUEANTE requiere NC en Jira via Workflow Manager.  
Tras resolución de todas las NCs → re-review completo obligatorio.

**Causa raíz del hallazgo RV-001 (el más grave):** los commits US-001 → US-007
documentan código generado en el sandbox cloud de SOFIA, pero ese código
fue escrito en la ruta temporal `/home/claude/` del sandbox, no en el
filesystem local del repositorio. Los git tools operaron correctamente
sobre `/Users/cuadram/proyectos/bank-portal`, pero no había archivos
que commitear en las capas `application/`, `api/`, `infrastructure/persistence/`
e `infrastructure/aop/`. Los commits existen en el historial pero son
**vacíos de contenido real** en esas capas.

---

## Hallazgos detallados

---

### 🔴 BLOQUEANTES

---

#### RV-001 — Capas application, api, persistence y aop ausentes del filesystem
- **Nivel:** Arquitectura y Diseño
- **Archivos afectados:** `application/usecase/*.java`, `application/dto/*.java`,
  `api/controller/*.java`, `api/advice/GlobalExceptionHandler.java`,
  `infrastructure/persistence/**`, `infrastructure/aop/**`,
  `src/test/**` (todos los tests)
- **NC Jira:** NC-BANKPORTAL-001 (a crear via Workflow Manager)

**Descripción:**  
El proyecto solo contiene 24 de los ~70+ archivos Java descritos en los commit messages.
Están presentes: `domain/**`, `infrastructure/config/**`, `infrastructure/security/**`.
Están **completamente ausentes**: la capa `application/` (casos de uso + DTOs),
la capa `api/` (controllers + GlobalExceptionHandler), `infrastructure/persistence/`
(entidades JPA, repositorios, adapters) e `infrastructure/aop/` (aspecto de auditoría).
Tampoco existe ningún archivo en `src/test/`.

El proyecto **no compila** en este estado. `@SpringBootApplication` no puede
resolver los beans declarados en los commits porque las clases no existen.

**Root cause:** Los archivos fueron generados por SOFIA en el filesystem del
sandbox cloud (`/home/claude/`) en lugar del filesystem local del repo
(`/Users/cuadram/proyectos/bank-portal`). Los commits se realizaron con
`git add` sobre rutas vacías.

**Corrección requerida:**  
Regenerar todos los archivos ausentes directamente en el path correcto del
repositorio local. Lista exhaustiva de archivos requeridos:

```
application/dto/
  ConfirmEnrollmentRequestDto.java, ConfirmEnrollmentResponseDto.java
  DisableTwoFactorRequestDto.java, DisableTwoFactorResponseDto.java
  EnrollResponseDto.java
  GenerateRecoveryCodesRequestDto.java, GenerateRecoveryCodesResponseDto.java
  LoginRequestDto.java, LoginResponseDto.java
  RecoveryCodesStatusDto.java
  VerifyOtpRequestDto.java, VerifyOtpResponseDto.java

application/usecase/
  ConfirmEnrollmentUseCase.java, DisableTwoFactorUseCase.java
  EnrollTwoFactorUseCase.java, GenerateRecoveryCodesUseCase.java
  GetRecoveryCodesStatusUseCase.java, LoginUseCase.java
  VerifyOtpUseCase.java

api/controller/
  AuthController.java, RecoveryCodesController.java
  TwoFactorEnrollController.java, TwoFactorManageController.java
  TwoFactorVerifyController.java
api/advice/
  GlobalExceptionHandler.java

domain/service/
  RecoveryCodeGeneratorService.java   (también ausente)

infrastructure/aop/
  TwoFactorAudit.java, TwoFactorAuditAspect.java

infrastructure/persistence/entity/
  AuditLogEntity.java, RecoveryCodeEntity.java, UserEntity.java
infrastructure/persistence/jpa/
  AuditLogJpaRepository.java, RecoveryCodeJpaRepository.java, UserJpaRepository.java
infrastructure/persistence/adapter/
  AuditLogRepositoryAdapter.java, RecoveryCodeRepositoryAdapter.java
  TwoFactorRepositoryAdapter.java, UserRepositoryAdapter.java

src/test/.../integration/support/
  AbstractIntegrationTest.java, OtpTestHelper.java, TestFixtureFactory.java
src/test/.../integration/
  AuditLogE2ETest.java, DisableTwoFactorFlowE2ETest.java
  EnrollmentFlowE2ETest.java, LoginFlowE2ETest.java
  RecoveryCodesFlowE2ETest.java
src/test/.../unit/...
  (todos los tests unitarios de use cases, domain services, AOP, security)
```

---

#### RV-002 — Dependencias Testcontainers ausentes en pom.xml
- **Nivel:** Tests / Compilación
- **Archivo:** `apps/backend-2fa/pom.xml`
- **NC Jira:** NC-BANKPORTAL-002

**Descripción:**  
El commit `50110d9` (US-007) documenta la adición de tres dependencias de
Testcontainers al `pom.xml`, pero el archivo actual no las contiene:

```xml
<!-- Ausentes del pom.xml actual -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

Sin estas dependencias, `AbstractIntegrationTest`, todas las clases E2E y
el `@ServiceConnection` no compilarán. Los 32 escenarios de US-007 son inaccesibles.

**Corrección requerida:** Añadir las tres dependencias con `<scope>test</scope>`
en el bloque de dependencias de test del `pom.xml`.

---

#### RV-003 — CryptoService (domain) importa TotpProperties (infrastructure) — violación hexagonal
- **Nivel:** Arquitectura y Diseño
- **Archivo:** `domain/service/CryptoService.java:6`
- **NC Jira:** NC-BANKPORTAL-003

**Código actual:**
```java
// domain/service/CryptoService.java
import com.experis.sofia.bankportal.twofa.infrastructure.config.TotpProperties;

@Service
public class CryptoService {
    public CryptoService(TotpProperties totpProperties) { ... }
}
```

**Descripción:**  
La capa `domain` importa directamente `TotpProperties` de la capa `infrastructure.config`.
Esto invierte el flujo de dependencias correcto de la arquitectura hexagonal:
`Infrastructure → Application → Domain` (nunca `Domain → Infrastructure`).

El dominio no debe saber que existe `TotpProperties` ni la estructura de
configuración de Spring Boot. Si en el futuro se reemplaza el mecanismo de
configuración, el dominio se ve afectado innecesariamente.

**Corrección sugerida:**
```java
// domain/service/CryptoService.java — sin import de infrastructure
@Service
public class CryptoService {

    public CryptoService(String aesKeyBase64) {
        byte[] keyBytes = Base64.getDecoder().decode(aesKeyBase64);
        // ...
    }
}
```
```java
// infrastructure/config/TotpConfig.java — el adaptador provee el valor
@Bean
public CryptoService cryptoService(TotpProperties props) {
    return new CryptoService(props.aesKey());
}
```

Alternativamente: crear una interfaz `KeyProvider` en dominio e implementarla en infra.

---

#### RV-004 — RateLimiterService usa package com.bucket4j — no existe en Bucket4j 8.x
- **Nivel:** Compilación
- **Archivo:** `infrastructure/security/RateLimiterService.java:3-4`
- **NC Jira:** NC-BANKPORTAL-004

**Código actual:**
```java
import com.bucket4j.Bandwidth;
import com.bucket4j.Bucket;
```

**Descripción:**  
El groupId de la dependencia es `com.bucket4j:bucket4j-core:8.10.1` pero
el paquete de las clases en Bucket4j 8.x es `io.github.bucket4j`.
El import `com.bucket4j.*` no existe → `ClassNotFoundException` en compilación.

**Corrección sugerida:**
```java
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
```

---

#### RV-005 — Variable de entorno PRE_AUTH_TOKEN_TTL_MIN mapeada a propiedad en segundos
- **Nivel:** Seguridad — misconfiguration de TTL
- **Archivo:** `src/main/resources/application.yml:31`
- **NC Jira:** NC-BANKPORTAL-005

**Código actual:**
```yaml
jwt:
  pre-auth-ttl-seconds: ${PRE_AUTH_TOKEN_TTL_MIN:5}
  #                     ^^^^^^^^^^^^^^^^^^^^^^^^
  # El sufijo _MIN sugiere minutos pero la propiedad está en SEGUNDOS
  # Default = 5 → 5 SEGUNDOS (no 5 minutos)
```

**Descripción:**  
La env var se llama `PRE_AUTH_TOKEN_TTL_MIN` (sugiere minutos) pero la
propiedad que rellena es `pre-auth-ttl-seconds` (espera segundos).
Si un operador configura `PRE_AUTH_TOKEN_TTL_MIN=5` asumiendo que son minutos,
el pre-auth token tendrá un TTL de **5 segundos** — prácticamente inutilizable
y que generará errores 401 continuos durante el flujo de login.

Adicionalmente, el resumen de arquitectura y la documentación del sprint
referencian `PRE_AUTH_TOKEN_TTL_SECONDS=300` como nombre correcto,
lo que confirma la inconsistencia.

Con TTL de 5 segundos: el flujo de login 2FA sería imposible en condiciones
reales → usuarios incapaces de autenticarse → vector de DoS indirecto.

**Corrección sugerida:**
```yaml
jwt:
  pre-auth-ttl-seconds: ${PRE_AUTH_TOKEN_TTL_SECONDS:300}
  #                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  # Nombre alineado con la propiedad (segundos). Default = 300 = 5 minutos.
```

---

### 🟠 MAYORES

---

#### RV-006 — CryptoService.encrypt() usa getBytes() sin charset explícito
- **Nivel:** Seguridad
- **Archivo:** `domain/service/CryptoService.java:62`

**Código actual:**
```java
byte[] cipherBytes = cipher.doFinal(plainText.getBytes());
//                                             ^^^^^^^^^^
//                                             charset por defecto de la JVM
```

**Descripción:**  
`String.getBytes()` sin parámetro usa el charset por defecto de la plataforma
(definido por `file.encoding` en la JVM). En sistemas Linux production el
default suele ser UTF-8, pero no está garantizado. Si se despliega en un
entorno con charset distinto (ej. Latin-1), el secreto TOTP se cifraría con
bytes diferentes a los que se descifrarían en otro entorno → **los secretos
TOTP almacenados serían irrecuperables**.

**Corrección:**
```java
byte[] cipherBytes = cipher.doFinal(
    plainText.getBytes(StandardCharsets.UTF_8));  // charset explícito siempre
```

El mismo fix aplica en `decrypt()` al reconstruir el String:
```java
return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
```

---

#### RV-007 — JwtTokenProvider.extractUsername() re-parsea JWT completo
- **Nivel:** Calidad de Código
- **Archivo:** `infrastructure/security/JwtTokenProvider.java:90-97`

**Código actual:**
```java
// Llamado en JwtAuthenticationFilter DESPUÉS de validateAndExtractUserId()
// → el JWT se firma/parsea 2 veces por request
public String extractUsername(String token) {
    return Jwts.parser()
        .verifyWith(signingKey)
        .build()
        .parseSignedClaims(token)   // segunda verificación de firma — innecesaria
        .getPayload()
        .get(CLAIM_USERNAME, String.class);
}
```

**Descripción:**  
El filtro `JwtAuthenticationFilter` llama primero a `validateAndExtractUserId(token)`
y luego a `extractUsername(token)`. Ambos parsean y verifican la firma completa del JWT.
Esto duplica el trabajo criptográfico en cada request autenticado.

**Corrección sugerida:** Retornar un record con userId + username en una sola operación:
```java
public record JwtClaims(UUID userId, String username) {}

public JwtClaims validateAndExtract(String token) {
    Claims claims = Jwts.parser().verifyWith(signingKey).build()
        .parseSignedClaims(token).getPayload();
    return new JwtClaims(
        UUID.fromString(claims.getSubject()),
        claims.get(CLAIM_USERNAME, String.class)
    );
}
```

---

#### RV-008 — JwtTokenProvider TTL de sesión hardcodeado (8h)
- **Nivel:** Calidad de Código / Configurabilidad
- **Archivo:** `infrastructure/security/JwtTokenProvider.java:33`

**Código actual:**
```java
private static final long DEFAULT_TTL_MS = 8L * 60 * 60 * 1000;
// Hardcodeado — no configurable sin recompilar
```

**Descripción:**  
Mientras `pre-auth-ttl-seconds` es configurable via env var, el TTL del JWT
de sesión completa está hardcodeado en la clase. Banco Meridian podría requerir
ajustar este valor por política de seguridad (ej. reducir a 4h en producción,
extender a 12h en test). Para consistencia con el resto del módulo:

**Corrección:**
```java
// JwtProperties.java — añadir campo
public record JwtProperties(
    String secret,
    String preAuthSecret,
    long preAuthTtlSeconds,
    long sessionTtlSeconds   // nuevo
) {}

// application.yml
// jwt:
//   session-ttl-seconds: ${JWT_SESSION_TTL_SECONDS:28800}  # 8h default
```

---

### 🟡 MENORES

---

#### RV-009 — RateLimiterService.isBlocked() potencial race condition
- **Archivo:** `infrastructure/security/RateLimiterService.java:64-69`

```java
// Dos operaciones no atómicas sobre ConcurrentHashMap
if (!buckets.containsKey(userId)) {    // check
    return false;
}
return buckets.get(userId).getAvailableTokens() == 0;  // get
// Entre check y get otro thread pudo haber eliminado la entrada
```

**Corrección:**
```java
Bucket bucket = buckets.get(userId);
return bucket != null && bucket.getAvailableTokens() == 0;
```

---

#### RV-010 — TotpService instancia ZxingPngQrGenerator por llamada
- **Archivo:** `domain/service/TotpService.java:56`

```java
QrGenerator generator = new ZxingPngQrGenerator();  // new en cada llamada
```

`ZxingPngQrGenerator` es stateless. Debería inyectarse como `@Bean` en `TotpConfig`
para evitar la creación del objeto en cada enrolamiento.

---

#### RV-011 — JwtProperties.preAuthTtlSeconds es Long boxed en lugar de long primitivo
- **Archivo:** `infrastructure/config/JwtProperties.java`

```java
public record JwtProperties(
    String secret,
    String preAuthSecret,
    Long preAuthTtlSeconds   // boxed → NullPointerException si binding falla
) {}
```

**Corrección:** Usar `long preAuthTtlSeconds` (primitivo). Los records con
`@ConfigurationProperties` funcionan correctamente con tipos primitivos.

---

#### RV-012 — V4 audit_log no referencia ADR que justifica ausencia de FK
- **Archivo:** `db/migration/V4__create_audit_log_table.sql`

El comentario explica la decisión pero no referencia el ADR formalmente.
Añadir: `-- Decisión de diseño: ADR-003 §Inmutabilidad — sin FK para preservar log histórico`.

---

### 🟢 SUGERENCIAS

---

#### RV-013 — application.yml: valor por defecto de TOTP_ISSUER no marcado como "solo dev"
El default `BankMeridian` en `totp.issuer: ${TOTP_ISSUER:BankMeridian}` podría
usarse accidentalmente en entornos no configurados. Añadir comentario:
`# TOTP_ISSUER — obligatorio en producción. Default solo para desarrollo local.`

---

#### RV-014 — JwtAuthenticationFilter: rutas públicas hardcodeadas, no sincronizadas con SecurityConfig
Las rutas en `shouldNotFilter()` se definen también en `SecurityConfig.securityFilterChain()`.
Si se añade una ruta pública nueva, hay que recordar actualizarla en dos lugares.
Considerar una lista centralizada de rutas públicas como `@ConfigurationProperties`.

---

#### RV-015 — application-integration.yml: valor de totp.aes-key de test predecible
El valor `MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MDE=` es `"01234567890..."` — predecible.
Para mayor robustez en CI, generarlo desde una variable de entorno de pipeline.

---

## Métricas de calidad

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Archivos Java presentes | 24 / ~70+ | 100% | 🔴 34% |
| Tests unitarios presentes | 0 | ≥ 14 clases | 🔴 0% |
| Cobertura JaCoCo medible | No medible | ≥ 80% | 🔴 N/A |
| Complejidad ciclomática máxima | ≤ 5 (en código visible) | ≤ 10 | ✅ |
| Métodos públicos sin Javadoc | 0 (en código visible) | 0 | ✅ |
| Secrets hardcodeados en código | 0 | 0 | ✅ |
| Desviaciones contrato OpenAPI | No verificable | 0 | ⚠️ N/A |

---

## Checklist de conformidad

```
ARQUITECTURA
☑ Estructura de paquetes coincide con LLD del Architect (en código visible)
✗ Dependencias fluyen en dirección correcta → RV-003 (domain→infra)
✗ Sin lógica de negocio en capas incorrectas → no verificable (capas ausentes)

CONTRATO OPENAPI
✗ Todos los endpoints implementados → no verificable (controllers ausentes)
✗ Request/Response bodies → no verificable (DTOs ausentes)
✗ Códigos de error → no verificable (GlobalExceptionHandler ausente)

SEGURIDAD
☑ Sin secrets hardcodeados en código fuente o application.yml
✗ Sin stack traces expuestos → ✅ configurado en yml; server.error: never
☑ Inputs validados (visible en lo revisado)
✗ Endpoint /2fa/verify: pre-auth token en header (ADR-001) → no verificable
☑ JwtAuthenticationFilter excluye correctamente /auth/login y /2fa/verify
☑ BCrypt cost=12 configurado en SecurityConfig
✗ RV-004: package Bucket4j incorrecto → fallo de compilación
✗ RV-005: TTL env var ambiguo → riesgo de misconfiguration

TESTS
✗ Cobertura ≥ 80% → 0 archivos de test presentes (RV-001)
✗ Testcontainers en pom.xml → ausentes (RV-002)

DOCUMENTACIÓN
☑ Javadoc en todos los métodos públicos del código visible
☑ Variables de entorno documentadas en application.yml
☑ ADRs referenciados en Javadoc de clases relevantes

GIT
☑ Nombre de rama: feature/FEAT-001-autenticacion-2fa ✅
☑ Conventional Commits aplicado en todos los commits ✅
☑ PR referencia ticket Jira (Resolves: US-XXX en mensajes) ✅
⚠ PR tiene muchos más commits de los esperados — commits vacíos (RV-001)
```

---

## Acciones requeridas post-review

| # | Acción | Responsable | SLA | NC Jira |
|---|---|---|---|---|
| 1 | Regenerar capas application, api, persistence, aop en path local correcto | Dev Backend | 48h | NC-BANKPORTAL-001 |
| 2 | Añadir dependencias Testcontainers en pom.xml | Dev Backend | 48h | NC-BANKPORTAL-002 |
| 3 | Corregir arquitectura: CryptoService sin dependencia de TotpProperties | Dev Backend | 48h | NC-BANKPORTAL-003 |
| 4 | Corregir imports Bucket4j: com.bucket4j → io.github.bucket4j | Dev Backend | 48h | NC-BANKPORTAL-004 |
| 5 | Corregir env var PRE_AUTH_TOKEN_TTL_MIN → PRE_AUTH_TOKEN_TTL_SECONDS | Dev Backend | 48h | NC-BANKPORTAL-005 |
| 6 | Fix CryptoService: getBytes() → getBytes(StandardCharsets.UTF_8) | Dev Backend | 48h | — (MAYOR) |
| 7 | Refactor JwtTokenProvider: una sola extracción de claims | Dev Backend | 48h | — (MAYOR) |
| 8 | Hacer configurable JWT session TTL (hardcoded 8h) | Dev Backend | 48h | — (MAYOR) |
| 9 | Fix race condition isBlocked() en RateLimiterService | Dev Backend | best effort | — |
| 10 | Re-review completo obligatorio tras resolución de NCs 1-5 | Code Reviewer | post-fix | — |

---

> 🔒 **Handoff a Workflow Manager**  
> Artefacto: `docs/code-review/CR-FEAT-001-backend-sprint01.md` v1.0  
> Veredicto: 🔴 RECHAZADO  
> Acción: Crear NC-BANKPORTAL-001..005 en Jira  
> Asignado a: Dev Backend Agent  
> SLA: 48h por NC  
> Pipeline: BLOCKED hasta VERIFIED de todas las NCs

---

*Generado por SOFIA Code Reviewer Agent · BankPortal · Sprint 01 · 2026-03-12*
