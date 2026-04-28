package com.experis.sofia.bankportal.savings.api.controller;

import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AllocationDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.AutoRuleRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CloseResultDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.ContributeRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.CreateGoalRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.GoalDetailDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.MilestoneDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.SavingsGoalDto;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.UpdateGoalRequest;
import com.experis.sofia.bankportal.savings.application.dto.SavingsDtos.WidgetDto;
import com.experis.sofia.bankportal.savings.application.usecase.CloseGoalUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.ConfigureAutoRuleUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.ContributeManualUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.CreateGoalUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.GetDashboardWidgetUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.GetGoalDetailUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.ListGoalsUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.PauseAutoRuleUseCase;
import com.experis.sofia.bankportal.savings.application.usecase.UpdateGoalUseCase;
import com.experis.sofia.bankportal.savings.domain.model.GoalStatus;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — Modulo Objetivos de Ahorro (FEAT-024).
 *
 * <p>Base path: {@code /api/v1/savings}. Auth: Bearer JWT. {@code userId}
 * extraido via {@code request.getAttribute("authenticatedUserId")} (LA-TEST-001).</p>
 *
 * <p>Mapeo endpoints → UCs (LLD §8 · 11 endpoints):</p>
 * <pre>
 *   GET    /goals                              -> ListGoalsUseCase
 *   POST   /goals                              -> CreateGoalUseCase
 *   GET    /goals/{id}                         -> GetGoalDetailUseCase
 *   PUT    /goals/{id}                         -> UpdateGoalUseCase
 *   DELETE /goals/{id}                         -> CloseGoalUseCase (SCA si reserved>30€)
 *   POST   /goals/{id}/contributions           -> ContributeManualUseCase
 *   GET    /goals/{id}/contributions           -> (lectura del repo via GetGoalDetailUseCase)
 *   PUT    /goals/{id}/auto-rule               -> ConfigureAutoRuleUseCase
 *   DELETE /goals/{id}/auto-rule               -> PauseAutoRuleUseCase
 *   GET    /goals/{id}/milestones              -> (lectura via GetGoalDetailUseCase)
 *   GET    /dashboard-widget                   -> GetDashboardWidgetUseCase
 * </pre>
 *
 * @author SOFIA Developer Agent · FEAT-024 Sprint 26 · Fase E
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/api/v1/savings")
@RequiredArgsConstructor
public class SavingsController {

    private final CreateGoalUseCase           createGoal;
    private final ListGoalsUseCase            listGoals;
    private final GetGoalDetailUseCase        getGoalDetail;
    private final UpdateGoalUseCase           updateGoal;
    private final CloseGoalUseCase            closeGoal;
    private final ContributeManualUseCase     contributeManual;
    private final ConfigureAutoRuleUseCase    configureAutoRule;
    private final PauseAutoRuleUseCase        pauseAutoRule;
    private final GetDashboardWidgetUseCase   getDashboardWidget;

    // ── Helper ───────────────────────────────────────────────────────────────

    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }

    // ── US-024-02 · GET /goals ───────────────────────────────────────────────

    @GetMapping("/goals")
    public ResponseEntity<List<SavingsGoalDto>> listGoals(
            @RequestParam(required = false) GoalStatus status,
            HttpServletRequest req) {
        return ResponseEntity.ok(listGoals.execute(userId(req), status));
    }

    // ── US-024-01 · POST /goals ──────────────────────────────────────────────

    @PostMapping("/goals")
    public ResponseEntity<SavingsGoalDto> createGoal(
            @Valid @RequestBody CreateGoalRequest body,
            HttpServletRequest req) {
        SavingsGoalDto dto = createGoal.execute(userId(req), body);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── US-024-03 · GET /goals/{id} ──────────────────────────────────────────

    @GetMapping("/goals/{id}")
    public ResponseEntity<GoalDetailDto> getGoal(
            @PathVariable UUID id,
            HttpServletRequest req) {
        return ResponseEntity.ok(getGoalDetail.execute(userId(req), id));
    }

    // ── US-024-06 · PUT /goals/{id} ──────────────────────────────────────────

    @PutMapping("/goals/{id}")
    public ResponseEntity<SavingsGoalDto> updateGoal(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGoalRequest body,
            HttpServletRequest req) {
        return ResponseEntity.ok(updateGoal.execute(userId(req), id, body));
    }

    // ── US-024-06 · DELETE /goals/{id} (SCA si reserved>30€) ─────────────────

    @DeleteMapping("/goals/{id}")
    public ResponseEntity<CloseResultDto> closeGoal(
            @PathVariable UUID id,
            @RequestHeader(value = "X-OTP", required = false) String otp,
            HttpServletRequest req) {
        return ResponseEntity.ok(closeGoal.execute(userId(req), id, otp));
    }

    // ── US-024-04 · POST /goals/{id}/contributions ───────────────────────────

    @PostMapping("/goals/{id}/contributions")
    public ResponseEntity<AllocationDto> contributeManual(
            @PathVariable UUID id,
            @Valid @RequestBody ContributeRequest body,
            HttpServletRequest req) {
        AllocationDto dto = contributeManual.execute(userId(req), id, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // ── GET /goals/{id}/contributions (lectura paginada via detalle) ─────────

    @GetMapping("/goals/{id}/contributions")
    public ResponseEntity<List<AllocationDto>> listContributions(
            @PathVariable UUID id,
            HttpServletRequest req) {
        // Reutilizamos GetGoalDetailUseCase (devuelve top-20 mas recientes en el detalle).
        // Si en el futuro necesitamos paginacion explicita, anadiremos un UC dedicado.
        return ResponseEntity.ok(getGoalDetail.execute(userId(req), id).recentAllocations());
    }

    // ── US-024-05 · PUT /goals/{id}/auto-rule ────────────────────────────────

    @PutMapping("/goals/{id}/auto-rule")
    public ResponseEntity<AutoRuleDto> configureAutoRule(
            @PathVariable UUID id,
            @Valid @RequestBody AutoRuleRequest body,
            HttpServletRequest req) {
        return ResponseEntity.ok(configureAutoRule.execute(userId(req), id, body));
    }

    // ── DELETE /goals/{id}/auto-rule (pausar) ────────────────────────────────

    @DeleteMapping("/goals/{id}/auto-rule")
    public ResponseEntity<Void> pauseAutoRule(
            @PathVariable UUID id,
            HttpServletRequest req) {
        pauseAutoRule.execute(userId(req), id);
        return ResponseEntity.noContent().build();
    }

    // ── GET /goals/{id}/milestones ───────────────────────────────────────────

    @GetMapping("/goals/{id}/milestones")
    public ResponseEntity<List<MilestoneDto>> listMilestones(
            @PathVariable UUID id,
            HttpServletRequest req) {
        return ResponseEntity.ok(getGoalDetail.execute(userId(req), id).milestones());
    }

    // ── US-024-08 · GET /dashboard-widget ────────────────────────────────────

    @GetMapping("/dashboard-widget")
    public ResponseEntity<WidgetDto> getDashboardWidget(HttpServletRequest req) {
        try {
            return ResponseEntity.ok(getDashboardWidget.execute(userId(req)));
        } catch (Exception e) {
            // Degradacion elegante: dashboard no debe romperse si savings falla.
            // Patron heredado de PfmController (RN-F023-15 / LA-CORE-046).
            log.warn("savings.widget.degraded reason={}", e.getMessage());
            return ResponseEntity.ok(new WidgetDto(
                    0,
                    java.math.BigDecimal.ZERO,
                    java.math.BigDecimal.ZERO,
                    java.math.BigDecimal.ZERO,
                    List.of()
            ));
        }
    }
}
