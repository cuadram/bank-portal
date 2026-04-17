package com.experis.sofia.bankportal.dashboard.application;

import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Motor de categorización de gastos por keywords.
 *
 * <p>ADR-019 — MVP con keyword matching. ML en FEAT-012.
 * FEAT-010 US-1002 Sprint 12: categorías originales ALIMENTACION/TRANSPORTE/SERVICIOS/OCIO/OTROS.
 * FEAT-023 Sprint 25: ampliado con 9 categorías PFM. Orden de evaluación garantiza
 * que los valores originales (posiciones 0-3) se evalúan primero → compatibilidad total
 * con dashboard analítico existente.
 *
 * <p>REGLA de extensión: añadir nuevas categorías DESPUÉS de las originales en
 * CATEGORY_PRIORITY para no alterar la precedencia de los tests existentes.
 *
 * @author SOFIA Developer Agent — FEAT-010 Sprint 12 · FEAT-023 Sprint 25
 */
@Slf4j
@Component
public class SpendingCategorizationEngine {

    /** Keywords por categoría — orden define prioridad de matching. */
    private static final Map<SpendingCategory, List<String>> KEYWORDS = Map.ofEntries(

        // ── Originales FEAT-010 (orden preservado) ─────────────────────────────
        Map.entry(SpendingCategory.ALIMENTACION, List.of(
            "mercadona", "carrefour", "lidl", "aldi", "dia ", "supermercado",
            "alimentacion", "fruteria", "panaderia", "pescaderia", "eroski",
            "alcampo", "hipercor", "consum", "ahorramás", "el corte ingles alim"
        )),
        Map.entry(SpendingCategory.TRANSPORTE, List.of(
            "renfe", "metro", "bus ", "taxi", "uber", "cabify", "gasolina",
            "repsol", "bp ", "cepsa", "parking", "peaje", "autopista", "blablacar",
            "ouigo", "iryo", "avlo", "emt ", "tmb ", "bicing", "valenbisi"
        )),
        Map.entry(SpendingCategory.SERVICIOS, List.of(
            "endesa", "iberdrola", "naturgy", "gas natural", "agua ",
            "telefonica", "vodafone", "orange", "movistar", "jazztel",
            "mutua madrileña", "seguros generali"  // keywords genéricas retiradas — FEAT-023 usa cat. específicas
        )),
        Map.entry(SpendingCategory.OCIO, List.of(
            "netflix", "spotify", "amazon prime", "hbo", "disney", "steam",
            "cine", "restaurante", "bar ", "cerveceria", "teatro",
            "concierto", "gym", "gimnasio", "amazon"
        )),

        // ── Nuevas FEAT-023 PFM ────────────────────────────────────────────────
        Map.entry(SpendingCategory.RESTAURANTES, List.of(
            "restaurante", "cafeteria", "hamburgueseria", "pizzeria", "sushi",
            "mcdonalds", "burger king", "kfc", "telepizza", "dominos",
            "just eat", "glovo", "uber eats", "deliveroo", "tapas", "cerveceria"
        )),
        Map.entry(SpendingCategory.SALUD, List.of(
            "farmacia", "clinica", "hospital", "medico", "dentista",
            "oftalmologia", "fisioterapia", "laboratorio", "analisis",
            "sanitas", "adeslas", "axa salud", "asisa", "dkv"
        )),
        Map.entry(SpendingCategory.HOGAR, List.of(
            "ikea", "leroy merlin", "bricomart", "aki ", "bauhaus",
            "el corte ingles hogar", "zara home", "casa ", "maisons du monde",
            "comunidad propietarios", "trastero", "alquiler"
        )),
        Map.entry(SpendingCategory.SUMINISTROS, List.of(
            "endesa hogar", "iberdrola hogar", "naturgy hogar",
            "canal isabel", "aguas de ", "aqualia", "suez agua",
            "calor y frio", "calefaccion"
        )),
        Map.entry(SpendingCategory.COMUNICACIONES, List.of(
            "movistar fibra", "vodafone fibra", "orange fibra", "masmovil",
            "pepephone", "simyo", "digi ", "yoigo", "correos",
            "amazon web", "google one", "dropbox", "icloud"
        )),
        Map.entry(SpendingCategory.EDUCACION, List.of(
            "universidad", "colegio", "academia", "udemy", "coursera",
            "fnac libros", "casa del libro", "libreria", "papeleria",
            "material escolar", "master ", "posgrado", "cambridge"
        )),
        Map.entry(SpendingCategory.VIAJES, List.of(
            "vueling", "iberia", "ryanair", "easyjet", "level ",
            "booking", "airbnb", "hotel", "hostal", "pension",
            "avis", "hertz", "europcar", "viajes el corte", "halcon viajes"
        )),
        Map.entry(SpendingCategory.SEGUROS, List.of(
            "mapfre seguro", "generali", "allianz", "zurich seguro",
            "reale", "linea directa", "mutua madrilena", "pelayo",
            "seguros rga", "ocaso", "catalana occidente"
        )),
        Map.entry(SpendingCategory.NOMINA, List.of(
            "nomina", "salario", "paga ", "haberes", "mensualidad empresa"
        )),
        Map.entry(SpendingCategory.TRANSFERENCIAS, List.of(
            "bizum p2p envio", "ocatransferencia"  // Sistema NO categoriza transferencias genéricas — solo reglas usuario
        ))
    );

    /**
     * Orden de evaluación — determina prioridad cuando hay múltiples matches.
     * Originales FEAT-010 primero para no alterar comportamiento del dashboard.
     */
    private static final List<SpendingCategory> CATEGORY_PRIORITY = List.of(
        // originales (preservar orden)
        SpendingCategory.ALIMENTACION,
        SpendingCategory.TRANSPORTE,
        SpendingCategory.SERVICIOS,
        SpendingCategory.OCIO,
        // PFM — más específicos antes que genéricos
        SpendingCategory.NOMINA,
        SpendingCategory.TRANSFERENCIAS,
        SpendingCategory.RESTAURANTES,
        SpendingCategory.SALUD,
        SpendingCategory.HOGAR,
        SpendingCategory.SUMINISTROS,
        SpendingCategory.COMUNICACIONES,
        SpendingCategory.EDUCACION,
        SpendingCategory.VIAJES,
        SpendingCategory.SEGUROS
    );

    /**
     * Categoriza un gasto por su concepto e issuer.
     * Prioridad: orden definido en CATEGORY_PRIORITY → OTROS si no hay match.
     */
    public SpendingCategory categorize(String concept, String issuer) {
        String text = (nvl(concept) + " " + nvl(issuer)).toLowerCase();

        for (SpendingCategory cat : CATEGORY_PRIORITY) {
            List<String> keywords = KEYWORDS.get(cat);
            if (keywords == null) continue;
            for (String kw : keywords) {
                if (text.contains(kw)) return cat;
            }
        }

        log.info("[categorize] OTROS: concept='{}' issuer='{}'", mask(concept), mask(issuer));
        return SpendingCategory.OTROS;
    }

    /**
     * Categoriza aplicando primero una regla de usuario si existe.
     * Usado por PfmCategorizationService (regla usuario > sistema — RN-F023-01).
     */
    public SpendingCategory categorizeWithUserRule(String concept, String issuer,
                                                    SpendingCategory userOverride) {
        if (userOverride != null) return userOverride;
        return categorize(concept, issuer);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String nvl(String s) { return s == null ? "" : s; }

    private String mask(String s) {
        if (s == null || s.length() < 4) return "***";
        return s.substring(0, 2) + "***" + s.substring(s.length() - 2);
    }
}
