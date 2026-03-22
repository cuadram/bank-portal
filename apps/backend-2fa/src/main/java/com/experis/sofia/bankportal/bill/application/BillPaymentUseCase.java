package com.experis.sofia.bankportal.bill.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.bill.application.dto.BillDto;
import com.experis.sofia.bankportal.bill.application.dto.PayBillCommand;
import com.experis.sofia.bankportal.bill.application.dto.PaymentResultDto;
import com.experis.sofia.bankportal.bill.domain.Bill;
import com.experis.sofia.bankportal.bill.domain.BillPayment;
import com.experis.sofia.bankportal.bill.domain.BillPaymentPort;
import com.experis.sofia.bankportal.bill.domain.BillPaymentRepositoryPort;
import com.experis.sofia.bankportal.bill.domain.BillRepositoryPort;
import com.experis.sofia.bankportal.bill.domain.BillStatus;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Caso de uso — Pago de recibo domiciliado.
 * US-903 FEAT-009 Sprint 11.
 *
 * Flujo:
 *   1. Buscar recibo PENDING del usuario
 *   2. Verificar OTP (PSD2 SCA)
 *   3. Ejecutar pago en core bancario via BillPaymentPort
 *   4. Persistir resultado + actualizar estado del recibo
 *   5. Audit log BILL_PAYMENT_INITIATED + BILL_PAYMENT_COMPLETED
 *
 * @author SOFIA Developer Agent — FEAT-009 Sprint 11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BillPaymentUseCase {

    private final BillRepositoryPort billRepository;
    private final BillPaymentPort billPaymentPort;
    private final BillPaymentRepositoryPort billPaymentRepository;
    private final TwoFactorService twoFactorService;
    private final AuditLogService auditLog;

    @Transactional
    public PaymentResultDto pay(UUID userId, UUID billId, PayBillCommand cmd) {

        // 1. Buscar recibo activo del usuario
        Bill bill = billRepository.findByIdAndUserId(billId, userId)
                .orElseThrow(() -> new BillNotFoundException(billId));

        // 2. Verificar que no esté ya pagado
        if (bill.status() == BillStatus.PAID) {
            throw new BillAlreadyPaidException(billId);
        }

        // 3. Verificar OTP — PSD2 SCA obligatorio (ANTES del audit INITIATED — RV-001)
        twoFactorService.verifyCurrentOtp(userId, cmd.otpCode());

        auditLog.log("BILL_PAYMENT_INITIATED", userId,
                "billId=" + billId + " amount=" + bill.amount() + " issuer=" + bill.issuer());

        // 4. Ejecutar pago en core bancario (con idempotencyKey para reintentos seguros)
        UUID idempotencyKey = UUID.randomUUID();
        String coreTxnId = billPaymentPort.executePayment(
                cmd.sourceAccountId(), bill.amount(),
                bill.issuer() + " — " + bill.concept(), idempotencyKey);

        // 5. Persistir registro de pago en bill_payments (RV-002)
        LocalDateTime now = LocalDateTime.now();
        BillPayment payment = new BillPayment(
                UUID.randomUUID(), userId, billId, null,
                bill.issuer(), bill.amount(), cmd.sourceAccountId(),
                "COMPLETED", coreTxnId, now);
        BillPayment saved = billPaymentRepository.save(payment);

        // 6. Actualizar estado del recibo a PAID
        Bill paidBill = new Bill(bill.id(), bill.userId(), bill.issuer(), bill.concept(),
                bill.amount(), bill.dueDate(), BillStatus.PAID, bill.createdAt());
        billRepository.save(paidBill);

        auditLog.log("BILL_PAYMENT_COMPLETED", userId,
                "billId=" + billId + " paymentId=" + saved.id() + " coreTxnId=" + coreTxnId + " amount=" + bill.amount());

        log.info("[US-903] Recibo pagado: billId={} paymentId={} userId={} coreTxnId={}",
                billId, saved.id(), userId, coreTxnId);

        return new PaymentResultDto(saved.id(), "COMPLETED", now);
    }

    public List<BillDto> listPending(UUID userId) {
        return billRepository.findPendingByUserId(userId).stream()
                .map(b -> new BillDto(b.id(), b.issuer(), b.concept(),
                        b.amount(), b.dueDate(), b.status().name()))
                .toList();
    }

    // ── Excepciones de dominio ────────────────────────────────────────────────

    public static class BillNotFoundException extends RuntimeException {
        public BillNotFoundException(UUID billId) {
            super("Recibo no encontrado: " + billId);
        }
    }

    public static class BillAlreadyPaidException extends RuntimeException {
        private final String errorCode = "BILL_ALREADY_PAID";

        public BillAlreadyPaidException(UUID billId) {
            super("El recibo ya fue pagado: " + billId);
        }

        public String getErrorCode() { return errorCode; }
    }
}
