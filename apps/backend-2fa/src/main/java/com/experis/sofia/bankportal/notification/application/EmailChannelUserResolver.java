package com.experis.sofia.bankportal.notification.application;

import java.util.UUID;

/**
 * Puerto de dominio para resolver el email de un usuario a partir de su ID.
 * Implementado en infraestructura por {@code JpaEmailChannelUserResolver}.
 */
public interface EmailChannelUserResolver {
    String resolveEmail(UUID userId);
}
