package com.experis.sofia.bankportal.scheduled.infrastructure;

import com.experis.sofia.bankportal.scheduled.application.usecase.RetrySchedulerPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
public class RetrySchedulerAdapter implements RetrySchedulerPort {
    @Override
    public void scheduleRetry(UUID scheduledTransferId, LocalDate scheduledDate, int delayHours) {
        log.debug("[RetryScheduler] id={} delay={}h", scheduledTransferId, delayHours);
    }
}
