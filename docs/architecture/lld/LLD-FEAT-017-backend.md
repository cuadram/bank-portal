# LLD Backend — FEAT-017 · Domiciliaciones y Recibos

**BankPortal · Banco Meridian · Sprint 19 · v1.19.0**

| Campo | Valor |
|---|---|
| Feature | FEAT-017 |
| Stack | Java 21 · Spring Boot 3.3.4 · PostgreSQL 16 · Redis 7 |
| Agente | Architect — SOFIA v2.2 |
| Fecha | 2026-03-27T06:29:55.664Z |

---

## Estructura de paquetes — backend-2fa

```
apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/
└── directdebit/                          ← Bounded Context nuevo
    ├── domain/
    │   ├── DebitMandate.java             ← Entidad JPA mandato SEPA
    │   ├── DirectDebit.java              ← Entidad JPA recibo
    │   ├── MandateStatus.java            ← Enum: ACTIVE, CANCELLED, SUSPENDED
    │   ├── DebitStatus.java              ← Enum: PENDING, CHARGED, RETURNED, REJECTED
    │   └── MandateType.java              ← Enum: CORE, B2B
    ├── repository/
    │   ├── DebitMandateRepository.java   ← JpaRepository<DebitMandate, UUID>
    │   └── DirectDebitRepository.java    ← JpaRepository<DirectDebit, UUID>
    ├── service/
    │   ├── DirectDebitQueryService.java  ← US-1702: consultas paginadas
    │   ├── MandateCreateService.java     ← US-1703: alta mandato + OTP + audit
    │   ├── MandateCancelService.java     ← US-1704: cancelación + PSD2 D-2
    │   └── DebitEventHandler.java        ← US-1705: procesamiento eventos cobro
    ├── scheduler/
    │   └── SimulaCobroJob.java           ← ShedLock job: procesa PENDING → CHARGED
    ├── controller/
    │   └── DirectDebitController.java    ← REST endpoints /api/v1/direct-debits/
    ├── dto/
    │   ├── request/
    │   │   ├── CreateMandateRequest.java
    │   │   └── CancelMandateRequest.java
    │   └── response/
    │       ├── MandateResponse.java
    │       ├── MandatePageResponse.java
    │       ├── DirectDebitResponse.java
    │       └── DirectDebitPageResponse.java
    ├── mapper/
    │   ├── MandateMapper.java            ← MapStruct entity → DTO
    │   └── DirectDebitMapper.java
    ├── validator/
    │   └── IbanValidator.java            ← ISO 13616 mod-97, 34 países SEPA
    ├── exception/
    │   ├── MandateDuplicateException.java
    │   ├── MandateCancellationBlockedPsd2Exception.java
    │   └── MandateNotFoundException.java
    └── config/
        ├── DirectDebitConfig.java        ← @Configuration beans
        └── HolidayCalendarService.java   ← Días hábiles Spain + TARGET2
```

---

## Flyway V19 — Migración de base de datos

```sql
-- V19__direct_debits.sql
-- ============================================================
-- FEAT-017: Domiciliaciones y Recibos SEPA DD Core
-- Sprint 19 · BankPortal · Banco Meridian
-- ============================================================

CREATE TYPE mandate_type AS ENUM ('CORE', 'B2B');
CREATE TYPE mandate_status AS ENUM ('ACTIVE', 'CANCELLED', 'SUSPENDED');
CREATE TYPE debit_status AS ENUM ('PENDING', 'CHARGED', 'RETURNED', 'REJECTED');

CREATE TABLE debit_mandates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    creditor_name VARCHAR(140) NOT NULL,
    creditor_iban VARCHAR(34) NOT NULL,
    mandate_ref   VARCHAR(35) NOT NULL,
    mandate_type  mandate_type NOT NULL DEFAULT 'CORE',
    status        mandate_status NOT NULL DEFAULT 'ACTIVE',
    signed_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    cancelled_at  DATE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_mandate_ref UNIQUE (mandate_ref),
    CONSTRAINT uk_active_mandate_per_creditor
        UNIQUE (user_id, creditor_iban, status)
        DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE direct_debits (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id    UUID NOT NULL REFERENCES debit_mandates(id) ON DELETE RESTRICT,
    amount        NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    currency      CHAR(3) NOT NULL DEFAULT 'EUR',
    status        debit_status NOT NULL DEFAULT 'PENDING',
    due_date      DATE NOT NULL,
    charged_at    TIMESTAMPTZ,
    return_reason VARCHAR(4),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de rendimiento
CREATE INDEX idx_dm_user_id        ON debit_mandates(user_id);
CREATE INDEX idx_dm_account_id     ON debit_mandates(account_id);
CREATE INDEX idx_dm_status         ON debit_mandates(status);
CREATE INDEX idx_dd_mandate_id     ON direct_debits(mandate_id);
CREATE INDEX idx_dd_status_due     ON direct_debits(status, due_date);
CREATE INDEX idx_dd_due_date       ON direct_debits(due_date);

COMMENT ON TABLE debit_mandates IS 'SEPA DD Core mandates — FEAT-017 Sprint 19';
COMMENT ON TABLE direct_debits  IS 'SEPA DD debit records per mandate — FEAT-017 Sprint 19';
```

---

## Clases principales

```mermaid
classDiagram
  class DebitMandate {
    +UUID id
    +UUID accountId
    +UUID userId
    +String creditorName
    +String creditorIban
    +String mandateRef
    +MandateType mandateType
    +MandateStatus status
    +LocalDate signedAt
    +LocalDate cancelledAt
    +List~DirectDebit~ debits
    +cancel() void
    +isActive() boolean
  }

  class DirectDebit {
    +UUID id
    +UUID mandateId
    +BigDecimal amount
    +String currency
    +DebitStatus status
    +LocalDate dueDate
    +ZonedDateTime chargedAt
    +String returnReason
    +markCharged() void
    +markReturned(String reason) void
    +markRejected() void
  }

  class MandateCreateService {
    -IbanValidator ibanValidator
    -OtpVerificationService otpService
    -DebitMandateRepository mandateRepo
    -NotificationService notifService
    -CoreBankingAdapter coreBanking
    +createMandate(CreateMandateRequest, userId) MandateResponse
    -generateMandateRef(userId) String
  }

  class MandateCancelService {
    -HolidayCalendarService calendar
    -OtpVerificationService otpService
    -DebitMandateRepository mandateRepo
    -DirectDebitRepository debitRepo
    -NotificationService notifService
    +cancelMandate(mandateId, userId, otp) void
    -checkPsd2D2Rule(mandateId) void
  }

  class IbanValidator {
    -static Set~String~ SEPA_COUNTRIES
    +validate(iban) void
    -mod97(iban) int
    -rearrange(iban) String
  }

  class HolidayCalendarService {
    -Set~LocalDate~ spanishHolidays
    -Set~LocalDate~ target2Holidays
    +getNextBusinessDays(date, n) LocalDate
    +isBusinessDay(date) boolean
  }

  class SimulaCobroJob {
    +@Scheduled processDebits() void
    -processDebit(DirectDebit) void
  }

  DebitMandate ||--o{ DirectDebit : contains
  MandateCreateService --> IbanValidator : uses
  MandateCreateService --> DebitMandate : creates
  MandateCancelService --> HolidayCalendarService : uses
  MandateCancelService --> DebitMandate : updates
  SimulaCobroJob --> DirectDebit : processes
```

---

## DirectDebitController — Endpoints

```java
@RestController
@RequestMapping("/api/v1/direct-debits")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Direct Debits", description = "SEPA DD Core mandates and debits management")
public class DirectDebitController {

    // GET /api/v1/direct-debits/mandates
    @GetMapping("/mandates")
    public ResponseEntity<MandatePageResponse> getMandates(
        @AuthenticationPrincipal JwtAuthPrincipal principal,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) { ... }

    // GET /api/v1/direct-debits/mandates/{id}
    @GetMapping("/mandates/{id}")
    public ResponseEntity<MandateResponse> getMandate(
        @PathVariable UUID id,
        @AuthenticationPrincipal JwtAuthPrincipal principal) { ... }

    // POST /api/v1/direct-debits/mandates
    @PostMapping("/mandates")
    public ResponseEntity<MandateResponse> createMandate(
        @Valid @RequestBody CreateMandateRequest request,
        @AuthenticationPrincipal JwtAuthPrincipal principal) { ... }

    // DELETE /api/v1/direct-debits/mandates/{id}
    @DeleteMapping("/mandates/{id}")
    public ResponseEntity<Void> cancelMandate(
        @PathVariable UUID id,
        @Valid @RequestBody CancelMandateRequest request,
        @AuthenticationPrincipal JwtAuthPrincipal principal) { ... }

    // GET /api/v1/direct-debits/debits
    @GetMapping("/debits")
    public ResponseEntity<DirectDebitPageResponse> getDebits(
        @AuthenticationPrincipal JwtAuthPrincipal principal,
        @RequestParam(required = false) DebitStatus status,
        @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DATE) LocalDate to,
        @RequestParam(required = false) UUID mandateId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") @Max(50) int size) { ... }

    // GET /api/v1/direct-debits/debits/{id}
    @GetMapping("/debits/{id}")
    public ResponseEntity<DirectDebitResponse> getDebit(
        @PathVariable UUID id,
        @AuthenticationPrincipal JwtAuthPrincipal principal) { ... }
}
```

---

## IbanValidator — Algoritmo ISO 13616 mod-97

```java
@Component
public class IbanValidator {

    private static final Set<String> SEPA_COUNTRIES = Set.of(
        "AD","AT","BE","BG","CH","CY","CZ","DE","DK","EE",
        "ES","FI","FR","GB","GI","GR","HR","HU","IE","IS",
        "IT","LI","LT","LU","LV","MC","MT","NL","NO","PL",
        "PT","RO","SE","SI","SK","SM","VA"
    ); // 34 países SEPA EPC

    public void validate(String iban) {
        if (iban == null || iban.length() < 5 || iban.length() > 34)
            throw new InvalidIbanException("IBAN length invalid");
        String cleaned = iban.replaceAll("\\s", "").toUpperCase();
        if (!SEPA_COUNTRIES.contains(cleaned.substring(0, 2)))
            throw new InvalidIbanException("Country not in SEPA zone");
        if (mod97(cleaned) != 1)
            throw new InvalidIbanException("IBAN checksum failed (mod-97)");
    }

    private int mod97(String iban) {
        String rearranged = iban.substring(4) + iban.substring(0, 4);
        StringBuilder numeric = new StringBuilder();
        for (char c : rearranged.toCharArray()) {
            if (Character.isLetter(c)) numeric.append(c - 'A' + 10);
            else numeric.append(c);
        }
        BigInteger value = new BigInteger(numeric.toString());
        return value.mod(BigInteger.valueOf(97)).intValue();
    }
}
```

---

## HolidayCalendarService — Regla PSD2 D-2

```java
@Service
public class HolidayCalendarService {

    // Festivos nacionales España 2026 (mock Sprint 19)
    private static final Set<LocalDate> HOLIDAYS_2026 = Set.of(
        LocalDate.of(2026, 1, 1),   // Año Nuevo
        LocalDate.of(2026, 1, 6),   // Reyes
        LocalDate.of(2026, 4, 3),   // Viernes Santo
        LocalDate.of(2026, 5, 1),   // Día del Trabajo
        LocalDate.of(2026, 8, 15),  // Asunción
        LocalDate.of(2026, 10, 12), // Fiesta Nacional
        LocalDate.of(2026, 11, 1),  // Todos los Santos
        LocalDate.of(2026, 12, 6),  // Constitución
        LocalDate.of(2026, 12, 8),  // Inmaculada
        LocalDate.of(2026, 12, 25)  // Navidad
    );

    public LocalDate getBusinessDayCutoff(LocalDate from, int businessDays) {
        LocalDate date = from;
        int counted = 0;
        while (counted < businessDays) {
            date = date.plusDays(1);
            if (isBusinessDay(date)) counted++;
        }
        return date;
    }

    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow != DayOfWeek.SATURDAY
            && dow != DayOfWeek.SUNDAY
            && !HOLIDAYS_2026.contains(date);
    }
}
```

---

## SimulaCobroJob — Scheduler ShedLock

```java
@Component
@Slf4j
public class SimulaCobroJob {

    @Autowired DirectDebitRepository debitRepo;
    @Autowired DebitEventHandler eventHandler;

    @Scheduled(cron = "0 0 8 * * MON-FRI")  // 08:00 días hábiles
    @SchedulerLock(name = "SimulaCobroJob",
                   lockAtMostFor = "PT30M",
                   lockAtLeastFor = "PT5M")
    public void processDebits() {
        List<DirectDebit> pending = debitRepo
            .findByStatusAndDueDateLessThanEqual(PENDING, LocalDate.now());
        log.info("[SimulaCobroJob] Processing {} pending debits", pending.size());
        pending.forEach(eventHandler::process);
    }
}
```

---

## DEBT-031 — Rate limiting /cards/{id}/pin (Bucket4j)

```java
// RateLimitingFilter.java — extensión para endpoint PIN
// Bucket: 3 intentos / hora por cardId + userId
// Al superar: 429 + bloqueo temporal 24h + push + audit MANDATE_RATE_LIMIT_EXCEEDED

@Bean
public Bucket buildPinBucket(String cardId, String userId) {
    Bandwidth limit = Bandwidth.classic(3, Refill.intervally(3, Duration.ofHours(1)));
    return Bucket.builder().addLimit(limit).build();
}
// Clave Redis: rate:pin:{cardId}:{userId} → TTL 1h
```

---

*Architect Agent · CMMI TS SP 2.1, 2.2 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19*