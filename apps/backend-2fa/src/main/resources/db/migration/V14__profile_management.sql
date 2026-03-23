-- V14: Gestión de perfil de usuario — FEAT-012-A Sprint 14
-- ADR-021: password_history tabla independiente (SRP, extensible)
-- ADR-022: revoked_tokens híbrido Redis + PG (O(1) hot path + audit trail PCI-DSS)

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    street VARCHAR(256), city VARCHAR(128),
    postal_code VARCHAR(10), country CHAR(2),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_profile UNIQUE (user_id)
);
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);

CREATE TABLE user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_code VARCHAR(64) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_notif_pref UNIQUE (user_id, preference_code)
);
CREATE INDEX idx_user_notif_pref_user ON user_notification_preferences(user_id);

CREATE TABLE password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_history_user_date ON password_history(user_id, created_at DESC);

CREATE TABLE revoked_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti VARCHAR(36) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_revoked_jti UNIQUE (jti)
);
CREATE INDEX idx_revoked_tokens_jti ON revoked_tokens(jti);
CREATE INDEX idx_revoked_tokens_expires ON revoked_tokens(expires_at);

COMMENT ON TABLE user_profiles IS 'Datos personales ampliados — FEAT-012-A US-1201/1202';
COMMENT ON TABLE user_notification_preferences IS 'Preferencias de notificación — FEAT-012-A US-1204';
COMMENT ON TABLE password_history IS 'Historial contraseñas (últimas 3) — FEAT-012-A US-1203 ADR-021';
COMMENT ON TABLE revoked_tokens IS 'JTIs revocados — FEAT-012-A US-1205 ADR-022';
