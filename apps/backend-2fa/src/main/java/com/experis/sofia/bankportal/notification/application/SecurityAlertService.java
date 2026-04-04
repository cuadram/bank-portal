package com.experis.sofia.bankportal.notification.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

import static com.experis.sofia.bankportal.notification.domain.NotificationEventType.*;

/**
 * Listener de eventos de seguridad — FEAT-014.
 *
 * <p>Todos los eventos de seguridad son severity=HIGH, por lo que el Hub
 * los entrega por email e in-app ignorando preferencias del usuario.
 * El canal push sí respeta la preferencia.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAlertService {

    private final NotificationHub hub;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDeviceRegistered(DeviceRegisteredEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), SECURITY_NEW_DEVICE,
                "Acceso desde nuevo dispositivo",
                String.format("Acceso detectado en %s · %s (%s)",
                        event.browser(), event.os(), event.ipMasked()),
                Map.of("browser", event.browser(), "os", event.os(),
                        "ipMasked", event.ipMasked())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPasswordChanged(PasswordChangedEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), SECURITY_PASSWORD_CHANGED,
                "Contraseña actualizada",
                "Tu contraseña fue cambiada exitosamente. Si no fuiste tú, contacta soporte.",
                Map.of()
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTwoFactorFailed(TwoFactorFailedEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), SECURITY_2FA_FAILED,
                "Intento de verificación 2FA fallido",
                String.format("%d intentos fallidos de verificación en los últimos 10 minutos",
                        event.attempts()),
                Map.of("attempts", event.attempts(), "ipMasked", event.ipMasked())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPhoneChanged(PhoneChangedEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), SECURITY_PHONE_CHANGED,
                "Número de teléfono actualizado",
                "El teléfono de verificación de tu cuenta fue modificado.",
                Map.of()
        ));
    }

    // ── Domain Events (records) ──────────────────────────────────────────────

    public record DeviceRegisteredEvent(java.util.UUID userId, String browser,
                                        String os, String ipMasked) {}
    public record PasswordChangedEvent (java.util.UUID userId) {}
    public record TwoFactorFailedEvent (java.util.UUID userId, int attempts, String ipMasked) {}
    public record PhoneChangedEvent    (java.util.UUID userId) {}
}
