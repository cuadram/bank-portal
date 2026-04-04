package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.application.usecase.ScheduledTransferNotificationPort;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransfer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;

@Slf4j
@Service
public class ScheduledTransferNotificationAdapter implements ScheduledTransferNotificationPort {
    @Override
    public void notifySuccess(ScheduledTransfer t, LocalDate executionDate) {
        log.debug("[ScheduledNotif] success id={}", t.getId());
    }
    @Override
    public void notifyFailure(ScheduledTransfer t, LocalDate executionDate, String reason) {
        log.debug("[ScheduledNotif] failure id={} reason={}", t.getId(), reason);
    }
}
