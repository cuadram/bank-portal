package com.experis.sofia.bankportal.notification.infrastructure;

import com.experis.sofia.bankportal.notification.domain.EmailNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationServiceImpl implements EmailNotificationService {
    private final JavaMailSender mailSender;

    @Value("${notification.email.from:seguridad@bankmeridian.com}")
    private String from;

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from); msg.setTo(to); msg.setSubject(subject); msg.setText(text);
            mailSender.send(msg);
            log.debug("[Email] Sent to={}", to);
        } catch (Exception e) { log.warn("[Email] Failed to={}: {}", to, e.getMessage()); }
    }

    @Override public void sendAccountLockedEmail(String to, String unlockUrl) { send(to, "Cuenta bloqueada", "Desbloquee su cuenta: " + unlockUrl); }
    @Override public void sendAccountUnlockedEmail(String to) { send(to, "Cuenta desbloqueada", "Su cuenta ha sido desbloqueada."); }
    @Override public void sendNewContextAlertEmail(String to, String confirmUrl, String subnet) { send(to, "Nuevo acceso", "Nuevo acceso desde " + subnet + ". Confirme: " + confirmUrl); }
    @Override public void sendContextConfirmLink(String to, String confirmToken, String subnet) { send(to, "Confirme acceso", "Token: " + confirmToken + " desde " + subnet); }
    @Override public void sendUnlockLink(String to, String rawToken) { send(to, "Desbloqueo", "Token: " + rawToken); }
    @Override public void sendGenericEmail(String to, String subject, String body) { send(to, subject, body); }
}
