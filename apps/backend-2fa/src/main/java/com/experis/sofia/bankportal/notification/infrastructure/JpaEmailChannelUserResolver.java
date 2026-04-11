package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import com.experis.sofia.bankportal.notification.application.EmailChannelUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resuelve el email de un usuario desde {@link UserAccountRepository}.
 * Implementación de infraestructura del puerto {@link EmailChannelUserResolver}.
 */
@Component
@RequiredArgsConstructor
public class JpaEmailChannelUserResolver implements EmailChannelUserResolver {

    private final UserAccountRepository userAccountRepository;

    @Override
    public String resolveEmail(UUID userId) {
        return userAccountRepository.findById(userId)
                .map(u -> u.getEmail())
                .orElse(null);
    }
}
