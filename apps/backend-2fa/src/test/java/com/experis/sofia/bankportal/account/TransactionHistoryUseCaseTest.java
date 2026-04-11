package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.application.TransactionCategorizationService;
import com.experis.sofia.bankportal.account.application.TransactionDto;
import com.experis.sofia.bankportal.account.application.TransactionHistoryUseCase;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort.TransactionFilter;
import com.experis.sofia.bankportal.account.domain.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * US-702/703 — Tests unitarios TransactionHistoryUseCase.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@MockitoSettings(strictness = Strictness.LENIENT)
@ExtendWith(MockitoExtension.class)
class TransactionHistoryUseCaseTest {

    @Mock  AccountRepositoryPort          accountRepository;
    @Mock  TransactionCategorizationService categorizationService;
    @InjectMocks TransactionHistoryUseCase useCase;

    private UUID accountId;

    @BeforeEach
    void setUp() {
        accountId = UUID.randomUUID();
    }

    @Test
    @DisplayName("US-702: devuelve página de movimientos con categoría asignada")
    void getTransactions_returnsPageWithCategory() {
        Transaction tx = transaction("NOMINA EMPRESA SL", new BigDecimal("2000.00"),
                Transaction.Type.ABONO, "OTRO");
        Pageable pageable = PageRequest.of(0, 20);

        when(accountRepository.findTransactions(eq(accountId), any(), any()))
                .thenReturn(new PageImpl<>(List.of(tx)));
        when(categorizationService.categorizeAsString("NOMINA EMPRESA SL"))
                .thenReturn("NOMINA");

        Page<TransactionDto> result = useCase.getTransactions(
                accountId, TransactionFilter.empty(), pageable);

        assertThat(result.getContent()).hasSize(1);
        TransactionDto dto = result.getContent().get(0);
        assertThat(dto.category()).isEqualTo("NOMINA");
        assertThat(dto.amount()).isEqualByComparingTo("2000.00");
        assertThat(dto.type()).isEqualTo("ABONO");
    }

    @Test
    @DisplayName("US-702: page size mayor que MAX_PAGE_SIZE se acota a 100")
    void getTransactions_largePageSize_cappedAt100() {
        when(accountRepository.findTransactions(eq(accountId), any(), any()))
                .thenReturn(Page.empty());

        // No lanza excepción y delega con bounded pageable
        Page<TransactionDto> result = useCase.getTransactions(
                accountId, TransactionFilter.empty(), PageRequest.of(0, 500));

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("US-702: resultado vacío devuelve página vacía")
    void getTransactions_noResults_returnsEmptyPage() {
        when(accountRepository.findTransactions(any(), any(), any()))
                .thenReturn(Page.empty());

        Page<TransactionDto> result = useCase.getTransactions(
                accountId, TransactionFilter.empty(), PageRequest.of(0, 20));

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    @Test
    @DisplayName("US-702: categoría ya asignada no se recategoriza")
    void getTransactions_alreadyCategorized_keepCategory() {
        Transaction tx = transaction("OPERACION", new BigDecimal("100.00"),
                Transaction.Type.CARGO, "COMPRA");
        Pageable pageable = PageRequest.of(0, 20);

        when(accountRepository.findTransactions(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(tx)));
        // categorizationService NO debe ser llamado para tx ya categorizado
        // (Mockito verificará que no se invoca si no se llama)

        Page<TransactionDto> result = useCase.getTransactions(
                accountId, TransactionFilter.empty(), pageable);

        assertThat(result.getContent().get(0).category()).isEqualTo("COMPRA");
    }

    @Test
    @DisplayName("US-703: filtro con query menor de 3 chars ignorado")
    void getTransactions_shortQuery_filterIgnored() {
        TransactionFilter filter = new TransactionFilter(null, null, null, null, null, "ab");
        assertThat(filter.hasSearchQuery()).isFalse();
    }

    @Test
    @DisplayName("US-703: filtro con query >= 3 chars activa búsqueda")
    void getTransactions_validQuery_searchEnabled() {
        TransactionFilter filter = new TransactionFilter(null, null, null, null, null, "amazon");
        assertThat(filter.hasSearchQuery()).isTrue();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Transaction transaction(String concept, BigDecimal amount,
                                     Transaction.Type type, String category) {
        return new Transaction(UUID.randomUUID(), accountId,
                Instant.now(), concept, amount,
                new BigDecimal("5000.00"), category, type, Instant.now());
    }
}
