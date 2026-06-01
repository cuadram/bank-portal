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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Scheduler de aportaciones automaticas mensuales (FEAT-024 ADR-041).
 *
 * <p>Cada noche a las 02:00 UTC busca las reglas activas con
 * {@code next_execution_at <= now()} y delega cada una en
 * {@link ProcessAutoRuleUseCase}. La proteccion por replica viene de ShedLock
 * sobre la tabla {@code shedlock} (V31, originalmente V18c).</p>
 *
 * <p><b>Diseno de iteracion (DEBT-053, LLD §11):</b> lectura paginada via
 * {@link GoalAutoRuleRepositoryPort#findDueForExecution(Instant, Pageable)}
 * con tamano {@code bank.savings.auto.page-size}. Como procesar una regla
 * avanza su {@code next_execution_at} (sale del conjunto due), el bucle
 * <b>drena re-leyendo la pagina 0</b> hasta agotar; NO usa
 * {@code page.nextPageable()} (que saltaria reglas al encoger el conjunto; LA-027-06).
 * Un {@code Set<UUID>} de reglas ya intentadas evita reprocesar en bucle las que
 * fallan (no avanzan su next_execution_at por el rollback REQUIRES_NEW). Cada
 * regla se procesa en una transaccion REQUIRES_NEW propia (LLD §9): un fallo
 * aislado no aborta el ciclo (RN-F024-04).</p>
 *
 * <p><b>Cota conocida:</b> con &gt; page-size reglas de fallo persistente en
 * cabeza del orden, las posteriores se difieren al siguiente ciclo nocturno
 * (sin perdida; siguen due). Para escala extrema la evolucion seria un cursor
 * keyset por (next_execution_at, id). Ver LA-027-06.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoContributionScheduler {

    private final GoalAutoRuleRepositoryPort ruleRepo;
    private final ProcessAutoRuleUseCase processRule;

    @Value("${bank.savings.auto.page-size:200}")
    private int pageSize;

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
        int processed = 0;
        int failed = 0;
        Set<UUID> seen = new HashSet<>();
        Pageable firstPage = PageRequest.of(0, pageSize, Sort.by("nextExecutionAt", "id"));

        // Drenaje por pagina 0: al procesarse, la regla avanza next_execution_at y
        // sale del conjunto due, asi que re-leer la pagina 0 trae el siguiente lote.
        // El Set corta el bucle cuando solo quedan reglas ya intentadas (fallidas).
        while (true) {
            Page<GoalAutoRule> page = ruleRepo.findDueForExecution(start, firstPage);
            boolean progress = false;
            for (GoalAutoRule rule : page) {
                if (!seen.add(rule.getId())) {
                    continue; // ya intentada en este ciclo
                }
                progress = true;
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
            }
            if (page.isEmpty() || !progress) {
                break; // conjunto agotado o solo quedan reglas ya intentadas
            }
        }

        log.info("savings.auto.scheduler done attempted={} processed={} failed={} elapsed_ms={}",
                seen.size(), processed, failed,
                Duration.between(start, Instant.now()).toMillis());
    }
}
