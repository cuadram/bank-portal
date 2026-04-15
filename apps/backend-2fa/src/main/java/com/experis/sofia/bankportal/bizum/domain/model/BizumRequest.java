package com.experis.sofia.bankportal.bizum.domain.model;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
public class BizumRequest {
    private UUID id; private UUID requesterUserId; private String recipientPhone;
    private BigDecimal amount; private String concept; private BizumStatus status;
    private Instant expiresAt; private Instant createdAt; private Instant resolvedAt;
    private UUID paymentId;
    public BizumRequest() {}
    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getRequesterUserId() { return requesterUserId; } public void setRequesterUserId(UUID u) { this.requesterUserId = u; }
    public String getRecipientPhone() { return recipientPhone; } public void setRecipientPhone(String p) { this.recipientPhone = p; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal a) { this.amount = a; }
    public String getConcept() { return concept; } public void setConcept(String c) { this.concept = c; }
    public BizumStatus getStatus() { return status; } public void setStatus(BizumStatus s) { this.status = s; }
    public Instant getExpiresAt() { return expiresAt; } public void setExpiresAt(Instant t) { this.expiresAt = t; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant t) { this.createdAt = t; }
    public Instant getResolvedAt() { return resolvedAt; } public void setResolvedAt(Instant t) { this.resolvedAt = t; }
    public UUID getPaymentId() { return paymentId; } public void setPaymentId(UUID p) { this.paymentId = p; }
}
