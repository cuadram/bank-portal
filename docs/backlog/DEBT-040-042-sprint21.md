# DEBT-BACKLOG — Sprint 21 · FEAT-019
## Nuevas deudas técnicas identificadas por Security Agent v1.9

| ID       | Descripción                                                                    | Área             | Prioridad | Sprint obj. | CVSS | LA-020-02 |
|----------|--------------------------------------------------------------------------------|------------------|-----------|-------------|------|-----------|
| DEBT-040 | Race condition DataExportService — unique index parcial en gdpr_requests       | Security/Backend | Alta      | S21         | 5.3  | ⚠️ Sí    |
| DEBT-041 | OTP 2FA no validado en PrivacyController.requestDeletion — integrar OtpService | Security/Backend | Alta      | S21         | 4.8  | ⚠️ Sí    |
| DEBT-042 | Deletion confirmation token sin TTL 24h en DeletionRequestService              | Security/Backend | Media     | S22         | 2.1  | No        |

### Detalle DEBT-040 — Race condition DataExportService
- **CWE:** CWE-362
- **Componente:** `DataExportService.requestExport()`
- **Remediación:** Añadir unique index parcial en V23 o SERIALIZABLE isolation
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_gdpr_unique_active_export
    ON gdpr_requests(user_id, tipo)
    WHERE estado IN ('PENDING','IN_PROGRESS');
  ```
- **Referencia:** SEC-F019-01 · docs/security/SEC-FEAT-019-sprint21.md

### Detalle DEBT-041 — OTP 2FA no validado en eliminación de cuenta
- **CWE:** CWE-287
- **Componente:** `PrivacyController.requestDeletion()`
- **Remediación:** Inyectar `OtpService` (ya existe Sprint 1/FEAT-001) y validar `dto.otpCode()` antes de `initiateDeletion()`
- **Referencia:** SEC-F019-02 · docs/security/SEC-FEAT-019-sprint21.md

### Detalle DEBT-042 — Deletion token sin TTL 24h
- **CWE:** CWE-613
- **Componente:** `DeletionRequestService.confirmDeletion()`
- **Remediación:** `if (request.getCreatedAt().plusHours(24).isBefore(LocalDateTime.now())) { reject(...) }`
- **Referencia:** SEC-F019-03 · docs/security/SEC-FEAT-019-sprint21.md
