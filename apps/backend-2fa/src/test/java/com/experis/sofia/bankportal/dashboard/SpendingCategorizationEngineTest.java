package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.SpendingCategorizationEngine;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests unitarios del motor de categorización de gastos.
 * Sprint 14 — FEAT-012 / Dashboard portado — SOFIA QA Agent — CMMI VER SP 2.1
 */
@DisplayName("SpendingCategorizationEngine — Categorización por keywords")
class SpendingCategorizationEngineTest {

    private SpendingCategorizationEngine engine;

    @BeforeEach
    void setUp() { engine = new SpendingCategorizationEngine(); }

    @Test
    @DisplayName("Supermercado categoriza como ALIMENTACION")
    void categorize_supermercado_alimentacion() {
        assertThat(engine.categorize("Compra Mercadona", null)).isEqualTo(SpendingCategory.ALIMENTACION);
        assertThat(engine.categorize("LIDL España", null)).isEqualTo(SpendingCategory.ALIMENTACION);
    }

    @Test
    @DisplayName("Transporte público categoriza como TRANSPORTE")
    void categorize_metro_transporte() {
        assertThat(engine.categorize("Recarga metro Madrid", null)).isEqualTo(SpendingCategory.TRANSPORTE);
        assertThat(engine.categorize(null, "RENFE Cercanias")).isEqualTo(SpendingCategory.TRANSPORTE);
    }

    @Test
    @DisplayName("Suministros categoriza como SERVICIOS")
    void categorize_suministros_servicios() {
        assertThat(engine.categorize(null, "Endesa")).isEqualTo(SpendingCategory.SERVICIOS);
        assertThat(engine.categorize("Factura Movistar", null)).isEqualTo(SpendingCategory.SERVICIOS);
    }

    @Test
    @DisplayName("Streaming categoriza como OCIO")
    void categorize_streaming_ocio() {
        assertThat(engine.categorize("Netflix subscription", null)).isEqualTo(SpendingCategory.OCIO);
        assertThat(engine.categorize("Spotify Premium", null)).isEqualTo(SpendingCategory.OCIO);
    }

    @Test
    @DisplayName("Concepto desconocido categoriza como OTROS")
    void categorize_unknown_otros() {
        assertThat(engine.categorize("Transferencia 12345", null)).isEqualTo(SpendingCategory.OTROS);
        assertThat(engine.categorize(null, null)).isEqualTo(SpendingCategory.OTROS);
    }

    @Test
    @DisplayName("Concepto e issuer ambos nulos — devuelve OTROS sin NPE")
    void categorize_bothNull_returnsOtros() {
        assertThatCode(() -> engine.categorize(null, null)).doesNotThrowAnyException();
        assertThat(engine.categorize(null, null)).isEqualTo(SpendingCategory.OTROS);
    }
}
