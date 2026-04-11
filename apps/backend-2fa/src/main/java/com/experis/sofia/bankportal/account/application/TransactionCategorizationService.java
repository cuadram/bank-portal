package com.experis.sofia.bankportal.account.application;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * US-705 — Categorización automática de movimientos por reglas keyword.
 *
 * <p>Sprint 9: reglas simples case-insensitive sobre el campo {@code concept}.
 * El orden de las reglas importa — se evalúa la primera coincidencia.
 * Categoría {@code OTRO} como fallback universal.
 *
 * <p>Sprint futuro (FEAT-010): ML-based con modelo entrenado sobre historial real.
 *
 * @author SOFIA Developer Agent — US-705 Sprint 9
 */
@Service
public class TransactionCategorizationService {

    public enum Category {
        NOMINA, TRANSFERENCIA, COMPRA, DOMICILIACION,
        CAJERO, COMISION, DEVOLUCION, BIZUM, RECIBO_UTIL, OTRO
    }

    /** Reglas ordenadas por especificidad — primera coincidencia gana. */
    private static final List<Map.Entry<List<String>, Category>> RULES = List.of(
        Map.entry(List.of("nomina", "salary", "sueldo", "haberes", "retribucion"),
                  Category.NOMINA),
        Map.entry(List.of("bizum"),
                  Category.BIZUM),
        Map.entry(List.of("devolucion", "devol", "refund", "reembolso", "devoluc"),
                  Category.DEVOLUCION),
        Map.entry(List.of("comision", "com.", "mantenimiento cuenta", "cuota mantenimiento"),
                  Category.COMISION),
        Map.entry(List.of("transferencia", "transfer", "trnsf", "envio dinero"),
                  Category.TRANSFERENCIA),
        Map.entry(List.of("cajero", "atm", "reintegro", "disposicion efectivo"),
                  Category.CAJERO),
        Map.entry(List.of("domicil", "suministro"),
                  Category.DOMICILIACION),
        Map.entry(List.of("luz", "electricidad", "endesa", "iberdrola", "naturgy",
                           "agua", "canal isabel", "gas natural", "telefono", "movil",
                           "internet", "vodafone", "movistar", "orange", "yoigo",
                           "seguro", "mutua", "mapfre", "sanitas"),
                  Category.RECIBO_UTIL),
        Map.entry(List.of("recibo", "factura"),
                  Category.DOMICILIACION),
        Map.entry(List.of("compra", "pago", "tpv", "pos", "amazon", "mercadona",
                           "carrefour", "lidl", "aldi", "eroski"),
                  Category.COMPRA)
    );

    /**
     * Categoriza un movimiento por su concepto.
     * @param concept texto del movimiento; puede ser null
     * @return categoría asignada; {@link Category#OTRO} como fallback
     */
    public Category categorize(String concept) {
        if (concept == null || concept.isBlank()) return Category.OTRO;
        String lower = concept.toLowerCase();

        return RULES.stream()
                .filter(e -> e.getKey().stream().anyMatch(lower::contains))
                .map(Map.Entry::getValue)
                .findFirst()
                .orElse(Category.OTRO);
    }

    public String categorizeAsString(String concept) {
        return categorize(concept).name();
    }
}
