package com.experis.sofia.bankportal.pfm.infrastructure.persistence;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import com.experis.sofia.bankportal.pfm.domain.model.PfmUserRule;
import com.experis.sofia.bankportal.pfm.domain.repository.PfmUserRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Adaptador JPA/JDBC — pfm_user_rules.
 * @Primary — activo en dev/staging/production sin @Profile (LA-019-08).
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@Repository
@RequiredArgsConstructor
public class JpaPfmUserRuleAdapter implements PfmUserRuleRepository {

    private final JdbcClient jdbc;

    @Override
    public List<PfmUserRule> findByUserId(UUID userId) {
        return jdbc.sql("""
            SELECT id, user_id, concept_pattern, category_code, created_at
            FROM pfm_user_rules WHERE user_id = :userId ORDER BY created_at DESC
            """)
            .param("userId", userId)
            .query((rs, n) -> new PfmUserRule(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("concept_pattern"),
                SpendingCategory.valueOf(rs.getString("category_code")),
                rs.getTimestamp("created_at").toInstant()
            )).list();
    }

    @Override
    public int countByUserId(UUID userId) {
        return jdbc.sql("SELECT COUNT(*) FROM pfm_user_rules WHERE user_id = :userId")
            .param("userId", userId).query(Integer.class).single();
    }

    @Override
    public PfmUserRule save(UUID userId, String conceptPattern, SpendingCategory category) {
        UUID id  = UUID.randomUUID();
        Instant now = Instant.now();
        jdbc.sql("""
            INSERT INTO pfm_user_rules (id, user_id, concept_pattern, category_code, created_at)
            VALUES (:id, :userId, :pattern, :category, :now)
            """)
            .param("id", id).param("userId", userId)
            .param("pattern", conceptPattern)
            .param("category", category.name())
            .param("now", now)
            .update();
        return new PfmUserRule(id, userId, conceptPattern, category, now);
    }

    @Override
    public void deleteById(UUID ruleId, UUID userId) {
        jdbc.sql("DELETE FROM pfm_user_rules WHERE id = :id AND user_id = :userId")
            .param("id", ruleId).param("userId", userId).update();
    }
}
