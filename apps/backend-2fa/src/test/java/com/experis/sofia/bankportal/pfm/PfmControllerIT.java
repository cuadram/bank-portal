package com.experis.sofia.bankportal.pfm;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * IT Smoke test — PFM Controller.
 * Verifica que el contexto Spring arranca con el nuevo módulo pfm
 * y que los endpoints responden (401 sin token — auth funciona).
 * LA-019-04: IT smoke test obligatorio por feature.
 * FEAT-023 Sprint 25.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PfmControllerIT {

    @Autowired MockMvc mvc;

    @Test @DisplayName("IT-PFM-001 — GET /api/v1/pfm/overview sin token → 401")
    void overviewRequiresAuth() throws Exception {
        mvc.perform(get("/api/v1/pfm/overview"))
           .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-PFM-002 — GET /api/v1/pfm/budgets sin token → 401")
    void budgetsRequiresAuth() throws Exception {
        mvc.perform(get("/api/v1/pfm/budgets"))
           .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-PFM-003 — GET /api/v1/pfm/widget sin token → 401")
    void widgetRequiresAuth() throws Exception {
        mvc.perform(get("/api/v1/pfm/widget"))
           .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-PFM-004 — GET /api/v1/pfm/analysis sin token → 401")
    void analysisRequiresAuth() throws Exception {
        mvc.perform(get("/api/v1/pfm/analysis"))
           .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-PFM-005 — GET /api/v1/pfm/distribution sin token → 401")
    void distributionRequiresAuth() throws Exception {
        mvc.perform(get("/api/v1/pfm/distribution"))
           .andExpect(status().isUnauthorized());
    }
}
