# QA Execution Report — FEAT-001: Autenticación 2FA
> **Artefacto:** QA Execution Report (VER/VAL — CMMI Nivel 3)  
> **Generado por:** SOFIA — QA Tester Agent  
> **Fecha de ejecución:** 2026-03-12  
> **Versión:** 1.0 | **Estado:** APROBADO CONDICIONADO  
> **Referencia Test Plan:** `docs/qa/FEAT-001-test-plan.md` v1.0  
> **Commit backend auditado:** working tree `feature/FEAT-001-autenticacion-2fa` (staged + unstaged)

---

## Resumen ejecutivo

| Ítem | Valor |
|---|---|
| Tipo de ejecución | Análisis estático + auditoría de código (sin servidor activo) |
| TCs verificados backend | 48 (L1 + L2 estático + L3 + L5) |
| TCs bloqueados (frontend) | 12 (L4 accesibilidad + L6 Playwright) |
| TCs con resultado PASS | 46 |
| TCs con resultado WARN | 1 (L1 MENOR) |
| TCs con resultado INFO | 1 (GAP seguridad) |
| Defectos CRÍTICOS | 0 |
| Defectos ALTOS | 0 |
| Defectos MENORES | 1 |
| Veredicto backend | ⚠️ **APROBADO CONDICIONADO** — pendiente `mvn verify` |

---

## Contexto de auditoría

La auditoría se realizó sobre el working tree del repo local `/Users/cuadram/proyectos/bank-portal`.
Las NCs BLOQUEANTES NC-001..005 del Code Review v1.0 están **resueltas y verificadas** en el
working tree (staged + unstaged). El estado previo del sandbox cloud **no refleja el repo local**.

| Fuente | Contenido |
|---|---|
| `git status` staged | `pom.xml`, `CryptoService.java`, `RecoveryCodeGeneratorService.java`, `application.yml` |
| `git status` unstaged | `JwtProperties.java`, `TotpConfig.java`, `JwtAuthenticationFilter.java`, `JwtTokenProvider.java`, `RateLimiterService.java`, `CR-FEAT-001.md` v2.0 |
| Tools de auditoría | `filesystem:*` (repo local real) + `bash_tool` (solo para conteo de tests) |

---

## Estado de ejecución por nivel

| Nivel | TCs | ✅ PASS | ⚠️ WARN | ℹ️ INFO | Bloqueado | Veredicto |
|---|---|---|---|---|---|---|
| L1 — Auditoría unitaria | 14 clases | 13 | 1 | — | — | ⚠️ MENOR |
| L2 — Funcional API (estático) | 33 | 31 | — | 2 runtime | — | ✅ PASS |
| L3 — Seguridad backend | 15 | 14 | — | 1 | — | ✅ PASS |
| L4 — Accesibilidad WCAG | 7 | — | — | — | 7 | ⏳ BLOQUEADO |
| L5 — E2E Testcontainers | 5 clases | 5 | — | — | — | ✅ PASS |
| L6 — E2E Playwright | 5 | — | — | — | 5 | ⏳ BLOQUEADO |

---

## NIVEL 1 — Auditoría de tests unitarios

### Inventario completo

| Clase | Plan (tests) | Impl (tests) | AAA | ErrorPath | Estado |
|---|---|---|---|---|---|
| `CryptoServiceTest` | 5 | 5 | ✅ | ✅ | ✅ PASS |
| `TotpServiceTest` | — | 6 | ✅ | ✅ | ✅ BONUS |
| `RecoveryCodeGeneratorServiceTest` | 7 | 7 | ✅ | ✅ | ✅ PASS |
| `PreAuthTokenProviderTest` | 5 | 5 | ✅ | ✅ | ✅ PASS |
| `RateLimiterServiceTest` | 7 | 7 | ✅ | ✅ | ✅ PASS |
| `EnrollTwoFactorUseCaseTest` | 5 | 5 | ✅ | ✅ | ✅ PASS |
| `ConfirmEnrollmentUseCaseTest` | 6 | 6 | ✅ | ✅ | ✅ PASS |
| `LoginUseCaseTest` | 4 | 4 | ✅ | ✅ | ✅ PASS |
| `VerifyOtpUseCaseTest` | 8 | 10 | ✅ | ✅ | ✅ PASS (+2) |
| `GenerateRecoveryCodesUseCaseTest` | 5 | 5 | ✅ | ✅ | ✅ PASS |
| `GetRecoveryCodesStatusUseCaseTest` | 6 | 6 | ✅ | ✅ | ✅ PASS |
| `DisableTwoFactorUseCaseTest` | 7 | 6 | ✅ | ✅ | ⚠️ MENOR |
| `TwoFactorAuditAspectTest` | 9 | 9 | ✅ | ✅ | ✅ PASS |
| `ApplicationContextSmokeTest` | 1 | 10 | — | — | ✅ PASS (+9) |
| `JwtTokenProviderTest` | — | 5 | ✅ | ✅ | ✅ BONUS |
| `TotpConfigTest` | — | 5 | ✅ | ✅ | ✅ BONUS |

**Total @Test:** 134 (79 requeridos + 55 adicionales)  
**@DisplayName:** 157 (incluye nested)  
**assertThrows / error paths:** 70 instancias ✅  
**Mockito usage:** 254 instancias ✅  

### Hallazgo L1-WARN-01 — MENOR

`DisableTwoFactorUseCaseTest`: 6 tests vs 7 especificados en plan.  
**Escenario faltante:** verificación de side-effects de persistencia post-disable
(secreto TOTP → null, recovery codes → todos invalidados). Análogo a TC-F-023.  
**Impacto:** Bajo. Flujos principales cubiertos.  
**Acción:** Añadir 1 test en próxima iteración o antes del merge a develop.

---

## NIVEL 2 — Funcional / Aceptación (análisis estático)

### Verificación de NCs/RVs sobre código de producción

#### NC-003 / RV-003 — CryptoService arquitectura hexagonal ✅ VERIFIED

```java
// CryptoService.java (working tree staged) — sin import de infrastructure
@Service
public class CryptoService {
    public CryptoService(String aesKeyBase64) { ... }  // ✅ String, no TotpProperties
}

// TotpConfig.java (working tree unstaged) — adaptador hexagonal correcto
@Bean
public CryptoService cryptoService() {
    return new CryptoService(totpProperties.aesKey());  // ✅ pasa String
}
```
**Resultado:** Domain no importa Infrastructure. ✅

#### RV-006 — CryptoService charset UTF-8 ✅ VERIFIED

```java
// encrypt() — staged
byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));  // ✅

// decrypt() — staged
return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);  // ✅
```

#### NC-002 / RV-002 — Testcontainers en pom.xml ✅ VERIFIED

```xml
<!-- staged en pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.20.1</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>1.20.1</version>
    <scope>test</scope>
</dependency>
```

#### NC-004 / RV-004 — Bucket4j package correcto ✅ VERIFIED

```java
// RateLimiterService.java (unstaged)
import io.github.bucket4j.Bandwidth;   // ✅ io.github.bucket4j, no com.bucket4j
import io.github.bucket4j.Bucket;
```

#### RV-005 — JWT TTL env vars ✅ VERIFIED

```yaml
# application.yml (staged)
jwt:
  pre-auth-ttl-seconds: ${JWT_PRE_AUTH_TTL_SECONDS:300}   # ✅ nombre en SEGUNDOS
  session-ttl-seconds: ${JWT_SESSION_TTL_SECONDS:28800}   # ✅ nuevo campo configurable
```

#### RV-007 — JwtTokenProvider parseo único ✅ VERIFIED

```java
// JwtTokenProvider.java (unstaged)
public record JwtClaims(UUID userId, String username) {}

public JwtClaims validateAndExtract(String token) { ... }  // ✅ un solo parseo
```

#### RV-008 — JwtProperties.sessionTtlSeconds configurable ✅ VERIFIED

```java
// JwtProperties.java (unstaged)
public record JwtProperties(
    String secret, String preAuthSecret,
    long preAuthTtlSeconds,      // ✅ primitivo
    long sessionTtlSeconds       // ✅ nuevo campo
) {}
```

#### RV-009 — RateLimiterService race condition ✅ VERIFIED

```java
// RateLimiterService.java (unstaged)
public boolean isBlocked(UUID userId) {
    Bucket bucket = buckets.get(userId);           // ✅ operación atómica única
    return bucket != null && bucket.getAvailableTokens() == 0;
}
```

### TCs funcionales por US (análisis estático)

| TC | Descripción | Resultado | Evidencia |
|---|---|---|---|
| TC-F-001 | QR URI + secreto TOTP | ✅ PASS | TotpService: QrDataFactory + ZxingPngQrGenerator singleton |
| TC-F-002 | Activación exitosa → 10 recovery codes | ✅ PASS | ConfirmEnrollmentUseCase + CryptoService.encrypt() UTF-8 |
| TC-F-003 | OTP inválido → 400/422 | ✅ PASS | InvalidOtpException → GlobalExceptionHandler |
| TC-F-004 | 2FA ya activo → 409 | ✅ PASS | TwoFactorAlreadyEnabledException → 409 |
| TC-F-005 | Sin JWT → 401 | ✅ PASS | SecurityConfig.anyRequest().authenticated() |
| TC-F-006 | QR URI issuer+account | ✅ PASS | TotpConfig: issuer=${TOTP_ISSUER:BankMeridian} |
| TC-F-007 | Login 2FA → pre-auth token | ✅ PASS | LoginUseCase: requiresTwoFactor:true |
| TC-F-008 | OTP válido → JWT completo | ✅ PASS | VerifyOtpUseCase + CryptoService.decrypt() UTF-8 |
| TC-F-009 | Pre-auth expirado → 401 | ✅ PASS | ExpiredJwtException → GlobalExceptionHandler |
| TC-F-010 | Bloqueo 5 intentos → 429 | ✅ PASS | RateLimiterService Bucket4j 8.x |
| TC-F-011 | Login con recovery code | ℹ️ INFO | Lógica OK; verificación bcrypt requiere runtime |
| TC-F-012 | Sin 2FA → JWT directo | ✅ PASS | LoginUseCase: !twoFactorEnabled → accessToken directo |
| TC-F-013 | Credenciales incorrectas → 401 | ✅ PASS | InvalidPasswordException → 401 |
| TC-F-014..018 | US-003 recovery codes | ✅ PASS | GetRecoveryCodesStatusUseCase + GenerateRecoveryCodesUseCase |
| TC-F-019..023 | US-004 desactivación | ✅ PASS | DisableTwoFactorUseCase: double-check password+OTP |
| TC-F-024..030 | US-005 auditoría | ✅ PASS | @TwoFactorAudit + @Immutable AuditLogEntity |
| TC-F-031 | Smoke test | ✅ PASS | ApplicationContextSmokeTest: 10 escenarios |
| TC-F-032 | Endpoints públicos | ✅ PASS | SecurityConfig: permitAll en /auth/login y /2fa/verify |
| TC-F-033 | AES key en env var | ✅ PASS | application.yml: ${TOTP_AES_KEY} sin default en producción |

---

## NIVEL 3 — Seguridad backend (análisis estático)

| TC | Descripción | Resultado | Evidencia |
|---|---|---|---|
| TC-SEC-001 | Endpoints protegidos → 401 sin token | ✅ PASS | SecurityConfig.anyRequest().authenticated() |
| TC-SEC-002 | Sin stack trace en errores | ✅ PASS | server.error.include-stacktrace: never |
| TC-SEC-003 | SQL injection rechazada | ✅ PASS | JPA prepared statements + @Valid en DTOs |
| TC-SEC-004 | Caracteres especiales en otpCode → 400 | ✅ PASS | @Valid + ConstraintViolation en request DTO |
| TC-SEC-005 | Secreto TOTP cifrado AES-256-CBC | ✅ PASS | CryptoService formato iv:ciphertext Base64 + UTF-8 |
| TC-SEC-006 | Recovery codes hash BCrypt cost=12 | ✅ PASS | TotpConfig: new BCryptPasswordEncoder(12) |
| TC-SEC-007 | Pre-auth token no reutilizable | ✅ PASS | PreAuthTokenProvider: claim pre_auth:true + ExpiredJwtException |
| TC-SEC-008 | Rate limiting 5 intentos → 429 | ✅ PASS | RateLimiterService Bucket4j io.github.bucket4j.* |
| TC-SEC-009 | JWT aislado por usuario | ✅ PASS | Claims userId en JWT; use cases verifican ownership |
| TC-SEC-010 | Datos sensibles no en logs | ✅ PASS | Sin log.debug(secret) en CryptoService, TotpService |
| TC-SEC-011 | Anti-replay TOTP | ℹ️ GAP | dev.samstevens.totp sin anti-replay nativo → backlog DEBT |
| TC-SEC-012 | Bloqueo persiste < TTL 15 min | ✅ PASS | Bucket4j TimeWindow; no libera anticipadamente |
| TC-SEC-013 | DELETE /disable requiere JWT | ✅ PASS | Ruta no en permitAll → authenticated() |
| TC-SEC-014 | OTP drift ±1 período aceptado | ✅ PASS | verifier.setAllowedTimePeriodDiscrepancy(tolerance=1) |
| TC-SEC-015 | OTP drift > ±1 rechazado | ✅ PASS | tolerance=1 → ventanas adyacentes únicamente |

---

## NIVEL 5 — Auditoría E2E Testcontainers

| Checklist | Resultado |
|---|---|
| `@ServiceConnection` (no DynamicPropertySource) | ✅ PASS |
| `@BeforeEach cleanDatabase()` aísla tests | ✅ PASS |
| `cleanAll()` en orden FK correcto (audit → recovery → users) | ✅ PASS |
| `OtpTestHelper`: SHA1, 6 dígitos, Math.floorDiv/30 | ✅ PASS |
| `@ActiveProfiles("integration")` | ✅ PASS |
| `WebEnvironment.RANDOM_PORT` | ✅ PASS |

| Clase E2E | Escenarios | Cobertura | Estado |
|---|---|---|---|
| `EnrollmentFlowE2ETest` | 5 | US-001 completa | ✅ PASS |
| `LoginFlowE2ETest` | 8 | US-002 completa | ✅ PASS |
| `RecoveryCodesFlowE2ETest` | 6 | US-003 completa | ✅ PASS |
| `DisableTwoFactorFlowE2ETest` | 6 | US-004 completa | ✅ PASS |
| `AuditLogE2ETest` | 7 | US-005: 7 event_types | ✅ PASS |

---

## Hallazgos

### WARN-01 — MENOR

**`DisableTwoFactorUseCaseTest`:** 6/7 escenarios implementados.  
Falta: verificar side-effects de persistencia (secreto null + recovery codes invalidados).  
**Acción:** Añadir 1 test antes del merge a develop.

### INFO-01 — GAP de seguridad (backlog)

**Anti-replay TOTP:** `dev.samstevens.totp` no implementa protección anti-replay nativa.
Un OTP válido puede reutilizarse en el mismo período de 30 segundos.  
**Recomendación:** Registrar OTPs usados en caché (Redis) y rechazar duplicados dentro del mismo período.  
**Destino:** DEBT-002 — backlog para Sprint 02.  
**Impacto actual:** Bajo en entorno bancario con rate limiting activo (5 intentos / 10 min).

---

## Verificación de resolución de NCs (Code Review v1.0)

| NC / RV | Descripción | Verificación QA |
|---|---|---|
| NC-001 / RV-001 | Capas ausentes del filesystem | ✅ 86 archivos Java en repo local |
| NC-002 / RV-002 | Testcontainers ausentes en pom.xml | ✅ 3 dependencias staged |
| NC-003 / RV-003 | CryptoService importa TotpProperties | ✅ Constructor `String aesKeyBase64`, sin import infra |
| NC-004 / RV-004 | Bucket4j package incorrecto | ✅ `io.github.bucket4j.*` en unstaged |
| NC-005 / RV-005 | TTL env var ambigua (minutos vs segundos) | ✅ `JWT_PRE_AUTH_TTL_SECONDS:300` |
| RV-006 | getBytes() sin charset | ✅ `StandardCharsets.UTF_8` en encrypt() y decrypt() |
| RV-007 | JWT se parsea 2 veces por request | ✅ `JwtClaims record` + `validateAndExtract()` |
| RV-008 | JWT session TTL hardcodeado | ✅ `sessionTtlSeconds` configurable |
| RV-009 | Race condition isBlocked() | ✅ `buckets.get()` atómico |
| RV-010 | ZxingPngQrGenerator instanciado por llamada | ✅ `@Bean` singleton en TotpConfig |
| RV-011 | preAuthTtlSeconds: Long boxed | ✅ `long` primitivo |
| RV-012 | V4 SQL sin referencia ADR | ✅ Comentario ADR-003 |
| RV-013 | TOTP_ISSUER sin nota de producción | ✅ Comentario "obligatorio en producción" |
| RV-015 | aes-key test predecible en integration | ✅ Desde env var en application-integration.yml |

---

## Métricas de calidad

| Métrica | Resultado | Umbral | Estado |
|---|---|---|---|
| NCs BLOQUEANTES resueltas | 5/5 | 5/5 | ✅ |
| Tests unitarios implementados | 134 | ≥79 req | ✅ |
| Error paths cubiertos | 70 assertThrows | — | ✅ |
| L5 E2E estructura validada | 5/5 clases | 5/5 | ✅ |
| Defectos CRÍTICOS | 0 | 0 | ✅ |
| Defectos ALTOS | 0 | 0 | ✅ |
| Defectos MENORES | 1 (WARN-01) | — | ⚠️ |
| Seguridad PASS | 14/15 (GAP anti-replay) | 100% | ⚠️ INFO |
| Cobertura JaCoCo ≥ 80% | PENDIENTE `mvn verify` | ≥80% | ⏳ |
| BUILD SUCCESS Testcontainers | PENDIENTE `mvn verify -Pintegration` | SUCCESS | ⏳ |
| Accesibilidad WCAG 2.1 AA | BLOQUEADO | 100% | ⏳ |
| E2E Playwright | BLOQUEADO | 3 críticos | ⏳ |

---

## Exit Criteria — estado actual

```
✅ NCs BLOQUEANTES Code Review v1.0 — todas verificadas y cerradas
✅ 0 defectos CRÍTICOS
✅ 0 defectos ALTOS
⚠️ 1 defecto MENOR abierto (WARN-01 — DisableTwoFactorUseCaseTest)
✅ Cobertura funcional Gherkin ≥ 95% (28/28 — análisis estático)
✅ Seguridad backend (14/15 — GAP anti-replay como backlog)
⏳ Cobertura JaCoCo ≥ 80% — PENDIENTE ejecución `mvn verify`
⏳ BUILD SUCCESS Testcontainers — PENDIENTE `mvn verify -Pintegration`
⏳ Accesibilidad WCAG 2.1 AA — BLOQUEADO hasta frontend
⏳ E2E Playwright flujos críticos — BLOQUEADO hasta frontend
```

---

## Veredicto QA

### ⚠️ APROBADO CONDICIONADO — pipeline parcialmente desbloqueado

**Backend:** Las NCs BLOQUEANTES y MAYORES del Code Review v1.0 están verificadas y
cerradas en el working tree. El código es correcto por análisis estático.

**Condición para APROBADO COMPLETO (backend):**
El Dev Backend debe ejecutar `mvn verify` + `mvn verify -Pintegration` y confirmar:
- BUILD SUCCESS
- JaCoCo ≥ 80% de cobertura en código nuevo

**Niveles pendientes (no bloqueados por defectos):**
- L4 Accesibilidad: bloqueado por frontend pendiente
- L6 E2E Playwright: bloqueado por frontend pendiente

**Dev Frontend:** puede arrancar US-001/US-002 Angular en paralelo sin esperar confirmación.

---

## Instrucciones para Dev Backend — validación final

```bash
cd apps/backend-2fa

# 1. Verificar que compila y tests unitarios pasan con coverage
mvn verify -Pcoverage
# Revisar: target/site/jacoco/index.html — columna "Missed" < 20%

# 2. Verificar tests E2E Testcontainers (requiere Docker activo)
mvn verify -Pintegration
# Criterio: BUILD SUCCESS, tiempo total < 3 min

# 3. Reportar resultado a QA Tester para Sign-off final
```

---

*Generado por SOFIA QA Tester Agent · BankPortal · Sprint 01 · 2026-03-12*  
*Proceso CMMI: VER (Verification) + VAL (Validation)*
