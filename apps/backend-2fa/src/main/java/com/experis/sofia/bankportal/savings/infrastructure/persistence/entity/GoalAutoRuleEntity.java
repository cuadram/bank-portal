package com.experis.sofia.bankportal.savings.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad JPA — tabla {@code goal_auto_rules} (V29).
 * <p>Mapeo segun LLD-FEAT-024 §4.4. UK parcial {@code WHERE active=TRUE} en
 * (goal_id) protege que solo exista una regla activa por objetivo (RN-F024-04).
 * {@code dayOfMonth} mapea SMALLINT BD a int Java (alineado con dominio).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Entity
@Table(name = "goal_auto_rules")
@Getter
@Setter
@NoArgsConstructor
public class GoalAutoRuleEntity {

    @Id
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "goal_id", nullable = false, columnDefinition = "UUID")
    private UUID goalId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    @Column(name = "source_account_id", nullable = false, columnDefinition = "UUID")
    private UUID sourceAccountId;

    @Column(name = "active", nullable = false)
    private boolean active;

    @Column(name = "next_execution_at", nullable = false)
    private Instant nextExecutionAt;

    @Column(name = "last_execution_at")
    private Instant lastExecutionAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
