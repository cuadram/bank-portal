-- V31 — ShedLock tabla para ADR-028 (originalmente V18c en S18, renombrada en Sprint 26 Fase H.7)
-- Renombrada de V18c -> V31 para evitar out-of-order vs V19..V30 ya aplicadas en BD persistente.
-- Cierra R-015-01 Nivel 3 + DEBT-051 (cableado ShedLock).

CREATE TABLE IF NOT EXISTS shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMP    NOT NULL,
    locked_at   TIMESTAMP    NOT NULL,
    locked_by   VARCHAR(255) NOT NULL,
    CONSTRAINT pk_shedlock PRIMARY KEY (name)
);
