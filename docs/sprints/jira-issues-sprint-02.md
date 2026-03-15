# Jira Issues — Sprint 02: Hardening + E2E + FEAT-002
> **Estado:** PENDIENTE DE CREACIÓN (Jira no conectado en este entorno)
> **Generado por:** SOFIA — Scrum Master Agent
> **Fecha:** 2026-03-14
> **Sprint:** 02

---

## Epic nueva

| Campo   | Valor                                         |
|---------|-----------------------------------------------|
| Type    | Epic                                          |
| Summary | EPIC-002: Gestión de Sesiones y Hardening     |
| Labels  | sofia, security, redis, e2e                   |
| Priority | High                                         |

---

## Stories / Tareas Sprint 02

| Issue          | Type    | Summary                                              | SP | Priority    | Sprint    | Labels                        |
|----------------|---------|------------------------------------------------------|----|-------------|-----------|-------------------------------|
| DEBT-001       | Task    | RateLimiterService → Bucket4j + Redis                | 5  | High        | Sprint 02 | sofia, java, redis, tech-debt |
| DEBT-002       | Task    | Anti-replay TOTP con Redis cache (TTL 90s)           | 5  | High        | Sprint 02 | sofia, java, redis, security  |
| RV-001         | Task    | Mock TwoFactorStore en TestBed — interceptor tests   | 2  | Medium      | Sprint 02 | sofia, angular, tech-debt     |
| RV-002         | Task    | PUBLIC_PATHS matching robusto en auth.interceptor    | 2  | Medium      | Sprint 02 | sofia, angular, tech-debt     |
| RV-003         | Task    | Cancelar setTimeout handles en RecoveryCodes ngOnDestroy | 1 | Low      | Sprint 02 | sofia, angular, tech-debt     |
| DEBT-003       | Task    | JaCoCo 0.8.12 → 0.8.13+                             | 1  | Low         | Sprint 02 | sofia, java, tech-debt        |
| L6-E2E         | Story   | Suite Playwright — flujos críticos 2FA               | 8  | High        | Sprint 02 | sofia, playwright, e2e, qa    |
| L4-A11Y        | Story   | Accesibilidad runtime: axe-core + NVDA/JAWS          | 3  | Medium      | Sprint 02 | sofia, a11y, wcag, qa         |
| FEAT-002-US001 | Story   | Listar y gestionar sesiones activas (backend + frontend) | 9 | Medium   | Sprint 02 | sofia, java, angular, redis   |

**Total: 36 SP**

---

## Issue links

- DEBT-001 → blocks → DEBT-002 (Redis requerido)
- DEBT-001 → blocks → L6-E2E (entorno estable requerido)
- DEBT-001 → blocks → FEAT-002-US001 (Redis sesiones)
- L6-E2E → blocks → L4-A11Y (axe-core en Playwright)

---

## Subtasks por Story (para crear como children)

### DEBT-001 (5 SP)
- T-S2-001: `pom.xml` → spring-boot-starter-data-redis + Lettuce
- T-S2-002: `docker-compose.yml` → Redis 7-alpine
- T-S2-003: Refactorizar RateLimiterService (ConcurrentHashMap → RedisTemplate)
- T-S2-004: Tests integración con Testcontainers Redis
- T-S2-005: Variables entorno REDIS_HOST/PORT/PASSWORD
- T-S2-006: Actualizar AbstractIntegrationTest con RedisContainer

### DEBT-002 (5 SP)
- T-S2-007: OtpReplayCache @Service (Redis Set, TTL 90s)
- T-S2-008: Integrar en VerifyOtpUseCase + ConfirmEnrollmentUseCase
- T-S2-009: InvalidOtpException en replay detectado
- T-S2-010: Tests unitarios + integración OtpReplayCache

### L6-E2E (8 SP)
- T-S2-015: Setup Playwright (playwright.config.ts)
- T-S2-016: Page Objects (4 páginas 2FA)
- T-S2-017: E2E flujo enrolamiento
- T-S2-018: E2E flujo login 2FA
- T-S2-019: E2E flujo desactivación
- T-S2-020: CI job playwright-e2e

### FEAT-002-US001 (9 SP)
- T-S2-023: SessionRepository (Redis)
- T-S2-024: GET /api/v1/sessions
- T-S2-025: DELETE /api/v1/sessions/{sessionId}
- T-S2-026: ActiveSessionsComponent (Angular)
- T-S2-027: Tests unitarios backend

---

*Crear manualmente en Jira o conectar integración Atlassian para automatizar.*
