-- V4: Tabla audit_log — INMUTABLE (INSERT-only, sin UPDATE ni DELETE)
-- FEAT-001 | US-005 | BankPortal | Banco Meridian | Sprint 01
-- PCI-DSS req. 10.7: retención mínima 12 meses (gestión externa: pg_partman o archiving)

CREATE TABLE audit_log (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NULL,                   -- NULL en intentos previos a auth
    event_type      VARCHAR(64)  NOT NULL,               -- TwoFactorEventType enum
    ip_address      VARCHAR(45)  NOT NULL,               -- IPv4 o IPv6
    user_agent      VARCHAR(512) NOT NULL,
    event_timestamp TIMESTAMP    NOT NULL DEFAULT NOW(), -- Siempre UTC
    result          VARCHAR(16)  NOT NULL
                    CHECK (result IN ('SUCCESS', 'FAILURE', 'BLOCKED'))
);
-- Sin FK CASCADE: user_id es referencia informativa.
-- Si el usuario se elimina, el log histórico permanece (inmutabilidad).

CREATE INDEX idx_audit_log_user_id  ON audit_log(user_id);
CREATE INDEX idx_audit_log_event_ts ON audit_log(event_timestamp DESC);
CREATE INDEX idx_audit_log_type     ON audit_log(event_type);
