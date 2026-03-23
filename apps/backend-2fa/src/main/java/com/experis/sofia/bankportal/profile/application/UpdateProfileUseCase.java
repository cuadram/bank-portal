package com.experis.sofia.bankportal.profile.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.profile.application.dto.*;
import com.experis.sofia.bankportal.profile.domain.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UpdateProfileUseCase {

    private static final Pattern PHONE_E164   = Pattern.compile("^\\+[1-9]\\d{7,14}$");
    private static final Pattern POSTAL_ES    = Pattern.compile("^\\d{5}$");
    private static final String  EMAIL_FIELD  = "email";

    private final UserProfileRepository profileRepo;
    private final GetProfileUseCase     getProfileUseCase;
    private final AuditLogService       auditLog;

    @Transactional
    public ProfileResponse execute(UUID userId, UpdateProfileRequest req, String ip) {
        // Validaciones
        if (req.phone() != null && !PHONE_E164.matcher(req.phone()).matches())
            throw new ProfileValidationException("phone", "INVALID_FORMAT");
        if (req.address() != null && req.address().postalCode() != null
                && "ES".equalsIgnoreCase(req.address().country())
                && !POSTAL_ES.matcher(req.address().postalCode()).matches())
            throw new ProfileValidationException("postalCode", "INVALID_FORMAT");

        // Upsert profile
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
        auditLog.log("PROFILE_UPDATE", userId, "ip=" + ip);
        return getProfileUseCase.execute(userId);
    }

    public static class ProfileValidationException extends RuntimeException {
        private final String field;
        private final String error;
        public ProfileValidationException(String field, String error) {
            super("Validation failed: " + field + " — " + error);
            this.field = field; this.error = error;
        }
        public String getField()  { return field; }
        public String getError()  { return error; }
    }
}
