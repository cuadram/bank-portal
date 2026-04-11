package com.experis.sofia.bankportal.beneficiary.api;

import com.experis.sofia.bankportal.beneficiary.application.BeneficiaryManagementUseCase;
import com.experis.sofia.bankportal.beneficiary.application.dto.BeneficiaryDto;
import com.experis.sofia.bankportal.beneficiary.application.dto.CreateBeneficiaryCommand;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * US-803 — CRUD de beneficiarios.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@RestController
@RequestMapping("/api/v1/beneficiaries")
@RequiredArgsConstructor
public class BeneficiaryController {

    private final BeneficiaryManagementUseCase useCase;

    @GetMapping
    public ResponseEntity<List<BeneficiaryDto>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(useCase.listActive(userId));
    }

    @PostMapping
    public ResponseEntity<BeneficiaryDto> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateRequest req) {
        var cmd = new CreateBeneficiaryCommand(userId, req.alias(), req.iban(), req.holderName(), req.otpCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(cmd));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BeneficiaryDto> updateAlias(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAliasRequest req) {
        return ResponseEntity.ok(useCase.updateAlias(id, userId, req.alias()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id) {
        useCase.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public record CreateRequest(
            @NotBlank @Size(max = 64)  String alias,
            @NotBlank @Size(max = 34)  String iban,
            @NotBlank @Size(max = 128) String holderName,
            @NotBlank @Pattern(regexp = "\\d{6}") String otpCode
    ) {}

    public record UpdateAliasRequest(
            @NotBlank @Size(max = 64) String alias
    ) {}
}
