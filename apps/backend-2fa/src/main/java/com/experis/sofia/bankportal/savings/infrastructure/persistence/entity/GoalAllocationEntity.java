package com.experis.sofia.bankportal.savings.infrastructure.persistence.entity;

import com.experis.sofia.bankportal.savings.domain.model.AllocationStatus;
import com.experis.sofia.bankportal.savings.domain.model.AllocationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad JPA — tabla {@code goal_allocations} (V29).
 * <p>Mapeo segun LLD-FEAT-024 §4.2. UK (goal_id, allocation_month) protege
 * idempotencia mensual de aportaciones AUTO (RN-F024-05).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Entity
@Table(name = "goal_allocations")
@Getter
@Setter
@NoArgsConstructor
public class GoalAllocationEntity {

    @Id
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "goal_id", nullable = false, columnDefinition = "UUID")
    private UUID goalId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "allocation_type", nullable = false, length = 10)
    private AllocationType allocationType;

    @Column(name = "source_account_id", nullable = false, columnDefinition = "UUID")
    private UUID sourceAccountId;

    @Column(name = "rule_id", columnDefinition = "UUID")
    private UUID ruleId;

    @Column(name = "allocation_month", length = 7)
    private String allocationMonth;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    private AllocationStatus status;

    @Column(name = "failure_reason", length = 50)
    private String failureReason;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;
}
