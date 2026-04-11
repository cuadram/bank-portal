package com.experis.sofia.bankportal.privacy.application;

import com.experis.sofia.bankportal.privacy.application.dto.ConsentResponse;
import com.experis.sofia.bankportal.privacy.application.dto.ConsentUpdateRequest;
import com.experis.sofia.bankportal.privacy.domain.ConsentHistory;
import com.experis.sofia.bankportal.privacy.domain.ConsentType;
import com.experis.sofia.bankportal.privacy.infrastructure.ConsentHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Gestión de consentimientos GDPR Art.7 con historial inmutable.
 * RN-F019-15: SECURITY no es desactivable.
 * RN-F019-16: cada cambio genera registro en consent_history (INSERT-only).
 * RN-F019-17: COMMUNICATIONS sincroniza con preferencias de notificación.
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConsentManagementService {

    private final ConsentHistoryRepository consentRepo;

    /** RF-019-04: lista estado actual de todos los consentimientos. */
    @Transactional(readOnly = true)
    public List<ConsentResponse> getCurrentConsents(UUID userId) {
        List<ConsentHistory> current = consentRepo.findCurrentConsents(userId);

        // Si no hay historial todavía, devolver defaults
        if (current.isEmpty()) {
            return List.of(
                new ConsentResponse(ConsentType.MARKETING,      true,  LocalDateTime.now()),
                new ConsentResponse(ConsentType.ANALYTICS,      false, LocalDateTime.now()),
                new ConsentResponse(ConsentType.COMMUNICATIONS, true,  LocalDateTime.now()),
                new ConsentResponse(ConsentType.SECURITY,       true,  LocalDateTime.now())
            );
        }

        return current.stream()
            .map(c -> new ConsentResponse(c.getTipo(), c.isValorNuevo(), c.getCreatedAt()))
            .collect(Collectors.toList());
    }

    /** RF-019-04: actualiza un consentimiento e inserta registro en historial. */
    @Transactional
    public ConsentResponse updateConsent(UUID userId, ConsentUpdateRequest dto, String ipOrigen) {
        // RN-F019-15: SECURITY no es toggleable
        if (!dto.tipo().isToggleable()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "CONSENT_NOT_TOGGLEABLE: Las alertas de seguridad no pueden desactivarse");
        }

        // Recuperar valor anterior para el historial (RN-F019-16)
        Boolean valorAnterior = consentRepo.findLatest(userId, dto.tipo())
            .map(ConsentHistory::isValorNuevo)
            .orElse(null);

        // Insertar registro inmutable (LA-019-13: LocalDateTime)
        ConsentHistory entry = ConsentHistory.builder()
            .userId(userId)
            .tipo(dto.tipo())
            .valorAnterior(valorAnterior)
            .valorNuevo(dto.activo())
            .ipOrigen(ipOrigen)
            .createdAt(LocalDateTime.now())
            .build();
        consentRepo.save(entry);

        log.info("[FEAT-019] Consentimiento {} {} → {} userId={}",
            dto.tipo(), valorAnterior, dto.activo(), userId);

        return new ConsentResponse(dto.tipo(), dto.activo(), entry.getCreatedAt());
    }
}
