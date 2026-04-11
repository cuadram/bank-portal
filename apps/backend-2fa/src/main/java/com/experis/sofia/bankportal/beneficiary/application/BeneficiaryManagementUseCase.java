package com.experis.sofia.bankportal.beneficiary.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.beneficiary.application.dto.BeneficiaryDto;
import com.experis.sofia.bankportal.beneficiary.application.dto.CreateBeneficiaryCommand;
import com.experis.sofia.bankportal.beneficiary.domain.Beneficiary;
import com.experis.sofia.bankportal.beneficiary.domain.BeneficiaryRepositoryPort;
import com.experis.sofia.bankportal.beneficiary.domain.IbanValidator;
import com.experis.sofia.bankportal.twofa.domain.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * US-803 — CRUD de beneficiarios. Alta requiere OTP (PSD2 SCA).
 * Edición de alias no requiere OTP (cambio no financiero).
 * Eliminación es lógica (soft delete).
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BeneficiaryManagementUseCase {

    private final BeneficiaryRepositoryPort repo;
    private final IbanValidator             ibanValidator;
    private final TwoFactorService          twoFactorService;
    private final AuditLogService           auditLog;

    public List<BeneficiaryDto> listActive(UUID userId) {
        return repo.findActiveByUserId(userId).stream()
                .map(BeneficiaryDto::from).toList();
    }

    @Transactional
    public BeneficiaryDto create(CreateBeneficiaryCommand cmd) {
        ibanValidator.validate(cmd.iban());
        if (repo.existsActiveByUserIdAndIban(cmd.userId(), cmd.iban()))
            throw new BeneficiaryAlreadyExistsException(cmd.iban());
        twoFactorService.verifyCurrentOtp(cmd.userId(), cmd.otpCode());

        var b = new Beneficiary(cmd.userId(), cmd.alias(), cmd.iban(), cmd.holderName());
        repo.save(b);
        auditLog.log("BENEFICIARY_ADDED", cmd.userId(),
                "alias=" + cmd.alias() + " iban=" + b.getMaskedIban());
        log.info("[US-803] Beneficiario añadido userId={} iban={}", cmd.userId(), b.getMaskedIban());
        return BeneficiaryDto.from(b);
    }

    @Transactional
    public BeneficiaryDto updateAlias(UUID id, UUID userId, String newAlias) {
        var b = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new BeneficiaryNotFoundException(id));
        b.updateAlias(newAlias);
        repo.save(b);
        auditLog.log("BENEFICIARY_UPDATED", userId, "id=" + id + " alias=" + newAlias);
        return BeneficiaryDto.from(b);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var b = repo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new BeneficiaryNotFoundException(id));
        b.softDelete();
        repo.save(b);
        auditLog.log("BENEFICIARY_DELETED", userId, "id=" + id);
        log.info("[US-803] Beneficiario eliminado (soft) userId={} id={}", userId, id);
    }

    public static class BeneficiaryNotFoundException extends RuntimeException {
        public BeneficiaryNotFoundException(UUID id) { super("Beneficiario no encontrado: " + id); }
    }

    public static class BeneficiaryAlreadyExistsException extends RuntimeException {
        public BeneficiaryAlreadyExistsException(String iban) {
            super("Ya existe beneficiario activo con IBAN ****" + iban.substring(iban.length() - 4));
        }
    }
}
