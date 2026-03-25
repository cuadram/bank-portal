package com.experis.sofia.bankportal.scheduled.application.scheduler;

import com.experis.sofia.bankportal.scheduled.application.usecase.ExecuteScheduledTransferUseCase;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransfer;
import com.experis.sofia.bankportal.scheduled.domain.ScheduledTransferRepository;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * ADR-028: ShedLock JDBC — ejecución única en multi-instancia.
 * DEBT-030: paginación batches de 500.
 * RV-F016-05: LocalDate.now() con timezone explícito (Europe/Madrid).
 */
@Component
public class ScheduledTransferJobService {

    private static final Logger LOG = Logger.getLogger(ScheduledTransferJobService.class.getName());
    private static final int BATCH_SIZE = 500;
    private static final ZoneId ZONE = ZoneId.of("Europe/Madrid");

    private final ScheduledTransferRepository    repository;
    private final ExecuteScheduledTransferUseCase executeUseCase;

    public ScheduledTransferJobService(ScheduledTransferRepository repository,
                                       ExecuteScheduledTransferUseCase executeUseCase) {
        this.repository     = repository;
        this.executeUseCase = executeUseCase;
    }

    @Scheduled(cron = "${scheduler.cron:0 0 6 * * *}")
    @SchedulerLock(
        name           = "scheduledTransferJob",
        lockAtLeastFor = "PT5M",
        lockAtMostFor  = "PT10M"
    )
    public void runDailyJob() {
        LocalDate today = LocalDate.now(ZONE); // RV-F016-05: timezone explícito
        int ok = 0, errors = 0, page = 0;
        Page<ScheduledTransfer> batch;

        LOG.info("[ScheduledTransferJob] Iniciando — " + today + " (" + ZONE + ")");

        do {
            batch = repository.findDueTransfers(today, PageRequest.of(page++, BATCH_SIZE));
            for (ScheduledTransfer t : batch.getContent()) {
                try {
                    executeUseCase.execute(t.getId(), today, false);
                    ok++;
                } catch (Exception ex) {
                    errors++;
                    LOG.log(Level.SEVERE,
                        "[ScheduledTransferJob] Error en transferencia " + t.getId(), ex);
                }
            }
        } while (batch.hasNext());

        LOG.info("[ScheduledTransferJob] Completado — OK=" + ok + " ERR=" + errors
                 + " páginas=" + page);
    }
}
