package com.experis.sofia.bankportal.account.api;

import com.experis.sofia.bankportal.account.application.StatementExportUseCase;
import com.experis.sofia.bankportal.account.application.StatementExportUseCase.StatementResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * API REST — Extractos bancarios.
 *
 * <pre>
 *   GET /api/v1/accounts/{accountId}/statements/{year}/{month}?format=pdf|csv
 * </pre>
 *
 * <p>Criterios de aceptación US-704:
 * <ul>
 *   <li>200 OK + bytes fichero (PDF o CSV) cuando hay movimientos.</li>
 *   <li>204 No Content cuando el mes no tiene movimientos.</li>
 *   <li>400 Bad Request si el formato es desconocido.</li>
 *   <li>400 Bad Request si year/month están fuera de rango válido.</li>
 * </ul>
 *
 * @author SOFIA Developer Agent — US-704 Sprint 9
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class StatementController {

    private static final int MIN_YEAR = 2000;
    private static final int MAX_YEAR = 2099;

    private final StatementExportUseCase statementExportUseCase;

    /**
     * Descarga un extracto mensual en formato PDF o CSV.
     *
     * @param accountId ID de la cuenta bancaria
     * @param year      Año (2000-2099)
     * @param month     Mes (1-12)
     * @param format    "pdf" | "csv" (default: "pdf")
     * @param jwt       token JWT del usuario autenticado
     * @return 200 con bytes del fichero, 204 si no hay movimientos, 400 si parámetros inválidos
     */
    @GetMapping("/{accountId}/statements/{year}/{month}")
    public CompletableFuture<ResponseEntity<byte[]>> downloadStatement(
            @PathVariable UUID    accountId,
            @PathVariable int     year,
            @PathVariable int     month,
            @RequestParam(defaultValue = "pdf") String format,
            @AuthenticationPrincipal Jwt jwt) {

        // ── Validaciones de entrada ──────────────────────────────────────────
        if (month < 1 || month > 12) {
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().build());
        }
        if (year < MIN_YEAR || year > MAX_YEAR) {
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().build());
        }
        String fmt = format.toLowerCase();
        if (!fmt.equals("pdf") && !fmt.equals("csv")) {
            return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().build());
        }

        UUID userId = UUID.fromString(jwt.getSubject());
        log.info("[US-704] GET /accounts/{}/statements/{}/{} format={} userId={}",
                accountId, year, month, fmt, userId);

        // ── Delegar en use case ──────────────────────────────────────────────
        return statementExportUseCase.export(userId, accountId, year, month, fmt)
                .thenApply(optional -> buildResponse(optional, fmt));
    }

    // ── Builder de respuesta HTTP ─────────────────────────────────────────────

    private ResponseEntity<byte[]> buildResponse(Optional<StatementResult> result,
                                                   String fmt) {
        if (result.isEmpty()) {
            // 204 — mes sin movimientos
            return ResponseEntity.noContent().build();
        }

        StatementResult r = result.get();
        MediaType mediaType = "pdf".equals(fmt)
                ? MediaType.APPLICATION_PDF
                : new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentLength(r.content().length);
        // RV-004: sanitizar filename para evitar HTTP header injection
        String safeFilename = r.filename().replaceAll("[\\r\\n\"\\\\]", "_");
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + safeFilename + "\"");
        headers.set("X-Content-SHA256", r.sha256());
        headers.set("X-Statement-Format", r.format());

        return new ResponseEntity<>(r.content(), headers, HttpStatus.OK);
    }
}
