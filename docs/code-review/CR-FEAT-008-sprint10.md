# Code Review Report — FEAT-008 Transferencias Bancarias

## Metadata

| Campo | Valor |
|---|---|
| Proyecto | BankPortal — Banco Meridian |
| Stack | Java 21 / Spring Boot 3.3.4 |
| Sprint | 10 |
| Fecha | 2026-03-20 |
| Archivos revisados | 14 |
| Líneas revisadas | ~620 |
| Rama | feature/FEAT-008-sprint10 |
| Referencia Jira | SCRUM-31 |
| Revisor | SOFIA Code Reviewer Agent |

---

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 0 | 1 | 0 | 0 |
| Contrato OpenAPI | 0 | 1 | 0 | 0 |
| Seguridad | 0 | 0 | 1 | 0 |
| Calidad de Código | 0 | 1 | 0 | 1 |
| Tests | 0 | 1 | 0 | 0 |
| Documentación | 0 | 0 | 1 | 0 |
| Convenciones Git | 0 | 0 | 0 | 1 |
| **TOTAL** | **0** | **4** | **2** | **2** |

## Veredicto

**⚠️ APROBADO CON CONDICIONES — RE-REVIEW obligatorio**

Cero bloqueantes. Cuatro hallazgos MAYORES que requieren corrección antes de pasar a QA.
La seguridad PSD2 y la atomicidad de las transferencias son correctas.
Los issues se concentran en arquitectura hexagonal, endpoint faltante, rendimiento y cobertura de tests.

---

## Hallazgos detallados

### 🟠 Mayores

---

#### RV-001 — Application layer importa directamente una clase de Infrastructure

- **Nivel:** Arquitectura y Diseño
- **Archivo:** `transfer/application/TransferLimitValidationService.java:5`

**Descripción:** `TransferLimitValidationService` (capa application) declara como dependencia `TransferLimitRedisAdapter` (capa infrastructure). Esto viola la regla de dependencias de la arquitectura hexagonal: Application debe depender únicamente de interfaces/puertos, nunca de adaptadores concretos. Si el adaptador cambia de Redis a una BD, la lógica de negocio queda acoplada.

**Código actual:**
```java
// application/TransferLimitValidationService.java
import com.experis.sofia.bankportal.transfer.infrastructure.redis.TransferLimitRedisAdapter;
...
private final TransferLimitRedisAdapter redisAdapter;  // ← infra concreta en application
```

**Corrección requerida:** Definir puerto en dominio e inyectar la interfaz:
```java
// 1. Nuevo puerto en domain/
public interface TransferLimitPort {
    BigDecimal getDailyAccumulated(UUID userId);
    BigDecimal incrementDaily(UUID userId, BigDecimal amount);
}

// 2. TransferLimitRedisAdapter implementa el puerto
@Component
public class TransferLimitRedisAdapter implements TransferLimitPort { ... }

// 3. Application usa el puerto
import com.experis.sofia.bankportal.transfer.domain.TransferLimitPort;
private final TransferLimitPort limitPort;  // ← interfaz de dominio
```

---

#### RV-002 — Endpoint GET /api/v1/transfers/limits no implementado

- **Nivel:** Contrato OpenAPI
- **Archivo:** LLD-011-transfers-backend.md (contrato v1.7.0) vs código entregado

**Descripción:** El contrato OpenAPI v1.7.0 aprobado por el Tech Lead define `GET /api/v1/transfers/limits` para que el usuario consulte sus límites vigentes (US-804 criterio 4). El `TransferLimitsController` fue diseñado en el LLD pero no fue implementado en el Step 4. Desviación no aprobada del contrato.

**Corrección requerida:** Implementar `TransferLimitsController`:
```java
@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class TransferLimitsController {

    private final TransferLimitValidationService limitService;

    @GetMapping("/limits")
    public ResponseEntity<LimitsDto> getLimits(@AuthenticationPrincipal UUID userId) {
        BigDecimal dailyUsed      = limitService.getDailyAccumulated(userId);
        BigDecimal dailyLimit     = limitService.getDailyLimit();
        BigDecimal dailyRemaining = dailyLimit.subtract(dailyUsed).max(BigDecimal.ZERO);
        return ResponseEntity.ok(new LimitsDto(
            limitService.getPerOperationLimit(), dailyLimit,
            dailyUsed, dailyRemaining));
    }

    public record LimitsDto(BigDecimal perOperationLimit, BigDecimal dailyLimit,
                            BigDecimal dailyUsed, BigDecimal dailyRemaining) {}
}
```

---

#### RV-003 — Detección de primera transferencia carga todo el historial del usuario

- **Nivel:** Calidad de Código (rendimiento)
- **Archivo:** `transfer/application/TransferToBeneficiaryUseCase.java:35-37`

**Descripción:** La lógica anti-fraude de "primera transferencia a un beneficiario" carga todo el historial de transferencias del usuario en memoria para buscar coincidencias. En un usuario con años de actividad esto puede suponer miles de registros, superando fácilmente el RNF-F8-001 de latencia p95 ≤ 500ms.

**Código actual:**
```java
boolean isFirst = transferRepo.findByUserIdOrderByCreatedAtDesc(cmd.userId()).stream()
        .noneMatch(t -> cmd.beneficiaryId().equals(t.getBeneficiaryId()) && t.isCompleted());
```

**Corrección requerida:** Añadir método específico al puerto:
```java
// TransferRepositoryPort.java
boolean existsCompletedTransferToBeneficiary(UUID userId, UUID beneficiaryId);

// TransferToBeneficiaryUseCase.java — O(1) en BD con índice
boolean isFirst = !transferRepo.existsCompletedTransferToBeneficiary(
        cmd.userId(), cmd.beneficiaryId());
```

---

#### RV-004 — Sin suite de tests para TransferToBeneficiaryUseCase (US-802)

- **Nivel:** Tests
- **Archivo:** `src/test/java/com/experis/sofia/bankportal/transfer/` (directorio)

**Descripción:** El SRS-FEAT-008 define 4 escenarios Gherkin para US-802 (RF-802). Ninguno tiene test unitario. La cobertura estimada del módulo `transfer/application` queda en ~65%, por debajo del 80% requerido en el DoD y en la CMMI Quality Gate. Los flujos críticos sin cobertura son: beneficiario no encontrado, regla de primera transferencia, límite diario superado, y core bancario con error.

**Corrección requerida:** Crear `TransferToBeneficiaryUseCaseTest` con mínimo 4 tests cubriendo los escenarios Gherkin del SRS:
```java
@Test void execute_beneficiaryTransfer_success()
@Test void execute_firstTransfer_withoutConfirmation_throws()
@Test void execute_beneficiaryNotFound_throws()
@Test void execute_dailyLimitExceeded_throwsBeforeOtp()
```

---

### 🟡 Menores

---

#### RV-005 — @Component de Spring en la capa de dominio

- **Nivel:** Arquitectura / Documentación
- **Archivo:** `beneficiary/domain/IbanValidator.java:8`

**Descripción:** `IbanValidator` declara `@Component` en la capa de dominio, introduciendo una dependencia de Spring Framework en código que debería ser POJO puro. El dominio no debería conocer ningún framework. No bloquea funcionalmente, pero viola el principio de dominio limpio.

**Corrección sugerida:**
```java
// Eliminar @Component del dominio
public class IbanValidator { ... }

// Declarar el bean en una clase de configuración de infrastructure o application
@Configuration
public class BeneficiaryConfig {
    @Bean public IbanValidator ibanValidator() { return new IbanValidator(); }
}
```

---

#### RV-006 — Mensaje de InsufficientFundsException expone datos financieros

- **Nivel:** Seguridad
- **Archivo:** `transfer/application/TransferUseCase.java:52-55`

**Descripción:** El constructor de `InsufficientFundsException` incluye el saldo disponible en el mensaje de la excepción. Si este mensaje llega al cliente sin ser filtrado por un `@ControllerAdvice`, expone información financiera sensible en la respuesta HTTP. Aunque el GlobalExceptionHandler debería capturarlo, el mensaje en la excepción actúa como riesgo latente.

**Corrección sugerida:**
```java
// Mensaje genérico en la excepción (el detail va a logs, no al cliente)
public InsufficientFundsException() {
    super("INSUFFICIENT_FUNDS");
}
// El GlobalExceptionHandler devuelve solo el código de error al cliente
```

---

### 🟢 Sugerencias

---

#### RV-007 — Commits sin referencia al ticket Jira

Los commits del Step 4 no incluyen `Resolves: SCRUM-31` ni `Refs: SCRUM-31` en el mensaje. La trazabilidad commit → Jira es requisito CMMI PMC SP 1.2 para poder rastrear cambios de código al backlog.

**Sugerencia:** Añadir en el siguiente commit:
```
feat(dev): TransferLimitsController + tests US-802

Resolves: SCRUM-31
```

---

#### RV-008 — TransferLimitExceededException podría usar métodos de fábrica

Actualmente hay dos lugares que construyen la excepción con strings literales de código de error. Centralizar en métodos estáticos de fábrica evita errores de tipografía en los códigos.

```java
public static TransferLimitExceededException operationLimit(BigDecimal limit) {
    return new TransferLimitExceededException("OPERATION_LIMIT_EXCEEDED",
            "Límite máximo por operación: " + limit + "€");
}
public static TransferLimitExceededException dailyLimit(BigDecimal remaining) {
    return new TransferLimitExceededException("DAILY_LIMIT_EXCEEDED",
            "Límite diario restante: " + remaining + "€");
}
```

---

## Métricas de calidad

| Métrica | Valor | Mínimo requerido | Estado |
|---|---|---|---|
| Tests escritos | 18 | — | — |
| Cobertura estimada transfer/application | ~65% | 80% | ⚠️ Bajo (US-802 sin cobertura) |
| Cobertura estimada beneficiary/ | ~88% | 80% | ✅ |
| Complejidad ciclomática máxima | 6 (TransferUseCase.execute) | 10 | ✅ |
| Métodos públicos sin Javadoc | 4 (getters básicos) | — | ✅ aceptable |
| Desviaciones contrato OpenAPI | 1 (limits endpoint) | 0 | ⚠️ |
| Secrets hardcodeados | 0 | 0 | ✅ |
| Violaciones OWASP | 0 | 0 | ✅ |

---

## Checklist de conformidad

```
ARQUITECTURA
[x] Dependencias fluyen en dirección correcta (con excepción RV-001)
[ ] Application no depende de clases concretas de Infrastructure — PENDIENTE RV-001
[x] Sin lógica de negocio en controllers
[x] Bounded contexts respetados (transfer/ y beneficiary/ separados)
[x] Estructura de paquetes coincide con LLD

CONTRATO OPENAPI
[x] POST /transfers/own — implementado ✅
[x] POST /transfers/beneficiary — implementado ✅
[ ] GET /transfers/limits — NO implementado — PENDIENTE RV-002
[x] GET/POST/PUT/DELETE /beneficiaries — implementados ✅
[x] Request/Response bodies coinciden con esquemas

SEGURIDAD
[x] Sin secrets hardcodeados
[x] OTP obligatorio en toda transferencia y alta de beneficiario
[x] IBAN nunca completo en logs (enmascarado)
[x] Importe en BigDecimal nunca float
[x] @Valid en todos los endpoints de entrada
[x] @AuthenticationPrincipal en todos los controllers
[ ] Mensaje de excepción con datos financieros — MENOR RV-006

TESTS
[x] TransferUseCaseTest — 6 tests (US-801 + dominio)
[x] TransferLimitValidationServiceTest — 5 tests (US-804)
[x] BeneficiaryManagementUseCaseTest — 7 tests (US-803)
[ ] TransferToBeneficiaryUseCaseTest — 0 tests (US-802) — PENDIENTE RV-004
[ ] Cobertura >= 80% en transfer/application — PENDIENTE RV-004

DOCUMENTACIÓN
[x] Javadoc en clases públicas
[x] Comentarios inline en flujos críticos
[x] Variables de entorno documentadas en LLD

GIT
[x] Naming de rama correcto: feature/FEAT-008-sprint10
[x] Conventional Commits aplicado
[ ] Commits sin referencia Jira (SCRUM-31) — SUGERENCIA RV-007
```

---

## Acciones requeridas — RE-REVIEW

| # | Hallazgo | Acción | Responsable | SLA |
|---|---|---|---|---|
| 1 | RV-001 | Crear `TransferLimitPort` en dominio; `TransferLimitRedisAdapter` implementa el puerto; `TransferLimitValidationService` inyecta la interfaz | Developer | 4h |
| 2 | RV-002 | Implementar `TransferLimitsController` con `GET /api/v1/transfers/limits` | Developer | 2h |
| 3 | RV-003 | Añadir `existsCompletedTransferToBeneficiary(userId, beneficiaryId)` al puerto; reemplazar stream sobre lista completa | Developer | 2h |
| 4 | RV-004 | Crear `TransferToBeneficiaryUseCaseTest` con mínimo 4 tests cubriendo escenarios Gherkin US-802 | Developer | 3h |

**Total estimado de corrección: ~11h**

---

*Code Review Report — SOFIA Code Reviewer Agent — Step 5*
*CMMI Level 3 — VER SP 2.1 · VER SP 2.2 · VER SP 3.1*
*BankPortal Sprint 10 — FEAT-008 — 2026-03-20*
