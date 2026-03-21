package com.experis.sofia.bankportal.transfer.api;

import com.experis.sofia.bankportal.transfer.application.TransferLimitValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * US-804 — Consulta de límites de transferencia vigentes (solo lectura).
 * El usuario puede ver sus límites pero NO modificarlos (requiere contacto con la oficina).
 *
 * RV-002 fix: endpoint GET /api/v1/transfers/limits definido en OpenAPI v1.7.0 e implementado.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class TransferLimitsController {

    private final TransferLimitValidationService limitService;

    /**
     * Retorna los límites configurados por el banco y el acumulado diario del usuario.
     */
    @GetMapping("/limits")
    public ResponseEntity<LimitsResponse> getLimits(@AuthenticationPrincipal UUID userId) {
        BigDecimal perOp      = limitService.getPerOperationLimit();
        BigDecimal daily      = limitService.getDailyLimit();
        BigDecimal dailyUsed  = limitService.getDailyAccumulated(userId);
        BigDecimal remaining  = daily.subtract(dailyUsed).max(BigDecimal.ZERO);

        return ResponseEntity.ok(new LimitsResponse(perOp, daily, dailyUsed, remaining));
    }

    /** Response DTO — expone solo lo necesario, sin datos internos del sistema. */
    public record LimitsResponse(
            BigDecimal perOperationLimit,
            BigDecimal dailyLimit,
            BigDecimal dailyUsed,
            BigDecimal dailyRemaining
    ) {}
}
