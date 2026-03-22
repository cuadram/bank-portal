package com.experis.sofia.bankportal.bill.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.bill.application.dto.PayInvoiceCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.BillPayment;
import com.experis.sofia.bankportal.bill.domain.BillLookupResult;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import com.experis.sofia.bankportal.bill.domain.BillPaymentRepositoryPort;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Caso de uso — Lookup y pago de factura con referencia (sin domiciliación).
 * US-904 FEAT-009 Sprint 11.
 *
 * Flujo:
 *   1. Validar formato de referencia (20 dígitos — hecho en Bean Validation)
 *   2. Consultar factura al core bancario via BillPaymentPort.lookupBill()
 *   3. Verificar OTP (PSD2 SCA)
 *   4. Ejecutar pago en core
 *   5. Audit log con referencia enmascarada (primeros 4 + **** + últimos 4)
 *
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BillLookupAndPayUseCase {

    private final BillPaymentPort billPaymentPort;
    private final BillPaymentRepositoryPort billPaymentRepository;
    private final TwoFactorService twoFactorService;
    private final AuditLogService auditLog;

    /** Solo lookup — para GET /api/v1/bills/lookup */
    public BillLookupResult lookup(String reference) {
        // DEBT-019: validación de formato delegada al controller (@Pattern)
        return billPaymentPort.lookupBill(reference);
    }

    @Transactional
    public PaymentResultDto pay(UUID userId, PayInvoiceCommand cmd) {
        // DEBT-019: validación de referencia ya hecha por Bean Validation en el controller

        // Lookup en core — confirmar que la factura existe y el importe es correcto
        BillLookupResult bill = billPaymentPort.lookupBill(cmd.reference());

        auditLog.log("INVOICE_PAYMENT_INITIATED", userId,
                "ref=" + maskReference(cmd.reference()) + " amount=" + cmd.amount());

        // OTP obligatorio — PSD2 SCA
        twoFactorService.verifyCurrentOtp(userId, cmd.otpCode());

        // Ejecutar pago con idempotencyKey
        UUID idempotencyKey = UUID.randomUUID();
        String coreTxnId = billPaymentPort.executePayment(
                cmd.sourceAccountId(), cmd.amount(),
                bill.issuer() + " — " + bill.concept(), idempotencyKey);

        // Persistir en bill_payments (RV-002)
        LocalDateTime now = LocalDateTime.now();
        BillPayment payment = new BillPayment(
                UUID.randomUUID(), userId, null,
                cmd.reference(), bill.issuer(), cmd.amount(),
                cmd.sourceAccountId(), "COMPLETED", coreTxnId, now);
        BillPayment saved = billPaymentRepository.save(payment);

        auditLog.log("INVOICE_PAYMENT_COMPLETED", userId,
                "ref=" + maskReference(cmd.reference()) + " paymentId=" + saved.id()
                        + " coreTxnId=" + coreTxnId + " amount=" + cmd.amount());

        log.info("[US-904] Factura pagada: ref={} paymentId={} userId={} coreTxnId={}",
                maskReference(cmd.reference()), saved.id(), userId, coreTxnId);

        return new PaymentResultDto(saved.id(), "COMPLETED", now);
    }

    // DEBT-019: validateReference() eliminado — validación única en BillController (@Pattern)

    /** Enmascara referencia: primeros 4 + **** + últimos 4 */
    private String maskReference(String ref) {
        return ref.substring(0, 4) + "****" + ref.substring(ref.length() - 4);
    }

    // ── Excepciones de dominio ────────────────────────────────────────────────

    public static class InvalidBillReferenceException extends RuntimeException {
        private final String errorCode = "INVALID_BILL_REFERENCE";

        public InvalidBillReferenceException(String ref) {
            super("Referencia de factura inválida: debe tener exactamente 20 dígitos");
        }

        public String getErrorCode() { return errorCode; }
    }
}
