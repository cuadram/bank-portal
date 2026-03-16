package com.experis.sofia.bankportal.session.infrastructure.notification;

import com.experis.sofia.bankportal.session.domain.model.DeviceInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Adaptador de notificaciones de seguridad (US-105).
 * Envía email transaccional cuando se detecta login desde dispositivo nuevo.
 *
 * <p>El envío es asíncrono para no bloquear el flujo de login.
 *
 * @author SOFIA Developer Agent — FEAT-002 Sprint 3
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityNotificationAdapter {

    private final JavaMailSender mailSender;

    @Value("${notification.email.from}")
    private String fromAddress;

    @Value("${notification.email.deny-base-url}")
    private String denyBaseUrl;

    /**
     * Envía alerta de seguridad por login desde dispositivo nuevo.
     *
     * @param userId      ID del usuario destinatario
     * @param userEmail   dirección email del usuario
     * @param deviceInfo  información del dispositivo del login
     * @param ipMasked    IP enmascarada del login
     * @param denyToken   token HMAC firmado para el enlace "No fui yo"
     */
    @Async
    public void sendLoginAlert(UUID userId, String userEmail, DeviceInfo deviceInfo,
                                String ipMasked, String denyToken) {
        try {
            var message = mailSender.createMimeMessage();
            var helper  = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress);
            helper.setTo(userEmail);
            helper.setSubject("[Banco Meridian] Nuevo acceso detectado en tu cuenta");
            helper.setText(buildHtmlBody(deviceInfo, ipMasked, denyToken), true);

            mailSender.send(message);
            log.info("Security alert sent to user={}", userId);
        } catch (Exception e) {
            // No propagar excepción — el login no debe fallar por el email
            log.error("Failed to send security alert for user={}: {}", userId, e.getMessage());
        }
    }

    private String buildHtmlBody(DeviceInfo deviceInfo, String ipMasked, String denyToken) {
        String denyUrl = denyBaseUrl + "/" + denyToken;
        return """
            <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1B3A6B">Nuevo acceso a tu cuenta</h2>
              <p>Hemos detectado un acceso desde un dispositivo nuevo:</p>
              <table style="border-collapse:collapse;width:100%%">
                <tr><td style="padding:8px;background:#f5f5f5"><b>Dispositivo</b></td>
                    <td style="padding:8px">%s %s</td></tr>
                <tr><td style="padding:8px;background:#f5f5f5"><b>Tipo</b></td>
                    <td style="padding:8px">%s</td></tr>
                <tr><td style="padding:8px;background:#f5f5f5"><b>IP</b></td>
                    <td style="padding:8px">%s</td></tr>
              </table>
              <p>Si fuiste tú, puedes ignorar este mensaje.</p>
              <p><a href="%s" style="background:#cc0000;color:white;padding:10px 20px;
                 text-decoration:none;border-radius:4px;display:inline-block">
                 No fui yo — cerrar esta sesión</a></p>
              <p style="color:#888;font-size:12px">
                Este enlace expira en 24 horas. Banco Meridian nunca te pedirá
                tu contraseña por email.
              </p>
            </body></html>
            """.formatted(
                    deviceInfo.os(), deviceInfo.browser(),
                    deviceInfo.deviceType(), ipMasked, denyUrl);
    }
}
