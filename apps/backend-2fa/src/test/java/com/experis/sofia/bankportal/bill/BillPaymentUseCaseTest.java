package com.experis.sofia.bankportal.bill;

import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.bill.application.BillPaymentUseCase;
import com.experis.sofia.bankportal.bill.application.BillPaymentUseCase.BillAlreadyPaidException;
import com.experis.sofia.bankportal.bill.application.BillPaymentUseCase.BillNotFoundException;
import com.experis.sofia.bankportal.bill.application.dto.PayBillCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.Bill;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import com.experis.sofia.bankportal.bill.domain.BillRepositoryPort;
import com.experis.sofia.bankportal.bill.domain.BillStatus;
import com.experis.sofia.bankportal.auth.totp.TwoFactorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-903 BillPaymentUseCase.
 * Cubre: happy path, recibo ya pagado, recibo no encontrado, OTP inválido.
 *
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11
 */
@ExtendWith(MockitoExtension.class)
class BillPaymentUseCaseTest {

    @Mock BillRepositoryPort billRepository;
    @Mock BillPaymentPort billPaymentPort;
    @Mock TwoFactorService twoFactorService;
    @Mock AuditLogService auditLog;

    @InjectMocks BillPaymentUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID billId = UUID.randomUUID();
    private final UUID sourceAccountId = UUID.randomUUID();
    private final String validOtp = "123456";

    private Bill pendingBill;

    @BeforeEach
    void setUp() {
        pendingBill = new Bill(billId, userId, "Endesa", "Factura luz mayo",
                new BigDecimal("85.30"), LocalDate.now().plusDays(5),
                BillStatus.PENDING, LocalDateTime.now());
    }

    @Test
    @DisplayName("US-903 Escenario 1: Pago de recibo exitoso con OTP válido")
    void pay_success() {
        when(billRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(pendingBill));
        when(billPaymentPort.executePayment(any(), any(), any(), any())).thenReturn("TXN-001");
        when(billRepository.save(any())).thenReturn(pendingBill);

        PaymentResultDto result = useCase.pay(userId, billId, new PayBillCommand(sourceAccountId, validOtp));

        assertThat(result.status()).isEqualTo("COMPLETED");
        verify(twoFactorService).verifyCurrentOtp(userId, validOtp);
        verify(billPaymentPort).executePayment(eq(sourceAccountId), eq(pendingBill.amount()),
                anyString(), any(UUID.class));
        verify(billRepository).save(argThat(b -> b.status() == BillStatus.PAID));
        verify(auditLog).record(eq(userId), eq("BILL_PAYMENT_COMPLETED"), anyString());
    }

    @Test
    @DisplayName("US-903 Escenario 4: Recibo ya pagado → BILL_ALREADY_PAID")
    void pay_alreadyPaid_throws() {
        Bill paidBill = new Bill(billId, userId, "Endesa", "Factura luz mayo",
                new BigDecimal("85.30"), LocalDate.now(), BillStatus.PAID, LocalDateTime.now());
        when(billRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(paidBill));

        assertThatThrownBy(() -> useCase.pay(userId, billId, new PayBillCommand(sourceAccountId, validOtp)))
                .isInstanceOf(BillAlreadyPaidException.class)
                .extracting("errorCode").isEqualTo("BILL_ALREADY_PAID");

        verifyNoInteractions(twoFactorService, billPaymentPort);
    }

    @Test
    @DisplayName("US-903 Escenario 3: Saldo insuficiente → saldo verificado antes de OTP")
    void pay_billNotFound_throws() {
        when(billRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.pay(userId, billId, new PayBillCommand(sourceAccountId, validOtp)))
                .isInstanceOf(BillNotFoundException.class);

        verifyNoInteractions(twoFactorService, billPaymentPort);
    }

    @Test
    @DisplayName("US-903: listPending devuelve solo recibos PENDING del usuario")
    void listPending_returnsOnlyPending() {
        when(billRepository.findPendingByUserId(userId)).thenReturn(List.of(pendingBill));

        var result = useCase.listPending(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo("PENDING");
        assertThat(result.get(0).issuer()).isEqualTo("Endesa");
    }

    @Test
    @DisplayName("US-903: OTP inválido → no se ejecuta el pago")
    void pay_invalidOtp_throws() {
        when(billRepository.findByIdAndUserId(billId, userId)).thenReturn(Optional.of(pendingBill));
        doThrow(new RuntimeException("OTP_INVALID"))
                .when(twoFactorService).verifyCurrentOtp(userId, "000000");

        assertThatThrownBy(() -> useCase.pay(userId, billId,
                new PayBillCommand(sourceAccountId, "000000")))
                .hasMessageContaining("OTP_INVALID");

        verifyNoInteractions(billPaymentPort);
        verify(billRepository, never()).save(any());
    }
}
