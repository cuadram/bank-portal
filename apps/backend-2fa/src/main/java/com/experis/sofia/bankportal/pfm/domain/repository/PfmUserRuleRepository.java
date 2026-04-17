package com.experis.sofia.bankportal.pfm.domain.repository;

import com.experis.sofia.bankportal.pfm.domain.model.PfmUserRule;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import java.util.List;
import java.util.UUID;

/** Puerto — reglas de categorización del usuario. */
public interface PfmUserRuleRepository {
    List<PfmUserRule> findByUserId(UUID userId);
    int countByUserId(UUID userId);
    PfmUserRule save(UUID userId, String conceptPattern, SpendingCategory category);
    void deleteById(UUID ruleId, UUID userId);
}
