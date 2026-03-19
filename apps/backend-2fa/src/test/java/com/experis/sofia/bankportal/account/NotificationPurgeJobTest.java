package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.notification.infrastructure.NotificationPurgeJob;
import com.experis.sofia.bankportal.notification.domain.UserNotificationRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * DEBT-012 — Tests unitarios NotificationPurgeJob.
 *
 * @author SOFIA Developer Agent — DEBT-012 Sprint 9
 */
@ExtendWith(MockitoExtension.class)
class NotificationPurgeJobTest {

    @Mock  UserNotificationRepository notificationRepository;
    @Spy   MeterRegistry meterRegistry = new SimpleMeterRegistry();
    @InjectMocks NotificationPurgeJob purgeJob;

    @Test
    @DisplayName("DEBT-012: purga notificaciones con más de 90 días")
    void purge_deletesOlderThan90Days() {
        when(notificationRepository.deleteExpiredBefore(any())).thenReturn(42);

        purgeJob.purgeOldNotifications();

        ArgumentCaptor<Instant> cutoffCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(notificationRepository).deleteExpiredBefore(cutoffCaptor.capture());

        Instant cutoff = cutoffCaptor.getValue();
        Instant expected = Instant.now().minus(90, ChronoUnit.DAYS);

        // El cutoff debe estar entre 90 días menos 5 segundos y 90 días menos ahora
        assertThat(cutoff).isBefore(expected.plusSeconds(5));
        assertThat(cutoff).isAfter(expected.minusSeconds(5));
    }

    @Test
    @DisplayName("DEBT-012: idempotente — 0 purgadas no lanza excepción")
    void purge_zeroDeleted_noException() {
        when(notificationRepository.deleteExpiredBefore(any())).thenReturn(0);

        purgeJob.purgeOldNotifications();  // no debe lanzar excepción

        verify(notificationRepository, times(1)).deleteExpiredBefore(any());
    }

    @Test
    @DisplayName("DEBT-012: notificaciones de hace 89 días NO se purgan (límite exclusivo)")
    void purge_cutoffIs90DaysExclusive() {
        ArgumentCaptor<Instant> cutoffCaptor = ArgumentCaptor.forClass(Instant.class);
        when(notificationRepository.deleteExpiredBefore(any())).thenReturn(0);

        purgeJob.purgeOldNotifications();

        verify(notificationRepository).deleteExpiredBefore(cutoffCaptor.capture());
        Instant cutoff = cutoffCaptor.getValue();

        // Una notificación de hace 89 días NO debería caer antes del cutoff
        Instant notif89Days = Instant.now().minus(89, ChronoUnit.DAYS);
        assertThat(notif89Days).isAfter(cutoff);
    }
}
