package com.experis.sofia.bankportal.directdebit.scheduler;

import com.experis.sofia.bankportal.directdebit.domain.DebitStatus;
import com.experis.sofia.bankportal.directdebit.repository.DirectDebitRepository;
import com.experis.sofia.bankportal.directdebit.service.DebitEventHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

/**
 * US-1705: SEPA DD debit processing scheduler.
 * Processes PENDING debits with dueDate <= today.
 * ShedLock prevents concurrent execution across instances.
 * FEAT-017 Sprint 19
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SimulaCobroJob {

    private final DirectDebitRepository debitRepo;
    private final DebitEventHandler eventHandler;

    @Scheduled(cron = "0 0 8 * * MON-FRI")
    @SchedulerLock(
        name = "SimulaCobroJob",
        lockAtMostFor  = "PT30M",
        lockAtLeastFor = "PT5M"
    )
    public void processDebits() {
        var pending = debitRepo.findByStatusAndDueDateLessThanEqual(
            DebitStatus.PENDING, LocalDate.now());

        log.info("[SimulaCobroJob] Processing {} pending debits for {}", pending.size(), LocalDate.now());

        for (var debit : pending) {
            try {
                // Simulate: 90% charged, 10% rejected (MVP — real CoreBanking in Sprint 20)
                if (Math.random() < 0.9) {
                    eventHandler.processCharged(debit);
                } else {
                    eventHandler.processRejected(debit);
                }
            } catch (Exception e) {
                log.error("[SimulaCobroJob] Error processing debit {}: {}", debit.getId(), e.getMessage());
            }
        }

        log.info("[SimulaCobroJob] Completed processing {} debits", pending.size());
    }
}
