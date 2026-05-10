package com.experis.sofia.bankportal.savings.domain.service;

import com.experis.sofia.bankportal.account.domain.AccountReservePort;
import com.experis.sofia.bankportal.savings.domain.exception.GoalNotFoundException;
import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import com.experis.sofia.bankportal.savings.domain.model.SavingsGoal;
import com.experis.sofia.bankportal.savings.domain.repository.SavingsGoalRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * TC-F024-013..019 — GoalClosureService.
 * RN-F024-11 (SCA threshold), RN-F024-12 (cierre con liberacion atomica).
 *
 * Cobertura:
 *  - requiresSca(): umbral configurable, casos limite (==, &lt;, &gt;), null/zero
 *  - close(): happy path con release invocado
 *  - close(): idempotente con status=CLOSED
 *  - close(): rechaza estados no cerrables
 *  - close(): no llama release si reserved=0
 *  - close(): no llama release si sourceAccountId=null
 *  - close(): orden release ANTES de save (LLD seccion 6.3)
 *  - close(): GoalNotFoundException si goalRepo no encuentra
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase F.2
 */
@ExtendWith(MockitoExtension.class)
class GoalClosureServiceTest {

    @Mock SavingsGoalRepositoryPort goalRepo;
    @Mock AccountReservePort accountReserve;

    private GoalClosureService service;

    private static final BigDecimal SCA_THRESHOLD = new BigDecimal("30.00");

    @BeforeEach
    void setUp() {
        service = new GoalClosureService(goalRepo, accountReserve);
        // @Value no se inyecta automaticamente en unit tests Mockito puros.
        // ReflectionTestUtils setea el campo privado scaThreshold tras construir.
        ReflectionTestUtils.setField(service, "scaThreshold", SCA_THRESHOLD);
    }

    private SavingsGoal goal(UUID id, BigDecimal reserved, GoalStatus status, UUID sourceAccount) {
        SavingsGoal g = new SavingsGoal();
        g.setId(id);
        g.setUserId(UUID.randomUUID());
        g.setName("test-goal");
        g.setTargetAmount(new BigDecimal("1000.00"));
        g.setReservedAmount(reserved);
        g.setTargetDate(LocalDate.now().plusMonths(6));
        g.setCategory(GoalCategory.VIAJE);
        g.setStatus(status);
        g.setSourceAccountId(sourceAccount);
        g.setCreatedAt(Instant.now().minusSeconds(86_400));
        g.setUpdatedAt(Instant.now());
        return g;
    }

    // -- requiresSca() --------------------------------------------------------

    @Test @DisplayName("TC-F024-013a — requiresSca: reserved=29.99 (< 30) -> false")
    void requiresScaBelowThreshold() {
        var g = goal(UUID.randomUUID(), new BigDecimal("29.99"), GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isFalse();
    }

    @Test @DisplayName("TC-F024-013b — requiresSca: reserved=30.00 EXACTO (== 30) -> false (estricto >)")
    void requiresScaAtThresholdExclusive() {
        var g = goal(UUID.randomUUID(), new BigDecimal("30.00"), GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isFalse();
    }

    @Test @DisplayName("TC-F024-013c — requiresSca: reserved=30.01 (> 30) -> true")
    void requiresScaAboveThreshold() {
        var g = goal(UUID.randomUUID(), new BigDecimal("30.01"), GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isTrue();
    }

    @Test @DisplayName("TC-F024-013d — requiresSca: reserved=null -> false (defensivo)")
    void requiresScaNullReserved() {
        var g = goal(UUID.randomUUID(), null, GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isFalse();
    }

    @Test @DisplayName("TC-F024-013e — requiresSca: reserved=0 -> false")
    void requiresScaZeroReserved() {
        var g = goal(UUID.randomUUID(), BigDecimal.ZERO, GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isFalse();
    }

    @Test @DisplayName("TC-F024-013f — requiresSca: goal=null -> false (defensivo)")
    void requiresScaNullGoal() {
        assertThat(service.requiresSca(null)).isFalse();
    }

    @Test @DisplayName("TC-F024-013g — requiresSca: umbral configurable a 100 -> reserved=50 sigue false")
    void requiresScaCustomThreshold() {
        ReflectionTestUtils.setField(service, "scaThreshold", new BigDecimal("100.00"));
        var g = goal(UUID.randomUUID(), new BigDecimal("50.00"), GoalStatus.ACTIVE, UUID.randomUUID());
        assertThat(service.requiresSca(g)).isFalse();
    }

    // -- close() — happy path -------------------------------------------------

    @Test @DisplayName("TC-F024-014 — close: happy path libera reserva + marca CLOSED + closedAt")
    void closeHappyPath() {
        UUID goalId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        BigDecimal reserved = new BigDecimal("250.00");
        var g = goal(goalId, reserved, GoalStatus.ACTIVE, accountId);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any(SavingsGoal.class))).thenAnswer(inv -> inv.getArgument(0));

        SavingsGoal closed = service.close(goalId);

        verify(accountReserve).release(accountId, reserved);
        assertThat(closed.getStatus()).isEqualTo(GoalStatus.CLOSED);
        assertThat(closed.getClosedAt()).isNotNull();
        // reservedAmount NO se reset (LLD seccion 3.2: retencion historica)
        assertThat(closed.getReservedAmount()).isEqualByComparingTo(reserved);
    }

    @Test @DisplayName("TC-F024-015 — close: orden release ANTES de save (LLD seccion 6.3)")
    void closeOrderReleaseBeforeSave() {
        UUID goalId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        var g = goal(goalId, new BigDecimal("100.00"), GoalStatus.ACTIVE, accountId);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.close(goalId);

        InOrder order = inOrder(accountReserve, goalRepo);
        order.verify(accountReserve).release(any(UUID.class), any(BigDecimal.class));
        order.verify(goalRepo).save(any(SavingsGoal.class));
    }

    // -- close() — sin release ------------------------------------------------

    @Test @DisplayName("TC-F024-016a — close: reserved=0 NO invoca release (sin reserva que liberar)")
    void closeZeroReservedDoesNotRelease() {
        UUID goalId = UUID.randomUUID();
        var g = goal(goalId, BigDecimal.ZERO, GoalStatus.ACTIVE, UUID.randomUUID());

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.close(goalId);

        verify(accountReserve, never()).release(any(), any());
        verify(goalRepo).save(any(SavingsGoal.class));
    }

    @Test @DisplayName("TC-F024-016b — close: sourceAccountId=null NO invoca release (sin destino)")
    void closeNullSourceAccountDoesNotRelease() {
        UUID goalId = UUID.randomUUID();
        var g = goal(goalId, new BigDecimal("100.00"), GoalStatus.ACTIVE, null);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.close(goalId);

        verify(accountReserve, never()).release(any(), any());
    }

    @Test @DisplayName("TC-F024-016c — close: reserved=null NO invoca release")
    void closeNullReservedDoesNotRelease() {
        UUID goalId = UUID.randomUUID();
        var g = goal(goalId, null, GoalStatus.ACTIVE, UUID.randomUUID());

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.close(goalId);

        verify(accountReserve, never()).release(any(), any());
    }

    // -- close() — idempotencia ------------------------------------------------

    @Test @DisplayName("TC-F024-017 — close: idempotente si status=CLOSED previo")
    void closeIdempotentIfAlreadyClosed() {
        UUID goalId = UUID.randomUUID();
        var g = goal(goalId, new BigDecimal("100.00"), GoalStatus.CLOSED, UUID.randomUUID());
        Instant originalClosedAt = Instant.now().minusSeconds(3600);
        g.setClosedAt(originalClosedAt);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));

        SavingsGoal result = service.close(goalId);

        assertThat(result).isSameAs(g);
        assertThat(result.getClosedAt()).isEqualTo(originalClosedAt);
        verify(accountReserve, never()).release(any(), any());
        verify(goalRepo, never()).save(any());
    }

    // -- close() — estados no cerrables ---------------------------------------

    @Test @DisplayName("TC-F024-018 — close: COMPLETED puede cerrarse (cierre voluntario tras 100%)")
    void closeFromCompletedAllowed() {
        UUID goalId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        var g = goal(goalId, new BigDecimal("1000.00"), GoalStatus.COMPLETED, accountId);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SavingsGoal closed = service.close(goalId);

        assertThat(closed.getStatus()).isEqualTo(GoalStatus.CLOSED);
        verify(accountReserve).release(accountId, new BigDecimal("1000.00"));
    }

    // -- close() — error paths ------------------------------------------------

    @Test @DisplayName("TC-F024-019a — close: GoalNotFoundException si goalRepo no encuentra")
    void closeGoalNotFoundThrows() {
        UUID goalId = UUID.randomUUID();
        when(goalRepo.findById(goalId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.close(goalId))
            .isInstanceOf(GoalNotFoundException.class);

        verify(accountReserve, never()).release(any(), any());
        verify(goalRepo, never()).save(any());
    }

    // -- argumentos exactos ---------------------------------------------------

    @Test @DisplayName("TC-F024-019b — close: argumentos a release() son exactamente sourceAccountId + reservedAmount")
    void closeReleaseArgumentsAreExact() {
        UUID goalId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        BigDecimal reserved = new BigDecimal("123.45");
        var g = goal(goalId, reserved, GoalStatus.ACTIVE, accountId);

        when(goalRepo.findById(goalId)).thenReturn(Optional.of(g));
        when(goalRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.close(goalId);

        ArgumentCaptor<UUID> accCap = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<BigDecimal> amtCap = ArgumentCaptor.forClass(BigDecimal.class);
        verify(accountReserve).release(accCap.capture(), amtCap.capture());

        assertThat(accCap.getValue()).isEqualTo(accountId);
        assertThat(amtCap.getValue()).isEqualByComparingTo(reserved);
    }
}
