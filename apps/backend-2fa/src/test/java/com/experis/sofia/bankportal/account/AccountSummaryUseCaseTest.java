package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.application.AccountSummaryDto;
import com.experis.sofia.bankportal.account.application.AccountSummaryUseCase;
import com.experis.sofia.bankportal.account.domain.Account;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * US-701 — Tests unitarios AccountSummaryUseCase.
 *
 * @author SOFIA Developer Agent — FEAT-007 Sprint 9
 */
@ExtendWith(MockitoExtension.class)
class AccountSummaryUseCaseTest {

    @Mock  AccountRepositoryPort accountRepository;
    @InjectMocks AccountSummaryUseCase useCase;

    private UUID userId;
    private UUID corrienteId;
    private UUID ahorroId;

    @BeforeEach
    void setUp() {
        userId      = UUID.randomUUID();
        corrienteId = UUID.randomUUID();
        ahorroId    = UUID.randomUUID();
    }

    @Test
    @DisplayName("US-701: devuelve 2 cuentas activas con saldo cargado")
    void getSummary_twoCuentas_returnsBothWithBalance() {
        Account corriente = account(corrienteId, "Cuenta Corriente",
                "ES9121000418450200051332", Account.Type.CORRIENTE,
                new BigDecimal("3842.55"), new BigDecimal("250.00"));
        Account ahorro = account(ahorroId, "Cuenta Ahorro",
                "ES7620770024003102575766", Account.Type.AHORRO,
                new BigDecimal("12500.00"), BigDecimal.ZERO);

        when(accountRepository.findByUserId(userId)).thenReturn(List.of(corriente, ahorro));

        List<AccountSummaryDto> result = useCase.getSummary(userId);

        assertThat(result).hasSize(2);
        AccountSummaryDto c = result.get(0);
        assertThat(c.alias()).isEqualTo("Cuenta Corriente");
        assertThat(c.ibanMasked()).isEqualTo("ES91 **** **** **** 1332");
        assertThat(c.availableBalance()).isEqualByComparingTo("3842.55");
        assertThat(c.retainedBalance()).isEqualByComparingTo("250.00");
        assertThat(c.type()).isEqualTo("CORRIENTE");
    }

    @Test
    @DisplayName("US-701: sin cuentas activas devuelve lista vacía")
    void getSummary_noCuentas_returnsEmpty() {
        when(accountRepository.findByUserId(userId)).thenReturn(List.of());

        List<AccountSummaryDto> result = useCase.getSummary(userId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("US-701: cuenta INACTIVE excluida del resultado")
    void getSummary_inactiveCuenta_excluded() {
        Account inactive = account(UUID.randomUUID(), "Cuenta Bloqueada",
                "ES1234567890123456789012", Account.Type.CORRIENTE,
                BigDecimal.ZERO, BigDecimal.ZERO);
        // Sobrescribir con cuenta INACTIVE
        Account inactiveAccount = new Account(inactive.getId(), userId,
                "Cuenta Bloqueada", "ES1234567890123456789012",
                Account.Type.CORRIENTE, Account.Status.INACTIVE, Instant.now());
        inactiveAccount.loadBalance(BigDecimal.ZERO, BigDecimal.ZERO);

        when(accountRepository.findByUserId(userId)).thenReturn(List.of(inactiveAccount));

        List<AccountSummaryDto> result = useCase.getSummary(userId);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("US-701: IBAN corto devuelve '****' enmascarado")
    void getSummary_shortIban_returnsMasked() {
        Account a = account(corrienteId, "Test", "ES91", Account.Type.CORRIENTE,
                BigDecimal.TEN, BigDecimal.ZERO);
        when(accountRepository.findByUserId(userId)).thenReturn(List.of(a));

        List<AccountSummaryDto> result = useCase.getSummary(userId);

        assertThat(result.get(0).ibanMasked()).isEqualTo("****");
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Account account(UUID id, String alias, String iban, Account.Type type,
                             BigDecimal available, BigDecimal retained) {
        Account a = new Account(id, userId, alias, iban, type,
                Account.Status.ACTIVE, Instant.now());
        a.loadBalance(available, retained);
        return a;
    }
}
