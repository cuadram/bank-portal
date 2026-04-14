# LLD Backend — FEAT-022: Bizum P2P
**Sprint 24 · Java 21 / Spring Boot 3.3 · SOFIA v2.7**

---

## Estructura de paquetes — módulo `bizum`

```
com.experis.sofia.bankportal.bizum/
├── domain/
│   ├── model/
│   │   ├── BizumActivation.java       // userId, phone (E.164), accountId, status, gdprConsentAt
│   │   ├── BizumPayment.java          // senderId, recipientPhone, amount(BigDecimal), concept, status, sepaRef
│   │   ├── BizumRequest.java          // requesterId, recipientPhone, amount, concept, status, expiresAt
│   │   └── BizumStatus.java           // PENDING, COMPLETED, REJECTED, EXPIRED
│   ├── exception/
│   │   ├── BizumNotActiveException.java
│   │   ├── PhoneAlreadyRegisteredException.java
│   │   ├── PhoneNotRegisteredException.java
│   │   ├── BizumLimitExceededException.java    // per-op y daily
│   │   ├── BizumRequestExpiredException.java
│   │   └── BizumRequestNotFoundException.java
│   ├── service/
│   │   ├── BizumLimitService.java     // checkPerOperation(amount) + checkDaily(userId, amount)
│   │   └── PhoneValidationService.java // validateE164(phone)
│   └── repository/
│       ├── BizumActivationRepositoryPort.java
│       ├── BizumPaymentRepositoryPort.java
│       └── BizumRequestRepositoryPort.java
├── application/
│   ├── usecase/
│   │   ├── ActivateBizumUseCase.java
│   │   ├── SendPaymentUseCase.java
│   │   ├── RequestMoneyUseCase.java
│   │   ├── AcceptRequestUseCase.java
│   │   ├── RejectRequestUseCase.java
│   │   └── ListTransactionsUseCase.java
│   └── dto/
│       ├── ActivateBizumRequest.java  // phone, accountId
│       ├── ActivateBizumResponse.java // phoneMasked, activatedAt, status
│       ├── SendPaymentRequest.java    // recipientPhone, amount, concept, otp
│       ├── SendPaymentResponse.java   // ref, status, completedAt, amountSent
│       ├── RequestMoneyRequest.java   // recipientPhone, amount, concept
│       ├── RequestMoneyResponse.java  // requestId, status, expiresAt
│       ├── ResolveRequestRequest.java // action: ACCEPTED|REJECTED, otp (si ACCEPTED)
│       └── BizumTransactionDTO.java   // type, amount, phoneMasked, concept, status, timestamp
├── infrastructure/
│   ├── persistence/
│   │   ├── BizumActivationEntity.java      // @Entity bizum_activations
│   │   ├── BizumPaymentEntity.java         // @Entity bizum_payments
│   │   ├── BizumRequestEntity.java         // @Entity bizum_requests
│   │   ├── JpaBizumActivationRepository.java
│   │   ├── JpaBizumPaymentRepository.java
│   │   ├── JpaBizumRequestRepository.java
│   │   └── JpaBizumAdapter.java            // @Primary, implementa los 3 ports
│   ├── corebanking/
│   │   └── CoreBankingMockBizumClient.java  // @Primary, SepaInstantPort — ADR-038
│   └── redis/
│       └── BizumRateLimitAdapter.java       // DEBT-046 — key: ratelimit:{userId}:bizum:{date}
└── api/
    ├── BizumController.java                 // @RestController /api/v1/bizum
    └── BizumExceptionHandler.java           // @ControllerAdvice scope=bizum (LA-TEST-003)
```

---

## Reglas de implementación críticas

### BigDecimal (ADR-034)
```java
// CORRECTO — HALF_EVEN siempre para cantidades monetarias
BigDecimal amount = new BigDecimal("45.00").setScale(2, RoundingMode.HALF_EVEN);

// INCORRECTO
double amount = 45.0;  // NUNCA double/float para dinero
```

### Enmascaramiento de teléfono (RN-F022-09)
```java
public static String maskPhone(String phone) {
    // +34 612 345 678 → +34 *** 5678
    if (phone == null || phone.length() < 4) return "***";
    return phone.substring(0, 3) + " *** " + phone.substring(phone.length() - 4);
}
```

### Rate limit Redis (DEBT-046)
```java
// Key canónico: ratelimit:{userId}:bizum:{yyyy-MM-dd}
String key = String.format("ratelimit:%s:bizum:%s", userId, LocalDate.now(ZoneOffset.UTC));
// TTL: hasta fin del día UTC → BizumRateLimitAdapter calcula segundos restantes
```

### Perfiles Spring (LA-019-08)
```java
// Adaptador real — activo en todos los entornos
@Primary
@Repository
public class JpaBizumAdapter implements BizumPaymentRepositoryPort { ... }

// CoreBanking mock — activo en todos los entornos de STG
@Primary
@Component
public class CoreBankingMockBizumClient implements SepaInstantPort { ... }
// NUNCA @Profile("!production") — causa activación en STG (LA-019-08)
```

### ExceptionHandler (LA-TEST-003)
```java
@RestControllerAdvice(basePackages = "com.experis.sofia.bankportal.bizum")
public class BizumExceptionHandler {
    @ExceptionHandler(BizumLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleLimit(BizumLimitExceededException e) {
        return ResponseEntity.unprocessableEntity().body(new ErrorResponse("LIMIT_EXCEEDED", e.getMessage()));
    }
    @ExceptionHandler(InvalidOtpException.class)  // de paquete twofa — LA-022 precedente
    public ResponseEntity<ErrorResponse> handleOtp(InvalidOtpException e) {
        return ResponseEntity.status(401).body(new ErrorResponse("OTP_INVALID", e.getMessage()));
    }
    // ... todos los tipos de excepción deben tener handler explícito
}
```

### getAttribute JWT (LA-TEST-001)
```java
// CORRECTO — nombre del atributo tal como lo escribe JwtAuthenticationFilter
UUID userId = (UUID) request.getAttribute("authenticatedUserId");
// INCORRECTO
UUID userId = (UUID) request.getAttribute("userId");  // 500 en producción
```

---

## Configuración — application.properties

```properties
# Bizum — límites configurables (RN-F022-04/05, no hardcodeados)
bank.bizum.limit.per-operation=500
bank.bizum.limit.per-day=2000
bank.bizum.request.ttl-hours=24

# STG bypass OTP (ya existente en application-staging.yml)
# totp.stg-bypass-code=123456
```

---

## Tests unitarios obligatorios (G-4)

| Clase test | Casos de prueba |
|---|---|
| BizumLimitServiceTest | TC-001: importe <= 500 OK, TC-002: importe > 500 → excepción, TC-003: daily < 2000 OK, TC-004: daily >= 2000 → excepción, TC-005: reset diario medianoche UTC |
| SendPaymentUseCaseTest | TC-006: happy path COMPLETED, TC-007: OTP inválido → 401, TC-008: límite diario → 422, TC-009: destinatario no registrado → 404, TC-010: saldo insuficiente → 422 |
| RequestMoneyUseCaseTest | TC-011: solicitud creada PENDING, TC-012: aceptar → ACCEPTED + pago ejecutado, TC-013: rechazar → REJECTED, TC-014: expiración 24h → EXPIRED |

*Total estimado: ≥11 tests unitarios*

---

*LLD Backend generado por Architect Agent — SOFIA v2.7 — Step 3 — Sprint 24*

---

## Requisito G-4b — SpringContextIT (LA-020-11 / GR-003)

El Developer Agent **debe verificar** que `SpringContextIT` existe y compila antes de declarar G-4b:

```java
// apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/SpringContextIT.java
@SpringBootTest
class SpringContextIT {
    @Test void contextLoads() { }
}
```

`mvn compile` con BUILD SUCCESS es **bloqueante** para Gate G-4b. Sin esta verificación el gate no se aprueba (GR-003 + GR-004).

Los DEBT-045/046 planificados en este sprint no tienen CVSS asignado (deudas técnicas de arquitectura, no CVEs). GR-010 evaluará `open_debts` en G-9 — en S24 no hay deudas de seguridad pendientes.
