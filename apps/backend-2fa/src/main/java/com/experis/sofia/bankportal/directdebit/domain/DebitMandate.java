package com.experis.sofia.bankportal.directdebit.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

/**
 * SEPA Direct Debit mandate entity.
 * FEAT-017 Sprint 19 - BankPortal Banco Meridian
 */
@Entity
@Table(name = "debit_mandates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DebitMandate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "creditor_name", nullable = false, length = 140)
    private String creditorName;

    @Column(name = "creditor_iban", nullable = false, length = 34)
    private String creditorIban;

    @Column(name = "mandate_ref", nullable = false, length = 35, unique = true)
    private String mandateRef;

    @Enumerated(EnumType.STRING)
    @Column(name = "mandate_type", nullable = false)
    @Builder.Default
    private MandateType mandateType = MandateType.CORE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private MandateStatus status = MandateStatus.ACTIVE;

    @Column(name = "signed_at", nullable = false)
    @Builder.Default
    private LocalDate signedAt = LocalDate.now();

    @Column(name = "cancelled_at")
    private LocalDate cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private ZonedDateTime createdAt = ZonedDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private ZonedDateTime updatedAt = ZonedDateTime.now();

    /** Business method: cancel this mandate. */
    public void cancel() {
        this.status = MandateStatus.CANCELLED;
        this.cancelledAt = LocalDate.now();
        this.updatedAt = ZonedDateTime.now();
    }

    public boolean isActive() {
        return MandateStatus.ACTIVE.equals(this.status);
    }
}
