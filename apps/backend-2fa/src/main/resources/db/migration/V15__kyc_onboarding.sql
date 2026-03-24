-- V15: Onboarding KYC / Verificación de Identidad — FEAT-013 Sprint 15
-- ADR-023: documentos cifrados AES-256 en filesystem local (path almacenado, no binario en BD)

-- ── Tabla principal — estado KYC por usuario ─────────────────────────────────
CREATE TABLE kyc_verifications (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('NONE','PENDING','SUBMITTED','APPROVED','REJECTED','EXPIRED')),
    submitted_at     TIMESTAMP,
    reviewed_at      TIMESTAMP,
    reviewer_id      UUID,
    rejection_reason VARCHAR(500),
    created_at       TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT uq_kyc_user UNIQUE (user_id)
);

CREATE INDEX idx_kyc_verifications_user   ON kyc_verifications(user_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);

-- ── Tabla de documentos — uno por tipo+cara ───────────────────────────────────
CREATE TABLE kyc_documents (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_id            UUID        NOT NULL REFERENCES kyc_verifications(id) ON DELETE CASCADE,
    document_type     VARCHAR(20) NOT NULL CHECK (document_type IN ('DNI','NIE','PASSPORT')),
    side              VARCHAR(10) NOT NULL CHECK (side IN ('FRONT','BACK')),
    file_path         VARCHAR(500) NOT NULL,    -- path al fichero cifrado AES-256
    file_hash         VARCHAR(64) NOT NULL,     -- SHA-256 del contenido original
    expires_at        DATE,                     -- fecha de caducidad del documento
    validation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CHECK (validation_status IN ('PENDING','VALID','INVALID')),
    uploaded_at       TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT uq_kyc_doc_type_side UNIQUE (kyc_id, document_type, side)
);

CREATE INDEX idx_kyc_documents_kyc_id ON kyc_documents(kyc_id);

COMMENT ON TABLE kyc_verifications IS 'Estado KYC por usuario — FEAT-013 US-1301 ADR-023';
COMMENT ON TABLE kyc_documents     IS 'Documentos de identidad subidos — FEAT-013 US-1302';
