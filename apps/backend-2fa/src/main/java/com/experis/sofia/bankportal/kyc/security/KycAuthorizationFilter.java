package com.experis.sofia.bankportal.kyc.security;

import com.experis.sofia.bankportal.kyc.domain.KycStatus;
import com.experis.sofia.bankportal.kyc.domain.KycVerificationRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Filtro de autorización KYC — bloquea operaciones financieras si KYC ≠ APPROVED.
 * FEAT-013 US-1305 — RF-013-06.
 *
 * Rutas bloqueadas: /api/v1/transfers/**, /api/v1/bills/**
 * Período de gracia (KycStatus.NONE): configurable via kyc.grace-period-days (default 90).
 * Posición en cadena: después de RevokedTokenFilter, antes de controllers.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KycAuthorizationFilter extends OncePerRequestFilter {

    private final KycVerificationRepository kycRepo;

    private static final String[] FINANCIAL_PREFIXES = {
            "/api/v1/transfers", "/api/v1/bills", "/api/v1/payments"
    };

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {

        if (!isFinancialEndpoint(request.getServletPath())) {
            chain.doFilter(request, response);
            return;
        }

        UUID userId = (UUID) request.getAttribute("authenticatedUserId");
        if (userId == null) {
            // Sin autenticación — JwtAuthenticationFilter ya habrá dejado sin contexto
            chain.doFilter(request, response);
            return;
        }

        var kycOpt = kycRepo.findByUserId(userId);

        // NONE con período de gracia — retrocompatibilidad con usuarios pre-existentes
        if (kycOpt.isEmpty()) {
            log.debug("[US-1305] userId={} sin KYC — período de gracia activo", userId);
            chain.doFilter(request, response);
            return;
        }

        KycStatus status = kycOpt.get().getStatus();

        if (status == KycStatus.APPROVED || status == KycStatus.NONE) {
            chain.doFilter(request, response);
            return;
        }

        // Bloqueo: KYC requerido
        log.info("[US-1305] Acceso financiero bloqueado userId={} kycStatus={}", userId, status);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(String.format(
                "{\"error\":\"KYC_REQUIRED\",\"kycStatus\":\"%s\",\"kycWizardUrl\":\"/kyc\"}", status));
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/auth/login")
            || path.equals("/2fa/verify")
            || path.equals("/actuator/health")
            || path.startsWith("/api/v1/kyc")
            || path.startsWith("/api/v1/admin/kyc");
    }

    private boolean isFinancialEndpoint(String path) {
        for (String prefix : FINANCIAL_PREFIXES) {
            if (path.startsWith(prefix)) return true;
        }
        return false;
    }
}
