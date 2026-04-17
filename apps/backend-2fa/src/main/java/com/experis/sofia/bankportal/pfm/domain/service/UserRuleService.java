package com.experis.sofia.bankportal.pfm.domain.service;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.PfmUserRule;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmUserRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

/**
 * CRUD de reglas de categorización del usuario.
 * RN-F023-18: máx 50 reglas/usuario.
 * RN-F023-19: solo CARGO son recategorizables (validado en controller).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Service
@RequiredArgsConstructor
public class UserRuleService {

    public static final int MAX_RULES = 50;
    private final PfmUserRuleRepository repo;

    public List<PfmUserRule> getRules(UUID userId) {
        return repo.findByUserId(userId);
    }

    public PfmUserRule createRule(UUID userId, String conceptPattern, SpendingCategory category) {
        if (repo.countByUserId(userId) >= MAX_RULES)
            throw new RuleLimitExceededException("Máximo " + MAX_RULES + " reglas");
        return repo.save(userId, conceptPattern, category);
    }

    public void deleteRule(UUID ruleId, UUID userId) {
        repo.deleteById(ruleId, userId);
    }

    public static class RuleLimitExceededException extends RuntimeException {
        public RuleLimitExceededException(String msg) { super(msg); }
    }
}
