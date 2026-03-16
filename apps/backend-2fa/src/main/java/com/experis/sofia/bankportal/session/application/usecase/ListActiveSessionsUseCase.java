package com.experis.sofia.bankportal.session.application.usecase;

import com.experis.sofia.bankportal.session.application.dto.SessionResponse;
import com.experis.sofia.bankportal.session.domain.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Caso de uso US-101 — Listar sesiones activas del usuario autenticado.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Service
@RequiredArgsConstructor
public class ListActiveSessionsUseCase {

    private final UserSessionRepository sessionRepository;

    /**
     * Retorna las sesiones activas del usuario, marcando cuál es la actual.
     *
     * @param userId     ID del usuario autenticado
     * @param currentJti JTI del JWT de la request actual
     * @return lista de sesiones ordenada por lastActivity DESC
     */
    @Transactional(readOnly = true)
    public List<SessionResponse> execute(UUID userId, String currentJti) {
        return sessionRepository.findAllActiveByUserId(userId).stream()
                .map(session -> new SessionResponse(
                        session.getId().toString(),
                        session.getDeviceInfo().os(),
                        session.getDeviceInfo().browser(),
                        session.getDeviceInfo().deviceType(),
                        session.getIpMasked(),
                        session.getLastActivity(),
                        session.getCreatedAt(),
                        session.getJti().equals(currentJti)
                ))
                .toList();
    }
}
