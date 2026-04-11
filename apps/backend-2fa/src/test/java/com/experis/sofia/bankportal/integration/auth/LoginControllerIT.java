package com.experis.sofia.bankportal.integration.auth;

import com.experis.sofia.bankportal.integration.config.IntegrationTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test — LoginController.
 * Verifica el flujo completo de autenticación contra BD real.
 * DEBT-030 — detecta errores de configuración de SecurityConfig en tiempo de build.
 */
@DisplayName("LoginController — Integration Tests")
class LoginControllerIT extends IntegrationTestBase {

    @Test
    @DisplayName("POST /auth/login devuelve 200 y accessToken con credenciales válidas")
    void login_returnsJwtWithValidCredentials() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "a.delacuadra@nemtec.es", "password": "Angel@123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken", notNullValue()))
            .andExpect(jsonPath("$.accessToken", startsWith("eyJ")));
    }

    @Test
    @DisplayName("POST /auth/login devuelve 401 con contraseña incorrecta")
    void login_returns401WithWrongPassword() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "a.delacuadra@nemtec.es", "password": "WrongPass!"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/login devuelve 401 con usuario inexistente")
    void login_returns401WithNonExistentUser() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "noexiste@test.com", "password": "SomePass!"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/login devuelve 400 con body inválido")
    void login_returns400WithInvalidBody() throws Exception {
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/accounts devuelve 401 sin token")
    void protectedEndpoint_returns401WithoutToken() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/v1/accounts"))
            .andExpect(status().isUnauthorized());
    }
}
