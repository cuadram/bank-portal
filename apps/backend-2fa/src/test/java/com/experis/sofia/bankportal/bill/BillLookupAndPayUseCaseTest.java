package com.experis.sofia.bankportal.bill;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.bill.application.BillLookupAndPayUseCase;
import com.experis.sofia.bankportal.bill.application.dto.PayInvoiceCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.BillLookupResult;
import com.experis.sofia.bankportal.bill.domain.BillPayment;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import com.experis.sofia.bankportal.bill.domain.BillPaymentRepositoryPort;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-904 BillLookupAndPayUseCase.
 * DEBT-019: validateReference() eliminado — validación en controller (@Pattern).
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11 / Sprint 12
 */
@ExtendWith(MockitoExtension.class)
class BillLookupAndPayUseCaseTest {

    @Mock BillPaymentPort           billPaymentPort;
    @Mock BillPaymentRepositoryPort billPaymentRepository;
    @Mock TwoFactorService          twoFactorService;
    @Mock AuditLogService           auditLog;

    @InjectMocks BillLookupAndPayUseCase useCase;

    private final UUID userId        = UUID.randomUUID();
    private final UUID sourceAccount = UUID.randomUUID();
    private final String validRef    = "12345678901234567890"; // 20 dígitos

    @Test
    @DisplayName("US-904 Escenario 1: lookup exitoso de factura")
    void lookup_success() {
        BillLookupResult expected = new BillLookupResult(
                "EXT-001", "Telefónica", "Factura móvil junio",
                new BigDecimal("45.00"), "2026-04-15");
        when(billPaymentPort.lookupBill(validRef)).thenReturn(expected);

        BillLookupResult result = useCase.lookup(validRef);

        assertThat(result.issuer()).isEqualTo("Telefónica");
        assertThat(result.amount()).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("US-904 Escenario 3: pago exitoso con OTP y referencia válidos")
    void pay_success() {
        BillLookupResult lookup = new BillLookupResult(
                "EXT-001", "Agua Madrid", "Recibo agua Q1",
                new BigDecimal("30.50"), "2026-04-30");
        BillPayment saved = new BillPayment(
                UUID.randomUUID(), userId, null, validRef,
                "Agua Madrid", new BigDecimal("30.50"), sourceAccount,
                "COMPLETED", "TXN-002", LocalDateTime.now());

        when(billPaymentPort.lookupBill(validRef)).thenReturn(lookup);
        when(billPaymentPort.executePayment(any(), any(), any(), any())).thenReturn("TXN-002");
        when(billPaymentRepository.save(any())).thenReturn(saved);

        PayInvoiceCommand cmd = new PayInvoiceCommand(
                validRef, sourceAccount, new BigDecimal("30.50"), "123456");
        PaymentResultDto result = useCase.pay(userId, cmd);

        assertThat(result.status()).isEqualTo("COMPLETED");
        verify(twoFactorService).verifyCurrentOtp(userId, "123456");
        verify(billPaymentPort).executePayment(eq(sourceAccount),
                eq(new BigDecimal("30.50")), anyString(), any(UUID.class));
    }

    @Test
    @DisplayName("US-904 Escenario 4: referencia enmascarada en audit log")
    void pay_referenceIsMaskedInAuditLog() {
        BillLookupResult lookup = new BillLookupResult(
                "EXT-001", "Iberdrola", "Luz julio",
                new BigDecimal("90.00"), "2026-05-01");
        BillPayment saved = new BillPayment(
                UUID.randomUUID(), userId, null, validRef,
                "Iberdrola", new BigDecimal("90.00"), sourceAccount,
                "COMPLETED", "TXN-003", LocalDateTime.now());

        when(billPaymentPort.lookupBill(validRef)).thenReturn(lookup);
        when(billPaymentPort.executePayment(any(), any(), any(), any())).thenReturn("TXN-003");
        when(billPaymentRepository.save(any())).thenReturn(saved);

        useCase.pay(userId, new PayInvoiceCommand(
                validRef, sourceAccount, new BigDecimal("90.00"), "654321"));

        verify(auditLog).log(eq("INVOICE_PAYMENT_COMPLETED"), eq(userId),
                argThat(msg -> msg.contains("1234****7890") && !msg.contains(validRef)));
    }

    @Test
    @DisplayName("US-904: OTP inválido → no se ejecuta el pago")
    void pay_invalidOtp_doesNotExecutePayment() {
        BillLookupResult lookup = new BillLookupResult(
                "EXT-001", "Gas Natural", "Gas abril",
                new BigDecimal("55.00"), "2026-04-20");
        when(billPaymentPort.lookupBill(validRef)).thenReturn(lookup);
        doThrow(new RuntimeException("OTP_INVALID"))
                .when(twoFactorService).verifyCurrentOtp(any(), eq("000000"));

        assertThatThrownBy(() -> useCase.pay(userId,
                new PayInvoiceCommand(validRef, sourceAccount, new BigDecimal("55.00"), "000000")))
                .hasMessageContaining("OTP_INVALID");

        verify(billPaymentPort, never()).executePayment(any(), any(), any(), any());
    }

    @Test
    @DisplayName("US-904 DEBT-019: lookup sin validateReference interna — delegada al controller")
    void lookup_noInternalValidation_delegatesToController() {
        // DEBT-019: validateReference() eliminado del use case.
        // La validación ocurre en BillController via @Pattern antes de llegar aquí.
        // Si el controller deja pasar una referencia (válida), el use case la pasa al core.
        BillLookupResult result = new BillLookupResult(
                "EXT-999", "Test", "Test", BigDecimal.TEN, "2026-12-31");
        when(billPaymentPort.lookupBill(validRef)).thenReturn(result);

        assertThatNoException().isThrownBy(() -> useCase.lookup(validRef));
        verify(billPaymentPort).lookupBill(validRef);
    }
}
