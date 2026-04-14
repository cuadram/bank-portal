package com.experis.sofia.bankportal.bizum.infrastructure.persistence;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "bizum_activations")
public class BizumActivationEntity {
    @Id private UUID id;
    @Column(name = "user_id") private UUID userId;
    @Column(name = "account_id") private UUID accountId;
    private String phone;
    private String status;
    @Column(name = "gdpr_consent_at") private Instant gdprConsentAt;
    @Column(name = "activated_at") private Instant activatedAt;
    @Column(name = "deactivated_at") private Instant deactivatedAt;

    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; } public void setUserId(UUID u) { this.userId = u; }
    public UUID getAccountId() { return accountId; } public void setAccountId(UUID a) { this.accountId = a; }
    public String getPhone() { return phone; } public void setPhone(String p) { this.phone = p; }
    public String getStatus() { return status; } public void setStatus(String s) { this.status = s; }
    public Instant getGdprConsentAt() { return gdprConsentAt; } public void setGdprConsentAt(Instant t) { this.gdprConsentAt = t; }
    public Instant getActivatedAt() { return activatedAt; } public void setActivatedAt(Instant t) { this.activatedAt = t; }
    public Instant getDeactivatedAt() { return deactivatedAt; } public void setDeactivatedAt(Instant t) { this.deactivatedAt = t; }
}
