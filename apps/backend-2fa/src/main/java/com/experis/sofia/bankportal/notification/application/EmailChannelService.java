package com.experis.sofia.bankportal.notification.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Canal de email para notificaciones multicanal — FEAT-014.
 *
 * <p>Invocado desde {@link NotificationHub#dispatch}, que ya corre en el
 * executor {@code notificationExecutor}. Por tanto, este servicio es
 * síncrono — no lleva {@code @Async} propio para evitar doble despacho
 * al mismo pool (RV-F014-06 fix).
 *
 * <p>El flujo de email de seguridad FEAT-004 (NotificationService) no se modifica.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailChannelService {

    private final JavaMailSender          mailSender;
    private final EmailChannelUserResolver userResolver;

    /**
     * Envía email de notificación al usuario.
     * Se ejecuta en el hilo del executor del Hub — no lanzar excepciones checked.
     */
    public void sendNotificationEmail(UUID userId, String subject, String body) {
        try {
            String email = userResolver.resolveEmail(userId);
            if (email == null) {
                log.warn("[Email] no email found for userId={}", userId);
                return;
            }
            var msg = new SimpleMailMessage();
            msg.setTo(email);
            msg.setSubject("[Banco Meridian] " + subject);
            msg.setText(body + "\n\nSi no reconoces esta actividad, accede a tu banca online y contacta soporte.");
            mailSender.send(msg);
            log.debug("[Email] sent userId={} subject={}", userId, subject);
        } catch (Exception e) {
            log.error("[Email] send failed userId={}: {}", userId, e.getMessage());
        }
    }
}
