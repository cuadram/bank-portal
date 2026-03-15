# Code Review Report — FEAT-001: 2FA TOTP (Sprint 1)

## Metadata
| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Stack** | Java 17 / Spring Boot 3.x + Angular 17 |
| **Sprint** | Sprint 1 |
| **Fecha** | 2026-03-14 |
| **Archivos revisados** | 24 (16 Java + 8 Angular/TS) |
| **Rama** | `feature/FEAT-001-2fa` |
| **Referencias Jira** | US-006, US-001, US-002, US-003 |
| **Reviewer** | SOFIA Code Reviewer Agent |

---

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 0 | 1 | 0 | 0 |
| Contrato OpenAPI | 1 | 0 | 0 | 0 |
| Seguridad | 1 | 0 | 1 | 1 |
| Calidad de Código | 0 | 0 | 1 | 1 |
| Tests | 0 | 1 | 0 | 0 |
| Documentación | 0 | 0 | 1 | 0 |
| Convenciones Git | 0 | 0 | 0 | 0 |
| **TOTAL** | **2** | **2** | **3** | **2** |

## Veredicto
### 🔴 RECHAZADO — 2 hallazgos BLOQUEANTES

Pipeline en estado `BLOCKED`. Se generan 2 NCs en Jira via Workflow Manager.
El Developer debe resolver las NCs en ≤ 48h y solicitar re-review completo.

---

## Hallazgos detallados

---

### 🔴 Bloqueantes

#### RV-001 — Secreto TOTP transmitido en header HTTP (violación contrato OpenAPI + seguridad)
- **Nivel:** Contrato OpenAPI + Seguridad
- **Archivo:** `api/controller/TwoFaController.java:43` + `openapi-2fa.yaml:/activate`
- **NC Jira:** NC-BP-001 (a crear via Workflow Manager)
- **Descripción:** El endpoint `POST /api/2fa/activate` recibe el `rawSecret` del enrolamiento
  via `@RequestHeader("X-Raw-Secret")`. Esto tiene dos problemas:
  1. **Violación de contrato OpenAPI**: `openapi-2fa.yaml` define `/activate` con únicamente
     `otpCode` en el request body — no existe parámetro `X-Raw-Secret`. El Developer desviö
     el contrato sin aprobación del Architect (ver SKILL code-reviewer: _desviación no aprobada del contrato → BLOQUEANTE_).
  2. **Riesgo de seguridad**: transmitir el secreto TOTP en un header HTTP implica que:
     (a) el frontend debe almacenarlo en memoria/estado entre las llamadas a `/enroll` y `/activate`
     (b) el header queda registrado en logs de infraestructura (reverse proxies, API gateways)
     comprometiendo el secreto.

- **Código actual:**
  ```java
  @PostMapping("/activate")
  public ResponseEntity<ActivateResponse> activate(
          @AuthenticationPrincipal UUID userId,
          @Valid @RequestBody ActivateRequest request,
          @RequestHeader(value = "X-Forwarded-For", defaultValue = "unknown") String ip,
          @RequestHeader("X-Raw-Secret") String rawSecret) {   // ← BLOQUEANTE
      return ResponseEntity.ok(activateUseCase.execute(userId, request.otpCode(), rawSecret, ip));
  }
  ```
- **Corrección requerida:** El servidor debe almacenar el secreto temporalmente (Caffeine
  cache con TTL de 5 minutos, keyed por userId) en el use case de enrolamiento.
  El `/activate` lo recupera del cache por userId, sin que el frontend lo reenvíe.
  ```java
  // EnrollTotpUseCase: almacenar secreto en cache antes de retornar
  pendingSecretCache.put(userId, rawSecret); // TTL 5 min
  return new EnrollResponse(qrUri, rawSecret); // se sigue mostrando al usuario para QR manual

  // ActivateTotpUseCase: recuperar del cache
  String rawSecret = Optional.ofNullable(pendingSecretCache.getIfPresent(userId))
      .orElseThrow(() -> new IllegalStateException("Sesión de enrolamiento expirada"));
  pendingSecretCache.invalidate(userId);

  // TwoFaController.activate: eliminar @RequestHeader("X-Raw-Secret")
  @PostMapping("/activate")
  public ResponseEntity<ActivateResponse> activate(
          @AuthenticationPrincipal UUID userId,
          @Valid @RequestBody ActivateRequest request,
          @RequestHeader(value = "X-Forwarded-For", defaultValue = "unknown") String ip) {
      return ResponseEntity.ok(activateUseCase.execute(userId, request.otpCode(), ip));
  }
  ```

---

#### RV-002 — Capa de infraestructura JPA ausente: el contexto Spring no arranca
- **Nivel:** Arquitectura y Diseño
- **Archivo:** `infrastructure/persistence/` (directorio vacío)
- **NC Jira:** NC-BP-002 (a crear via Workflow Manager)
- **Descripción:** El LLD define explícitamente los adaptadores JPA:
  `JpaTotpSecretRepository`, `JpaRecoveryCodeRepository`, `JpaAuditEventRepository`
  y las entidades `TotpSecretEntity`, `RecoveryCodeEntity`, `AuditEventEntity`.
  Ninguno fue implementado. Los puertos (interfaces) en `domain/repository` están
  definidos correctamente, pero Spring no puede satisfacer sus dependencias en tiempo
  de arranque. El contexto de aplicación **lanza `NoSuchBeanDefinitionException`**
  al iniciar, bloqueando cualquier prueba de integración o despliegue.

- **Código actual:** `infrastructure/persistence/` — directorio vacío (0 archivos)
- **Corrección requerida:** Implementar las 3 entidades JPA y sus repositorios Spring Data:
  ```java
  // Ejemplo mínimo — TotpSecretEntity.java
  @Entity @Table(name = "totp_secrets")
  public class TotpSecretEntity {
      @Id @GeneratedValue(strategy = GenerationType.UUID)
      private UUID id;
      @Column(name = "user_id", nullable = false, unique = true)
      private UUID userId;
      @Column(name = "encrypted_secret", nullable = false, columnDefinition = "TEXT")
      private String encryptedSecret;
      @Column(nullable = false)
      private boolean enabled;
      private Instant activatedAt;
      private Instant updatedAt;
      // getters/setters + mappers domain ↔ entity
  }

  // JpaTotpSecretRepository.java (adaptador)
  @Repository
  public class JpaTotpSecretRepository implements TotpSecretRepository {
      private final TotpSecretJpaRepository jpa; // Spring Data JPA
      // implementar findByUserId, save, deleteByUserId con mapeo entity ↔ domain
  }
  ```
  Se requieren 3 entidades + 3 adaptadores + sus interfaces Spring Data JPA.

---

### 🟠 Mayores

#### RV-003 — JwtService stub: UnsupportedOperationException en flows críticos
- **Nivel:** Arquitectura y Diseño
- **Archivo:** `infrastructure/security/JwtService.java:38,50`
- **Descripción:** `JwtService.issueFullSessionToken()` y `extractUserId()` lanzan
  `UnsupportedOperationException`. Los use cases `VerifyOtpUseCase` y
  `VerifyRecoveryUseCase` llaman `jwtService.issueFullSessionToken()` en su flujo
  principal (happy path). Esto provoca un fallo de runtime en todos los tests de
  integración y hace que US-002 y US-003 no sean testables end-to-end en Sprint 1.
  El DEBT-002 está correctamente documentado, pero el stub **no puede ser la
  implementación entregada en un sprint** — debe haber al menos una implementación
  funcional mínima (aunque use HS256 en lugar de RSA) para que los escenarios
  Gherkin sean verificables por QA.
- **Corrección requerida:** Implementar versión funcional con JJWT (HS256) usando
  `JWT_FULL_SECRET` de `application.yml`. Mantener el DEBT-002 para migración a RSA.

#### RV-004 — Cobertura de tests insuficiente: use cases críticos sin tests
- **Nivel:** Tests
- **Archivos:** `application/usecase/EnrollTotpUseCase.java`,
  `application/usecase/ActivateTotpUseCase.java`,
  `application/usecase/VerifyRecoveryUseCase.java`
- **Descripción:** Solo se generaron tests para `VerifyOtpUseCase` (3 escenarios).
  Los use cases `EnrollTotpUseCase`, `ActivateTotpUseCase` y `VerifyRecoveryUseCase`
  no tienen tests unitarios. Esto cubre aproximadamente el 30-35% de los use cases
  del sprint — muy por debajo del 80% requerido. En particular:
  - `ActivateTotpUseCase` contiene la lógica de cifrado AES-256 y generación
    de recovery codes — el escenario de error (OTP inválido) no tiene test.
  - `VerifyRecoveryUseCase` tiene lógica bcrypt de comparación — sin test de
    código inválido o ya usado.
- **Corrección requerida:** Añadir tests unitarios (patrón AAA + Mockito) para los
  3 use cases faltantes, cubriendo happy path + error path + edge cases
  (sesión expirada, código ya usado, usuario sin 2FA activo).

---

### 🟡 Menores

#### RV-005 — Sin Dockerfile para nuevo microservicio backend-2fa
- **Nivel:** Documentación / Infraestructura
- **Archivo:** `apps/backend-2fa/` (raíz)
- **Descripción:** El LLD especifica que `backend-2fa` es un nuevo microservicio.
  La ausencia de Dockerfile impide su construcción y despliegue en pipeline Jenkins.
  No es BLOQUEANTE para el Code Review, pero el DevOps skill lo requerirá.
- **Corrección requerida:** Añadir `Dockerfile` multi-stage estándar Spring Boot:
  ```dockerfile
  FROM eclipse-temurin:17-jre-alpine AS runtime
  ARG JAR_FILE=target/*.jar
  COPY ${JAR_FILE} app.jar
  ENTRYPOINT ["java", "-jar", "/app.jar"]
  ```

#### RV-006 — SecureRandom instanciado dentro de método (calidad)
- **Nivel:** Calidad de Código
- **Archivo:** `application/usecase/ActivateTotpUseCase.java:72`
- **Descripción:** `generateRecoveryCodePlain()` crea `new java.security.SecureRandom()`
  dentro del cuerpo del método (como variable local). `SecureRandom` es costoso de
  instanciar y thread-safe — debe ser un campo `private static final` de la clase.
- **Corrección:**
  ```java
  private static final SecureRandom RNG = new SecureRandom(); // campo de clase
  ```

#### RV-007 — AuthService Angular: JWT en sessionStorage sin advertencia de scope
- **Nivel:** Seguridad (frontend)
- **Archivo:** `core/services/auth.service.ts:17`
- **Descripción:** `sessionStorage` es accesible desde JavaScript — expuesto a XSS.
  Dado que Angular 17 escapa el HTML por defecto y el proyecto usa `DomSanitizer`,
  el riesgo es bajo pero presente. No es BLOQUEANTE (no es `localStorage` permanente
  y el SRS no mandó httpOnly cookies), pero debe documentarse como decisión consciente.
- **Corrección sugerida:** Añadir comentario JSDoc con la decisión y referencia al ADR
  o crear ADR-005 en documentación de arquitectura.

---

### 🟢 Sugerencias

#### RV-008 — VerifyOtpUseCase: considerar @Transactional
- **Archivo:** `application/usecase/VerifyOtpUseCase.java`
- **Descripción:** El flujo de verificación exitosa (reset de rate limiter + log de
  auditoría) podría beneficiarse de `@Transactional` para garantizar que ambas
  operaciones sean atómicas. Si el log de auditoría falla, el rate limiter ya se resetó.
  Bajo carga normal el riesgo es mínimo, pero en alta concurrencia puede generar
  inconsistencias en el audit_log. Consideración para Sprint 2.

#### RV-009 — Angular OtpInputComponent: añadir debounce en valueChange
- **Archivo:** `shared/components/otp-input/otp-input.component.ts`
- **Descripción:** El output `valueChange` emite en cada keystroke. Considerar
  añadir un `debounceTime(150)` para evitar renders innecesarios en el store si
  el input se conecta a un Signal que dispara efectos costosos.

---

## Métricas de calidad

| Métrica | Valor medido | Requerido | Estado |
|---|---|---|---|
| Cobertura de tests (use cases) | ~35% | ≥ 80% | 🟠 Mayor |
| Complejidad ciclomática máxima | 6 (ActivateTotpUseCase) | ≤ 10 | ✅ |
| Métodos públicos sin Javadoc | 0 | 0 | ✅ |
| Desviaciones contrato OpenAPI | 1 (X-Raw-Secret) | 0 | 🔴 |
| Secrets hardcodeados | 0 | 0 | ✅ |
| Stack traces expuestos al cliente | 0 | 0 | ✅ |
| Lógica de negocio en controllers | 0 | 0 | ✅ |
| Dependencias fluyen correctamente | ✅ | — | ✅ |

---

## Checklist de conformidad

```
ARQUITECTURA
✅ Estructura de paquetes coincide con LLD del Architect (domain/app/infra/api)
✅ Dependencias fluyen en dirección correcta (API→App→Domain←Infra)
✅ Sin lógica de negocio en controllers
❌ Capa infrastructure/persistence vacía — Spring context no arranca (NC-BP-002)

CONTRATO OPENAPI
❌ /activate usa X-Raw-Secret header no definido en contrato (NC-BP-001)
✅ Métodos HTTP y rutas coinciden con openapi-2fa.yaml
✅ Request/Response bodies correctos en los demás endpoints
✅ Códigos de error ProblemDetail alineados con el contrato

SEGURIDAD
❌ Secreto TOTP transmitido en header HTTP (registrable en logs de infra) (NC-BP-001)
✅ Sin secrets hardcodeados — todas las credenciales via variables de entorno
✅ Sin stack traces expuestos — TwoFaExceptionHandler retorna ProblemDetail
✅ Inputs validados con @Valid + Jakarta Bean Validation
✅ AES-256-GCM correctamente implementado con IV aleatorio
✅ BCrypt cost=12 para recovery codes

TESTS
❌ Cobertura de use cases ~35% — EnrollTotpUseCase, ActivateTotpUseCase,
   VerifyRecoveryUseCase sin tests (RV-004)
✅ TotpServiceTest: 5 tests — happy path + edge cases
✅ EncryptionServiceTest: 4 tests — round trip + tamper detection
✅ VerifyOtpUseCaseTest: 3 tests — happy + invalid + rate limit

DOCUMENTACIÓN
✅ Javadoc en todos los métodos públicos Java
✅ JSDoc en servicios y componentes Angular públicos
✅ Variables de entorno documentadas en application.yml
❌ Sin Dockerfile para backend-2fa (RV-005)

GIT
✅ Naming de rama correcto (feature/FEAT-001-2fa)
✅ Conventional Commits aplicado
✅ PR referencia ticket Jira (Resolves: FEAT-001)
```

---

## Acciones requeridas post-review

| # | Acción | Severidad | Responsable | SLA |
|---|---|---|---|---|
| 1 | Resolver NC-BP-001: eliminar X-Raw-Secret header, implementar pending-secret cache en EnrollTotpUseCase | 🔴 Bloqueante | Java Developer | 48 h |
| 2 | Resolver NC-BP-002: implementar capa persistence (3 entidades JPA + 3 adaptadores) | 🔴 Bloqueante | Java Developer | 48 h |
| 3 | Implementar JwtService funcional con JJWT/HS256 (mantener DEBT-002 para RSA) | 🟠 Mayor | Java Developer | 48 h |
| 4 | Añadir tests unitarios para EnrollTotpUseCase, ActivateTotpUseCase, VerifyRecoveryUseCase | 🟠 Mayor | Java Developer | 48 h |
| 5 | Añadir Dockerfile multi-stage para backend-2fa | 🟡 Menor | Java Developer | Mismo PR |
| 6 | Mover SecureRandom a campo static final en ActivateTotpUseCase | 🟡 Menor | Java Developer | Mismo PR |
| 7 | Documentar decisión sessionStorage en AuthService (JSDoc o ADR-005) | 🟡 Menor | Angular Developer | Mismo PR |

**Tras corrección de las NCs:** solicitar re-review al Code Reviewer Agent.
El re-review verificará específicamente RV-001 a RV-004.

---

## Aspectos positivos destacados

- ✅ Arquitectura hexagonal implementada correctamente — puertos e interfaces bien separados
- ✅ AES-256-GCM con IV aleatorio por cifrado — implementación correcta del ADR-002
- ✅ Rate limiting por userId+IP con TTL — cubre el RNF-D03 correctamente
- ✅ Todos los eventos de auditoría registrados en los use cases implementados
- ✅ BCrypt cost=12 para recovery codes — resistente a rainbow tables
- ✅ TwoFaExceptionHandler con ProblemDetail RFC 9457 — sin exposición de internos
- ✅ Angular: NgRx Signal Store bien estructurado con rxMethod
- ✅ OtpInputComponent accesible (aria-label, aria-live, autocomplete="one-time-code")
- ✅ AuthInterceptor funcional para gestión transparente de Bearer JWT

---

*Generado por SOFIA Code Reviewer Agent — 2026-03-14*
*Estado: 🔴 RECHAZADO — 2 NCs abiertas (NC-BP-001, NC-BP-002)*
*Próxima acción: Developer resuelve NCs → re-review*
