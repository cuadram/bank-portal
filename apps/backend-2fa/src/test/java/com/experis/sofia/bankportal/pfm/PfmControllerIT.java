package com.experis.sofia.bankportal.pfm;

import com.experis.sofia.bankportal.twofa.BackendTwoFactorApplication;
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
 * Fix DEBT-055 / NC-CMMI-001 (2026-05-20):
 *   - Anadido classes = BackendTwoFactorApplication.class (sin esto Spring no
 *     localiza @SpringBootConfiguration porque PfmControllerIT esta en paquete
 *     com.experis.sofia.bankportal.pfm fuera del subpaquete twofa.*).
 *   - Cambiado perfil "test" -> "integration-compose" alineado con patron S26
 *     (SavingsIntegrationTestBase, BizumIntegrationTestBase): perfil test estaba
 *     pensado para Testcontainers que no se usan en este proyecto.
 *   - El test es smoke de seguridad (5 endpoints x 401 sin token), no requiere
 *     fixture de datos; integration-compose ya provee PG/Redis del Docker Compose.
 *
 * @author SOFIA Developer Agent — FEAT-023 Sprint 25
 * @author SOFIA QA Audit S18-S26 — fix DEBT-055 / NC-CMMI-001
 */
@SpringBootTest(
    classes = BackendTwoFactorApplication.class,
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT
)
@AutoConfigureMockMvc
@ActiveProfiles("integration-compose")
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
