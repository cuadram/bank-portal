package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.application.AccountSummaryDto;
import com.experis.sofia.bankportal.account.application.AccountSummaryUseCase;
import com.experis.sofia.bankportal.account.application.StatementExportUseCase;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * US-704 — Tests unitarios StatementExportUseCase.
 *
 * <p>Cubre:
 * <ul>
 *   <li>Generación CSV con BOM y cabeceras correctas.</li>
 *   <li>Mes sin movimientos devuelve Optional.empty().</li>
 *   <li>Hash SHA-256 presente y no vacío.</li>
 *   <li>Nombre de fichero correcto por formato.</li>
 *   <li>Formato no soportado lanza IllegalArgumentException.</li>
 *   <li>Cuenta no perteneciente al usuario lanza IllegalArgumentException.</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — US-704 Sprint 9
 */
@ExtendWith(MockitoExtension.class)
class StatementExportUseCaseTest {

    @Mock AccountRepositoryPort   accountRepository;
    @Mock AccountSummaryUseCase   accountSummaryUseCase;
    @InjectMocks StatementExportUseCase useCase;

    private UUID userId;
    private UUID accountId;
    private AccountSummaryDto accountDto;

    @BeforeEach
    void setUp() {
        userId    = UUID.randomUUID();
        accountId = UUID.randomUUID();
        accountDto = new AccountSummaryDto(
                accountId, "Cuenta Nómina", "ES** **** **** **** 1234",
                "CORRIENTE", new BigDecimal("3500.00"), BigDecimal.ZERO);

        when(accountSummaryUseCase.getSummary(userId))
                .thenReturn(List.of(accountDto));
    }

    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: mes sin movimientos devuelve Optional.empty()")
    void export_emptyMonth_returnsEmpty() throws Exception {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of());

        Optional<StatementExportUseCase.StatementResult> result =
                useCase.export(userId, accountId, 2026, 1, "pdf").get();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("US-704: CSV tiene BOM UTF-8 y cabeceras en español")
    void export_csv_hasBomAndHeaders() throws Exception {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of(buildTransaction("NOMINA SL", "2000.00", "ABONO")));

        Optional<StatementExportUseCase.StatementResult> result =
                useCase.export(userId, accountId, 2026, 2, "csv").get();

        assertThat(result).isPresent();
        StatementExportUseCase.StatementResult r = result.get();
        assertThat(r.format()).isEqualTo("CSV");

        String csv = new String(r.content(), java.nio.charset.StandardCharsets.UTF_8);
        assertThat(csv).startsWith("\uFEFF"); // BOM presente
        assertThat(csv).contains("fecha;concepto;importe;saldo_tras_movimiento;tipo;categoria");
    }

    @Test
    @DisplayName("US-704: CSV contiene los movimientos correctamente escapados")
    void export_csv_containsTransactionData() throws Exception {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of(
                        buildTransaction("NOMINA; EMPRESA SL", "2000.00", "ABONO"),
                        buildTransaction("FACTURA LUZ",        "45.30",   "CARGO")));

        Optional<StatementExportUseCase.StatementResult> r =
                useCase.export(userId, accountId, 2026, 2, "csv").get();

        String csv = new String(r.get().content(), java.nio.charset.StandardCharsets.UTF_8);
        assertThat(csv).contains("\"NOMINA; EMPRESA SL\""); // campo con ; escapado con comillas
        assertThat(csv).contains("FACTURA LUZ");
        assertThat(csv).contains("2000.00");
        assertThat(csv).contains("45.30");
    }

    @Test
    @DisplayName("US-704: hash SHA-256 presente, 64 chars hex lowercase")
    void export_csv_sha256Present() throws Exception {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of(buildTransaction("PAGO", "100.00", "CARGO")));

        StatementExportUseCase.StatementResult r =
                useCase.export(userId, accountId, 2026, 3, "csv").get().orElseThrow();

        assertThat(r.sha256()).hasSize(64);
        assertThat(r.sha256()).matches("[0-9a-f]+");
    }

    @Test
    @DisplayName("US-704: nombre de fichero contiene IBAN limpio, año, mes y extensión")
    void export_csv_filenameCorrect() throws Exception {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of(buildTransaction("TX", "10.00", "CARGO")));

        StatementExportUseCase.StatementResult r =
                useCase.export(userId, accountId, 2026, 4, "csv").get().orElseThrow();

        assertThat(r.filename()).startsWith("extracto-");
        assertThat(r.filename()).contains("2026-04");
        assertThat(r.filename()).endsWith(".csv");
    }

    @Test
    @DisplayName("US-704: formato no soportado lanza IllegalArgumentException")
    void export_unknownFormat_throwsIllegalArgument() {
        when(accountRepository.findByMonth(eq(accountId), any(), any(), anyInt()))
                .thenReturn(List.of(buildTransaction("TX", "10.00", "CARGO")));

        CompletableFutureAssert<Optional<StatementExportUseCase.StatementResult>> assertion =
                assertThatFuture(useCase.export(userId, accountId, 2026, 1, "xlsx"));

        assertion.failsWithin(java.time.Duration.ofSeconds(3))
                .withThrowableOfType(ExecutionException.class)
                .withCauseInstanceOf(IllegalArgumentException.class)
                .withMessageContaining("xlsx");
    }

    @Test
    @DisplayName("US-704: cuenta ajena lanza IllegalArgumentException")
    void export_foreignAccount_throwsIllegalArgument() {
        UUID otherAccount = UUID.randomUUID(); // no está en la lista del usuario

        assertThatFuture(useCase.export(userId, otherAccount, 2026, 1, "csv"))
                .failsWithin(java.time.Duration.ofSeconds(3))
                .withThrowableOfType(ExecutionException.class)
                .withCauseInstanceOf(IllegalArgumentException.class);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private <T> org.assertj.core.api.AbstractFutureAssert<?, ?, T, ?> assertThatFuture(
            java.util.concurrent.Future<T> future) {
        return org.assertj.core.api.Assertions.assertThat(future);
    }

    private Transaction buildTransaction(String concept, String amount, String type) {
        return new Transaction(
                UUID.randomUUID(), accountId,
                Instant.now(), concept,
                new BigDecimal(amount),
                new BigDecimal("5000.00"),
                "OTRO",
                Transaction.Type.valueOf(type),
                Instant.now());
    }
}
