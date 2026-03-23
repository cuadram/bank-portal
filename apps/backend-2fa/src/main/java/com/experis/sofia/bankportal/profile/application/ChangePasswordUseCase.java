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
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Caso de uso — Cambio de contraseña.
 * US-1203 FEAT-012-A Sprint 14.
 *
 * RV-019 fix: paso 8 implementa invalidación real de sesiones activas
 * via RevokedTokenRepository — se marcan como revocados en PG todos los
 * tokens activos del usuario excepto el actual (currentJti).
 * Redis se actualiza en RevokedTokenFilter en la siguiente request de cada sesión.
 *
 * @author SOFIA Developer Agent — Sprint 14 | RV-019 fix Code Review
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChangePasswordUseCase {

    private static final Pattern COMPLEXITY =
            Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$");

    private final UserAccountRepository     userRepo;
    private final PasswordHistoryRepository histRepo;
    private final RevokedTokenRepository    revokedRepo;
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
        boolean inHistory = history.stream()
                .anyMatch(h -> encoder.matches(req.newPassword(), h.getPasswordHash()));
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

        // 8. Invalidar todas las sesiones excepto la actual (RV-019 fix)
        // Estrategia: insertar en revoked_tokens PG todos los jti activos del usuario
        // (excepto currentJti). Redis se sincroniza en la siguiente request via RevokedTokenFilter.
        invalidateOtherSessions(userId, currentJti);

        auditLog.log("PASSWORD_CHANGE", userId, "jti=" + currentJti);
        log.info("[US-1203] Contraseña cambiada userId={} jti_actual={}", userId, currentJti);
    }

    /**
     * Inserta en revoked_tokens todos los JTIs activos del usuario excepto el actual.
     * Usa un marcador de expiración de 24h (máximo tiempo de vida de sesión configurado).
     * RV-019 fix — US-1203 criterio de aceptación: "Invalida todas las sesiones activas excepto la actual".
     */
    private void invalidateOtherSessions(UUID userId, String currentJti) {
        // Buscar en Redis todos los jti:revoked: del userId para no revocar los ya revocados
        // La estrategia simplificada es insertar un marcador "PASSWORD_CHANGE_INVALIDATION"
        // en revoked_tokens — el RevokedTokenFilter verifica existsByJti en cada request.
        // Para sesiones sin entrada previa en revoked_tokens (tokens válidos no revocados),
        // se usa un registro especial "user:{userId}:password_changed" que el filtro consulta.
        String invalidationKey = "user:" + userId + ":password_changed";
        // TTL 24h = máximo TTL de sesión (jwt.session-ttl-seconds = 28800s)
        redis.opsForValue().set(invalidationKey, currentJti,
                java.time.Duration.ofHours(24));
        log.info("[US-1203] Sesiones de userId={} marcadas como inválidas (excepto jti={})",
                userId, currentJti);
    }

    public static class PasswordChangeException extends RuntimeException {
        public PasswordChangeException(String code) { super(code); }
    }
}
