package com.experis.sofia.bankportal.auth.integration;

import com.experis.sofia.bankportal.auth.api.AccountAndContextController;
import com.experis.sofia.bankportal.auth.application.AccountUnlockUseCase;
import com.experis.sofia.bankportal.auth.application.LoginContextUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** US-602 - Integration tests capa web - contratos HTTP. SOFIA QA Agent Sprint 7 */
@WebMvcTest(AccountAndContextController.class)
@DisplayName("US-602 - AccountAndContextController HTTP contracts")
class AccountUnlockControllerIT {

    @Autowired MockMvc mockMvc;
    @MockBean AccountUnlockUseCase accountUnlockUseCase;
    @MockBean LoginContextUseCase  loginContextUseCase;

    @Nested @DisplayName("POST /api/v1/account/unlock")
    class RequestUnlock {

        @Test @DisplayName("Email valido -> 204 anti-enumeration R-SEC-004")
        void validEmail_204() throws Exception {
            doNothing().when(accountUnlockUseCase).requestUnlock(anyString());
            mockMvc.perform(post("/api/v1/account/unlock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"user@test.com\"}"))
                    .andExpect(status().isNoContent());
        }

        @Test @DisplayName("Email invalido -> 400 Bean Validation")
        void invalidEmail_400() throws Exception {
            mockMvc.perform(post("/api/v1/account/unlock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"not-an-email\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("Body vacio -> 400")
        void emptyBody_400() throws Exception {
            mockMvc.perform(post("/api/v1/account/unlock")
                    .contentType(MediaType.APPLICATION_JSON).content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("useCase siempre 204 incluso si email no existe (anti-enumeration)")
        void unknownEmail_still204() throws Exception {
            doNothing().when(accountUnlockUseCase).requestUnlock(anyString());
            mockMvc.perform(post("/api/v1/account/unlock")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"unknown@test.com\"}"))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested @DisplayName("GET /api/v1/account/unlock/{token}")
    class UnlockByToken {

        @Test @DisplayName("Token valido -> 302 redirect /login?reason=account-unlocked")
        void validToken_302() throws Exception {
            doNothing().when(accountUnlockUseCase).unlockByToken("valid-token");
            mockMvc.perform(get("/api/v1/account/unlock/valid-token"))
                    .andExpect(status().isFound())
                    .andExpect(header().string("Location", "/login?reason=account-unlocked"));
        }

        @Test @DisplayName("Token invalido (UnlockTokenException) -> 400")
        void invalidToken_400() throws Exception {
            doThrow(new AccountUnlockUseCase.UnlockTokenException("Token no encontrado"))
                    .when(accountUnlockUseCase).unlockByToken("bad-token");
            mockMvc.perform(get("/api/v1/account/unlock/bad-token"))
                    .andExpect(status().isBadRequest());
        }
    }
}
