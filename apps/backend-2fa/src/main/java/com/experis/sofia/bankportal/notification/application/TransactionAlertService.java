package com.experis.sofia.bankportal.notification.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Map;

import static com.experis.sofia.bankportal.notification.domain.NotificationEventType.*;

/**
 * Listener de eventos transaccionales de negocio — FEAT-014.
 *
 * <p>Escucha los eventos publicados por TransferService, PaymentService, etc.
 * y los convierte en {@link NotificationEvent} para que el Hub los despache.
 *
 * <p>{@code AFTER_COMMIT}: garantiza que el evento solo se procesa si la
 * transacción de negocio se confirmó exitosamente en BD.
 *
 * @author SOFIA Developer Agent — FEAT-014 Sprint 16
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionAlertService {

    private final NotificationHub hub;

    // ── Eventos de transferencia ────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransferCompleted(TransferCompletedEvent event) {
        log.debug("[Alert] TRANSFER_COMPLETED userId={} amount={}", event.userId(), event.amount());
        hub.dispatch(NotificationEvent.of(
                event.userId(), TRANSFER_COMPLETED,
                "Transferencia enviada",
                String.format("%.2f€ enviados a %s", event.amount(), maskIban(event.iban())),
                Map.of("amount", event.amount(), "iban", event.iban())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTransferReceived(TransferReceivedEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), TRANSFER_RECEIVED,
                "Transferencia recibida",
                String.format("%.2f€ recibidos de %s", event.amount(), maskIban(event.originIban())),
                Map.of("amount", event.amount(), "originIban", event.originIban())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentCompleted(PaymentCompletedEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), PAYMENT_COMPLETED,
                "Pago completado",
                String.format("%.2f€ pagados a %s", event.amount(), event.payeeName()),
                Map.of("amount", event.amount(), "payeeName", event.payeeName())
        ));
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBillPaid(BillPaidEvent event) {
        hub.dispatch(NotificationEvent.of(
                event.userId(), BILL_PAID,
                "Factura pagada",
                String.format("%s — %.2f€", event.billProvider(), event.amount()),
                Map.of("amount", event.amount(), "provider", event.billProvider())
        ));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private String maskIban(String iban) {
        if (iban == null || iban.length() < 8) return "****";
        return iban.substring(0, 4) + " **** **** " + iban.substring(iban.length() - 4);
    }

    // ── Domain Events (records) ──────────────────────────────────────────────

    public record TransferCompletedEvent(java.util.UUID userId, double amount, String iban) {}
    public record TransferReceivedEvent (java.util.UUID userId, double amount, String originIban) {}
    public record PaymentCompletedEvent (java.util.UUID userId, double amount, String payeeName) {}
    public record BillPaidEvent         (java.util.UUID userId, double amount, String billProvider) {}
}
