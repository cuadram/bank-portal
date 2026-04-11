# LLD Backend — FEAT-021: Depósitos a Plazo Fijo
**Sprint 23 · BankPortal · Banco Meridian · Architect Agent · SOFIA v2.7**

---

## 1. Estructura de paquetes

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/
└── deposit/
    ├── domain/
    │   ├── model/
    │   │   ├── Deposit.java               ← entidad de dominio
    │   │   ├── DepositApplication.java    ← solicitud de apertura
    │   │   ├── DepositStatus.java         ← enum: ACTIVE, MATURED, CANCELLED
    │   │   └── RenewalInstruction.java    ← enum: RENEW_AUTO, RENEW_MANUAL, CANCEL_AT_MATURITY
    │   ├── service/
    │   │   ├── DepositSimulatorService.java   ← cálculo TIN/IRPF/neto (BigDecimal)
    │   │   ├── IrpfRetentionCalculator.java   ← tramos Art.25 Ley 35/2006
    │   │   └── PenaltyCalculator.java         ← penalización cancelación anticipada
    │   ├── exception/
    │   │   ├── DepositNotFoundException.java
    │   │   ├── DepositAccessDeniedException.java
    │   │   ├── DepositNotCancellableException.java
    │   │   └── DepositSimulationException.java
    │   └── repository/
    │       ├── DepositRepositoryPort.java
    │       └── DepositApplicationRepositoryPort.java
    ├── application/
    │   ├── usecase/
    │   │   ├── ListDepositsUseCase.java
    │   │   ├── GetDepositDetailUseCase.java
    │   │   ├── SimulateDepositUseCase.java
    │   │   ├── OpenDepositUseCase.java
    │   │   ├── SetRenewalInstructionUseCase.java
    │   │   └── CancelDepositUseCase.java
    │   └── dto/
    │       ├── SimulateDepositRequest.java
    │       ├── SimulationResponse.java
    │       ├── OpenDepositRequest.java
    │       ├── DepositResponse.java
    │       ├── DepositSummaryDTO.java
    │       ├── DepositDetailDTO.java
    │       ├── RenewalRequest.java
    │       └── CancellationResult.java
    ├── infrastructure/
    │   ├── persistence/
    │   │   ├── DepositEntity.java
    │   │   ├── DepositApplicationEntity.java
    │   │   ├── JpaDepositRepository.java       ← interface Spring Data JPA
    │   │   └── JpaDepositAdapter.java          ← @Primary, implementa port
    │   └── corebanking/
    │       └── CoreBankingMockDepositClient.java  ← patrón ADR-035
    └── api/
        ├── DepositController.java
        └── DepositExceptionHandler.java        ← @ControllerAdvice (LA-TEST-003)
```

---

## 2. Modelo de dominio detallado

### Deposit.java
```java
public class Deposit {
    private UUID id;
    private UUID userId;
    private BigDecimal importe;        // NUMERIC(15,2)
    private int plazoMeses;            // 1–60
    private BigDecimal tin;            // desde @Value — NUNCA hardcodeado (DEBT-044)
    private BigDecimal tae;
    private DepositStatus estado;      // ACTIVE | MATURED | CANCELLED
    private RenewalInstruction renovacion; // default RENEW_MANUAL (RN-F021-07)
    private UUID cuentaOrigenId;
    private LocalDate fechaApertura;
    private LocalDate fechaVencimiento;
    private BigDecimal penalizacion;   // null si no cancelado anticipadamente
    private Instant createdAt;
    private Instant updatedAt;
}
```

### DepositStatus.java
```java
public enum DepositStatus { ACTIVE, MATURED, CANCELLED }
```

### RenewalInstruction.java
```java
public enum RenewalInstruction { RENEW_AUTO, RENEW_MANUAL, CANCEL_AT_MATURITY }
```

---

## 3. Servicios de dominio

### DepositSimulatorService.java
```java
// @Value("${bank.products.deposit.tin}") BigDecimal tin — DEBT-044
// @Value("${bank.products.deposit.tae}") BigDecimal tae
public SimulationResult calcular(BigDecimal importe, int plazoMeses) {
    BigDecimal interesesBrutos = importe
        .multiply(tin)
        .multiply(BigDecimal.valueOf(plazoMeses).divide(BigDecimal.valueOf(12), 10, HALF_EVEN))
        .setScale(2, HALF_EVEN);                          // ADR-036 — BigDecimal HALF_EVEN
    BigDecimal retencion = irpfCalculator.calcular(interesesBrutos);
    BigDecimal interesesNetos = interesesBrutos.subtract(retencion).setScale(2, HALF_EVEN);
    BigDecimal totalVencimiento = importe.add(interesesNetos).setScale(2, HALF_EVEN);
    return new SimulationResult(tin, tae, interesesBrutos, retencion, interesesNetos, totalVencimiento);
}
```

### IrpfRetentionCalculator.java — tramos Art.25 Ley 35/2006
```java
// Tramo 1: 19% si interesesBrutos <= 6.000 €
// Tramo 2: 21% si interesesBrutos <= 50.000 €
// Tramo 3: 23% si interesesBrutos > 50.000 €
public BigDecimal calcular(BigDecimal interesesBrutos) {
    BigDecimal rate = interesesBrutos.compareTo(new BigDecimal("6000")) <= 0
        ? new BigDecimal("0.19")
        : interesesBrutos.compareTo(new BigDecimal("50000")) <= 0
            ? new BigDecimal("0.21")
            : new BigDecimal("0.23");
    return interesesBrutos.multiply(rate).setScale(2, HALF_EVEN);
}
```

### PenaltyCalculator.java
```java
// @Value("${bank.products.deposit.penalty-rate}") BigDecimal penaltyRate  (default 0.25)
public BigDecimal calcular(BigDecimal interesesDevengados) {
    return interesesDevengados.multiply(penaltyRate).setScale(2, HALF_EVEN);
}
```

---

## 4. Puertos de dominio

### DepositRepositoryPort.java
```java
public interface DepositRepositoryPort {
    List<Deposit> findByUserId(UUID userId, Pageable pageable);
    Optional<Deposit> findById(UUID id);
    Deposit save(Deposit deposit);
    Deposit update(Deposit deposit);
}
```

### DepositApplicationRepositoryPort.java
```java
public interface DepositApplicationRepositoryPort {
    DepositApplication save(DepositApplication application);
    Optional<DepositApplication> findByIdAndUserId(UUID id, UUID userId);
}
```

---

## 5. Use Cases — firmas

```java
// ListDepositsUseCase
Page<DepositSummaryDTO> execute(UUID userId, Pageable pageable);

// GetDepositDetailUseCase
DepositDetailDTO execute(UUID depositId, UUID userId);
// throws DepositNotFoundException, DepositAccessDeniedException

// SimulateDepositUseCase  ← sin autenticación (RN-F021-03)
SimulationResponse execute(SimulateDepositRequest request);
// validates: importe >= 1000, plazo 1..60

// OpenDepositUseCase
DepositResponse execute(OpenDepositRequest request, UUID userId);
// OtpValidationUseCase.validate() ANTES de persistir (LA-TEST-003)
// throws InvalidOtpException, InsufficientFundsException

// SetRenewalInstructionUseCase
DepositResponse execute(UUID depositId, UUID userId, RenewalInstruction instruction);
// throws DepositNotFoundException, DepositAccessDeniedException, DepositNotCancellableException

// CancelDepositUseCase
CancellationResult execute(UUID depositId, UUID userId, String otp);
// OtpValidationUseCase.validate() ANTES de cancelar
// throws DepositNotCancellableException si estado != ACTIVE
```

---

## 6. Estrategia de perfiles Spring (LA-019-08)

```
JpaDepositAdapter            → @Primary, sin @Profile → activo en dev/stg/prod
CoreBankingMockDepositClient → sin @Profile (patrón ADR-035) → único client disponible
MockDepositAdapter           → @Profile("mock") → solo en tests unitarios
```

---

## 7. DepositExceptionHandler.java (LA-TEST-003)

```java
@ControllerAdvice(assignableTypes = DepositController.class)
public class DepositExceptionHandler {
    @ExceptionHandler(DepositNotFoundException.class)
    ResponseEntity<?> handle(DepositNotFoundException e)        { return 404; }
    @ExceptionHandler(DepositAccessDeniedException.class)
    ResponseEntity<?> handle(DepositAccessDeniedException e)    { return 403; }
    @ExceptionHandler(DepositNotCancellableException.class)
    ResponseEntity<?> handle(DepositNotCancellableException e)  { return 409; }
    @ExceptionHandler(DepositSimulationException.class)
    ResponseEntity<?> handle(DepositSimulationException e)      { return 400; }
    @ExceptionHandler(InvalidOtpException.class)
    ResponseEntity<?> handle(InvalidOtpException e)             { return 401; }
    @ExceptionHandler(InsufficientFundsException.class)
    ResponseEntity<?> handle(InsufficientFundsException e)      { return 422; }
}
```

---

## 8. CoreBankingMockDepositClient.java (ADR-037, patrón ADR-035)

```java
@Component
public class CoreBankingMockDepositClient {
    public void registrarApertura(UUID depositId, UUID userId, BigDecimal importe) {
        // Mock determinista — log de auditoría
        log.info("[CoreBanking-Mock] APERTURA depositId={} userId={} importe={}", ...);
    }
    public void registrarCancelacion(UUID depositId, BigDecimal importeAbonado) {
        log.info("[CoreBanking-Mock] CANCELACION depositId={} importeAbonado={}", ...);
    }
}
```

---

## 9. Flyway — V26__deposits.sql

```sql
-- V26 — FEAT-021 Depósitos a Plazo Fijo
-- Sprint 23 · BankPortal · Banco Meridian · 2026-04-06

CREATE TABLE IF NOT EXISTS deposits (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID          NOT NULL,
  importe            NUMERIC(15,2) NOT NULL,
  plazo_meses        INTEGER       NOT NULL,
  tin                NUMERIC(10,6) NOT NULL,
  tae                NUMERIC(10,6) NOT NULL,
  estado             VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
  renovacion         VARCHAR(30)   NOT NULL DEFAULT 'RENEW_MANUAL',
  cuenta_origen_id   UUID          NOT NULL,
  fecha_apertura     DATE          NOT NULL,
  fecha_vencimiento  DATE          NOT NULL,
  penalizacion       NUMERIC(15,2),
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_estado  ON deposits(estado);
CREATE INDEX IF NOT EXISTS idx_deposits_vencimiento ON deposits(fecha_vencimiento);

CREATE TABLE IF NOT EXISTS deposit_applications (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL,
  importe          NUMERIC(15,2) NOT NULL,
  plazo_meses      INTEGER       NOT NULL,
  cuenta_origen_id UUID          NOT NULL,
  renovacion       VARCHAR(30)   NOT NULL DEFAULT 'RENEW_MANUAL',
  estado           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  otp_verified     BOOLEAN       NOT NULL DEFAULT FALSE,
  deposit_id       UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dep_apps_user_id ON deposit_applications(user_id);

-- Seed STG: 2 depósitos activos para usuario de pruebas
DO $$
DECLARE v_user UUID := '11111111-1111-1111-1111-111111111111';
        v_acc  UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  INSERT INTO deposits
    (user_id, importe, plazo_meses, tin, tae, estado, renovacion,
     cuenta_origen_id, fecha_apertura, fecha_vencimiento)
  VALUES
    (v_user, 10000.00, 12, 0.032500, 0.033000, 'ACTIVE', 'RENEW_MANUAL',
     v_acc, '2026-04-01', '2027-04-01'),
    (v_user,  5000.00,  6, 0.030000, 0.030400, 'ACTIVE', 'RENEW_AUTO',
     v_acc, '2026-04-01', '2026-10-01')
  ON CONFLICT DO NOTHING;
END $$;
```

---

## 10. Mapa de tipos BD → Java (LA-019-13)

### Tabla: deposits

| Columna | Tipo PostgreSQL | Tipo Java | Notas |
|---|---|---|---|
| id | uuid | UUID | `rs.getObject("id", UUID.class)` |
| user_id | uuid | UUID | FK — UUID, no String |
| importe | numeric(15,2) | BigDecimal | NO double/float |
| plazo_meses | integer | int | |
| tin | numeric(10,6) | BigDecimal | 6 decimales para precisión intermedia |
| tae | numeric(10,6) | BigDecimal | |
| estado | varchar(20) | DepositStatus | `DepositStatus.valueOf(rs.getString("estado"))` |
| renovacion | varchar(30) | RenewalInstruction | `RenewalInstruction.valueOf(...)` |
| cuenta_origen_id | uuid | UUID | |
| fecha_apertura | date | LocalDate | NO Instant — DATE sin timezone |
| fecha_vencimiento | date | LocalDate | NO Instant — DATE sin timezone |
| penalizacion | numeric(15,2) | BigDecimal | nullable |
| created_at | timestamptz | Instant | WITH timezone → Instant correcto |
| updated_at | timestamptz | Instant | WITH timezone → Instant correcto |

**REGLA:** `DATE` → `LocalDate`. `TIMESTAMPTZ` → `Instant`. `NUMERIC` → `BigDecimal`. Sin excepciones (LA-019-13).

---

## 11. application.properties — nuevas propiedades (DEBT-044)

```properties
# Depósitos a plazo fijo — FEAT-021
bank.products.deposit.tin=0.0325
bank.products.deposit.tae=0.0330
bank.products.deposit.penalty-rate=0.25
bank.products.deposit.min-amount=1000
bank.products.deposit.max-plazo-meses=60

# Préstamos — externalizado (DEBT-044)
bank.products.loan.tae=0.0695
```

---

## 12. Deuda técnica — cambios colaterales (Step 4)

| Deuda | Archivo | Cambio |
|---|---|---|
| DEBT-044 | `AmortizationCalculator.java` | Añadir `@Value("${bank.products.loan.tae}")` — eliminar constante |
| DEBT-044 | `DepositSimulatorService.java` | Desde creación: `@Value("${bank.products.deposit.tin}")` |
| DEBT-036 | `ExportAuditService.java` | Inyectar `AccountRepositoryPort` — resolver IBAN real |
| DEBT-037 | `CardValidationService.java` | Actualizar regex PAN: `^[0-9]{13,19}$` + Luhn |

---

*LLD Backend generado por Architect Agent — SOFIA v2.7 — Sprint 23 — 2026-04-06*
