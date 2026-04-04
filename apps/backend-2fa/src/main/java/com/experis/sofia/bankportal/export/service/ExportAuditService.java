package com.experis.sofia.bankportal.export.service;

import com.experis.sofia.bankportal.account.domain.Account;
import com.experis.sofia.bankportal.account.domain.AccountRepositoryPort;
import com.experis.sofia.bankportal.export.domain.ExportAuditLog;
import com.experis.sofia.bankportal.export.domain.ExportFormat;
import com.experis.sofia.bankportal.export.dto.ExportRequest;
import com.experis.sofia.bankportal.export.repository.ExportAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Registro asíncrono del audit log de exportaciones.
 * RN-F018-12: fire-and-forget — no bloquea la respuesta al usuario.
 * RN-F018-13: retención 7 años (GDPR Art.17§3b, PCI-DSS Req.10.7).
 * DEBT-036 (Sprint 21): IBAN real desde AccountRepositoryPort — ya no proxy de accountId.
 * LA-020-03: enriquecer audit log en momento de escritura, no diferir.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21 (DEBT-036)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportAuditService {

    private final ExportAuditLogRepository auditLogRepository;
    private final AccountRepositoryPort    accountRepository;   // DEBT-036

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 500))
    public void recordAsync(UUID accountId, ExportRequest request,
                            String userId, String ipOrigen, String userAgent,
                            int numRegistros, String hashSha256) {
        try {
            // DEBT-036: obtener IBAN real en el momento de escritura (LA-020-03)
            String ibanMasked = resolveIbanMasked(accountId);

            ExportAuditLog entry = ExportAuditLog.builder()
                    .userId(UUID.fromString(userId))
                    .accountId(accountId)
                    .timestampUtc(OffsetDateTime.now())
                    .iban(ibanMasked)                    // DEBT-036: IBAN real enmascarado
                    .fechaDesde(request.getFechaDesde())
                    .fechaHasta(request.getFechaHasta())
                    .tipoMovimiento(request.getTipoMovimiento())
                    .formato(request.getFormato())
                    .numRegistros(numRegistros)
                    .ipOrigen(ipOrigen)
                    .userAgent(userAgent != null && userAgent.length() > 500
                            ? userAgent.substring(0, 500) : userAgent)
                    .hashSha256(request.getFormato() == ExportFormat.PDF ? hashSha256 : null)
                    .build();

            auditLogRepository.save(entry);
            log.debug("Audit log registrado: formato={}, registros={}, iban={}",
                    request.getFormato(), numRegistros, ibanMasked);

        } catch (Exception e) {
            // RN-F018-12: nunca propagar — el fallo no interrumpe la exportación
            log.warn("Audit log async fallo (no bloquea exportacion): {}", e.getMessage());
        }
    }

    /**
     * DEBT-036: resuelve IBAN real enmascarado (últimos 4 dígitos).
     * Si la cuenta no se encuentra, usa proxy seguro en lugar de lanzar excepción.
     */
    private String resolveIbanMasked(UUID accountId) {
        try {
            return accountRepository.findByUserId(accountId).stream()
                    .filter(a -> a.getId().equals(accountId))
                    .findFirst()
                    .map(Account::getIbanMasked)
                    .orElse("****" + accountId.toString().substring(28)); // fallback seguro
        } catch (Exception e) {
            log.warn("DEBT-036: No se pudo resolver IBAN para accountId={}: {}", accountId, e.getMessage());
            return "****" + accountId.toString().substring(28);
        }
    }
}
