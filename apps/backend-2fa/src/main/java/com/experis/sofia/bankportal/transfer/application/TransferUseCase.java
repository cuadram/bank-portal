package com.experis.sofia.bankportal.transfer.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.transfer.application.dto.OwnTransferCommand;
import com.experis.sofia.bankportal.transfer.application.dto.TransferResponseDto;
import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
import com.experis.sofia.bankportal.transfer.domain.Transfer;
import com.experis.sofia.bankportal.transfer.domain.TransferRepositoryPort;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * US-801 — Transferencia entre cuentas propias con confirmación 2FA (PSD2 SCA).
 * Saga local @Transactional — ADR-016.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransferUseCase {

    private final TransferLimitValidationService limitService;
    private final BankCoreTransferPort           corePort;
    private final TransferRepositoryPort         transferRepo;
    private final TwoFactorService               twoFactorService;
    private final AuditLogService                auditLog;

    @Transactional
    public TransferResponseDto execute(OwnTransferCommand cmd) {
        auditLog.log("TRANSFER_INITIATED", cmd.userId(),
                "source=" + cmd.sourceAccountId() + " target=" + cmd.targetAccountId() + " amount=" + cmd.amount());

        // 1. Validar límites (RF-804)
        limitService.validate(cmd.userId(), cmd.amount());

        // 2. Validar saldo disponible
        BigDecimal balance = corePort.getAvailableBalance(cmd.sourceAccountId());
        if (balance.compareTo(cmd.amount()) < 0)
            throw new InsufficientFundsException(balance, cmd.amount());

        // 3. Verificar OTP (PSD2 SCA — obligatorio sin excepción)
        twoFactorService.verifyCurrentOtp(cmd.userId(), cmd.otpCode());
        auditLog.log("TRANSFER_OTP_VERIFIED", cmd.userId(), "type=OWN");

        // 4. Ejecutar en core bancario (mock Sprint 10)
        var result = corePort.executeOwnTransfer(
                cmd.sourceAccountId(), cmd.targetAccountId(), cmd.amount(), cmd.concept());
        if (!result.success()) throw new TransferCoreException(result.errorCode());

        // 5. Persistir en BD (@Transactional garantiza atomicidad)
        var transfer = new Transfer(cmd.userId(), cmd.sourceAccountId(),
                cmd.targetAccountId(), null, cmd.amount(), cmd.concept());
        transfer.complete();
        transferRepo.save(transfer);

        // 6. Incrementar contador Redis (best-effort — no bloquea si Redis falla)
        limitService.incrementDailyAccumulated(cmd.userId(), cmd.amount());

        auditLog.log("TRANSFER_COMPLETED", cmd.userId(), transfer.getId().toString());
        log.info("[US-801] Transferencia completada userId={} transferId={} amount={}",
                cmd.userId(), transfer.getId(), cmd.amount());

        return new TransferResponseDto(transfer.getId(), "COMPLETED",
                transfer.getExecutedAt(), result.sourceBalance(), result.targetBalance());
    }

    public static class InsufficientFundsException extends RuntimeException {
        public InsufficientFundsException(BigDecimal balance, BigDecimal requested) {
            super("Saldo insuficiente: disponible=" + balance + " solicitado=" + requested);
        }
    }

    public static class TransferCoreException extends RuntimeException {
        public TransferCoreException(String code) { super("Core bancario error: " + code); }
    }
}
