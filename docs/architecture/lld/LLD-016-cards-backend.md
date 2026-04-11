# LLD Backend — FEAT-016 Gestión de Tarjetas

## Metadata
| Campo | Valor |
|---|---|
| Documento | LLD-016-cards-backend v1.0 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Sprint | 18 · v1.18.0 |
| Autor | SOFIA Architect Agent |
| Fecha | 2026-03-25 |
| CMMI | AD SP 2.1 · AD SP 3.1 |

---

## Flyway Migrations

### V18 — Tabla cards
```sql
CREATE TABLE cards (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id       UUID NOT NULL REFERENCES accounts(id),
    user_id          UUID NOT NULL REFERENCES users(id),
    pan_masked       VARCHAR(19)  NOT NULL,  -- 'XXXX XXXX XXXX 1234'
    card_type        VARCHAR(10)  NOT NULL CHECK (card_type IN ('DEBIT','CREDIT')),
    status           VARCHAR(12)  NOT NULL CHECK (status IN ('ACTIVE','BLOCKED','EXPIRED','CANCELLED')),
    expiration_date  DATE         NOT NULL,
    daily_limit      NUMERIC(15,2) NOT NULL,
    monthly_limit    NUMERIC(15,2) NOT NULL,
    daily_limit_min  NUMERIC(15,2) NOT NULL,
    daily_limit_max  NUMERIC(15,2) NOT NULL,
    monthly_limit_min NUMERIC(15,2) NOT NULL,
    monthly_limit_max NUMERIC(15,2) NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_cards_user_id    ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_status     ON cards(status);

-- SeedData: 2 tarjetas por usuario test
INSERT INTO cards (account_id, user_id, pan_masked, card_type, status, expiration_date,
  daily_limit, monthly_limit, daily_limit_min, daily_limit_max, monthly_limit_min, monthly_limit_max)
SELECT a.id, a.user_id,
  'XXXX XXXX XXXX 1234', 'DEBIT', 'ACTIVE', '2028-12-31',
  1000.00, 5000.00, 100.00, 3000.00, 500.00, 15000.00
FROM accounts a LIMIT 1;
```

### V18b — DROP columnas plain push_subscriptions
```sql
-- Prerequisito: validar que ninguna query usa auth_plain o p256dh_plain
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS auth_plain;
ALTER TABLE push_subscriptions DROP COLUMN IF EXISTS p256dh_plain;
```

### V18c — Tabla shedlock (ADR-028)
```sql
CREATE TABLE shedlock (
    name       VARCHAR(64) NOT NULL PRIMARY KEY,
    lock_until TIMESTAMP   NOT NULL,
    locked_at  TIMESTAMP   NOT NULL,
    locked_by  VARCHAR(255) NOT NULL
);
```

---

## Domain Layer

### Card.java
```java
@Entity
@Table(name = "cards")
public class Card {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID accountId;
    private UUID userId;
    private String panMasked;
    @Enumerated(EnumType.STRING) private CardType cardType;
    @Enumerated(EnumType.STRING) private CardStatus status;
    private LocalDate expirationDate;
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal dailyLimitMin;
    private BigDecimal dailyLimitMax;
    private BigDecimal monthlyLimitMin;
    private BigDecimal monthlyLimitMax;

    public void block() {
        if (this.status != CardStatus.ACTIVE)
            throw new CardNotBlockableException("Card must be ACTIVE to block");
        this.status = CardStatus.BLOCKED;
    }

    public void unblock() {
        if (this.status != CardStatus.BLOCKED)
            throw new CardNotUnblockableException("Card must be BLOCKED to unblock");
        this.status = CardStatus.ACTIVE;
    }

    public void updateLimits(BigDecimal daily, BigDecimal monthly) {
        if (daily.compareTo(dailyLimitMin) < 0 || daily.compareTo(dailyLimitMax) > 0)
            throw new InvalidCardLimitException("daily_limit out of bank range");
        if (monthly.compareTo(monthlyLimitMin) < 0 || monthly.compareTo(monthlyLimitMax) > 0)
            throw new InvalidCardLimitException("monthly_limit out of bank range");
        if (monthly.compareTo(daily) < 0)
            throw new InvalidCardLimitException("MONTHLY_LIMIT_BELOW_DAILY");
        this.dailyLimit = daily;
        this.monthlyLimit = monthly;
    }

    public boolean belongsTo(UUID userId) {
        return this.userId.equals(userId);
    }
}
```

### Ports
```java
public interface CardRepository {
    List<Card> findByUserId(UUID userId);
    Optional<Card> findById(UUID cardId);
    Card save(Card card);
}

public interface CoreBankingPort {
    void changePin(UUID cardId, String newPinHash);
}
```

---

## Application Layer — Use Cases

### BlockCardUseCase.java
```java
@UseCase
@Transactional
public class BlockCardUseCase {
    private final CardRepository cardRepository;
    private final OtpValidationUseCase otpValidation;
    private final AuditLogService auditLog;
    private final WebPushService pushService;
    private final SseBroadcastService sseBroadcast;

    public void execute(UUID cardId, UUID userId, String otpCode) {
        otpValidation.validate(userId, otpCode); // throws InvalidOtpException

        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new CardNotFoundException(cardId));

        if (!card.belongsTo(userId))
            throw new CardAccessDeniedException("IDOR check failed");

        card.block();
        cardRepository.save(card);

        auditLog.log(AuditEvent.CARD_BLOCKED, userId, maskCardId(cardId));
        pushService.sendAsync(userId, NotificationEventType.CARD_BLOCKED);
        sseBroadcast.broadcast(userId, "CARD_BLOCKED", cardId.toString());
    }
}
```

### UnblockCardUseCase / UpdateCardLimitsUseCase / ChangePinUseCase
- Mismo patrón: OTP validation → IDOR check → domain operation → audit + push + SSE
- `ChangePinUseCase`: valida PIN contra regex `^(?!0{4}|1{4}|1234|4321|1111|9999)\\d{4}$`
  luego delega a `CoreBankingPort.changePin(cardId, BCrypt.hash(newPin))`

---

## API Layer — CardController.java

```java
@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardController {

    @GetMapping
    public ResponseEntity<List<CardSummaryDto>> listCards(
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(getCardsUseCase.execute(userId));
    }

    @GetMapping("/{cardId}")
    public ResponseEntity<CardDetailDto> getCard(
        @PathVariable UUID cardId,
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(getCardDetailUseCase.execute(cardId, userId));
    }

    @PostMapping("/{cardId}/block")
    public ResponseEntity<CardStatusDto> blockCard(
        @PathVariable UUID cardId,
        @RequestBody @Valid OtpRequest req,
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        blockCardUseCase.execute(cardId, userId, req.otpCode());
        return ResponseEntity.ok(new CardStatusDto("BLOCKED"));
    }

    @PostMapping("/{cardId}/unblock")
    public ResponseEntity<CardStatusDto> unblockCard(
        @PathVariable UUID cardId,
        @RequestBody @Valid OtpRequest req,
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        unblockCardUseCase.execute(cardId, userId, req.otpCode());
        return ResponseEntity.ok(new CardStatusDto("ACTIVE"));
    }

    @PutMapping("/{cardId}/limits")
    public ResponseEntity<CardLimitsDto> updateLimits(
        @PathVariable UUID cardId,
        @RequestBody @Valid UpdateLimitsRequest req,
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        updateCardLimitsUseCase.execute(cardId, userId, req.dailyLimit(), req.monthlyLimit(), req.otpCode());
        return ResponseEntity.ok(new CardLimitsDto(req.dailyLimit(), req.monthlyLimit()));
    }

    @PostMapping("/{cardId}/pin")
    public ResponseEntity<Void> changePin(
        @PathVariable UUID cardId,
        @RequestBody @Valid ChangePinRequest req,
        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        changePinUseCase.execute(cardId, userId, req.newPin(), req.otpCode());
        return ResponseEntity.ok().build();
    }
}
```

---

## ADR-028 — ShedLock (referencia LLD)

```java
// pom.xml additions
// net.javacrumbs.shedlock:shedlock-spring:5.13.0
// net.javacrumbs.shedlock:shedlock-provider-jdbc-template:5.13.0

@Configuration
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulerLockConfig {
    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build());
    }
}

// En ScheduledTransferExecutorJob:
@Scheduled(cron = "0 * * * * *")
@SchedulerLock(name = "scheduledTransferJob",
    lockAtLeastFor = "PT5M", lockAtMostFor = "PT10M")
public void execute() { ... }
```

---

## DEBT-030 — Paginación findDueTransfers

```java
// Antes (carga completa en memoria)
List<ScheduledTransfer> findDueTransfers(LocalDateTime now);

// Después (paginado en batches de 500)
@Query("SELECT t FROM ScheduledTransfer t WHERE t.nextExecutionDate <= :now AND t.status = 'PENDING'")
Page<ScheduledTransfer> findDueTransfers(@Param("now") LocalDateTime now, Pageable pageable);

// Uso en ScheduledTransferExecutorJob
int page = 0;
Page<ScheduledTransfer> batch;
do {
    batch = repository.findDueTransfers(now, PageRequest.of(page++, 500));
    batch.forEach(this::processTransfer);
} while (batch.hasNext());
```

---

## Test Strategy

| Test | Scope | Casos clave |
|---|---|---|
| `BlockCardUseCaseTest` | Unit | OTP inválido, IDOR, bloqueo ok, ya bloqueada |
| `UpdateCardLimitsUseCaseTest` | Unit | fuera rango, monthly<daily, ok |
| `ChangePinUseCaseTest` | Unit | PIN trivial, OTP inválido, ok |
| `CardControllerIntTest` | Integration | IDOR 403, bloqueo/desbloqueo, límites |
| `ShedLockConcurrencyTest` | Integration @SpringBootTest | 3 hilos — job ejecuta 1 vez |

---

*Generado por SOFIA Architect Agent — Sprint 18 — 2026-03-25*
*BankPortal — Banco Meridian · v1.18.0*
