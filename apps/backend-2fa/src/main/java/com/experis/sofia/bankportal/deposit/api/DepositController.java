package com.experis.sofia.bankportal.deposit.api;

import com.experis.sofia.bankportal.deposit.application.dto.*;
import com.experis.sofia.bankportal.deposit.application.usecase.*;
import com.experis.sofia.bankportal.deposit.domain.model.RenewalInstruction;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

/**
 * DepositController — FEAT-021 Sprint 23.
 * LA-TEST-001: NUNCA anotacion-AuthPrincipal — siempre req.getAttribute("authenticatedUserId").
 * DEBT-022: userId extraido del atributo que escribe JwtAuthenticationFilter.
 */
@RestController
@RequestMapping("/api/v1/deposits")
@RequiredArgsConstructor
public class DepositController {

    private final ListDepositsUseCase listDeposits;
    private final GetDepositDetailUseCase getDepositDetail;
    private final SimulateDepositUseCase simulate;
    private final OpenDepositUseCase openDeposit;
    private final SetRenewalInstructionUseCase setRenewal;
    private final CancelDepositUseCase cancelDeposit;

    /** POST /api/v1/deposits/simulate — sin autenticacion (RN-F021-03) */
    @PostMapping("/simulate")
    public ResponseEntity<SimulationResponse> simulate(@RequestBody @Valid SimulateDepositRequest req) {
        return ResponseEntity.ok(simulate.execute(req));
    }

    /** GET /api/v1/deposits */
    @GetMapping
    public ResponseEntity<Page<DepositSummaryDTO>> list(
            HttpServletRequest req,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
            listDeposits.execute(resolveUserId(req), PageRequest.of(page, size, Sort.by("createdAt").descending()))
        );
    }

    /** GET /api/v1/deposits/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<DepositDetailDTO> detail(@PathVariable UUID id, HttpServletRequest req) {
        return ResponseEntity.ok(getDepositDetail.execute(id, resolveUserId(req)));
    }

    /** POST /api/v1/deposits — apertura con SCA/OTP (RN-F021-08) */
    @PostMapping
    public ResponseEntity<DepositResponse> open(@RequestBody @Valid OpenDepositRequest body, HttpServletRequest req) {
        DepositResponse resp = openDeposit.execute(body, resolveUserId(req));
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(resp.id()).toUri();
        return ResponseEntity.created(location).body(resp);
    }

    /** PATCH /api/v1/deposits/{id}/renewal */
    @PatchMapping("/{id}/renewal")
    public ResponseEntity<DepositResponse> setRenewal(
            @PathVariable UUID id,
            @RequestBody @Valid RenewalRequest body,
            HttpServletRequest req) {
        return ResponseEntity.ok(setRenewal.execute(id, resolveUserId(req), body.instruction()));
    }

    /** POST /api/v1/deposits/{id}/cancel */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<CancellationResult> cancel(
            @PathVariable UUID id,
            @RequestParam String otp,
            HttpServletRequest req) {
        return ResponseEntity.ok(cancelDeposit.execute(id, resolveUserId(req), otp));
    }

    /** LA-TEST-001: atributo correcto — "authenticatedUserId" (no "userId") */
    private UUID resolveUserId(HttpServletRequest req) {
        return (UUID) req.getAttribute("authenticatedUserId");
    }
}
