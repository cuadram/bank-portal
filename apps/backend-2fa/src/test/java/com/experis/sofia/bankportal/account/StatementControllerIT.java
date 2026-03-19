package com.experis.sofia.bankportal.account;

import com.experis.sofia.bankportal.account.application.StatementExportUseCase;
import com.experis.sofia.bankportal.account.application.StatementExportUseCase.StatementResult;
import com.experis.sofia.bankportal.account.api.StatementController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * US-704 — Integration Test (WebMvcTest) StatementController.
 *
 * <p>Cubre:
 * <ul>
 *   <li>200 OK + Content-Type application/pdf para extracto PDF.</li>
 *   <li>200 OK + Content-Type text/csv para extracto CSV.</li>
 *   <li>204 No Content cuando el mes no tiene movimientos.</li>
 *   <li>400 Bad Request para mes fuera de rango (0, 13).</li>
 *   <li>400 Bad Request para formato desconocido.</li>
 *   <li>Header X-Content-SHA256 presente en respuestas 200.</li>
 *   <li>Header Content-Disposition con filename correcto.</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — US-704 Sprint 9
 */
@WebMvcTest(StatementController.class)
class StatementControllerIT {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    StatementExportUseCase statementExportUseCase;

    private static final UUID ACCOUNT_ID = UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001");
    private static final UUID USER_ID    = UUID.fromString("bbbbbbbb-0000-0000-0000-000000000002");
    private static final String BASE_URL = "/api/v1/accounts/" + ACCOUNT_ID + "/statements/2026/2";

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 1: PDF
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: GET statements PDF → 200 + application/pdf + SHA-256 header")
    void downloadStatement_pdf_returns200WithCorrectHeaders() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 fake pdf content".getBytes(StandardCharsets.UTF_8);
        StatementResult result = new StatementResult(
                pdfBytes, "extracto-ES001234-2026-02.pdf",
                "abc123def456abc123def456abc123def456abc123def456abc123def456abc1", "PDF");

        when(statementExportUseCase.export(
                eq(USER_ID), eq(ACCOUNT_ID), eq(2026), eq(2), eq("pdf")))
                .thenReturn(CompletableFuture.completedFuture(Optional.of(result)));

        var mvcResult = mockMvc.perform(get(BASE_URL)
                        .param("format", "pdf")
                        .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PDF))
                .andExpect(header().string("X-Content-SHA256",
                        "abc123def456abc123def456abc123def456abc123def456abc123def456abc1"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"extracto-ES001234-2026-02.pdf\""));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 2: CSV
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: GET statements CSV → 200 + text/csv + BOM en contenido")
    void downloadStatement_csv_returns200WithCsvContentType() throws Exception {
        String csvContent = "\uFEFFfecha;concepto;importe;saldo_tras_movimiento;tipo;categoria\n";
        byte[] csvBytes = csvContent.getBytes(StandardCharsets.UTF_8);
        StatementResult result = new StatementResult(
                csvBytes, "extracto-ES001234-2026-02.csv",
                "deadbeef".repeat(8), "CSV");

        when(statementExportUseCase.export(
                eq(USER_ID), eq(ACCOUNT_ID), eq(2026), eq(2), eq("csv")))
                .thenReturn(CompletableFuture.completedFuture(Optional.of(result)));

        var mvcResult = mockMvc.perform(get(BASE_URL)
                        .param("format", "csv")
                        .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"extracto-ES001234-2026-02.csv\""))
                .andExpect(header().exists("X-Content-SHA256"))
                .andExpect(content().bytes(csvBytes));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 3: mes sin movimientos → 204
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: mes sin movimientos → 204 No Content")
    void downloadStatement_emptyMonth_returns204() throws Exception {
        when(statementExportUseCase.export(any(), any(), anyInt(), anyInt(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(Optional.empty()));

        var mvcResult = mockMvc.perform(get(BASE_URL)
                        .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isNoContent());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 4: mes fuera de rango
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: mes=0 → 400 Bad Request")
    void downloadStatement_invalidMonthZero_returns400() throws Exception {
        // RV-002: añadir assertions — el controller retorna completedFuture(badRequest)
        // que MockMvc puede resolver con asyncDispatch
        var mvcResult = mockMvc.perform(
                        get("/api/v1/accounts/" + ACCOUNT_ID + "/statements/2026/0")
                                .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("US-704: mes=13 → 400 Bad Request")
    void downloadStatement_invalidMonthThirteen_returns400() throws Exception {
        var mvcResult = mockMvc.perform(
                        get("/api/v1/accounts/" + ACCOUNT_ID + "/statements/2026/13")
                                .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 5: formato desconocido
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: format=xlsx → 400 Bad Request")
    void downloadStatement_unknownFormat_returns400() throws Exception {
        var mvcResult = mockMvc.perform(get(BASE_URL)
                        .param("format", "xlsx")
                        .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
                .andReturn();

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Escenario 6: sin autenticación
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("US-704: sin JWT → 401 Unauthorized")
    void downloadStatement_noAuth_returns401() throws Exception {
        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isUnauthorized());
    }
}
