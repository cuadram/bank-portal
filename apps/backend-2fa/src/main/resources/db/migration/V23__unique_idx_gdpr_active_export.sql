-- V23 — DEBT-040 · Sprint 22 · CWE-362
-- Unique index parcial para prevenir race condition en DataExportService.requestExport()
-- Solo una solicitud PENDING o IN_PROGRESS por usuario y tipo puede existir simultáneamente.
-- Sustituye la verificación optimista por una garantía a nivel de base de datos.

CREATE UNIQUE INDEX IF NOT EXISTS idx_gdpr_unique_active_request
    ON gdpr_requests (user_id, tipo)
    WHERE estado IN ('PENDING', 'IN_PROGRESS');

COMMENT ON INDEX idx_gdpr_unique_active_request
    IS 'DEBT-040: Previene race condition CWE-362 en DataExportService — garantiza at-most-one solicitud activa por usuario/tipo';
