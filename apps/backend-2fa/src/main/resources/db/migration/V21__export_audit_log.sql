-- V21__export_audit_log.sql
-- FEAT-018: Audit log de exportaciones de movimientos
-- Retención 7 años: GDPR Art.17§3b + PCI-DSS Req.10
-- Sprint 20 · 2026-03-30

CREATE TABLE export_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    timestamp_utc   TIMESTAMPTZ NOT NULL DEFAULT now(),
    iban            VARCHAR(34) NOT NULL,
    fecha_desde     DATE NOT NULL,
    fecha_hasta     DATE NOT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL DEFAULT 'TODOS',
    formato         VARCHAR(10) NOT NULL,
    num_registros   INT NOT NULL,
    ip_origen       VARCHAR(45),
    user_agent      VARCHAR(500),
    hash_sha256     VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_formato CHECK (formato IN ('PDF','CSV')),
    CONSTRAINT chk_num_registros CHECK (num_registros >= 0),
    CONSTRAINT chk_fecha_rango CHECK (fecha_hasta >= fecha_desde)
);

CREATE INDEX idx_export_audit_user_date
    ON export_audit_log(user_id, timestamp_utc DESC);

CREATE INDEX idx_export_audit_created
    ON export_audit_log(created_at DESC);

COMMENT ON TABLE export_audit_log IS
    'Audit log exportaciones movimientos. Retención 7 años (GDPR Art.17§3b, PCI-DSS Req.10.7)';
COMMENT ON COLUMN export_audit_log.hash_sha256 IS
    'SHA-256 del PDF generado — solo para formato PDF';
COMMENT ON COLUMN export_audit_log.ip_origen IS
    'IP del cliente — almacenada como VARCHAR por compatibilidad IPv4/IPv6';
