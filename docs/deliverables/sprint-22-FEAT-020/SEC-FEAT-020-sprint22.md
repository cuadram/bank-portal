# Informe de Seguridad — FEAT-020 Sprint 22
## BankPortal · Banco Meridian

**Feature:** FEAT-020 — Gestión de Préstamos Personales
**Sprint:** 22 | **Security Agent:** SOFIA v2.6
**Fecha:** 2026-04-02 | **Semáforo:** GREEN

---

## Resultado

| Métrica | Valor |
|---|---|
| CVE Críticos | 0 |
| CVE Altos | 0 |
| SAST findings bajos | 1 (DEBT-037, en scope S22) |
| PCI-DSS | Compliant |
| GDPR | Compliant |
| **Semáforo** | **GREEN** |

---

## Verificaciones de seguridad (8/8 OK)

| ID | CVSS | Check | Resultado |
|---|---|---|---|
| SEC-001 | — | Sin @AuthenticationPrincipal en loan/ (DEBT-022) | OK |
| SEC-002 | — | OTP validado pre-persistencia (RN-F020-09, CWE-287) | OK |
| SEC-003 | 5.3 | idx_loan_apps_user_pending UNIQUE parcial (CWE-362) | OK |
| SEC-004 | — | BigDecimal exclusivo sin double/float (CWE-681) | OK |
| SEC-005 | — | Sin stack trace exposure en ExceptionHandler (CWE-209) | OK |
| SEC-006 | 2.1 | DEBT-037 Regex PAN Maestro 19d — en scope SCRUM-121 | OK |
| SEC-007 | — | @PreAuthorize("isAuthenticated()") en LoanController | OK |
| SEC-008 | — | Mock scoring determinista sin PII (ADR-035, GDPR) | OK |

---

## Deuda de seguridad abierta

| ID | CVSS | Descripción | Target | Estado |
|---|---|---|---|---|
| DEBT-037 | 2.1 | Regex PAN Maestro 19 dígitos | S22 | En scope SCRUM-121 |

---

## Notas de cumplimiento

- **PSD2:** OTP validado obligatoriamente antes de crear solicitud de préstamo (RN-F020-09). LoanController delega en OtpValidationUseCase antes de ApplyLoanUseCase.
- **Ley 16/2011 (crédito al consumo):** Cuadro de amortización disponible vía GET /api/v1/loans/{id}/amortization. Simulación stateless disponible pre-contratación.
- **GDPR:** Scoring mock no usa datos personales reales. LoanAuditLog previsto para trazabilidad.
- **CWE-362 (Race condition):** Mitigado por UNIQUE INDEX parcial en loan_applications(user_id) WHERE estado='PENDING'.

---

*SOFIA Security Agent — Sprint 22 — 2026-04-02*
