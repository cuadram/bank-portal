package com.experis.sofia.bankportal.kyc.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad JPA — documento de identidad subido.
 * UNIQUE en (kyc_id, document_type, side) — un doc por tipo+cara.
 * FEAT-013 US-1302 — Flyway V15.
 */
@Entity
@Table(name = "kyc_documents",
       uniqueConstraints = @UniqueConstraint(columnNames = {"kyc_id","document_type","side"}))
@Getter @Setter @NoArgsConstructor
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "kyc_id", nullable = false)
    private UUID kycId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocumentType documentType;

    @Column(nullable = false, length = 10)
    private String side; // FRONT | BACK

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_hash", nullable = false, length = 64)
    private String fileHash; // SHA-256

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @Column(name = "validation_status", length = 20)
    private String validationStatus = "PENDING"; // PENDING|VALID|INVALID

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
