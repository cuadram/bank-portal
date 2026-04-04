package com.experis.sofia.bankportal.directdebit.controller;

import com.experis.sofia.bankportal.directdebit.dto.request.*;
import com.experis.sofia.bankportal.directdebit.dto.response.*;
import com.experis.sofia.bankportal.directdebit.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.UUID;

/**
 * FEAT-017 Sprint 19 — SEPA DD Core REST Controller.
 * Endpoints: /api/v1/direct-debits/*
 * Security: JWT Bearer token required on all endpoints.
 * OTP required on POST (create) and DELETE (cancel).
 */
@RestController
@RequestMapping("/api/v1/direct-debits")
@RequiredArgsConstructor
public class DirectDebitController {

    private final DirectDebitQueryService queryService;
    private final MandateCreateService createService;
    private final MandateCancelService cancelService;

    /**
     * US-1702: List mandates for authenticated user.
     * GET /api/v1/direct-debits/mandates
     */
    @GetMapping("/mandates")
    public ResponseEntity<Page<MandateResponse>> getMandates(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(queryService.getMandates(userId, page, size));
    }

    /**
     * US-1702: Get mandate detail.
     * GET /api/v1/direct-debits/mandates/{id}
     */
    @GetMapping("/mandates/{id}")
    public ResponseEntity<MandateResponse> getMandate(
            @PathVariable UUID id,
            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(queryService.getMandate(id, userId));
    }

    /**
     * US-1703: Create new SEPA DD mandate.
     * POST /api/v1/direct-debits/mandates
     * Requires OTP 2FA.
     */
    @PostMapping("/mandates")
    public ResponseEntity<MandateResponse> createMandate(
            @Valid @RequestBody CreateMandateRequest req,
            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        MandateResponse response = createService.createMandate(req, userId);
        URI location = URI.create("/api/v1/direct-debits/mandates/" + response.getId());
        return ResponseEntity.created(location).body(response);
    }

    /**
     * US-1704: Cancel SEPA DD mandate with PSD2 D-2 validation.
     * DELETE /api/v1/direct-debits/mandates/{id}
     * Requires OTP 2FA.
     */
    @DeleteMapping("/mandates/{id}")
    public ResponseEntity<Void> cancelMandate(
            @PathVariable UUID id,
            @Valid @RequestBody CancelMandateRequest req,
            HttpServletRequest request) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        cancelService.cancelMandate(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * US-1702: List debit records with filters.
     * GET /api/v1/direct-debits/debits
     */
    @GetMapping("/debits")
    public ResponseEntity<Page<DirectDebitResponse>> getDebits(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        return ResponseEntity.ok(queryService.getDebits(userId, page, size));
    }
}
