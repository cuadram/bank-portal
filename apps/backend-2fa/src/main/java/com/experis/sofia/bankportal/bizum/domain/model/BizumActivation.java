package com.experis.sofia.bankportal.bizum.domain.model;
import java.time.Instant; import java.util.UUID;
public class BizumActivation {
    private UUID id; private UUID userId; private UUID accountId;
    private String phone; private BizumStatus status;
    private Instant gdprConsentAt; private Instant activatedAt; private Instant deactivatedAt;
    public BizumActivation() {}
    public UUID getId() { return id; } public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; } public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getAccountId() { return accountId; } public void setAccountId(UUID accountId) { this.accountId = accountId; }
    public String getPhone() { return phone; } public void setPhone(String phone) { this.phone = phone; }
    public BizumStatus getStatus() { return status; } public void setStatus(BizumStatus status) { this.status = status; }
    public Instant getGdprConsentAt() { return gdprConsentAt; } public void setGdprConsentAt(Instant t) { this.gdprConsentAt = t; }
    public Instant getActivatedAt() { return activatedAt; } public void setActivatedAt(Instant t) { this.activatedAt = t; }
    public Instant getDeactivatedAt() { return deactivatedAt; } public void setDeactivatedAt(Instant t) { this.deactivatedAt = t; }
}
