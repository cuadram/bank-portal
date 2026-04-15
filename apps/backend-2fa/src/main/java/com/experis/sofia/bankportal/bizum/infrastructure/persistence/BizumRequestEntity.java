package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "bizum_requests")
public class BizumRequestEntity {
    @Id private UUID id;
    @Column(name = "requester_user_id") private UUID requesterUserId;
    @Column(name = "recipient_phone") private String recipientPhone;
    @Column(precision = 12, scale = 2) private BigDecimal amount;
    private String concept;
    private String status;
    @Column(name = "expires_at") private Instant expiresAt;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "resolved_at") private Instant resolvedAt;
    @Column(name = "payment_id") private UUID paymentId;

    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getRequesterUserId() { return requesterUserId; } public void setRequesterUserId(UUID u) { this.requesterUserId = u; }
    public String getRecipientPhone() { return recipientPhone; } public void setRecipientPhone(String p) { this.recipientPhone = p; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal a) { this.amount = a; }
    public String getConcept() { return concept; } public void setConcept(String c) { this.concept = c; }
    public String getStatus() { return status; } public void setStatus(String s) { this.status = s; }
    public Instant getExpiresAt() { return expiresAt; } public void setExpiresAt(Instant t) { this.expiresAt = t; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant t) { this.createdAt = t; }
    public Instant getResolvedAt() { return resolvedAt; } public void setResolvedAt(Instant t) { this.resolvedAt = t; }
    public UUID getPaymentId() { return paymentId; } public void setPaymentId(UUID p) { this.paymentId = p; }
}
