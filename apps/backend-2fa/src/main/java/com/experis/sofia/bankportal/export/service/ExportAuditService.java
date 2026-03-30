package com.experis.sofia.bankportal.export.service;

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
 * HOTFIX-S20: paquete corregido + usa ExportAuditLogRepository real.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExportAuditService {

    private final ExportAuditLogRepository auditLogRepository;

    @Async
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 500))
    public void recordAsync(UUID accountId, ExportRequest request,
                            String userId, String ipOrigen, String userAgent,
                            int numRegistros, String hashSha256) {
        try {
            ExportAuditLog entry = ExportAuditLog.builder()
                    .userId(UUID.fromString(userId))
                    .accountId(accountId)
                    .timestampUtc(OffsetDateTime.now())
                    .iban("ACCOUNT-" + accountId.toString().substring(24)) // DEBT-036: enriquecer con IBAN real
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
            log.debug("Audit log registrado: formato={}, registros={}, account={}",
                    request.getFormato(), numRegistros, accountId);

        } catch (Exception e) {
            // RN-F018-12: nunca propagar — el fallo no interrumpe la exportación
            log.warn("Audit log async fallo (no bloquea exportacion): {}", e.getMessage());
        }
    }
}
