package com.experis.sofia.bankportal.account.infrastructure;

import com.experis.sofia.bankportal.account.domain.Account;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.Transaction;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Adaptador mock del repositorio de cuentas — Sprint 9 (@Profile "!production").
 *
 * <p>Genera datos ficticios pero realistas en memoria para permitir desarrollo
 * y pruebas sin conexión al core bancario real.
 * El adaptador real ({@code CoreBankingAccountAdapter}) se activará en Sprint 10
 * con {@code @Profile("production")} sin cambiar ningún use case.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@Component
@Profile("!production")
public class MockAccountRepositoryAdapter implements AccountRepositoryPort {

    // ── Mock data fija por userId ──────────────────────────────────────────────
    private static final Map<UUID, List<Account>> ACCOUNTS_BY_USER = new HashMap<>();
    private static final Map<UUID, List<Transaction>> TRANSACTIONS_BY_ACCOUNT = new HashMap<>();

    // UUID de usuario de prueba predefinido (coincide con datos de test)
    private static final UUID TEST_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    static {
        UUID corrienteId = UUID.fromString("acc00000-0000-0000-0000-000000000001");
        UUID ahorroId    = UUID.fromString("acc00000-0000-0000-0000-000000000002");

        Account corriente = new Account(corrienteId, TEST_USER_ID,
                "Cuenta Corriente", "ES9121000418450200051332",
                Account.Type.CORRIENTE, Account.Status.ACTIVE,
                Instant.now().minus(365, ChronoUnit.DAYS));
        corriente.loadBalance(new BigDecimal("3842.55"), new BigDecimal("250.00"));

        Account ahorro = new Account(ahorroId, TEST_USER_ID,
                "Cuenta Ahorro", "ES7620770024003102575766",
                Account.Type.AHORRO, Account.Status.ACTIVE,
                Instant.now().minus(365, ChronoUnit.DAYS));
        ahorro.loadBalance(new BigDecimal("12500.00"), BigDecimal.ZERO);

        ACCOUNTS_BY_USER.put(TEST_USER_ID, List.of(corriente, ahorro));

        // 200 movimientos mock para la cuenta corriente
        TRANSACTIONS_BY_ACCOUNT.put(corrienteId, generateMockTransactions(corrienteId, 200));
        // 50 movimientos mock para la cuenta ahorro
        TRANSACTIONS_BY_ACCOUNT.put(ahorroId, generateMockTransactions(ahorroId, 50));
    }

    private static List<Transaction> generateMockTransactions(UUID accountId, int count) {
        List<Transaction> txs = new ArrayList<>();
        BigDecimal balance = new BigDecimal("5000.00");

        String[][] mockConcepts = {
            {"NOMINA EMPRESA SL", "ABONO"}, {"BIZUM RECIBIDO MARIA", "ABONO"},
            {"COMPRA MERCADONA", "CARGO"}, {"RECIBO LUZ ENDESA", "CARGO"},
            {"TRANSFERENCIA RECIBIDA", "ABONO"}, {"CAJERO REINTEGRO", "CARGO"},
            {"PAGO AMAZON", "CARGO"}, {"RECIBO TELEFONO MOVISTAR", "CARGO"},
            {"COMPRA ZARA ONLINE", "CARGO"}, {"DEVOLUCION AMAZON", "ABONO"},
            {"RECIBO SEGURO MAPFRE", "CARGO"}, {"BIZUM ENVIADO JUAN", "CARGO"},
            {"COMPRA CARREFOUR", "CARGO"}, {"COMISION MANTENIMIENTO CUENTA", "CARGO"},
            {"TRANSFERENCIA ENVIADA", "CARGO"}, {"RECIBO GAS NATURGY", "CARGO"},
            {"PAGO TPV RESTAURANTE", "CARGO"}, {"NOMINA EXTRA JUNIO", "ABONO"},
            {"COMPRA LIDL", "CARGO"}, {"RECIBO INTERNET VODAFONE", "CARGO"}
        };

        for (int i = 0; i < count; i++) {
            String[] concept = mockConcepts[i % mockConcepts.length];
            // fix: Locale.US para separador decimal '.' independiente del locale del SO
            BigDecimal amount = concept[1].equals("ABONO")
                    ? new BigDecimal(String.format(Locale.US, "%.2f", 100 + (i * 47.3 % 1900)))
                    : new BigDecimal(String.format(Locale.US, "%.2f", -(10 + (i * 23.7 % 500))));

            balance = balance.add(amount);
            txs.add(new Transaction(
                    UUID.randomUUID(), accountId,
                    Instant.now().minus(i * 2L, ChronoUnit.HOURS),
                    concept[0], amount, balance, "OTRO",
                    Transaction.Type.valueOf(concept[1]),
                    Instant.now().minus(i * 2L, ChronoUnit.HOURS)
            ));
        }
        return Collections.unmodifiableList(txs);
    }

    // ── Puerto ─────────────────────────────────────────────────────────────────

    @Override
    public List<Account> findByUserId(UUID userId) {
        return ACCOUNTS_BY_USER.getOrDefault(userId, List.of());
    }

    @Override
    public Page<Transaction> findTransactions(UUID accountId,
                                               TransactionFilter filter,
                                               Pageable pageable) {
        List<Transaction> all = TRANSACTIONS_BY_ACCOUNT.getOrDefault(accountId, List.of());

        List<Transaction> filtered = all.stream()
                .filter(t -> filter.from()      == null || !t.getTransactionDate().isBefore(filter.from()))
                .filter(t -> filter.to()        == null || !t.getTransactionDate().isAfter(filter.to()))
                .filter(t -> filter.type()      == null || t.getType().name().equals(filter.type()))
                .filter(t -> filter.minAmount() == null ||
                             t.getAmount().abs().compareTo(filter.minAmount()) >= 0)
                .filter(t -> filter.maxAmount() == null ||
                             t.getAmount().abs().compareTo(filter.maxAmount()) <= 0)
                .filter(t -> !filter.hasSearchQuery() ||
                             t.getConcept().toLowerCase().contains(filter.searchQuery().toLowerCase()))
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end   = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Transaction> page = start >= filtered.size() ? List.of() : filtered.subList(start, end);

        return new PageImpl<>(page, pageable, filtered.size());
    }

    @Override
    public Optional<AccountBalance> getBalance(UUID accountId) {
        return ACCOUNTS_BY_USER.values().stream()
                .flatMap(Collection::stream)
                .filter(a -> a.getId().equals(accountId))
                .findFirst()
                .map(a -> new AccountBalance(
                        a.getId(), a.getAvailableBalance(),
                        a.getRetainedBalance(), Instant.now()));
    }

    @Override
    public List<Transaction> findByMonth(UUID accountId, Instant from, Instant to, int maxResults) {
        return TRANSACTIONS_BY_ACCOUNT.getOrDefault(accountId, List.of()).stream()
                .filter(t -> !t.getTransactionDate().isBefore(from))
                .filter(t -> !t.getTransactionDate().isAfter(to))
                .sorted(Comparator.comparing(Transaction::getTransactionDate))
                .limit(maxResults)
                .collect(Collectors.toList());
    }
}
