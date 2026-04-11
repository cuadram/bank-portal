package com.experis.sofia.bankportal.privacy.api;

import com.experis.sofia.bankportal.privacy.application.GdprRequestService;
import com.experis.sofia.bankportal.privacy.application.dto.GdprRequestResponse;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestStatus;
import com.experis.sofia.bankportal.privacy.domain.GdprRequestType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * REST API — Panel de administración GDPR.
 * FEAT-019 Sprint 21 — RF-019-07.
 * RN-F019-33: solo usuarios con rol ADMIN o GDPR_ADMIN pueden acceder.
 * RN-F019-34: SLA 30 días (GDPR Art.12§3).
 * FIX RV-F019-01: @PreAuthorize añadido — rol ADMIN requerido (no KYC_REVIEWER).
 * FIX RV-F019-S02: audit log de accesos (GDPR Art.5(2) accountability).
 *
 * @author SOFIA Developer Agent — FEAT-019 Sprint 21
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/gdpr-requests")
@RequiredArgsConstructor
public class AdminGdprController {

    private final GdprRequestService gdprRequestService;

    /**
     * GET /api/v1/admin/gdpr-requests — listado paginado con filtros opcionales.
     * RN-F019-33: requiere rol ADMIN — @PreAuthorize garantiza mínimo privilegio.
     * La regla global hasRole("KYC_REVIEWER") en SecurityConfig cubre /admin/**,
     * pero GDPR data requiere un rol más restrictivo: ADMIN o GDPR_ADMIN.
     * @EnableMethodSecurity activo en SecurityConfig — @PreAuthorize es efectivo.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('GDPR_ADMIN')")
    public ResponseEntity<Page<GdprRequestResponse>> getGdprRequests(
            @RequestParam(required = false) GdprRequestType tipo,
            @RequestParam(required = false) GdprRequestStatus estado,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaDesde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaHasta,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        // RV-F019-S02: GDPR Art.5(2) accountability — registrar acceso admin al panel
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("[GDPR-AUDIT] Admin panel accedido: user={} tipo={} estado={} page={}",
                auth != null ? auth.getName() : "unknown", tipo, estado, page);

        var pageable = PageRequest.of(page, Math.min(size, 100),
                                      Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(
            gdprRequestService.getRequests(tipo, estado, fechaDesde, fechaHasta, pageable));
    }
}
