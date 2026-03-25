package com.experis.sofia.bankportal.cards.infrastructure.web;

import com.experis.sofia.bankportal.cards.application.*;
import com.experis.sofia.bankportal.cards.domain.*;
import com.experis.sofia.bankportal.cards.infrastructure.web.dto.CardDetailDto;
import com.experis.sofia.bankportal.cards.infrastructure.web.dto.CardSummaryDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CardController — RV-F016-01 fix: usa DTOs en lugar de entidad JPA directa.
 */
@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
public class CardController {

    private final GetCardsUseCase getCardsUseCase;
    private final GetCardDetailUseCase getCardDetailUseCase;
    private final BlockCardUseCase blockCardUseCase;
    private final UnblockCardUseCase unblockCardUseCase;
    private final UpdateCardLimitsUseCase updateCardLimitsUseCase;
    private final ChangePinUseCase changePinUseCase;

    /** GET /api/v1/cards */
    @GetMapping
    public ResponseEntity<List<CardSummaryDto>> listCards(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<CardSummaryDto> result = getCardsUseCase.execute(userId)
            .stream().map(CardSummaryDto::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/v1/cards/{cardId} */
    @GetMapping("/{cardId}")
    public ResponseEntity<CardDetailDto> getCard(@PathVariable UUID cardId,
                                                 @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(CardDetailDto.from(getCardDetailUseCase.execute(cardId, userId)));
    }

    /** POST /api/v1/cards/{cardId}/block */
    @PostMapping("/{cardId}/block")
    public ResponseEntity<CardStatusResponse> blockCard(@PathVariable UUID cardId,
                                                        @RequestBody @Valid OtpRequest req,
                                                        @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        blockCardUseCase.execute(cardId, userId, req.otpCode());
        return ResponseEntity.ok(new CardStatusResponse("BLOCKED"));
    }

    /** POST /api/v1/cards/{cardId}/unblock */
    @PostMapping("/{cardId}/unblock")
    public ResponseEntity<CardStatusResponse> unblockCard(@PathVariable UUID cardId,
                                                          @RequestBody @Valid OtpRequest req,
                                                          @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        unblockCardUseCase.execute(cardId, userId, req.otpCode());
        return ResponseEntity.ok(new CardStatusResponse("ACTIVE"));
    }

    /** PUT /api/v1/cards/{cardId}/limits */
    @PutMapping("/{cardId}/limits")
    public ResponseEntity<CardLimitsResponse> updateLimits(@PathVariable UUID cardId,
                                                           @RequestBody @Valid UpdateLimitsRequest req,
                                                           @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        updateCardLimitsUseCase.execute(cardId, userId, req.dailyLimit(), req.monthlyLimit(), req.otpCode());
        return ResponseEntity.ok(new CardLimitsResponse(req.dailyLimit(), req.monthlyLimit()));
    }

    /** POST /api/v1/cards/{cardId}/pin */
    @PostMapping("/{cardId}/pin")
    public ResponseEntity<Void> changePin(@PathVariable UUID cardId,
                                          @RequestBody @Valid ChangePinRequest req,
                                          @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        changePinUseCase.execute(cardId, userId, req.newPin(), req.otpCode());
        return ResponseEntity.ok().build();
    }

    // ── DTOs inline ─────────────────────────────────────────────────────────
    record OtpRequest(@NotBlank @Size(min=6,max=6) String otpCode) {}
    record UpdateLimitsRequest(
        @NotNull @DecimalMin("0.01") BigDecimal dailyLimit,
        @NotNull @DecimalMin("0.01") BigDecimal monthlyLimit,
        @NotBlank @Size(min=6,max=6) String otpCode) {}
    record ChangePinRequest(
        @NotBlank @Pattern(regexp="^\\d{4}$") String newPin,
        @NotBlank @Size(min=6,max=6) String otpCode) {}
    record CardStatusResponse(String status) {}
    record CardLimitsResponse(BigDecimal dailyLimit, BigDecimal monthlyLimit) {}
}
