package com.experis.sofia.bankportal.dashboard;

import com.experis.sofia.bankportal.dashboard.application.SpendingCategorizationEngine;
import com.experis.sofia.bankportal.dashboard.application.SpendingCategoryService;
import com.experis.sofia.bankportal.dashboard.application.dto.SpendingCategoryDto;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort;
import com.experis.sofia.bankportal.dashboard.domain.DashboardRepositoryPort.RawSpendingRecord;
import com.experis.sofia.bankportal.dashboard.domain.SpendingCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitarios — SpendingCategoryService + SpendingCategorizationEngine.
 * US-1002 FEAT-010 Sprint 12.
 */
@ExtendWith(MockitoExtension.class)
class SpendingCategoryServiceTest {

    @Mock  DashboardRepositoryPort repo;
    @InjectMocks SpendingCategorizationEngine engine;

    private SpendingCategoryService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        service = new SpendingCategoryService(repo, engine);
        userId  = UUID.randomUUID();
    }

    @Test
    @DisplayName("US-1002 Escenario 1: categorías calculadas desde raw data")
    void shouldComputeCategoriesFromRaw() {
        when(repo.findCachedCategories(userId, "2026-03")).thenReturn(Collections.emptyList());
        when(repo.findRawSpendings(userId, "2026-03")).thenReturn(List.of(
                new RawSpendingRecord("Compra Mercadona", null, new BigDecimal("120.00")),
                new RawSpendingRecord(null, "Endesa",          new BigDecimal("85.50")),
                new RawSpendingRecord("Netflix mensual", null, new BigDecimal("15.99"))
        ));

        List<SpendingCategoryDto> result = service.getCategories(userId, "2026-03");

        assertThat(result).isNotEmpty();
        assertThat(result.stream().map(SpendingCategoryDto::category))
                .contains(SpendingCategory.ALIMENTACION.name(),
                          SpendingCategory.SERVICIOS.name(),
                          SpendingCategory.OCIO.name());
        verify(repo).upsertSpendingCategories(eq(userId), eq("2026-03"), anyList());
    }

    @Test
    @DisplayName("US-1002 Escenario 2: caché hit — no recalcula")
    void shouldReturnCachedCategoriesWithoutRecomputing() {
        List<SpendingCategoryDto> cached = List.of(
                new SpendingCategoryDto("ALIMENTACION", new BigDecimal("450.00"), 20.9, 12));
        when(repo.findCachedCategories(userId, "2026-03")).thenReturn(cached);

        List<SpendingCategoryDto> result = service.getCategories(userId, "2026-03");

        assertThat(result).isEqualTo(cached);
        verify(repo, never()).findRawSpendings(any(), any());
        verify(repo, never()).upsertSpendingCategories(any(), any(), any());
    }

    @Test
    @DisplayName("US-1002 Escenario 3: categorización por keyword TRANSPORTE")
    void shouldCategorizeTransporte() {
        assertThat(engine.categorize("Taxi aeropuerto", null))
                .isEqualTo(SpendingCategory.TRANSPORTE);
    }

    @Test
    @DisplayName("US-1002: concepto y emisor nulos → categoría OTROS")
    void shouldReturnOtrosForNullConceptAndIssuer() {
        assertThat(engine.categorize(null, null)).isEqualTo(SpendingCategory.OTROS);
    }

    @Test
    @DisplayName("US-1002: sin transacciones en el período → lista vacía")
    void shouldReturnEmptyForNoPeriodActivity() {
        when(repo.findCachedCategories(userId, "2025-01")).thenReturn(Collections.emptyList());
        when(repo.findRawSpendings(userId, "2025-01")).thenReturn(Collections.emptyList());

        List<SpendingCategoryDto> result = service.getCategories(userId, "2025-01");

        assertThat(result).isEmpty();
        verify(repo, never()).upsertSpendingCategories(any(), any(), any());
    }
}
