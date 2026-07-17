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
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Unit test del bucle keyset del scheduler (DEBT-053 + DEBT-067).
 *
 * <p>Verifica: (a) procesa todas las reglas a traves de varios lotes keyset,
 * (b) reglas sanas situadas tras mas de page-size reglas pegajosas NO sufren
 * starvation (regresion del drain-pagina-0, DEBT-067), (c) terminacion sin
 * bucle. Sin Spring: puerto y use case mockeados (el wiring JPA real lo cubre
 * AutoContributionSchedulerIT).</p>
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
        r.setNextExecutionAt(Instant.now().minusSeconds(3600));
        return r;
    }

    @Test
    @DisplayName("keyset: procesa todas las reglas a traves de varios lotes")
    void procesaTodasEnVariosLotes() {
        GoalAutoRule r1 = rule(), r2 = rule(), r3 = rule(), r4 = rule();
        when(ruleRepo.findDueForExecutionAfter(any(Instant.class), any(Instant.class), any(UUID.class), anyInt()))
                .thenReturn(List.of(r1, r2), List.of(r3, r4), List.of());
        when(processRule.execute(any())).thenAnswer(inv ->
                new ProcessAutoRuleResult(((GoalAutoRule) inv.getArgument(0)).getId(),
                        AllocationStatus.SUCCESS, null));

        scheduler.runDueAutoContributions();

        verify(processRule, times(4)).execute(any());
        verify(ruleRepo, times(3))
                .findDueForExecutionAfter(any(Instant.class), any(Instant.class), any(UUID.class), anyInt());
    }

    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    @DisplayName("DEBT-067: reglas sanas tras page-size pegajosas NO sufren starvation")
    void reglasSanasNoSufrenStarvation() {
        GoalAutoRule s1 = rule(), s2 = rule(), healthy = rule();
        // pageSize=2. Lote1 = 2 pegajosas (throw). Keyset avanza el cursor -> Lote2 = sana.
        // Con el drain-pagina-0 anterior, la sana habria quedado starvada.
        when(ruleRepo.findDueForExecutionAfter(any(Instant.class), any(Instant.class), any(UUID.class), anyInt()))
                .thenReturn(List.of(s1, s2), List.of(healthy), List.of());
        when(processRule.execute(s1)).thenThrow(new RuntimeException("stuck"));
        when(processRule.execute(s2)).thenThrow(new RuntimeException("stuck"));
        when(processRule.execute(healthy)).thenReturn(
                new ProcessAutoRuleResult(healthy.getId(), AllocationStatus.SUCCESS, null));

        scheduler.runDueAutoContributions();

        verify(processRule).execute(healthy); // clave: la sana SE procesa pese a 2 pegajosas antes
        verify(processRule, times(3)).execute(any());
    }

    @Test
    @Timeout(value = 5, unit = TimeUnit.SECONDS)
    @DisplayName("regla pegajosa unica: termina sin bucle infinito")
    void pegajosaUnicaTermina() {
        GoalAutoRule s = rule();
        when(ruleRepo.findDueForExecutionAfter(any(Instant.class), any(Instant.class), any(UUID.class), anyInt()))
                .thenReturn(List.of(s), List.of());
        when(processRule.execute(s)).thenThrow(new RuntimeException("stuck"));

        scheduler.runDueAutoContributions();

        verify(processRule, times(1)).execute(s);
    }
}
