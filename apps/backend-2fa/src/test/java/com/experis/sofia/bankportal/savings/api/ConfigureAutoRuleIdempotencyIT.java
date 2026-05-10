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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * IT BUG-S26-Q-003 fix verificacion - Sprint 26 FEAT-024 Step 7.
 *
 * <p>Verifica que PUT /api/v1/savings/goals/{id}/auto-rule cumple la
 * semantica idempotente RFC 7231 tras el fix C3 (upsert in-place).</p>
 *
 * <p>Antes del fix la segunda llamada chocaba con uk_goal_active_rule
 * (UNIQUE PARTIAL active=true) y devolvia 500 con stack trace.</p>
 *
 * @author SOFIA DevOps Agent - Sprint 26 Step 7 - C3/BUG-Q-003
 */
@AutoConfigureMockMvc
class ConfigureAutoRuleIdempotencyIT extends SavingsIntegrationTestBase {

    @Autowired MockMvc mvc;
    @Autowired JwtTokenProvider jwt;
    @Autowired ObjectMapper json;
    @Autowired JdbcClient jdbc;

    private String userToken;
    private UUID goalId;

    @BeforeEach
    void setUp() throws Exception {
        userToken = jwt.generate(TEST_USER_ID, "savings_test_user");
        Map<String, Object> goalBody = Map.of(
            "name", "Auto-rule idempotency test",
            "targetAmount", 5000,
            "targetDate", LocalDate.now().plusYears(2).toString(),
            "category", "VIAJE",
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        String resp = mvc.perform(post("/api/v1/savings/goals")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(goalBody)))
                .andReturn().getResponse().getContentAsString();
        goalId = UUID.fromString(json.readTree(resp).get("id").asText());
    }

    @AfterEach
    void cleanup() {
        jdbc.sql("DELETE FROM goal_allocations WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_milestones WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM goal_auto_rules WHERE goal_id IN (SELECT id FROM savings_goals WHERE user_id = ?)")
            .param(TEST_USER_ID).update();
        jdbc.sql("DELETE FROM savings_goals WHERE user_id = ?").param(TEST_USER_ID).update();
    }

    @Test
    @DisplayName("BUG-Q-003 - PUT auto-rule idempotente: 2 llamadas sucesivas devuelven 200 (no 500)")
    void putAutoRule_twice_returns200_idempotent() throws Exception {
        Map<String, Object> first = Map.of(
            "amount", 25,
            "dayOfMonth", 5,
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        mvc.perform(put("/api/v1/savings/goals/" + goalId + "/auto-rule")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(first)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(25.00))
                .andExpect(jsonPath("$.dayOfMonth").value(5))
                .andExpect(jsonPath("$.active").value(true));

        Map<String, Object> second = Map.of(
            "amount", 30,
            "dayOfMonth", 10,
            "sourceAccountId", TEST_ACCOUNT_ID.toString()
        );
        mvc.perform(put("/api/v1/savings/goals/" + goalId + "/auto-rule")
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(second)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.amount").value(30.00))
                .andExpect(jsonPath("$.dayOfMonth").value(10))
                .andExpect(jsonPath("$.active").value(true));

        // Solo debe existir 1 fila active=true (uk_goal_active_rule respetada)
        Long activeCount = jdbc.sql(
                "SELECT COUNT(*) FROM goal_auto_rules WHERE goal_id=? AND active=true")
            .param(goalId).query(Long.class).single();
        assertThat(activeCount).as("una sola regla activa por goal").isEqualTo(1L);

        // Y la fila activa refleja los valores de la segunda llamada
        Integer dayOfMonth = jdbc.sql(
                "SELECT day_of_month FROM goal_auto_rules WHERE goal_id=? AND active=true")
            .param(goalId).query(Integer.class).single();
        assertThat(dayOfMonth).isEqualTo(10);
    }
}
