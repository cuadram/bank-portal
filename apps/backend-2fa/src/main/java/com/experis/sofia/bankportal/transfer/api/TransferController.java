package com.experis.sofia.bankportal.transfer.api;

import com.experis.sofia.bankportal.transfer.application.TransferToBeneficiaryUseCase;
import com.experis.sofia.bankportal.transfer.application.TransferUseCase;
import com.experis.sofia.bankportal.transfer.application.dto.BeneficiaryTransferCommand;
import com.experis.sofia.bankportal.transfer.application.dto.OwnTransferCommand;
import com.experis.sofia.bankportal.transfer.application.dto.TransferResponseDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * US-801 / US-802 — Endpoints de transferencia bancaria.
 *
 * @author SOFIA Developer Agent — FEAT-008 Sprint 10
 */
@RestController
@RequestMapping("/api/v1/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferUseCase              transferUseCase;
    private final TransferToBeneficiaryUseCase beneficiaryTransferUseCase;

    /** US-801 — Transferencia entre cuentas propias. */
    @PostMapping("/own")
    public ResponseEntity<TransferResponseDto> ownTransfer(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody OwnTransferRequest req) {
        var cmd = new OwnTransferCommand(userId, req.sourceAccountId(),
                req.targetAccountId(), req.amount(), req.concept(), req.otpCode());
        return ResponseEntity.ok(transferUseCase.execute(cmd));
    }

    /** US-802 — Transferencia a beneficiario guardado. */
    @PostMapping("/beneficiary")
    public ResponseEntity<TransferResponseDto> beneficiaryTransfer(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody BeneficiaryTransferRequest req) {
        var cmd = new BeneficiaryTransferCommand(userId, req.beneficiaryId(),
                req.sourceAccountId(), req.amount(), req.concept(),
                req.otpCode(), req.firstTransferConfirmed());
        return ResponseEntity.ok(beneficiaryTransferUseCase.execute(cmd));
    }

    // ── Request DTOs ──────────────────────────────────────────────────────────

    public record OwnTransferRequest(
            @NotNull UUID sourceAccountId,
            @NotNull UUID targetAccountId,
            @NotNull @DecimalMin("0.01") @DecimalMax("2000.00")
            @Digits(integer = 13, fraction = 2) BigDecimal amount,
            @Size(max = 256) String concept,
            @NotBlank @Pattern(regexp = "\\d{6}") String otpCode
    ) {}

    public record BeneficiaryTransferRequest(
            @NotNull UUID beneficiaryId,
            @NotNull UUID sourceAccountId,
            @NotNull @DecimalMin("0.01") @DecimalMax("2000.00")
            @Digits(integer = 13, fraction = 2) BigDecimal amount,
            @Size(max = 256) String concept,
            @NotBlank @Pattern(regexp = "\\d{6}") String otpCode,
            boolean firstTransferConfirmed
    ) {}
}
