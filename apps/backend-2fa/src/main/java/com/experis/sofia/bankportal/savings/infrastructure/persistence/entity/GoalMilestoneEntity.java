package com.experis.sofia.bankportal.savings.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad JPA — tabla {@code goal_milestones} (V29).
 * <p>Mapeo segun LLD-FEAT-024 §4.3. UK (goal_id, percent) protege idempotencia
 * de emision de hitos 25/50/75/100 (RN-F024-09). {@code percent} es {@code SMALLINT}
 * en BD pero se mapea a {@code int} primitivo (LLD §4.3 acepta short OR int; usamos
 * int para alinear con el modelo de dominio {@code GoalMilestone.percent}).</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Entity
@Table(name = "goal_milestones")
@Getter
@Setter
@NoArgsConstructor
public class GoalMilestoneEntity {

    @Id
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "goal_id", nullable = false, columnDefinition = "UUID")
    private UUID goalId;

    @Column(name = "percent", nullable = false)
    private int percent;

    @Column(name = "reached_at", nullable = false)
    private Instant reachedAt;

    @Column(name = "notification_id", columnDefinition = "UUID")
    private UUID notificationId;
}
