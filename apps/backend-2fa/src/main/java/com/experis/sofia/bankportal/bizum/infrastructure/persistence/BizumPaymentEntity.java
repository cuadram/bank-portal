package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "bizum_payments")
public class BizumPaymentEntity {
    @Id private UUID id;
    @Column(name = "sender_user_id") private UUID senderUserId;
    @Column(name = "recipient_phone") private String recipientPhone;
    @Column(precision = 12, scale = 2) private BigDecimal amount;
    private String concept;
    private String status;
    @Column(name = "sepa_ref") private String sepaRef;
    @Column(name = "created_at") private Instant createdAt;
    @Column(name = "completed_at") private Instant completedAt;

    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getSenderUserId() { return senderUserId; } public void setSenderUserId(UUID u) { this.senderUserId = u; }
    public String getRecipientPhone() { return recipientPhone; } public void setRecipientPhone(String p) { this.recipientPhone = p; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal a) { this.amount = a; }
    public String getConcept() { return concept; } public void setConcept(String c) { this.concept = c; }
    public String getStatus() { return status; } public void setStatus(String s) { this.status = s; }
    public String getSepaRef() { return sepaRef; } public void setSepaRef(String r) { this.sepaRef = r; }
    public Instant getCreatedAt() { return createdAt; } public void setCreatedAt(Instant t) { this.createdAt = t; }
    public Instant getCompletedAt() { return completedAt; } public void setCompletedAt(Instant t) { this.completedAt = t; }
}
