# Traceability Log — FEAT-003 + FEAT-002 cierre · Sprint 4

## Metadata

| Campo | Valor |
|---|---|
| **Features** | FEAT-003 (Dispositivos de Confianza) · FEAT-002 cierre (US-105b) |
| **Sprint** | 4 · 2026-04-28 → 2026-05-09 |
| **Release** | v1.3.0 |

---

## Pipeline de trazabilidad

| Step | Agente | Artefacto | Gate | Aprobador |
|---|---|---|---|---|
| 1 | Scrum Master | SPRINT-004-planning.md + FEAT-003.md | PO | Product Owner |
| 3-ADR | Architect | ADR-008-trust-token-cookie.md | Tech Lead | Tech Lead |
| 4 | Developer Backend | 10 archivos Java — domain/application/api + Flyway V6 | — | — |
| 4 | Developer Frontend | TrustedDevicesComponent Angular | — | — |
| 5 | Code Reviewer | FEAT-003-developer-output.md | Tech Lead | Tech Lead |
| 6 | QA Tester | QA-FEAT-003-sprint4.md (48 TC, 0 NCs) | QA Lead + PO | QA Lead + PO |
| 7 | DevOps | application.yml + deployment.yaml + RELEASE-v1.3.0.md | Release Manager | Release Manager |
| 8 | SM Cierre | SPRINT-004-report.md + TRACEABILITY-FEAT-003-sprint4.md | — | — |

---

## Trazabilidad US → Implementación → Tests → Gate

| US | Criterios Gherkin | Clases principales | TCs | Gate |
|---|---|---|---|---|
| DEBT-004 | 3 | `DeviceFingerprintService` (ua-parser-java) | TC-DEBT004-01→03 | ✅ |
| DEBT-005 | 2 | `DeprecationHeaders` | TC-DEBT005-01/02 | ✅ |
| US-105b | 4 | `DenySessionByLinkUseCase` (HMAC completo) | TC-105b-01→04 | ✅ |
| US-201 | 4 | `MarkDeviceAsTrustedUseCase` + ADR-008 cookie | TC-201-01→04 | ✅ |
| US-202 | 4 | `ManageTrustedDevicesUseCase` + `TrustedDeviceController` | TC-202-01→04 | ✅ |
| US-203 | 5 | `ValidateTrustedDeviceUseCase` + TRUSTED_DEVICE_LOGIN audit | TC-203-01→05 | ✅ |
| US-204 | 2 | `ManageTrustedDevicesUseCase.cleanupExpired()` @Scheduled | TC-204-01/02 | ✅ |

---

## Trazabilidad ADR → Implementación

| ADR | Decisión | Implementación | Verificado |
|---|---|---|---|
| ADR-008 | Cookie HttpOnly + Secure + SameSite=Strict | `MarkDeviceAsTrustedUseCase.ResponseCookie` | ✅ TC-201-01 + E2E-S4-01 |

---

## Trazabilidad CMMI Nivel 3

| Área CMMI | Evidencia |
|---|---|
| REQM | FEAT-003.md — 4 US con Gherkin completo |
| PP | SPRINT-004-planning.md — estimación, risks, ACT-10 verificación |
| PMC | SPRINT-004-report.md — 4° sprint consecutivo 24/24 SP |
| VER | QA-FEAT-003-sprint4.md — 48 TCs verificados, 0 NCs |
| VAL | 12 E2E Playwright — validación en browser real |
| CM | rama `feature/FEAT-003-trusted-devices` → `main` · tag `v1.3.0` |
| OPF | ACT-12→15 verificadas en kick-off Sprint 4 — todas efectivas |
| QPM | NCs: 2→0→0→0 · Velocidad 24×4 · warnings: 0→0→2→1 (tendencia estable) |

---

*SOFIA SM Agent · BankPortal · Sprint 4 · 2026-05-09*
