package com.experis.sofia.bankportal.savings.infrastructure.scheduler;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ProcessAutoRuleResult;
import com.experis.sofia.bankportal.savings.application.usecase.ProcessAutoRuleUseCase;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Scheduler de aportaciones automaticas mensuales (FEAT-024 ADR-041).
 *
 * <p>Cada noche a las 02:00 UTC busca las reglas activas con
 * {@code next_execution_at <= now()} y delega cada una en
 * {@link ProcessAutoRuleUseCase}. La proteccion por replica viene de ShedLock
 * sobre la tabla {@code shedlock} (V31).</p>
 *
 * <p><b>Diseno de iteracion (DEBT-053 + DEBT-067, LLD 11):</b> paginacion por
 * <b>keyset (seek)</b> sobre la clave {@code (next_execution_at, id)}. El cursor
 * avanza SIEMPRE hacia delante, asi que cada regla due se intenta exactamente una
 * vez y las reglas <i>pegajosas</i> (las que no avanzan su next_execution_at:
 * goal inactivo, excepcion con rollback REQUIRES_NEW, idempotencia) quedan detras
 * del cursor y no vuelven a materializarse en la pagina. Esto elimina la
 * <b>starvation</b> del drain-pagina-0 anterior (LA-027-06): ninguna regla sana
 * queda sin intentar aunque haya mas de page-size reglas pegajosas en cabeza del
 * orden. Cada regla se procesa en una transaccion REQUIRES_NEW propia (LLD 9):
 * un fallo aislado no aborta el ciclo (RN-F024-04).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D · DEBT-067 Sprint 27
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoContributionScheduler {

    private static final UUID MIN_UUID = new UUID(0L, 0L);

    private final GoalAutoRuleRepositoryPort ruleRepo;
    private final ProcessAutoRuleUseCase processRule;

    @Value("${bank.savings.auto.page-size:200}")
    private int pageSize;

    @Scheduled(cron = "${bank.savings.auto.cron}")
    @SchedulerLock(
            name = "savings-auto-contribution",
            lockAtMostFor = "${bank.savings.auto.lock-max}",
            lockAtLeastFor = "${bank.savings.auto.lock-min}"
    )
    public void runDueAutoContributions() {
        Instant start = Instant.now();
        int processed = 0;
        int failed = 0;
        int attempted = 0;

        // Cursor keyset: arranca por debajo de cualquier clave real.
        Instant cursorNext = Instant.EPOCH;
        UUID cursorId = MIN_UUID;

        while (true) {
            List<GoalAutoRule> batch =
                    ruleRepo.findDueForExecutionAfter(start, cursorNext, cursorId, pageSize);
            if (batch.isEmpty()) {
                break;
            }
            for (GoalAutoRule rule : batch) {
                // Capturar la clave del cursor ANTES de execute: el use case muta
                // el objeto (updateRuleNextExecution) en las rutas que avanzan.
                Instant keyNext = rule.getNextExecutionAt();
                UUID keyId = rule.getId();
                attempted++;
                try {
                    ProcessAutoRuleResult r = processRule.execute(rule);
                    if (r.status() == AllocationStatus.SUCCESS) {
                        processed++;
                    } else {
                        failed++;
                    }
                } catch (Exception e) {
                    // REQUIRES_NEW del use case ya hace rollback de su tx; aqui solo
                    // logueamos y seguimos — RN-F024-04 (no bloquea ciclo).
                    failed++;
                    log.warn("savings.auto.scheduler rule_failed ruleId={} reason={}",
                            rule.getId(), e.getMessage());
                }
                cursorNext = keyNext;
                cursorId = keyId;
            }
            if (batch.size() < pageSize) {
                break; // ultima pagina
            }
        }

        log.info("savings.auto.scheduler done attempted={} processed={} failed={} elapsed_ms={}",
                attempted, processed, failed,
                Duration.between(start, Instant.now()).toMillis());
    }
}
