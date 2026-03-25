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
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Job diario que localiza todas las transferencias vencidas y las ejecuta.
 *
 * ADR-028 Sprint 18: ShedLock JDBC garantiza ejecución única en multi-instancia.
 * DEBT-030 Sprint 18: findDueTransfers paginado en batches de 500 — previene OOM.
 *
 * @author SOFIA Developer Agent — FEAT-016 Sprint 18
 */
@Component
public class ScheduledTransferJobService {

    private static final Logger LOG = Logger.getLogger(ScheduledTransferJobService.class.getName());
    private static final int BATCH_SIZE = 500;

    private final ScheduledTransferRepository    repository;
    private final ExecuteScheduledTransferUseCase executeUseCase;

    public ScheduledTransferJobService(ScheduledTransferRepository repository,
                                       ExecuteScheduledTransferUseCase executeUseCase) {
        this.repository     = repository;
        this.executeUseCase = executeUseCase;
    }

    /**
     * ADR-028: @SchedulerLock garantiza que solo una instancia ejecuta el job.
     * lockAtLeastFor=PT5M evita re-ejecución si el job termina muy rápido.
     * lockAtMostFor=PT10M libera el lock aunque la instancia falle.
     * DEBT-030: iteración por páginas de 500.
     */
    @Scheduled(cron = "${scheduler.cron:0 0 6 * * *}")
    @SchedulerLock(
        name        = "scheduledTransferJob",
        lockAtLeastFor = "PT5M",
        lockAtMostFor  = "PT10M"
    )
    public void runDailyJob() {
        LocalDate today = LocalDate.now();
        int ok = 0, errors = 0, page = 0;
        Page<ScheduledTransfer> batch;

        LOG.info("[ScheduledTransferJob] Iniciando — " + today);

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
