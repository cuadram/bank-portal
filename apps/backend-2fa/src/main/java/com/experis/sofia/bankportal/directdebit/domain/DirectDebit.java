package com.experis.sofia.bankportal.directdebit.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * SEPA Direct Debit record entity.
 * FEAT-017 Sprint 19 - BankPortal Banco Meridian
 */
@Entity
@Table(name = "direct_debits")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DirectDebit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "mandate_id", nullable = false)
    private UUID mandateId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 3, nullable = false)
    @Builder.Default
    private String currency = "EUR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DebitStatus status = DebitStatus.PENDING;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "charged_at")
    private ZonedDateTime chargedAt;

    @Column(name = "return_reason", length = 4)
    private String returnReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    public void markCharged() {
        this.status = DebitStatus.CHARGED;
        this.chargedAt = ZonedDateTime.now();
    }

    public void markReturned(String reason) {
        this.status = DebitStatus.RETURNED;
        this.returnReason = reason;
    }

    public void markRejected() {
        this.status = DebitStatus.REJECTED;
    }
}
