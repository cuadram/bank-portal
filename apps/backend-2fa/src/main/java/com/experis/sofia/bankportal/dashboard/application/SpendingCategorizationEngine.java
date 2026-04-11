package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Motor de categorización de gastos por keywords.
 * ADR-019 — MVP con keyword matching. ML en FEAT-012.
 * FEAT-010 US-1002 Sprint 12.
 *
 * @author SOFIA Developer Agent
 */
@Slf4j
@Component
public class SpendingCategorizationEngine {

    private static final Map<SpendingCategory, List<String>> KEYWORDS = Map.of(
        SpendingCategory.ALIMENTACION, List.of(
            "mercadona", "carrefour", "lidl", "aldi", "dia ", "supermercado",
            "alimentacion", "fruteria", "panaderia", "pescaderia", "eroski"
        ),
        SpendingCategory.TRANSPORTE, List.of(
            "renfe", "metro", "bus ", "taxi", "uber", "cabify", "gasolina",
            "repsol", "bp ", "cepsa", "parking", "peaje", "autopista", "blablacar"
        ),
        SpendingCategory.SERVICIOS, List.of(
            "endesa", "iberdrola", "naturgy", "gas natural", "agua ",
            "telefonica", "vodafone", "orange", "movistar", "jazztel",
            "seguros", "mutua", "sanitas", "mapfre", "adeslas"
        ),
        SpendingCategory.OCIO, List.of(
            "netflix", "spotify", "amazon prime", "hbo", "disney", "steam",
            "cine", "restaurante", "bar ", "cerveceria", "teatro",
            "concierto", "gym", "gimnasio", "amazon"
        )
    );

    /**
     * Categoriza un gasto por su concepto e issuer.
     * Prioridad: primer match en orden ALIMENTACION → TRANSPORTE → SERVICIOS → OCIO → OTROS.
     */
    public SpendingCategory categorize(String concept, String issuer) {
        String text = (nvl(concept) + " " + nvl(issuer)).toLowerCase();

        for (var entry : KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) {
                    return entry.getKey();
                }
            }
        }

        log.info("[US-1002] Gasto categorizado como OTROS: concept='{}' issuer='{}'",
                mask(concept), mask(issuer));
        return SpendingCategory.OTROS;
    }

    private String nvl(String s) { return s != null ? s : ""; }
    private String mask(String s) { return (s != null && s.length() > 20) ? s.substring(0, 20) + "…" : s; }
}
