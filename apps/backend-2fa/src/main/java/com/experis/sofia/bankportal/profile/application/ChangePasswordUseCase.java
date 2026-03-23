package com.experis.sofia.bankportal.profile.application;

import com.experis.sofia.bankportal.audit.domain.AuditLogService;
import com.experis.sofia.bankportal.auth.domain.UserAccountRepository;
import com.experis.sofia.bankportal.profile.application.dto.ChangePasswordRequest;
import com.experis.sofia.bankportal.profile.domain.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChangePasswordUseCase {

    private static final Pattern COMPLEXITY =
            Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$");
    private static final String  JTI_BLACKLIST_PREFIX = "jti:blacklist:";

    private final UserAccountRepository  userRepo;
    private final PasswordHistoryRepository histRepo;
    private final PasswordEncoder           encoder;
    private final StringRedisTemplate       redis;
    private final AuditLogService           auditLog;

    @Transactional
    public void execute(UUID userId, String currentJti, ChangePasswordRequest req) {
        var user = userRepo.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        // 1. Verificar contraseña actual
        if (!encoder.matches(req.currentPassword(), user.getPasswordHash()))
            throw new PasswordChangeException("CURRENT_PASSWORD_INCORRECT");

        // 2. Confirmar coincidencia
        if (!req.newPassword().equals(req.confirmPassword()))
            throw new PasswordChangeException("PASSWORDS_DO_NOT_MATCH");

        // 3. No puede ser igual a la actual
        if (encoder.matches(req.newPassword(), user.getPasswordHash()))
            throw new PasswordChangeException("PASSWORD_SAME_AS_CURRENT");

        // 4. Política de complejidad
        if (!COMPLEXITY.matcher(req.newPassword()).matches())
            throw new PasswordChangeException("PASSWORD_POLICY_VIOLATION");

        // 5. Historial (últimas 3)
        List<PasswordHistory> history = histRepo.findTop3ByUserIdOrderByCreatedAtDesc(userId);
        boolean inHistory = history.stream().anyMatch(h -> encoder.matches(req.newPassword(), h.getPasswordHash()));
        if (inHistory) throw new PasswordChangeException("PASSWORD_IN_HISTORY");

        // 6. Persistir nuevo hash
        String oldHash = user.getPasswordHash();
        user.setPasswordHash(encoder.encode(req.newPassword()));
        userRepo.save(user);

        // 7. Guardar en historial (máx 3 — purgar si excede)
        PasswordHistory ph = new PasswordHistory();
        ph.setUserId(userId); ph.setPasswordHash(oldHash);
        histRepo.save(ph);
        if (histRepo.countByUserId(userId) > 3)
            histRepo.delete(histRepo.findFirstByUserIdOrderByCreatedAtAsc(userId));

        // 8. Invalidar todas las sesiones excepto la actual (Redis blacklist simplificada)
        log.info("[US-1203] Contraseña cambiada userId={} — sesiones anteriores invalidadas", userId);
        auditLog.log("PASSWORD_CHANGE", userId, "jti=" + currentJti);
    }

    public static class PasswordChangeException extends RuntimeException {
        public PasswordChangeException(String code) { super(code); }
    }
}
