# LLD — FEAT-007: Backend Cuentas y Movimientos
## BankPortal · Banco Meridian · Sprint 9
*SOFIA Architect Agent · 2026-03-19*

## Estructura de paquetes (Clean Architecture)

```
apps/backend-2fa/src/main/java/com/bancomeridian/
└── accounts/
    ├── domain/
    │   ├── Account.java                    // @Entity — id, userId, iban (cifrado AES-256), ibanMasked, alias, type, balance
    │   ├── Transaction.java                // @Entity — id, accountId, date, concept, amount, category, balanceAfter
    │   └── Statement.java                  // @Entity — id, accountId, periodFrom, periodTo, generatedAt, filePath
    ├── application/
    │   ├── AccountService.java             // listAccounts(userId), @Cacheable(30s)
    │   ├── TransactionHistoryUseCase.java  // getPage(accountId, cursor, filters) → cursor-based
    │   ├── TransactionSearchService.java   // search(accountId, query, dateRange) → JPA Specification
    │   ├── StatementGeneratorService.java  // generate(accountId, range) → JasperReports → signed URL
    │   └── CategorySummaryService.java     // getSummary(accountId, period) → top-5 + otros
    ├── infrastructure/
    │   ├── AccountRepository.java          // JpaRepository<Account, UUID>
    │   ├── TransactionRepository.java      // JpaRepository + @Query cursor nativo
    │   ├── TransactionSpecification.java   // Specification<Transaction> para búsqueda dinámica
    │   ├── StatementRepository.java        // JpaRepository<Statement, UUID>
    │   ├── AccountController.java          // GET /api/v1/accounts
    │   ├── TransactionController.java      // GET /api/v1/accounts/{id}/transactions
    │   ├── StatementController.java        // POST /api/v1/accounts/{id}/statements
    │   └── NotificationPurgeJob.java       // @Scheduled cron="0 2 * * *" DELETE > 90d (DEBT-012)
    └── config/
        └── RedisSSEConfig.java             // RedisMessageListenerContainer + MessageListenerAdapter (DEBT-011)
```

## Flyway Migrations

### V10__create_accounts.sql
```sql
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id),
  iban        VARCHAR(500) NOT NULL,         -- cifrado AES-256-GCM (PCI-DSS req. 3.4)
  iban_masked VARCHAR(10) NOT NULL,          -- ****1234
  alias       VARCHAR(100),
  type        VARCHAR(20) NOT NULL CHECK (type IN ('CORRIENTE','AHORRO','NOMINA')),
  balance     DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
```

### V11__create_transactions.sql
```sql
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id      UUID NOT NULL REFERENCES accounts(id),
  date            TIMESTAMP NOT NULL,
  concept         VARCHAR(255) NOT NULL,
  amount          DECIMAL(15,2) NOT NULL,
  balance_after   DECIMAL(15,2) NOT NULL,
  category        VARCHAR(50) DEFAULT 'OTROS',
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Índice para cursor-based pagination (ADR-014)
CREATE INDEX idx_transactions_cursor ON transactions(account_id, date DESC, id DESC);
-- Índice GIN para full-text search (US-703)
CREATE INDEX idx_transactions_concept_fts ON transactions
  USING gin(to_tsvector('spanish', concept));
```

### V12__create_statements.sql
```sql
CREATE TABLE statements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES accounts(id),
  period_from  DATE NOT NULL,
  period_to    DATE NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  file_path    VARCHAR(500)
);
```

## Implementaciones clave

### TransactionRepository — cursor nativo
```java
@Query(value = """
  SELECT * FROM transactions
  WHERE account_id = :accountId
    AND (:cursorDate IS NULL OR (date, id) < (:cursorDate, :cursorId))
  ORDER BY date DESC, id DESC
  LIMIT :limit
  """, nativeQuery = true)
List<Transaction> findWithCursor(
  @Param("accountId") UUID accountId,
  @Param("cursorDate") LocalDateTime cursorDate,
  @Param("cursorId") UUID cursorId,
  @Param("limit") int limit
);
```

### NotificationPurgeJob (DEBT-012)
```java
@Component
public class NotificationPurgeJob {
  @Scheduled(cron = "0 0 2 * * *") // 02:00 UTC diario
  @Transactional
  public void purgeOldNotifications() {
    int deleted = notificationRepository
      .deleteByCreatedAtBefore(LocalDateTime.now().minusDays(90));
    log.info("[DEBT-012] Purged {} notifications older than 90 days", deleted);
  }
}
```

### RedisSSEConfig (DEBT-011)
```java
@Configuration
public class RedisSSEConfig {
  @Bean
  public RedisMessageListenerContainer redisSSEContainer(
      RedisConnectionFactory factory,
      SseEventPublisher publisher) {
    var container = new RedisMessageListenerContainer();
    container.setConnectionFactory(factory);
    // Subscripción dinámica por userId en SseService al conectar
    container.addMessageListener(publisher, new PatternTopic("sse:*"));
    return container;
  }
}
```

*CMMI Level 3 — TS SP 2.1 · TS SP 3.1*
