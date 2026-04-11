# Release Notes — v1.22.0
## BankPortal · Banco Meridian · Sprint 22

**Versión:** v1.22.0  
**Fecha:** 2026-04-02  
**Feature:** FEAT-020 — Gestión de Préstamos Personales  
**Breaking changes:** ❌ Ninguno  
**Rollback:** `docker compose pull && docker compose up -d` con tag v1.21.0

---

## Novedades

### FEAT-020 — Gestión de Préstamos Personales (19 SP)

**Backend:**
- `GET /api/v1/loans` — listado paginado de préstamos activos del usuario
- `GET /api/v1/loans/{id}` — detalle con cuadro de amortización inline
- `GET /api/v1/loans/{id}/amortization` — cuadro de amortización explícito (método francés, BigDecimal HALF_EVEN, ADR-034)
- `POST /api/v1/loans/simulate` — simulación stateless (importe 1k–60k, plazo 12–84m, TAE 6.50%)
- `POST /api/v1/loans/applications` — solicitud con OTP 2FA + pre-scoring mock (ADR-035)
- `GET /api/v1/loans/applications/{id}` — estado de solicitud
- `DELETE /api/v1/loans/applications/{id}` — cancelación (solo PENDING, solo propietario)

**Frontend:**
- Módulo `/prestamos` lazy loading (Angular 17)
- Componentes: LoanList · LoanDetail · LoanSimulator · LoanApplicationForm (stepper 3 pasos) · AmortizationTable
- Nav item "Préstamos" en sidebar

### DEBT-043 — Cerrado (2 SP)
- `GET /api/v1/profile/notifications` — HTTP 200 + [] (nunca 404)

### Correcciones técnicas (incluidas en sprint)
- `DeletionRequestService` — `GdprRequestStatus.EXPIRED → REJECTED` (compile error)
- `gen-global-dashboard.js` — `gate_pending` string→objeto normalizado + `parseArg()` + fallback `jira_issue`

---

## Migraciones Flyway

| Versión | Descripción |
|---|---|
| V24 | Tablas `loans`, `loan_applications`, `loan_audit_log` + índices + UNIQUE parcial PENDING |

---

## Variables de entorno nuevas

Ninguna. El módulo reutiliza: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `REDIS_URL`.

---

## Dependencias nuevas

Ninguna dependencia nueva en `pom.xml`.

---

## Checklist de despliegue

- [ ] `docker compose build --no-cache backend frontend`
- [ ] `docker compose up -d`
- [ ] Verificar Flyway V24 aplicada: `SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1`
- [ ] Smoke test: `bash infra/compose/smoke-test-v1.22.0.sh`
- [ ] Verificar `/prestamos` accesible en frontend

---

*SOFIA DevOps Agent — Sprint 22 — 2026-04-02*
