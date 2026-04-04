package com.experis.sofia.bankportal.loan.api;

import com.experis.sofia.bankportal.loan.application.dto.*;
import com.experis.sofia.bankportal.loan.application.usecase.*;
import com.experis.sofia.bankportal.loan.domain.model.AmortizationRow;
import com.experis.sofia.bankportal.twofa.application.OtpValidationUseCase;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller — FEAT-020 Gestión de Préstamos Personales.
 * RN-F020-09: OTP validado aquí antes de delegar en ApplyLoanUseCase.
 *             OtpValidationUseCase.validate() lanza InvalidOtpException → HTTP 401 via handler.
 * NUNCA AuthenticationPrincipal — siempre @RequestAttribute (DEBT-022 / LA-TEST-001).
 *
 * @author SOFIA Developer Agent — Sprint 22
 */
@RestController
@RequestMapping("/api/v1/loans")
@PreAuthorize("isAuthenticated()")
public class LoanController {

    private final ListLoansUseCase               listLoans;
    private final GetLoanDetailUseCase           getLoanDetail;
    private final GetAmortizationUseCase         getAmortization;
    private final SimulateLoanUseCase            simulateLoan;
    private final ApplyLoanUseCase               applyLoan;
    private final CancelLoanApplicationUseCase   cancelApplication;
    private final OtpValidationUseCase           otpValidation;

    public LoanController(ListLoansUseCase listLoans,
                          GetLoanDetailUseCase getLoanDetail,
                          GetAmortizationUseCase getAmortization,
                          SimulateLoanUseCase simulateLoan,
                          ApplyLoanUseCase applyLoan,
                          CancelLoanApplicationUseCase cancelApplication,
                          OtpValidationUseCase otpValidation) {
        this.listLoans         = listLoans;
        this.getLoanDetail     = getLoanDetail;
        this.getAmortization   = getAmortization;
        this.simulateLoan      = simulateLoan;
        this.applyLoan         = applyLoan;
        this.cancelApplication = cancelApplication;
        this.otpValidation     = otpValidation;
    }

    /** RN-F020-01 — préstamos paginados del usuario autenticado */
    @GetMapping
    public ResponseEntity<Page<LoanSummaryDTO>> listLoans(
            @PageableDefault(size = 10) Pageable pageable,
            HttpServletRequest req) {
        return ResponseEntity.ok(listLoans.execute(userId(req), pageable));
    }

    /** RN-F020-02 — detalle con cuadro de amortización inline */
    @GetMapping("/{id}")
    public ResponseEntity<LoanDetailDTO> getLoan(@PathVariable UUID id,
                                                  HttpServletRequest req) {
        return ResponseEntity.ok(getLoanDetail.execute(id, userId(req)));
    }

    /** RN-F020-17 — cuadro calculado dinámicamente, no persistido */
    @GetMapping("/{id}/amortization")
    public ResponseEntity<List<AmortizationRow>> getAmortization(@PathVariable UUID id,
                                                                   HttpServletRequest req) {
        return ResponseEntity.ok(getAmortization.execute(id, userId(req)));
    }

    /** RN-F020-04 — simulación stateless, sin autenticación fuerte */
    @PostMapping("/simulate")
    public ResponseEntity<SimulationResponse> simulate(@Valid @RequestBody SimulateRequest req) {
        return ResponseEntity.ok(simulateLoan.execute(req));
    }

    /**
     * RN-F020-09 — solicitud con OTP obligatorio.
     * validate() lanza InvalidOtpException si el código es incorrecto → HTTP 401.
     * Si score ≤ 600 → REJECTED. Si duplicado PENDING → HTTP 409.
     */
    @PostMapping("/applications")
    public ResponseEntity<LoanApplicationResponse> apply(
            @Valid @RequestBody ApplyLoanRequest body,
            HttpServletRequest req) {
        UUID userId = userId(req);
        otpValidation.validate(userId, body.otpCode());   // lanza excepción si inválido
        LoanApplicationResponse response = applyLoan.execute(userId, body);
        return ResponseEntity.created(
                URI.create("/api/v1/loans/applications/" + response.id()))
                .body(response);
    }

    /** RN-F020-15,16 — cancelar solicitud PENDING propia */
    @DeleteMapping("/applications/{id}")
    public ResponseEntity<Void> cancelApplication(@PathVariable UUID id,
                                                   HttpServletRequest req) {
        cancelApplication.execute(id, userId(req));
        return ResponseEntity.noContent().build();
    }

    /** LA-TEST-001: atributo correcto — 'authenticatedUserId' (no 'userId') */
    private UUID userId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }
}
