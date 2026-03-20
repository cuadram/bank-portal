package com.experis.sofia.bankportal.transfer.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.beneficiary.domain.BeneficiaryRepositoryPort;
import com.experis.sofia.bankportal.transfer.application.dto.BeneficiaryTransferCommand;
import com.experis.sofia.bankportal.transfer.application.dto.TransferResponseDto;
import com.experis.sofia.bankportal.transfer.domain.BankCoreTransferPort;
import com.experis.sofia.bankportal.transfer.domain.Transfer;
import com.experis.sofia.bankportal.transfer.domain.TransferRepositoryPort;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * US-802 — Transferencia a beneficiario guardado con confirmación 2FA.
 * Regla de primera transferencia: requiere firstTransferConfirmed=true (PSD2 Art. 97).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransferToBeneficiaryUseCase {

    private final TransferLimitValidationService limitService;
    private final BankCoreTransferPort           corePort;
    private final TransferRepositoryPort         transferRepo;
    private final BeneficiaryRepositoryPort      beneficiaryRepo;
    private final TwoFactorService               twoFactorService;
    private final AuditLogService                auditLog;

    @Transactional
    public TransferResponseDto execute(BeneficiaryTransferCommand cmd) {
        auditLog.log("TRANSFER_INITIATED", cmd.userId(),
                "type=BENEFICIARY beneficiaryId=" + cmd.beneficiaryId() + " amount=" + cmd.amount());

        // 1. Beneficiario activo y perteneciente al usuario
        var beneficiary = beneficiaryRepo.findByIdAndUserId(cmd.beneficiaryId(), cmd.userId())
                .filter(b -> b.isActive())
                .orElseThrow(() -> new BeneficiaryTransferException("BENEFICIARY_NOT_FOUND"));

        // 2. Regla anti-fraude: primera transferencia requiere confirmación explícita
        // RV-003 fix: query específica en lugar de cargar todo el historial del usuario
        boolean isFirst = !transferRepo.existsCompletedTransferToBeneficiary(
                cmd.userId(), cmd.beneficiaryId());
        if (isFirst && !cmd.firstTransferConfirmed())
            throw new BeneficiaryTransferException("FIRST_TRANSFER_CONFIRMATION_REQUIRED");

        // 3. Validar límites
        limitService.validate(cmd.userId(), cmd.amount());

        // 4. Validar saldo
        var balance = corePort.getAvailableBalance(cmd.sourceAccountId());
        if (balance.compareTo(cmd.amount()) < 0)
            throw new TransferUseCase.InsufficientFundsException(balance, cmd.amount());

        // 5. OTP (PSD2 SCA)
        twoFactorService.verifyCurrentOtp(cmd.userId(), cmd.otpCode());
        auditLog.log("TRANSFER_OTP_VERIFIED", cmd.userId(), "type=BENEFICIARY");

        // 6. Ejecutar en core (transferencia externa — destino es IBAN del beneficiario)
        var result = corePort.executeExternalTransfer(
                cmd.sourceAccountId(), beneficiary.getIban(), cmd.amount(), cmd.concept());
        if (!result.success()) throw new BeneficiaryTransferException(result.errorCode());

        // 7. Persistir
        var transfer = new Transfer(cmd.userId(), cmd.sourceAccountId(), null,
                cmd.beneficiaryId(), cmd.amount(), cmd.concept());
        transfer.complete();
        transferRepo.save(transfer);

        // 8. Contador Redis (best-effort)
        limitService.incrementDailyAccumulated(cmd.userId(), cmd.amount());

        auditLog.log("TRANSFER_TO_BENEFICIARY_COMPLETED", cmd.userId(),
                "transferId=" + transfer.getId() + " alias=" + beneficiary.getAlias());
        log.info("[US-802] Transferencia a beneficiario completada userId={} alias={} amount={}",
                cmd.userId(), beneficiary.getAlias(), cmd.amount());

        return new TransferResponseDto(transfer.getId(), "COMPLETED",
                transfer.getExecutedAt(), result.sourceBalance(), result.targetBalance());
    }

    public static class BeneficiaryTransferException extends RuntimeException {
        public BeneficiaryTransferException(String code) { super(code); }
    }
}
