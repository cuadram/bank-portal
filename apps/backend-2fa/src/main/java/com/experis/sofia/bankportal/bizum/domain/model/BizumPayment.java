package com.experis.sofia.bankportal.bizum.domain.model;
import java.math.BigDecimal; import java.time.Instant; import java.util.UUID;
public class BizumPayment {
    private UUID id; private UUID senderUserId; private String recipientPhone;
    private BigDecimal amount; private String concept; private BizumStatus status;
    private String sepaRef; private Instant createdAt; private Instant completedAt;
    public BizumPayment() {}
    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getSenderUserId() { return senderUserId; } public void setSenderUserId(UUID u) { this.senderUserId = u; }
    public String getRecipientPhone() { return recipientPhone; } public void setRecipientPhone(String p) { this.recipientPhone = p; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal a) { this.amount = a; }
    public String getConcept() { return concept; } public void setConcept(String c) { this.concept = c; }
    public BizumStatus getStatus() { return status; } public void setStatus(BizumStatus s) { this.status = s; }
    public String getSepaRef() { return sepaRef; } public void setSepaRef(String r) { this.sepaRef = r; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant t) { this.createdAt = t; }
    public Instant getCompletedAt() { return completedAt; } public void setCompletedAt(Instant t) { this.completedAt = t; }
}
