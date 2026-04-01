package com.experis.sofia.bankportal.profile.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.profile.application.dto.*;
import com.experis.sofia.bankportal.profile.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ResponseStatus;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * SAST-001 fix (Sprint 15): IP ofuscada en audit_log (RGPD Art.25 — privacy by design).
 * Los últimos 2 octetos se reemplazan por "***" antes de persistir en audit_log.
 */
@Service
@RequiredArgsConstructor
public class UpdateProfileUseCase {

    private static final Pattern PHONE_E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final Pattern POSTAL_ES  = Pattern.compile("^\\d{5}$");

    private final UserProfileRepository profileRepo;
    private final GetProfileUseCase     getProfileUseCase;
    private final AuditLogService       auditLog;

    @Transactional
    public ProfileResponse execute(UUID userId, UpdateProfileRequest req, String ip) {
        // RN-F019-01: el email no es modificable mediante PATCH /profile
        if (req.email() != null)
            throw new ProfileValidationException("email", "EMAIL_CANNOT_BE_MODIFIED");
        if (req.phone() != null && !PHONE_E164.matcher(req.phone()).matches())
            throw new ProfileValidationException("phone", "INVALID_FORMAT");
        if (req.address() != null && req.address().postalCode() != null
                && "ES".equalsIgnoreCase(req.address().country())
                && !POSTAL_ES.matcher(req.address().postalCode()).matches())
            throw new ProfileValidationException("postalCode", "INVALID_FORMAT");

        UserProfile profile = profileRepo.findByUserId(userId).orElseGet(() -> {
            UserProfile p = new UserProfile(); p.setUserId(userId); return p;
        });

        if (req.phone()   != null) profile.setPhone(req.phone());
        if (req.address() != null) {
            AddressDto a = req.address();
            if (a.street()     != null) profile.setStreet(a.street());
            if (a.city()       != null) profile.setCity(a.city());
            if (a.postalCode() != null) profile.setPostalCode(a.postalCode());
            if (a.country()    != null) profile.setCountry(a.country());
        }
        profileRepo.save(profile);

        // SAST-001: IP ofuscada — últimos 2 octetos reemplazados por ***
        auditLog.log("PROFILE_UPDATE", userId, "ip=" + maskIp(ip));
        return getProfileUseCase.execute(userId);
    }

    /**
     * Ofusca los últimos dos octetos de una IPv4 o los últimos 4 grupos de una IPv6.
     * SAST-001 fix — RGPD Art.25 privacy by design.
     */
    static String maskIp(String ip) {
        if (ip == null) return "unknown";
        String[] parts = ip.split("\\.");
        if (parts.length == 4)
            return parts[0] + "." + parts[1] + ".***.***";
        return ip.replaceAll("[^:]+$", "***"); // IPv6 simplificado
    }

    /** LA-TEST-003: @ResponseStatus obligatorio en excepciones de dominio. */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public static class ProfileValidationException extends RuntimeException {
        private final String field;
        private final String error;
        public ProfileValidationException(String field, String error) {
            super("Validation failed: " + field + " — " + error);
            this.field = field; this.error = error;
        }
        public String getField() { return field; }
        public String getError() { return error; }
    }
}
