# Sprint Report — Sprint 14
## BankPortal — Banco Meridian | FEAT-012-A

**Período:** 2026-03-23 → 2026-03-23 (sprint completado en sesión única)
**Release:** v1.14.0 | **Jira Epic:** SCRUM-35 (Finalizada)
**CMMI:** PMC SP 1.1 · PMC SP 1.6 · MA SP 2.2

---

## 1. Objetivo del Sprint

Desbloquear STG resolviendo el bloqueante crítico DEBT-022 (403 en todos los
endpoints), saldar la deuda técnica de Code Review Sprint 13 (RV-013..017), e
iniciar FEAT-012-A (Gestión de Perfil de Usuario) para completar la capacidad de 24 SP.

**Resultado: ✅ OBJETIVO CUMPLIDO AL 100%**

---

## 2. Velocidad y métricas

| Métrica | Valor |
|---|---|
| SP planificados | 24 |
| SP entregados | 24 |
| Cumplimiento | 100% |
| Defectos abiertos | 0 |
| Defectos cerrados | 0 |
| Test Cases ejecutados | 42/42 PASS |
| Cobertura Gherkin | 100% (20/20) |
| Security Gate | 🟢 VERDE |
| Velocidad histórica (14 sprints) | **~23.7 SP/sprint** |
| SP totales acumulados | **331 SP** |

---

## 3. Backlog completado

| ID | Tipo | SP | Descripción |
|---|---|---|---|
| **DEBT-022** | Tech Debt | 5 | Fix 403 STG — excluir `OAuth2ResourceServerAutoConfiguration` |
| **DEBT-023** | Tech Debt | 1 | Añadir `jti` UUID v4 al payload JWT |
| RV-013 | Tech Debt | 1 | `PdfReportGenerator`: catch `DocumentException\|IOException` |
| RV-014 | Tech Debt | 1 | `ExcelReportGenerator`: catch `IOException` |
| RV-015 | Tech Debt | 1 | `DashboardExportUseCase`: `@Transactional(readOnly=true)` |
| RV-016 | Tech Debt | 2 | `ProfilePageComponent`: `takeUntilDestroyed()` Angular |
| RV-017 | Tech Debt | 1 | `AuthGuard`: verificación claim `exp` JWT |
| US-1201 | Feature | 2 | Ver perfil personal — `GET /api/v1/profile` |
| US-1202 | Feature | 3 | Actualizar datos personales — `PATCH /api/v1/profile` |
| US-1203 | Feature | 3 | Cambiar contraseña — BCrypt12 + historial 3 + política |
| US-1204 | Feature | 2 | Preferencias de notificación — 5 códigos |
| US-1205 | Feature | 3 | Sesiones activas + revocación JTI — Redis+PG |
| **TOTAL** | | **24** | |

---

## 4. Hallazgos adicionales de Code Review (detectados en Step 5)

| ID | Severidad | Descripción | Estado |
|---|---|---|---|
| RV-018 | 🔴 Bloqueante | Repositorios JPA package-private | ✅ Corregido in-situ |
| RV-019 | 🟠 Mayor | Invalidación sesiones no implementada | ✅ Corregido in-situ |
| RV-021 | 🟡 Menor | Repositorios en fichero único (SRP) | ✅ Corregido |
| RV-022 | 🟡 Menor | `@Valid` faltante en ProfileController | ✅ Corregido |
| RV-023 | 🟢 Sugerencia | Import `tap` sin usar | ✅ Corregido |

---

## 5. Deuda técnica generada (Sprint 15)

| ID | Descripción | Prioridad |
|---|---|---|
| DEBT-024 | Merge `feature/FEAT-012-sprint14` → `develop` + tag `v1.14.0` | Alta |
| RV-020 | `twoFactorEnabled` leer desde BD (actualmente hardcodeado `false`) | Media |
| SAST-001 | Ofuscar IP en `audit_log` (RGPD Art.25) | Media |
| SAST-002 | Rate limiting específico en `POST /api/v1/profile/password` | Baja |

---

## 6. Retrospectiva

### ✅ Qué fue bien
- DEBT-022 resuelto de forma limpia sin refactorización de controllers
- Repositorios JPA bloqueantes detectados y corregidos en el mismo ciclo de CR
- RV-016/017 Angular correctamente implementados con `takeUntilDestroyed` + `DestroyRef`
- Pipeline SOFIA ejecutado sin interrupciones desde Step 1 hasta Step 9

### 🔄 Qué mejorar
- Merge pendiente de FEAT-011 → develop causó overhead significativo en Step 4
  Acción Sprint 15: establecer política de merge a develop al final de cada sprint
- Los repositorios package-private podrían haberse detectado antes del CR
  Acción: añadir checklist "visibilidad public en JPA repositories" al SKILL del Developer

### 📌 Action items Sprint 15
1. Merge `feature/FEAT-012-sprint14` → `develop` (DEBT-024) — día 1
2. Merge `feature/FEAT-011-sprint13` → `develop` — día 1 (pendiente desde Sprint 13)
3. Definir FEAT-013 con PO
4. Incluir SAST-001/002 + RV-020 en backlog técnico

---

## 7. Trazabilidad final

| Artefacto | Ruta |
|---|---|
| Sprint Planning | `docs/sprints/SPRINT-014-planning.md` |
| SRS | `docs/srs/SRS-FEAT-012.md` |
| HLD | `docs/architecture/hld/HLD-FEAT-012.md` |
| LLD Backend | `docs/architecture/lld/LLD-015-profile-backend.md` |
| LLD Frontend | `docs/architecture/lld/LLD-016-profile-frontend.md` |
| ADR-021 | `docs/architecture/adr/ADR-021-password-history-table.md` |
| ADR-022 | `docs/architecture/adr/ADR-022-jti-revocation-hybrid.md` |
| Code Review | `docs/code-review/CR-FEAT-012-sprint14.md` |
| Security Report | `docs/security/SecurityReport-Sprint14-FEAT-012.md` |
| QA Report | `docs/qa/QA-Report-FEAT-012-sprint14.md` |
| Jenkinsfile | `infra/jenkins/Jenkinsfile` |
| Release Notes | `docs/releases/RELEASE-NOTES-v1.14.0.md` |
| Jira Epic | SCRUM-35 → **Finalizada** |

---

*SOFIA Workflow Manager Agent — Step 9 — BankPortal Sprint 14 — 2026-03-23*
*CMMI Level 3 — PMC SP 1.1 · PMC SP 1.6 · MA SP 2.2*
