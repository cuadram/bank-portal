# Release Notes — BankPortal v1.14.0
## Sprint 14 — FEAT-012-A: Gestión de Perfil de Usuario

**Fecha de release:** 2026-03-23
**Rama:** `feature/FEAT-012-sprint14`
**Jira Epic:** SCRUM-35
**Tipo:** Feature Release + Debt Resolution

---

## Resumen

v1.14.0 incluye la feature de Gestión de Perfil de Usuario (FEAT-012-A), la resolución del
bloqueante crítico DEBT-022 que causaba 403 en STG, la habilitación de revocación de sesiones JWT
(DEBT-023), y la corrección de 10 findings de Code Review acumulados desde Sprint 13.

---

## ✨ Nuevas funcionalidades

### FEAT-012-A — Gestión de Perfil de Usuario (13 SP)

| US | Funcionalidad | Endpoint |
|---|---|---|
| US-1201 | Consulta de perfil personal | `GET /api/v1/profile` |
| US-1202 | Actualización de datos (teléfono E.164 + dirección) | `PATCH /api/v1/profile` |
| US-1203 | Cambio de contraseña (BCrypt12 + historial 3 + política) | `POST /api/v1/profile/password` |
| US-1204 | Preferencias de notificación (5 códigos) | `GET|PATCH /api/v1/profile/notifications` |
| US-1205 | Sesiones activas + revocación por JTI | `GET|DELETE /api/v1/profile/sessions/{jti}` |

**Nuevas tablas BD (Flyway V14):**
- `user_profiles` — datos personales ampliados
- `user_notification_preferences` — preferencias por usuario
- `password_history` — últimas 3 contraseñas (ADR-021)
- `revoked_tokens` — JTIs revocados (ADR-022 híbrido Redis+PG)

---

## 🔧 Deuda técnica resuelta

| DEBT | Descripción | Impacto |
|---|---|---|
| **DEBT-022** | Exclusión `OAuth2ResourceServerAutoConfiguration` — fix 403 STG | 🔴 Crítico |
| **DEBT-023** | JWT incluye `jti` UUID v4 — habilita revocación individual de sesiones | 🟠 Alto |

---

## 🔒 Security & Quality

| ID | Descripción |
|---|---|
| RV-013 | `PdfReportGenerator`: catch tipado `DocumentException | IOException` |
| RV-014 | `ExcelReportGenerator`: catch tipado `IOException` |
| RV-015 | `DashboardExportUseCase`: `@Transactional(readOnly=true)` en exportación |
| RV-016 | `ProfilePageComponent`: `takeUntilDestroyed()` — sin memory leaks Angular |
| RV-017 | `AuthGuard`: verificación claim `exp` del JWT |
| RV-018 | Repositorios JPA con visibilidad `public` (Spring Data detecta correctamente) |
| RV-019 | `ChangePasswordUseCase`: invalidación real de sesiones via Redis |
| RV-021 | Repositorios separados en ficheros individuales (SRP) |
| RV-022 | `@Valid` en `@RequestBody` del `ProfileController` |
| RV-023 | Import `tap` no usado eliminado en `profile.service.ts` |

---

## 🔄 Módulos portados (dashboard desde FEAT-011)

El módulo `dashboard` (FEAT-010/011) estaba en `feature/FEAT-011-sprint13` sin merge a `develop`.
En este sprint se incorpora a `feature/FEAT-012-sprint14` con los RV fixes aplicados:

- Flyway V12 (`bills`, `bill_payments`) y V13 (`spending_categories`, `budget_alerts`)
- Dashboard backend: 9 use cases + 6 DTOs + 2 adapters JPA + 2 controllers
- Dashboard export: `PdfReportGenerator` + `ExcelReportGenerator`

---

## 📊 Métricas de calidad

| Métrica | Valor |
|---|---|
| Story Points entregados | 24/24 SP |
| Test Cases ejecutados | 42/42 PASS |
| Defectos | 0 |
| Cobertura Gherkin | 100% (20/20 escenarios) |
| Cobertura tests unitarios | ≥ 80% (umbral JaCoCo) |
| Tests unitarios nuevos | +20 (total ~153) |
| CVEs críticos | 0 |
| Security semaphore | 🟢 VERDE |

---

## ⚠️ Breaking changes

**Ninguno.** Los endpoints existentes no se modificaron. El cambio en `JwtTokenProvider`
(añade `jti`) es retrocompatible — `RevokedTokenFilter` opera en fail-open si `jti` es nulo.

---

## 🔜 Deuda técnica pendiente (Sprint 15)

| ID | Descripción |
|---|---|
| RV-020 | `twoFactorEnabled` leer desde BD en lugar de hardcodeado |
| SAST-001 | Ofuscar IP en `audit_log` (RGPD Art. 25 — privacy by design) |
| SAST-002 | Rate limiting específico en `POST /api/v1/profile/password` |
| DEBT-024 | Merge `feature/FEAT-012-sprint14` → `develop` + tag `v1.14.0` |

---

*SOFIA DevOps Agent — Step 7 — BankPortal Sprint 14 — FEAT-012-A — 2026-03-23*
*Velocidad histórica: ~23.6 SP/sprint (14 sprints, 331 SP)*
