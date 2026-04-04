package com.experis.sofia.bankportal.scheduled.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de invariantes del aggregate root ScheduledTransfer.
 *
 * @author SOFIA QA Agent — FEAT-015 Sprint 17
 */
class ScheduledTransferTest {

    private static final LocalDate TOMORROW = LocalDate.now().plusDays(1);

    private ScheduledTransfer newTransfer(ScheduledTransferType type) {
        return new ScheduledTransfer(
                UUID.randomUUID(), UUID.randomUUID(), "ES7600000000000000000001",
                "Destino Test", BigDecimal.valueOf(100), "EUR", "Concepto",
                type, TOMORROW, null, null
        );
    }

    private ScheduledTransfer reconstitute(ScheduledTransferStatus status) {
        return new ScheduledTransfer(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                "IBAN", "Dest", BigDecimal.TEN, "EUR", "Test",
                ScheduledTransferType.MONTHLY, status,
                TOMORROW, TOMORROW, null, null, 0,
                LocalDateTime.now(), LocalDateTime.now(), null
        );
    }

    @Test @DisplayName("Constructor rechaza importe ≤ 0")
    void rejects_non_positive_amount() {
        assertThrows(IllegalArgumentException.class, () ->
                new ScheduledTransfer(UUID.randomUUID(), UUID.randomUUID(),
                        "IBAN", "Dest", BigDecimal.ZERO, "EUR", "Test",
                        ScheduledTransferType.ONCE, TOMORROW, null, null));
    }

    @Test @DisplayName("Constructor rechaza fecha hoy o pasada")
    void rejects_today_date() {
        assertThrows(IllegalArgumentException.class, () ->
                new ScheduledTransfer(UUID.randomUUID(), UUID.randomUUID(),
                        "IBAN", "Dest", BigDecimal.TEN, "EUR", "Test",
                        ScheduledTransferType.ONCE, LocalDate.now(), null, null));
    }

    @Test @DisplayName("pause() desde ACTIVE → PAUSED")
    void pause_from_active() {
        ScheduledTransfer t = reconstitute(ScheduledTransferStatus.ACTIVE);
        t.pause();
        assertEquals(ScheduledTransferStatus.PAUSED, t.getStatus());
    }

    @Test @DisplayName("pause() desde PENDING lanza excepción")
    void pause_from_pending_throws() {
        ScheduledTransfer t = newTransfer(ScheduledTransferType.MONTHLY);
        assertThrows(IllegalStateException.class, t::pause);
    }

    @Test @DisplayName("resume() desde PAUSED → ACTIVE")
    void resume_from_paused() {
        ScheduledTransfer t = reconstitute(ScheduledTransferStatus.PAUSED);
        t.resume();
        assertEquals(ScheduledTransferStatus.ACTIVE, t.getStatus());
    }

    @Test @DisplayName("cancel() desde PENDING → CANCELLED")
    void cancel_from_pending() {
        ScheduledTransfer t = newTransfer(ScheduledTransferType.ONCE);
        t.cancel();
        assertEquals(ScheduledTransferStatus.CANCELLED, t.getStatus());
        assertNotNull(t.getCancelledAt());
    }

    @Test @DisplayName("cancel() desde COMPLETED lanza excepción")
    void cancel_from_completed_throws() {
        ScheduledTransfer t = reconstitute(ScheduledTransferStatus.COMPLETED);
        assertThrows(IllegalStateException.class, t::cancel);
    }

    @Test @DisplayName("ONCE: incrementExecutions → COMPLETED + nextDate null")
    void once_completes_after_first_execution() {
        ScheduledTransfer t = newTransfer(ScheduledTransferType.ONCE);
        t.incrementExecutions(null);
        assertEquals(ScheduledTransferStatus.COMPLETED, t.getStatus());
        assertNull(t.getNextExecutionDate());
        assertEquals(1, t.getExecutionsCount());
    }

    @Test @DisplayName("MONTHLY: incrementExecutions → ACTIVE + nextDate avanza")
    void monthly_remains_active_after_execution() {
        ScheduledTransfer t = newTransfer(ScheduledTransferType.MONTHLY);
        LocalDate next = TOMORROW.plusMonths(1);
        t.incrementExecutions(next);
        assertEquals(ScheduledTransferStatus.ACTIVE, t.getStatus());
        assertEquals(next, t.getNextExecutionDate());
        assertEquals(1, t.getExecutionsCount());
    }

    @Test @DisplayName("MONTHLY con maxExecutions=2: segunda ejecución → COMPLETED")
    void monthly_completes_after_max_executions() {
        ScheduledTransfer t = new ScheduledTransfer(
                UUID.randomUUID(), UUID.randomUUID(), "IBAN", "Dest",
                BigDecimal.TEN, "EUR", "Test",
                ScheduledTransferType.MONTHLY, TOMORROW, null, 2);
        LocalDate next1 = TOMORROW.plusMonths(1);
        LocalDate next2 = TOMORROW.plusMonths(2);
        t.incrementExecutions(next1);
        assertEquals(ScheduledTransferStatus.ACTIVE, t.getStatus());
        t.incrementExecutions(next2);
        assertEquals(ScheduledTransferStatus.COMPLETED, t.getStatus());
        assertNull(t.getNextExecutionDate());
    }
}
