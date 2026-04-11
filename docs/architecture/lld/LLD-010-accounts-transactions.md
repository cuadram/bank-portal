# LLD-010 — Consulta de Cuentas y Movimientos
## FEAT-007: US-701 / US-702 / US-703 / US-704 / US-705 + DEBT-011 / DEBT-012
*SOFIA Architect Agent · Sprint 9 · 2026-03-17*

---

## 1. Visión general de la arquitectura

FEAT-007 introduce la épica de Operaciones Bancarias sobre la misma arquitectura hexagonal
establecida en FEAT-001→006. El patron clave es el **adaptador sellado**: `AccountRepositoryPort`
abstrae el acceso al core bancario de forma que Sprint 9 usa un mock y Sprint 10 conecta
el adaptador real sin cambiar ningún use case.

```
Angular 17                    Spring Boot (Backend)                   Infra
──────────────────────────────────────────────────────────────────────────────
AccountSummaryComponent       AccountController                       PostgreSQL
TransactionListComponent  ──► TransactionController           ──►    (V10 + GIN)
StatementExportComponent      StatementController
                                    │
                              AccountSummaryUseCase               Redis
                              TransactionHistoryUseCase   ──►    (Pub/Sub ADR-014
                              StatementExportUseCase              + Blacklist)
                              TransactionCategorizationService
                                    │
                              AccountRepositoryPort (puerto)
                                    │
                        ┌───────────┴───────────┐
                MockAccountRepositoryAdapter   CoreBankingAccountAdapter
                (@Profile "!production")       (@Profile "production")
                Sprint 9: datos Flyway V10     Sprint 10: API core bancario
```

---

## 2. DEBT-011 — Redis Pub/Sub para SSE escalado horizontal

### Componentes nuevos (ADR-014)

```java
// 1. RedisPubSubConfig — ya detallado en ADR-014

// 2. SseRedisSubscriber — ya detallado en ADR-014

// 3. SseEventPublisher — punto único de publicación SSE
//    Reemplaza todos los sseRegistry.send() directos

// 4. SseRegistry.sendToAll() — nuevo método para broadcast global
public void sendToAll(SseEvent event) {
    registry.forEach((userId, emitter) -> {
        try {
            emitter.send(SseEmitter.event()
                    .id(event.id()).name(event.type()).data(event.payload()));
        } catch (IOException e) {
            registry.remove(userId, emitter);
        }
    });
}
```

### Cambios en clases existentes

| Clase | Cambio | Motivo |
|---|---|---|
| `NotificationDomainEventPublisher` | `sseRegistry.send()` → `sseEventPublisher.publishToUser()` | ADR-014 |
| `MarkNotificationsUseCase` | ídem | ADR-014 |
| `SseNotificationController` | Usar `SseEventPublisher` para evento inicial unread-count | ADR-014 |
| `NotificationPurgeJob` | Nuevo — ver DEBT-012 | DEBT-012 |

---

## 3. DEBT-012 — Job nocturno purga notificaciones

```java
/**
 * DEBT-012 — Purga automática de user_notifications con más de 90 días.
 * Ejecuta a las 02:00 UTC diariamente.
 * Idempotente: sin filas → log "0 purgadas", sin fallo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationPurgeJob {

    private final NotificationRepository notificationRepository;
    private final MeterRegistry          meterRegistry;

    @Scheduled(cron = "0 0 2 * * *")   // 02:00 UTC
    @Transactional
    public void purgeOldNotifications() {
        Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
        long start = System.currentTimeMillis();

        int deleted = notificationRepository.deleteOlderThan(cutoff);

        long elapsed = System.currentTimeMillis() - start;
        log.info("[DEBT-012] purge.notifications.count={} elapsed={}ms cutoff={}",
                deleted, elapsed, cutoff);
        meterRegistry.counter("notifications.purged.total").increment(deleted);
    }
}
```

```java
// En NotificationRepository
@Modifying
@Query("DELETE FROM user_notifications WHERE created_at < :cutoff")
int deleteOlderThan(@Param("cutoff") Instant cutoff);
```

---

## 4. Flyway V10 — Tablas bancarias + datos mock

```sql
-- V10__account_transactions.sql

-- Cuentas bancarias del usuario
CREATE TABLE accounts (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias        VARCHAR(100) NOT NULL,
    iban         VARCHAR(34)  NOT NULL,
    type         VARCHAR(20)  NOT NULL CHECK (type IN ('CORRIENTE','AHORRO','NOMINA')),
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                              CHECK (status IN ('ACTIVE','INACTIVE','BLOCKED')),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Saldos — separados de accounts para actualización frecuente sin lock en tabla principal
CREATE TABLE account_balances (
    account_id        UUID          PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    retained_balance  DECIMAL(15,2) NOT NULL DEFAULT 0,
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Movimientos — tabla principal de FEAT-007
CREATE TABLE transactions (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id       UUID          NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP     NOT NULL,
    concept          VARCHAR(500)  NOT NULL,
    amount           DECIMAL(15,2) NOT NULL,   -- negativo=cargo, positivo=abono
    balance_after    DECIMAL(15,2) NOT NULL,
    category         VARCHAR(50)   NOT NULL DEFAULT 'OTRO',
    type             VARCHAR(20)   NOT NULL CHECK (type IN ('CARGO','ABONO')),
    created_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Índice principal: historial paginado por cuenta (US-702)
CREATE INDEX idx_transactions_account_date
    ON transactions(account_id, transaction_date DESC);

-- Índice full-text para búsqueda por concepto (US-703)
-- Requiere extension pg_trgm (habilitada en V1 o aquí):
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_transactions_concept_gin
    ON transactions USING gin(concept gin_trgm_ops);

-- Datos mock: 2 cuentas + 200 movimientos por cuenta
-- (generados por MockAccountRepositoryAdapter en @Profile("!production"))
-- No se insertan en Flyway para evitar datos sensibles en migraciones de producción
```

---

## 5. Puerto e Implementaciones — AccountRepositoryPort

```java
/**
 * Puerto de acceso al core bancario.
 * Implementaciones:
 *   - MockAccountRepositoryAdapter  (@Profile "!production") — Sprint 9
 *   - CoreBankingAccountAdapter     (@Profile "production")  — Sprint 10
 */
public interface AccountRepositoryPort {

    /** Cuentas del usuario con saldo. */
    List<AccountSummaryDto> findByUserId(UUID userId);

    /** Movimientos paginados con filtros combinables. */
    Page<TransactionDto> findTransactions(
            UUID accountId,
            TransactionFilter filter,
            Pageable pageable);

    /** Saldo actualizado de una cuenta. */
    Optional<AccountBalanceDto> getBalance(UUID accountId);
}

// --- DTOs ---

public record AccountSummaryDto(
    UUID   accountId,
    String alias,
    String ibanMasked,          // "ES91 **** **** **** 1234"
    String type,
    BigDecimal availableBalance,
    BigDecimal retainedBalance
) {}

public record TransactionDto(
    UUID       id,
    Instant    transactionDate,
    String     concept,
    BigDecimal amount,
    BigDecimal balanceAfter,
    String     category,
    String     type             // "CARGO" | "ABONO"
) {}

public record AccountBalanceDto(
    UUID       accountId,
    BigDecimal availableBalance,
    BigDecimal retainedBalance,
    Instant    updatedAt
) {}

// --- Filtro para US-702 / US-703 ---

public record TransactionFilter(
    Instant    from,
    Instant    to,
    String     type,            // null = todos
    BigDecimal minAmount,
    BigDecimal maxAmount,
    String     searchQuery      // null = sin búsqueda full-text (US-703)
) {
    public static TransactionFilter empty() {
        return new TransactionFilter(null, null, null, null, null, null);
    }
}
```

---

## 6. Use Cases — Backend

### 6.1 AccountSummaryUseCase (US-701)

```java
@UseCase
@RequiredArgsConstructor
@Slf4j
public class AccountSummaryUseCase {

    private final AccountRepositoryPort accountRepository;
    private final AuditLogPort          auditLog;

    @Transactional(readOnly = true)
    public List<AccountSummaryDto> getSummary(UUID userId, String ipAddress) {
        List<AccountSummaryDto> accounts = accountRepository.findByUserId(userId);

        auditLog.record(AuditLogEntry.builder()
                .userId(userId)
                .eventType(SecurityEventType.ACCOUNT_BALANCE_VIEWED)
                .ipAddress(maskIp(ipAddress))
                .metadata(Map.of("accountCount", accounts.size()))
                .build());

        return accounts;
    }

    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        int last = ip.lastIndexOf('.');
        return last > 0 ? ip.substring(0, last) + ".xxx" : ip;
    }
}
```

### 6.2 TransactionHistoryUseCase (US-702 + US-703)

```java
@UseCase
@RequiredArgsConstructor
public class TransactionHistoryUseCase {

    private final AccountRepositoryPort accountRepository;

    private static final int MAX_PAGE_SIZE = 100;

    @Transactional(readOnly = true)
    @Cacheable(value = "transactions",
               key = "#accountId + '_' + #filter.hashCode() + '_' + #pageable.pageNumber")
    public Page<TransactionDto> getTransactions(
            UUID accountId,
            TransactionFilter filter,
            Pageable pageable) {

        // Limitar page size para evitar queries masivos
        Pageable bounded = PageRequest.of(
                pageable.getPageNumber(),
                Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
                Sort.by("transactionDate").descending());

        return accountRepository.findTransactions(accountId, filter, bounded);
    }

    // Invalidar caché cuando llega evento SSE de nuevo movimiento
    @CacheEvict(value = "transactions", key = "#accountId + '_*'")
    public void invalidateCache(UUID accountId) { /* vacío — solo evict */ }
}
```

### 6.3 StatementExportUseCase (US-704)

```java
@UseCase
@RequiredArgsConstructor
@Slf4j
public class StatementExportUseCase {

    private final AccountRepositoryPort accountRepository;
    private final AuditLogPort          auditLog;

    private static final int MAX_TRANSACTIONS_PER_STATEMENT = 500;

    /**
     * Genera el extracto en el formato indicado.
     * @return Optional.empty() si no hay movimientos en el período (→ HTTP 204)
     */
    @Async
    public CompletableFuture<Optional<StatementResult>> export(
            UUID userId, UUID accountId,
            int year, int month, String format) {

        Instant from = YearMonth.of(year, month)
                .atDay(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant to   = YearMonth.of(year, month)
                .atEndOfMonth().atTime(23, 59, 59).toInstant(ZoneOffset.UTC);

        TransactionFilter filter = new TransactionFilter(from, to,
                null, null, null, null);
        Pageable page = PageRequest.of(0, MAX_TRANSACTIONS_PER_STATEMENT,
                Sort.by("transactionDate").ascending());

        Page<TransactionDto> transactions =
                accountRepository.findTransactions(accountId, filter, page);

        if (transactions.isEmpty()) return CompletableFuture.completedFuture(Optional.empty());

        List<AccountSummaryDto> accounts = accountRepository.findByUserId(userId);
        AccountSummaryDto account = accounts.stream()
                .filter(a -> a.accountId().equals(accountId))
                .findFirst()
                .orElseThrow(() -> new AccountNotFoundException(accountId));

        byte[] content = "pdf".equalsIgnoreCase(format)
                ? generatePdf(account, transactions.getContent(), year, month)
                : generateCsv(transactions.getContent());

        String hash = sha256Hex(content);
        String filename = String.format("extracto-%s-%04d-%02d.%s",
                account.ibanMasked().replaceAll("\\s",""), year, month, format.toLowerCase());

        auditLog.record(AuditLogEntry.builder()
                .userId(userId)
                .eventType(SecurityEventType.STATEMENT_DOWNLOADED)
                .metadata(Map.of(
                        "accountId", accountId,
                        "period", year + "-" + month,
                        "format", format,
                        "hash", hash))
                .build());

        return CompletableFuture.completedFuture(
                Optional.of(new StatementResult(content, filename, hash, format)));
    }

    private byte[] generatePdf(AccountSummaryDto account,
                                List<TransactionDto> txs, int year, int month) {
        // Plantilla corporativa Banco Meridian — #1B3A6B header, Arial
        // Patrón: ExportSecurityHistoryUseCase (FEAT-005 US-402)
        Document doc = new Document(PageSize.A4);
        // ... (ver patrón LLD-006 / FEAT-005 para el builder OpenPDF)
        return buildPdf(doc, account, txs, year, month);
    }

    private byte[] generateCsv(List<TransactionDto> txs) {
        // UTF-8 BOM para compatibilidad Excel
        StringBuilder sb = new StringBuilder("\uFEFF");
        sb.append("fecha;concepto;importe;saldo_tras_movimiento;categoria\n");
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                .withZone(ZoneOffset.UTC);
        for (TransactionDto tx : txs) {
            sb.append(fmt.format(tx.transactionDate())).append(";")
              .append(tx.concept().replace(";", ",")).append(";")
              .append(tx.amount()).append(";")
              .append(tx.balanceAfter()).append(";")
              .append(tx.category()).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (NoSuchAlgorithmException e) { throw new RuntimeException(e); }
    }

    public record StatementResult(
            byte[] content, String filename, String sha256, String format) {}
}
```

### 6.4 TransactionCategorizationService (US-705)

```java
/**
 * US-705 — Categorización automática de movimientos por reglas keyword.
 * Sprint 9: reglas simples case-insensitive sobre concept.
 * Sprint futuro (FEAT-010): ML-based.
 */
@Service
public class TransactionCategorizationService {

    public enum TransactionCategory {
        NOMINA, TRANSFERENCIA, COMPRA, DOMICILIACION,
        CAJERO, COMISION, DEVOLUCION, BIZUM, RECIBO_UTIL, OTRO
    }

    // Orden importa: primero la regla más específica
    private static final List<Map.Entry<List<String>, TransactionCategory>> RULES = List.of(
        entry(List.of("nomina","salary","sueldo","haberes"),   TransactionCategory.NOMINA),
        entry(List.of("bizum"),                                 TransactionCategory.BIZUM),
        entry(List.of("transferencia","transfer","trnsf"),      TransactionCategory.TRANSFERENCIA),
        entry(List.of("cajero","atm","efectivo","reintegro"),   TransactionCategory.CAJERO),
        entry(List.of("devolucion","devol","refund","reembolso"),TransactionCategory.DEVOLUCION),
        entry(List.of("comision","com.","mantenimiento cuenta"), TransactionCategory.COMISION),
        entry(List.of("recibo","domicil","suministro","factura",
                      "electricidad","agua","gas","telefono",
                      "internet","seguro"),                     TransactionCategory.DOMICILIACION),
        entry(List.of("compra","pago","tpv","pos"),             TransactionCategory.COMPRA),
        entry(List.of("luz","agua","gas","telef","vodafone",
                      "movistar","orange","endesa","iberdrola"), TransactionCategory.RECIBO_UTIL)
    );

    public TransactionCategory categorize(String concept) {
        if (concept == null) return TransactionCategory.OTRO;
        String lower = concept.toLowerCase();
        return RULES.stream()
                .filter(e -> e.getKey().stream().anyMatch(lower::contains))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(TransactionCategory.OTRO);
    }

    private static Map.Entry<List<String>, TransactionCategory> entry(
            List<String> keywords, TransactionCategory cat) {
        return Map.entry(keywords, cat);
    }
}
```

---

## 7. Controllers — Backend API

```java
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountSummaryUseCase    summaryUseCase;
    private final TransactionHistoryUseCase historyUseCase;
    private final StatementExportUseCase   exportUseCase;

    /** US-701 — Resumen de cuentas */
    @GetMapping
    public ResponseEntity<List<AccountSummaryDto>> getAccounts(
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(summaryUseCase.getSummary(userId, request.getRemoteAddr()));
    }

    /** US-702 + US-703 — Movimientos paginados con filtros y búsqueda */
    @GetMapping("/{accountId}/transactions")
    public ResponseEntity<Page<TransactionDto>> getTransactions(
            @PathVariable UUID accountId,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(required = false) String q,   // US-703: búsqueda full-text
            @PageableDefault(size = 20, sort = "transactionDate",
                             direction = Sort.Direction.DESC) Pageable pageable) {

        TransactionFilter filter = new TransactionFilter(from, to, type,
                minAmount, maxAmount, q);
        return ResponseEntity.ok(historyUseCase.getTransactions(accountId, filter, pageable));
    }

    /** US-704 — Descarga extracto PDF o CSV */
    @GetMapping("/{accountId}/statements/{year}/{month}")
    public ResponseEntity<byte[]> getStatement(
            @PathVariable UUID accountId,
            @PathVariable int year,
            @PathVariable int month,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal Jwt jwt) throws Exception {

        UUID userId = UUID.fromString(jwt.getSubject());
        Optional<StatementExportUseCase.StatementResult> result =
                exportUseCase.export(userId, accountId, year, month, format).get();

        if (result.isEmpty()) return ResponseEntity.noContent().build();

        StatementExportUseCase.StatementResult s = result.get();
        MediaType mediaType = "csv".equalsIgnoreCase(format)
                ? MediaType.parseMediaType("text/csv")
                : MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header("Content-Disposition", "attachment; filename=\"" + s.filename() + "\"")
                .header("X-Content-SHA256", s.sha256())
                .body(s.content());
    }
}
```

---

## 8. Frontend Angular — Componentes

### 8.1 AccountSummaryComponent (US-701)

```typescript
@Component({
  selector: 'app-account-summary',
  standalone: true,
  template: `
    <div class="accounts-grid">
      @for (account of accounts(); track account.accountId) {
        <div class="account-card" [class]="'type-' + account.type.toLowerCase()">
          <span class="account-alias">{{ account.alias }}</span>
          <span class="iban">{{ account.ibanMasked }}</span>
          <div class="balance">
            <span class="available">{{ account.availableBalance | currency:'EUR' }}</span>
            @if (account.retainedBalance > 0) {
              <span class="retained" [tooltip]="'Importe retenido pendiente de cargo'">
                -{{ account.retainedBalance | currency:'EUR' }} retenido
              </span>
            }
          </div>
        </div>
      }
      @if (accounts().length === 0 && !loading()) {
        <p class="empty-state">No tienes cuentas activas. Contacta con tu oficina.</p>
      }
    </div>
  `
})
export class AccountSummaryComponent implements OnInit {

  accounts = signal<AccountSummaryDto[]>([]);
  loading  = signal(true);

  private readonly accountService = inject(AccountService);
  private readonly sseService     = inject(SseNotificationService);

  ngOnInit() {
    this.accountService.getAccounts().subscribe({
      next:  a  => { this.accounts.set(a); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    // Actualizar saldo en tiempo real vía SSE (ADR-014)
    this.sseService.on('account-balance-updated').subscribe(({ data }) => {
      this.accounts.update(list =>
        list.map(a => a.accountId === data.accountId
          ? { ...a, availableBalance: data.availableBalance }
          : a));
    });
  }
}
```

### 8.2 TransactionListComponent (US-702 + US-703)

```typescript
@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [ScrollingModule], // @angular/cdk/scrolling — virtual scroll
})
export class TransactionListComponent {

  @Input() accountId!: string;

  transactions  = signal<TransactionDto[]>([]);
  totalElements = signal(0);
  loading       = signal(false);

  // Filtros (US-702)
  filterForm = new FormGroup({
    from:      new FormControl<string | null>(null),
    to:        new FormControl<string | null>(null),
    type:      new FormControl<string | null>(null),
    minAmount: new FormControl<number | null>(null),
    maxAmount: new FormControl<number | null>(null),
    q:         new FormControl<string | null>(null),   // US-703
  });

  private page     = 0;
  private readonly PAGE_SIZE = 20;
  private readonly transactionService = inject(TransactionService);

  ngOnInit() {
    // Debounce en campo de búsqueda (US-703)
    this.filterForm.get('q')!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadTransactions(); });

    // Recarga inmediata al cambiar otros filtros
    this.filterForm.valueChanges.pipe(
      debounceTime(50),
      distinctUntilChanged()
    ).subscribe(() => { this.page = 0; this.loadTransactions(); });

    this.loadTransactions();
  }

  loadTransactions(append = false) {
    if (this.loading()) return;
    this.loading.set(true);

    const f = this.filterForm.value;
    this.transactionService.getTransactions(this.accountId, {
      ...f, page: this.page, size: this.PAGE_SIZE
    }).subscribe({
      next: (page) => {
        if (append) this.transactions.update(t => [...t, ...page.content]);
        else        this.transactions.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadMore() { this.page++; this.loadTransactions(true); }

  clearFilters() {
    this.filterForm.reset();
    this.page = 0;
    this.loadTransactions();
  }
}
```

### 8.3 StatementExportComponent (US-704)

```typescript
@Component({ selector: 'app-statement-export', standalone: true })
export class StatementExportComponent {

  @Input() accountId!: string;
  downloading = signal(false);

  readonly months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(0, i).toLocaleString('es', { month: 'long' })
  }));
  readonly years = [2026, 2025, 2024];

  selectedYear  = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1);

  private readonly statementService = inject(StatementService);

  download(format: 'pdf' | 'csv') {
    if (this.downloading()) return;
    this.downloading.set(true);

    this.statementService.download(
        this.accountId, this.selectedYear(), this.selectedMonth(), format
    ).subscribe({
      next: (blob) => {
        if (!blob) { this.showEmptyMessage(); return; }
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `extracto-${this.selectedYear()}-${this.selectedMonth()}.${format}`;
        link.click();
        URL.revokeObjectURL(url);   // sin memory leak
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false)
    });
  }
}
```

### 8.4 CategoryBadgeComponent + paleta CSS (US-705)

```typescript
@Component({
  selector: 'app-category-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="'cat-' + category().toLowerCase()">
      {{ categoryLabel() }}
    </span>
  `
})
export class CategoryBadgeComponent {
  category = input.required<string>();
  categoryLabel = computed(() => CATEGORY_LABELS[this.category()] ?? this.category());
}

const CATEGORY_LABELS: Record<string, string> = {
  NOMINA: 'Nómina', TRANSFERENCIA: 'Transferencia', COMPRA: 'Compra',
  DOMICILIACION: 'Domiciliación', CAJERO: 'Cajero', COMISION: 'Comisión',
  DEVOLUCION: 'Devolución', BIZUM: 'Bizum', RECIBO_UTIL: 'Recibo',
  OTRO: 'Otro'
};
```

```css
/* styles/categories.scss */
.cat-nomina         { background: #e8f5e9; color: #2e7d32; }
.cat-transferencia  { background: #e3f2fd; color: #1565c0; }
.cat-compra         { background: #fff3e0; color: #e65100; }
.cat-domiciliacion  { background: #f3e5f5; color: #6a1b9a; }
.cat-cajero         { background: #fce4ec; color: #880e4f; }
.cat-comision       { background: #fff8e1; color: #f57f17; }
.cat-devolucion     { background: #e0f7fa; color: #006064; }
.cat-bizum          { background: #e8eaf6; color: #283593; }
.cat-recibo_util    { background: #efebe9; color: #3e2723; }
.cat-otro           { background: #f5f5f5; color: #424242; }
```

---

## 9. Impacto en AccountBalanceChanged → SSE (US-701 tiempo real)

Cuando el adaptador real (Sprint 10) reciba una actualización de saldo del core bancario,
publicará un evento SSE via `SseEventPublisher` (ADR-014):

```java
// En CoreBankingEventAdapter (Sprint 10) o MockBalanceSimulator (Sprint 9 dev)
@EventListener
public void onBalanceChanged(AccountBalanceChangedEvent event) {
    sseEventPublisher.publishToUser(event.userId(),
        SseEvent.balanceUpdated(event.accountId(), event.newBalance()));
}

// SseEvent.balanceUpdated() — nuevo tipo para FEAT-007
public static SseEvent balanceUpdated(UUID accountId, BigDecimal balance) {
    return new SseEvent(
        UUID.randomUUID().toString(),
        "account-balance-updated",
        Map.of("accountId", accountId, "availableBalance", balance));
}
```

---

## 10. OpenAPI v1.6.0 — Endpoints nuevos FEAT-007

```yaml
# Añadir a openapi-2fa.yaml

/api/v1/accounts:
  get:
    summary: "US-701 — Resumen de cuentas con saldo"
    security: [{ bearerAuth: [] }]
    responses:
      200:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/AccountSummaryDto'

/api/v1/accounts/{accountId}/transactions:
  get:
    summary: "US-702/703 — Movimientos paginados con filtros y búsqueda"
    parameters:
      - { name: from,       in: query, schema: { type: string, format: date-time } }
      - { name: to,         in: query, schema: { type: string, format: date-time } }
      - { name: type,       in: query, schema: { type: string, enum: [CARGO, ABONO] } }
      - { name: minAmount,  in: query, schema: { type: number } }
      - { name: maxAmount,  in: query, schema: { type: number } }
      - { name: q,          in: query, schema: { type: string, minLength: 3 } }
      - { name: page,       in: query, schema: { type: integer, default: 0 } }
      - { name: size,       in: query, schema: { type: integer, default: 20 } }

/api/v1/accounts/{accountId}/statements/{year}/{month}:
  get:
    summary: "US-704 — Descarga extracto PDF / CSV"
    parameters:
      - { name: format, in: query, schema: { type: string, enum: [pdf, csv], default: pdf } }
    responses:
      200:
        content:
          application/pdf: {}
          text/csv: {}
      204:
        description: No hay movimientos en el período
```

---

## 11. Tests requeridos Sprint 9 (DoD)

| Test | Tipo | Escenarios clave |
|---|---|---|
| `AccountSummaryUseCaseTest` | Unit | 2 cuentas, sin cuentas, audit_log ACCOUNT_BALANCE_VIEWED |
| `TransactionHistoryUseCaseTest` | Unit | filtros combinados, paginación, caché TTL |
| `StatementExportUseCaseTest` | Unit | PDF con hash SHA-256, CSV UTF-8 BOM, período vacío → Optional.empty |
| `TransactionCategorizationServiceTest` | Unit | 10 categorías + OTRO fallback, case-insensitive |
| `NotificationPurgeJobTest` | Unit | purga >90d, idempotente, límite exacto 90d |
| `AccountControllerIT` | IT | GET /accounts → 200, GET /transactions con filtros, GET /statements PDF/CSV |
| `SseEventPublisherIT` | IT | evento llega a Redis + subscriber local, fallback si Redis down |
| `e2e/us701-account-summary.spec.ts` | E2E | saldo visible, SSE actualiza en tiempo real |
| `e2e/us702-transactions.spec.ts` | E2E | paginación, filtros, estado vacío |
| `e2e/us703-search.spec.ts` | E2E | búsqueda por concepto, highlight, combinada con filtros |
| `e2e/us704-statement.spec.ts` | E2E | descarga PDF, descarga CSV, período sin movimientos |
| `e2e/debt011-sse-multipod.spec.ts` | E2E | evento cross-pod llega al cliente correcto |

**Objetivo: ≥ 65 tests nuevos · 0 defectos críticos**

---

*SOFIA Architect Agent · BankPortal · LLD-010 · Sprint 9 · 2026-03-17*
*🔒 GATE 2: aprobación Tech Lead requerida antes de implementar FEAT-007*
*CMMI Level 3 — TS SP 1.1 · TS SP 2.1 · TS SP 2.2*
