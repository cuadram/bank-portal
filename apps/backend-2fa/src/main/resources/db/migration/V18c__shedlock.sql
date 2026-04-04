-- V18c — ShedLock tabla para ADR-028 (FEAT-016 Sprint 18)
-- MUST: ejecutar en S1 día 1 — cierra R-015-01 Nivel 3

CREATE TABLE IF NOT EXISTS shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMP    NOT NULL,
    locked_at   TIMESTAMP    NOT NULL,
    locked_by   VARCHAR(255) NOT NULL,
    CONSTRAINT pk_shedlock PRIMARY KEY (name)
);
