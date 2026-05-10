package com.experis.sofia.bankportal.savings.infrastructure.scheduler;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ProcessAutoRuleResult;
import com.experis.sofia.bankportal.savings.application.usecase.ProcessAutoRuleUseCase;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Scheduler de aportaciones automaticas mensuales (FEAT-024 ADR-041).
 *
 * <p>Cada noche a las 02:00 UTC busca las reglas activas con
 * {@code next_execution_at <= now()} y delega cada una en
 * {@link ProcessAutoRuleUseCase}. La proteccion por replica viene de ShedLock
 * sobre la tabla {@code shedlock} (V31, originalmente V18c).</p>
 *
 * <p><b>Diseno de iteracion:</b> el puerto
 * {@link GoalAutoRuleRepositoryPort#findDueForExecution(Instant)} devuelve
 * {@code List<GoalAutoRule>} sin paginacion. Para escala &gt;1000 reglas
 * activas la migracion futura sera anadir paginacion a la firma del puerto;
 * a la escala actual del proyecto (S26) la lectura cabe en memoria sin
 * problema. Cada regla se procesa en una transaccion REQUIRES_NEW propia
 * (LLD §9), asi que un fallo aislado no aborta el ciclo (RN-F024-04).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoContributionScheduler {

    private final GoalAutoRuleRepositoryPort ruleRepo;
    private final ProcessAutoRuleUseCase processRule;

    /**
     * Ejecucion programada diaria. El cron se externaliza a
     * {@code bank.savings.auto.cron} (LLD §10) para permitir override en
     * tests de integracion.
     */
    @Scheduled(cron = "${bank.savings.auto.cron}")
    @SchedulerLock(
            name = "savings-auto-contribution",
            lockAtMostFor = "${bank.savings.auto.lock-max}",
            lockAtLeastFor = "${bank.savings.auto.lock-min}"
    )
    public void runDueAutoContributions() {
        Instant start = Instant.now();
        List<GoalAutoRule> due = ruleRepo.findDueForExecution(start);
        int processed = 0;
        int failed = 0;

        for (GoalAutoRule rule : due) {
            try {
                ProcessAutoRuleResult r = processRule.execute(rule);
                if (r.status() == AllocationStatus.SUCCESS) {
                    processed++;
                } else {
                    failed++;
                }
            } catch (Exception e) {
                // REQUIRES_NEW del use case ya hace rollback de su tx; aqui solo logueamos
                // y seguimos con la siguiente regla — RN-F024-04 (no bloquea ciclo).
                failed++;
                log.warn("savings.auto.scheduler rule_failed ruleId={} reason={}",
                        rule.getId(), e.getMessage());
            }
        }

        log.info("savings.auto.scheduler done total={} processed={} failed={} elapsed_ms={}",
                due.size(), processed, failed,
                Duration.between(start, Instant.now()).toMillis());
    }
}
