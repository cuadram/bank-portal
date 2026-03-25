package com.experis.sofia.bankportal.cards.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "cards")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "pan_masked", nullable = false, length = 19)
    private String panMasked;

    @Enumerated(EnumType.STRING)
    @Column(name = "card_type", nullable = false, length = 10)
    private CardType cardType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 12)
    private CardStatus status;

    @Column(name = "expiration_date", nullable = false)
    private LocalDate expirationDate;

    @Column(name = "daily_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimit;

    @Column(name = "monthly_limit", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimit;

    @Column(name = "daily_limit_min", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimitMin;

    @Column(name = "daily_limit_max", nullable = false, precision = 15, scale = 2)
    private BigDecimal dailyLimitMax;

    @Column(name = "monthly_limit_min", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimitMin;

    @Column(name = "monthly_limit_max", nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyLimitMax;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Domain behavior ──────────────────────────────────────────────────────

    public boolean belongsTo(UUID userId) {
        return this.userId.equals(userId);
    }

    public void block() {
        if (this.status != CardStatus.ACTIVE)
            throw new CardNotBlockableException("Card must be ACTIVE to block. Current: " + this.status);
        this.status = CardStatus.BLOCKED;
        this.updatedAt = LocalDateTime.now();
    }

    public void unblock() {
        if (this.status != CardStatus.BLOCKED)
            throw new CardNotUnblockableException("Card must be BLOCKED to unblock. Current: " + this.status);
        this.status = CardStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }

    public void updateLimits(BigDecimal daily, BigDecimal monthly) {
        if (daily.compareTo(dailyLimitMin) < 0 || daily.compareTo(dailyLimitMax) > 0)
            throw new InvalidCardLimitException(
                "daily_limit " + daily + " out of bank range [" + dailyLimitMin + "," + dailyLimitMax + "]");
        if (monthly.compareTo(monthlyLimitMin) < 0 || monthly.compareTo(monthlyLimitMax) > 0)
            throw new InvalidCardLimitException(
                "monthly_limit " + monthly + " out of bank range [" + monthlyLimitMin + "," + monthlyLimitMax + "]");
        if (monthly.compareTo(daily) < 0)
            throw new InvalidCardLimitException("MONTHLY_LIMIT_BELOW_DAILY");
        this.dailyLimit = daily;
        this.monthlyLimit = monthly;
        this.updatedAt = LocalDateTime.now();
    }
}
