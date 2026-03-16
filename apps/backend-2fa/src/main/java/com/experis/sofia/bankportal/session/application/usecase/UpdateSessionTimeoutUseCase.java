package com.experis.sofia.bankportal.session.application.usecase;

import com.experis.sofia.bankportal.session.application.dto.UpdateTimeoutRequest;
import com.experis.sofia.bankportal.session.domain.service.SessionDomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Caso de uso US-103 — Actualizar el timeout de inactividad del usuario.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
@RequiredArgsConstructor
public class UpdateSessionTimeoutUseCase {

    private final SessionDomainService domainService;
    private final JdbcTemplate         jdbcTemplate;

    /**
     * @param userId  ID del usuario autenticado
     * @param request request con el nuevo timeout en minutos
     * @throws IllegalArgumentException si el valor supera la política institucional
     */
    @Transactional
    public int execute(UUID userId, UpdateTimeoutRequest request) {
        // Valida contra la política institucional (5-60 min)
        domainService.validateTimeout(request.timeoutMinutes());

        jdbcTemplate.update(
                "UPDATE users SET session_timeout_minutes = ? WHERE id = ?",
                request.timeoutMinutes(), userId
        );
        return request.timeoutMinutes();
    }
}
