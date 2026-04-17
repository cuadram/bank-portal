package com.experis.sofia.bankportal.pfm;

import com.experis.sofia.bankportal.dashboard.application.SpendingCategorizationEngine;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica que la extensión de SpendingCategory (FEAT-023) no rompe
 * los valores originales FEAT-010 ni el SpendingCategorizationEngine.
 *
 * Nota: el sistema NO categoriza "TRANSFERENCIAS" — ese es rol exclusivo
 * de las reglas de usuario (RN-F023-01, ADR-037). Las transferencias
 * genéricas quedan como OTROS hasta que el usuario crea una regla manual.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
class SpendingCategoryExtensionTest {

    private final SpendingCategorizationEngine engine = new SpendingCategorizationEngine();

    @Test
    @DisplayName("Valores originales FEAT-010 siguen existiendo (no breaking change)")
    void valoresOriginalesExisten() {
        assertThat(SpendingCategory.valueOf("ALIMENTACION")).isEqualTo(SpendingCategory.ALIMENTACION);
        assertThat(SpendingCategory.valueOf("TRANSPORTE")).isEqualTo(SpendingCategory.TRANSPORTE);
        assertThat(SpendingCategory.valueOf("SERVICIOS")).isEqualTo(SpendingCategory.SERVICIOS);
        assertThat(SpendingCategory.valueOf("OCIO")).isEqualTo(SpendingCategory.OCIO);
        assertThat(SpendingCategory.valueOf("OTROS")).isEqualTo(SpendingCategory.OTROS);
    }

    @ParameterizedTest(name = "{0} -> {1}")
    @CsvSource({
        "COMPRA MERCADONA SA,     ALIMENTACION",
        "RENFE CERCANIAS MD,      TRANSPORTE",
        "NETFLIX MONTHLY,         OCIO",
        "NOMINA ABRIL,            NOMINA",
        "TRANSFERENCIA A JUAN,    OTROS",
        "BOOKING.COM HOTEL,       VIAJES",
        "FARMACIA CENTRAL,        SALUD",
        "IKEA VALENCIA,           HOGAR",
        "EMPRESA XYZ SL REF001,   OTROS",
        "VUELING AIRLINES,        VIAJES",
        "MCDONALDS MADRID,        RESTAURANTES",
        "MAPFRE SEGUROS AUTO,     SEGUROS"
    })
    @DisplayName("Motor de categorización extendido — keywords FEAT-023")
    void categorizacionExtendida(String concepto, String expectedCategory) {
        SpendingCategory result = engine.categorize(concepto, concepto);
        assertThat(result.name()).isEqualTo(expectedCategory.trim());
    }

    @Test
    @DisplayName("isIngreso: NOMINA y TRANSFERENCIAS son ingresos/exclusiones")
    void isIngreso() {
        assertThat(SpendingCategory.NOMINA.isIngreso()).isTrue();
        assertThat(SpendingCategory.TRANSFERENCIAS.isIngreso()).isTrue();
        assertThat(SpendingCategory.ALIMENTACION.isIngreso()).isFalse();
        assertThat(SpendingCategory.RESTAURANTES.isIngreso()).isFalse();
    }
}
