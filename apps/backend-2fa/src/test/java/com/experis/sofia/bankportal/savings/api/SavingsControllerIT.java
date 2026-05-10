package com.experis.sofia.bankportal.savings.api;

import com.experis.sofia.bankportal.integration.SavingsIntegrationTestBase;
import com.experis.sofia.bankportal.twofa.infrastructure.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * IT SavingsController - Sprint 26 FEAT-024 Step 4 Fase F.4.
 *
 * Cobertura:
 *  - 11 endpoints x 401 sin Authorization (smoke security)
 *  - 3 happy paths con Bearer JWT real (POST goal 201, GET goals 200, GET widget 200)
 *  - 1 escenario ownership cross-user 404 (RN-F024-08 acceso negado)
 *
 * Patron: hereda de SavingsIntegrationTestBase (postgres+redis del compose,
 * fixture savings-test-fixtures.sql precarga user/account/balance).
 *
 * @author SOFIA Developer Agent - FEAT-024 Sprint 26 - Fase F.4
 */
@AutoConfigureMockMvc
class SavingsControllerIT extends SavingsIntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider jwt;
    @Autowired ObjectMapper json;
    @Autowired JdbcClient jdbc;

    private String userToken;
    private String otherToken;

    @BeforeEach
    void setUp() {
        userToken = jwt.generate(TEST_USER_ID, "savings_test_user");
        otherToken = jwt.generate(OTHER_USER_ID, "savings_test_user_other");
    }

    @AfterEach
    void cleanup() {
        // Cleanup orden dependiente FK: allocations -> milestones -> auto_rules -> goals
        // Solo borra los del usuario test (no toca otros datos del compose persistente).
        jdbc.sql("DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id IN (?, ?))")
            .params(TEST_USER_ID, OTHER_USER_ID).update();
        jdbc.sql("DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id IN (?, ?))")
            .params(TEST_USER_ID, OTHER_USER_ID).update();
        jdbc.sql("DELETE FROM goal_auto_rules WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id IN (?, ?))")
            .params(TEST_USER_ID, OTHER_USER_ID).update();
        jdbc.sql("DELETE FROM savings_goals WHERE user_id IN (?, ?)")
            .params(TEST_USER_ID, OTHER_USER_ID).update();
        // Restaurar balance limpio (otros tests pueden haber modificado available/retained via reserve)
        jdbc.sql("UPDATE account_balances SET available_balance=10000.00, retained_balance=0.00 WHERE account_id=?")
            .param(TEST_ACCOUNT_ID).update();
        jdbc.sql("UPDATE account_balances SET available_balance=5000.00, retained_balance=0.00 WHERE account_id=?")
            .param(OTHER_ACCOUNT_ID).update();
    }

    // ========================================================================
    // SMOKE 401 - 11 endpoints sin Authorization header
    // ========================================================================

    @Test @DisplayName("IT-SAV-001 - GET /goals sin token -> 401")
    void getGoals_noToken_401() throws Exception {
        mvc.perform(get("/api/v1/savings/goals"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-002 - POST /goals sin token -> 401")
    void postGoal_noToken_401() throws Exception {
        mvc.perform(post("/api/v1/savings/goals")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-003 - GET /goals/{id} sin token -> 401")
    void getGoalDetail_noToken_401() throws Exception {
        mvc.perform(get("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-004 - PUT /goals/{id} sin token -> 401")
    void putGoal_noToken_401() throws Exception {
        mvc.perform(put("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-005 - DELETE /goals/{id} sin token -> 401")
    void deleteGoal_noToken_401() throws Exception {
        mvc.perform(delete("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-006 - POST /goals/{id}/contributions sin token -> 401")
    void postContribution_noToken_401() throws Exception {
        mvc.perform(post("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa/contributions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-007 - GET /goals/{id}/contributions sin token -> 401")
    void getContributions_noToken_401() throws Exception {
        mvc.perform(get("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa/contributions"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-008 - PUT /goals/{id}/auto-rule sin token -> 401")
    void putAutoRule_noToken_401() throws Exception {
        mvc.perform(put("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa/auto-rule")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-009 - DELETE /goals/{id}/auto-rule sin token -> 401")
    void deleteAutoRule_noToken_401() throws Exception {
        mvc.perform(delete("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa/auto-rule"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-010 - GET /goals/{id}/milestones sin token -> 401")
    void getMilestones_noToken_401() throws Exception {
        mvc.perform(get("/api/v1/savings/goals/00000000-0000-0000-0000-000000000aaa/milestones"))
                .andExpect(status().isUnauthorized());
    }

    @Test @DisplayName("IT-SAV-011 - GET /dashboard-widget sin token -> 401")
    void getWidget_noToken_401() throws Exception {
        mvc.perform(get("/api/v1/savings/dashboard-widget"))
                .andExpect(status().isUnauthorized());
    }

    // ========================================================================
    // HAPPY PATHS con Bearer JWT real
    // ========================================================================

    @Test @DisplayName("IT-SAV-100 - GET /goals con token valido (sin goals) -> 200 lista vacia")
    void getGoals_authenticated_emptyList() throws Exception {
        mvc.perform(get("/api/v1/savings/goals")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test @DisplayName("IT-SAV-101 - POST /goals con token valido -> 201 + goal en BD")
    void postGoal_authenticated_201() throws Exception {
        Map<String, Object> body = Map.of(
            "name", "Viaje a Japon",
            "targetAmount", 5000,
            "targetDate", LocalDate.now().plusYears(2).toString(),
            "category", "VIAJE",
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        mvc.perform(post("/api/v1/savings/goals")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Viaje a Japon"))
                .andExpect(jsonPath("$.targetAmount").value(5000.00))
                .andExpect(jsonPath("$.reservedAmount").value(0.00))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.category").value("VIAJE"));

        Long count = jdbc.sql("SELECT COUNT(*) FROM savings_goals WHERE user_id = ?")
                .param(TEST_USER_ID).query(Long.class).single();
        org.assertj.core.api.Assertions.assertThat(count).isEqualTo(1L);
    }

    @Test @DisplayName("IT-SAV-102 - GET /dashboard-widget con token valido -> 200")
    void getDashboardWidget_authenticated_200() throws Exception {
        mvc.perform(get("/api/v1/savings/dashboard-widget")
                .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeGoalsCount").exists());
    }

    // ========================================================================
    // OWNERSHIP cross-user
    // ========================================================================

    @Test @DisplayName("IT-SAV-200 - GET /goals/{id} de otro usuario -> 403 GoalAccessDenied")
    void getGoalDetail_crossUser_403() throws Exception {
        // Arrange: TEST_USER_ID crea un goal
        Map<String, Object> createBody = Map.of(
            "name", "Goal del primer usuario",
            "targetAmount", 1000,
            "targetDate", LocalDate.now().plusYears(1).toString(),
            "category", "EMERGENCIA",
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        String createResp = mvc.perform(post("/api/v1/savings/goals")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(createBody)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String goalId = json.readTree(createResp).get("id").asText();

        // Act+Assert: OTHER_USER_ID intenta leerlo -> 403
        mvc.perform(get("/api/v1/savings/goals/" + goalId)
                .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());
    }
}
