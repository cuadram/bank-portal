package com.experis.sofia.bankportal.pfm.domain.model;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import java.time.Instant;
import java.util.UUID;

/**
 * Regla de categorización personalizada del usuario.
 * RN-F023-17: el usuario puede asociar un concepto/comercio a una categoría.
 * RN-F023-18: máximo 50 reglas por usuario.
 * RN-F023-01: reglas usuario tienen prioridad sobre reglas del sistema.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
public class PfmUserRule {

    private final UUID             id;
    private final UUID             userId;
    private final String           conceptPattern;   // ILIKE pattern
    private final SpendingCategory category;
    private final Instant          createdAt;

    public PfmUserRule(UUID id, UUID userId, String conceptPattern,
                       SpendingCategory category, Instant createdAt) {
        this.id             = id;
        this.userId         = userId;
        this.conceptPattern = conceptPattern;
        this.category       = category;
        this.createdAt      = createdAt;
    }

    /** True si el concepto dado coincide con el patrón (case-insensitive). */
    public boolean matches(String concept) {
        if (concept == null || conceptPattern == null) return false;
        return concept.toLowerCase().contains(conceptPattern.toLowerCase());
    }

    public UUID             getId()             { return id; }
    public UUID             getUserId()         { return userId; }
    public String           getConceptPattern() { return conceptPattern; }
    public SpendingCategory getCategory()       { return category; }
    public Instant          getCreatedAt()      { return createdAt; }
}
