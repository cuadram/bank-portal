package com.experis.sofia.bankportal.savings.infrastructure.scheduler;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ProcessAutoRuleResult;
import com.experis.sofia.bankportal.savings.application.usecase.ProcessAutoRuleUseCase;
import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.GoalAutoRule;
import com.experis.sofia.bankportal.savings.domain.repository.GoalAutoRuleRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test del bucle de paginacion del scheduler (DEBT-053, GR/LA-027-06).
 *
 * <p>Verifica el patron de drenaje por pagina 0 + guard {@code Set<UUID>}:
 * (a) procesa todas las reglas a traves de varias lecturas de pagina,
 * (b) una regla que falla persistentemente NO provoca bucle infinito,
 * (c) caso mixto exito/fallo termina y procesa lo que debe.
 * Sin Spring: puerto y use case mockeados (no prueba el wiring JPA real,
 * eso lo cubre AutoContributionSchedulerIT).</p>
 */
class AutoContributionSchedulerTest {

    private GoalAutoRuleRepositoryPort ruleRepo;
    private ProcessAutoRuleUseCase processRule;
    private AutoContributionScheduler scheduler;

    @BeforeEach
    void setUp() {
        ruleRepo = mock(GoalAutoRuleRepositoryPort.class);
        processRule = mock(ProcessAutoRuleUseCase.class);
        scheduler = new AutoContributionScheduler(ruleRepo, processRule);
        ReflectionTestUtils.setField(scheduler, "pageSize", 2);
    }

    private static GoalAutoRule rule() {
        GoalAutoRule r = new GoalAutoRule();
        r.setId(UUID.randomUUID());
        return r;
    }

    private static Page<GoalAutoRule> page(GoalAutoRule... rules) {
        return new PageImpl<>(List.of(rules));
    }

    @Test
    @DisplayName("drena multiples paginas y procesa todas las reglas due")
    void drenaMultiPaginaProcesaTodas() {
        GoalAutoRule r1 = rule(), r2 = rule(), r3 = rule(), r4 = rule();
        // El conjunto se drena: pagina 0 trae el siguiente lote hasta vaciarse.
        when(ruleRepo.findDueForExecution(any(Instant.class), any(Pageable.class)))
                .thenReturn(page(r1, r2), page(r3, r4), page());
        when(processRule.execute(any())).thenAnswer(inv ->
                new ProcessAutoRuleResult(((GoalAutoRule) inv.getArgument(0)).getId(),
                        AllocationStatus.SUCCESS, null));

        scheduler.runDueAutoContributions();

        verify(processRule, times(4)).execute(any());
        verify(processRule).execute(r1);
        verify(processRule).execute(r4);
        verify(ruleRepo, times(3)).findDueForExecution(any(Instant.class), any(Pageable.class));
    }

    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    @DisplayName("regla que falla persistentemente no provoca bucle infinito")
    void reglaFallidaNoProvocaBucleInfinito() {
        GoalAutoRule rFail = rule();
        // La regla fallida NO avanza su next_execution_at -> reaparece en pagina 0.
        when(ruleRepo.findDueForExecution(any(Instant.class), any(Pageable.class)))
                .thenReturn(page(rFail));
        when(processRule.execute(rFail)).thenThrow(new RuntimeException("saldo insuficiente"));

        scheduler.runDueAutoContributions();

        // Se intenta UNA sola vez; el guard corta en la 2a lectura (solo IDs ya vistos).
        verify(processRule, times(1)).execute(rFail);
        verify(ruleRepo, times(2)).findDueForExecution(any(Instant.class), any(Pageable.class));
    }

    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    @DisplayName("mixto exito+fallo: termina, drena el exito, no repite el fallo")
    void mixtoExitoYFalloTermina() {
        GoalAutoRule rOk = rule(), rFail = rule();
        // Lectura 1: ambos due. Lectura 2: rOk ya drenado (procesado), queda rFail atascado.
        when(ruleRepo.findDueForExecution(any(Instant.class), any(Pageable.class)))
                .thenReturn(page(rOk, rFail), page(rFail));
        when(processRule.execute(rOk)).thenReturn(
                new ProcessAutoRuleResult(rOk.getId(), AllocationStatus.SUCCESS, null));
        when(processRule.execute(rFail)).thenThrow(new RuntimeException("fallo"));

        scheduler.runDueAutoContributions();

        verify(processRule, times(1)).execute(rOk);
        verify(processRule, times(1)).execute(rFail);
        verify(processRule, times(2)).execute(any());
        verify(ruleRepo, times(2)).findDueForExecution(any(Instant.class), any(Pageable.class));
    }
}
