package com.experis.sofia.bankportal.bill;

import com.experis.sofia.bankportal.audit.AuditLogService;
import com.experis.sofia.bankportal.bill.application.BillLookupAndPayUseCase;
import com.experis.sofia.bankportal.bill.application.BillLookupAndPayUseCase.InvalidBillReferenceException;
import com.experis.sofia.bankportal.bill.application.dto.PayInvoiceCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort.BillLookupResult;
import com.experis.sofia.bankportal.auth.totp.TwoFactorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — US-904 BillLookupAndPayUseCase.
 * Cubre: lookup exitoso, pago exitoso, referencia inválida, OTP inválido.
 *
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11
 */
@ExtendWith(MockitoExtension.class)
class BillLookupAndPayUseCaseTest {

    @Mock BillPaymentPort billPaymentPort;
    @Mock TwoFactorService twoFactorService;
    @Mock AuditLogService auditLog;

    @InjectMocks BillLookupAndPayUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final UUID sourceAccountId = UUID.randomUUID();
    private final String validReference = "12345678901234567890"; // 20 dígitos

    @Test
    @DisplayName("US-904 Escenario 1: Lookup exitoso de factura por referencia válida")
    void lookup_success() {
        BillLookupResult expected = new BillLookupResult(
                "EXT-001", "Telefónica", "Factura móvil junio",
                new BigDecimal("45.00"), "2026-04-15");
        when(billPaymentPort.lookupBill(validReference)).thenReturn(expected);

        BillLookupResult result = useCase.lookup(validReference);

        assertThat(result.issuer()).isEqualTo("Telefónica");
        assertThat(result.amount()).isEqualByComparingTo("45.00");
    }

    @Test
    @DisplayName("US-904 Escenario 2: Referencia inválida → INVALID_BILL_REFERENCE")
    void lookup_invalidReference_throws() {
        assertThatThrownBy(() -> useCase.lookup("1234")) // menos de 20 dígitos
                .isInstanceOf(InvalidBillReferenceException.class)
                .extracting("errorCode").isEqualTo("INVALID_BILL_REFERENCE");

        verifyNoInteractions(billPaymentPort);
    }

    @Test
    @DisplayName("US-904 Escenario 3: Pago de factura exitoso con OTP y referencia válidos")
    void pay_success() {
        BillLookupResult lookupResult = new BillLookupResult(
                "EXT-001", "Agua Madrid", "Recibo agua Q1",
                new BigDecimal("30.50"), "2026-04-30");
        when(billPaymentPort.lookupBill(validReference)).thenReturn(lookupResult);
        when(billPaymentPort.executePayment(any(), any(), any(), any())).thenReturn("TXN-002");

        PayInvoiceCommand cmd = new PayInvoiceCommand(
                validReference, sourceAccountId, new BigDecimal("30.50"), "123456");

        PaymentResultDto result = useCase.pay(userId, cmd);

        assertThat(result.status()).isEqualTo("COMPLETED");
        verify(twoFactorService).verifyCurrentOtp(userId, "123456");
        verify(billPaymentPort).executePayment(eq(sourceAccountId), eq(new BigDecimal("30.50")),
                anyString(), any(UUID.class));
        verify(auditLog).record(eq(userId), eq("INVOICE_PAYMENT_COMPLETED"), anyString());
    }

    @Test
    @DisplayName("US-904 Escenario 4: Referencia enmascarada en audit log")
    void pay_referenceIsMaskedInAuditLog() {
        BillLookupResult lookupResult = new BillLookupResult(
                "EXT-001", "Iberdrola", "Luz julio",
                new BigDecimal("90.00"), "2026-05-01");
        when(billPaymentPort.lookupBill(validReference)).thenReturn(lookupResult);
        when(billPaymentPort.executePayment(any(), any(), any(), any())).thenReturn("TXN-003");

        PayInvoiceCommand cmd = new PayInvoiceCommand(
                validReference, sourceAccountId, new BigDecimal("90.00"), "654321");
        useCase.pay(userId, cmd);

        // Verificar que el audit log contiene la referencia enmascarada, no la completa
        verify(auditLog).record(eq(userId), eq("INVOICE_PAYMENT_COMPLETED"),
                argThat(msg -> msg.contains("1234****7890") && !msg.contains(validReference)));
    }

    @Test
    @DisplayName("US-904: OTP inválido → no se ejecuta el pago")
    void pay_invalidOtp_doesNotExecutePayment() {
        BillLookupResult lookupResult = new BillLookupResult(
                "EXT-001", "Gas Natural", "Gas abril",
                new BigDecimal("55.00"), "2026-04-20");
        when(billPaymentPort.lookupBill(validReference)).thenReturn(lookupResult);
        doThrow(new RuntimeException("OTP_INVALID"))
                .when(twoFactorService).verifyCurrentOtp(any(), eq("000000"));

        PayInvoiceCommand cmd = new PayInvoiceCommand(
                validReference, sourceAccountId, new BigDecimal("55.00"), "000000");

        assertThatThrownBy(() -> useCase.pay(userId, cmd))
                .hasMessageContaining("OTP_INVALID");

        verify(billPaymentPort, never()).executePayment(any(), any(), any(), any());
    }
}
