package com.experis.sofia.bankportal.savings.infrastructure.persistence.entity;

import com.experis.sofia.bankportal.savings.domain.model.GoalCategory;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad JPA — tabla {@code savings_goals} (V29).
 * <p>Mapeo BD↔Java segun LLD-FEAT-024 §4.1. Enums almacenados como String
 * (CHECK constraint en DDL); no usar PostgreSQL ENUM nativo.</p>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase D
 */
@Entity
@Table(name = "savings_goals")
@Getter
@Setter
@NoArgsConstructor
public class SavingsGoalEntity {

    @Id
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", nullable = false, columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "target_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "reserved_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal reservedAmount;

    @Column(name = "target_date", nullable = false)
    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private GoalCategory category;

    @Column(name = "custom_category", length = 50)
    private String customCategory;

    @Column(name = "icon", length = 30)
    private String icon;

    @Column(name = "color", length = 10)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private GoalStatus status;

    @Column(name = "source_account_id", columnDefinition = "UUID")
    private UUID sourceAccountId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "closed_at")
    private Instant closedAt;
}
