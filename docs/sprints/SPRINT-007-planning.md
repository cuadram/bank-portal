# Sprint Planning — Sprint 7 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 7 |
| **Período** | 2026-06-09 → 2026-06-20 |
| **SM** | SOFIA SM Agent |
| **Estado** | ✅ **APPROVED** — Product Owner — 2026-06-09 |
| **Jira Epic** | SCRUM-22 |

---

## Gates HITL Sprint 7 — Estado actualizado

| Gate | Artefacto | Aprobador | Estado |
|---|---|---|---|
| ✅ Sprint Planning | SPRINT-007-planning.md | Product Owner | **APPROVED 2026-06-09** |
| ✅ ADR-011 + LLD-006/007 + LLD-frontend-config-history | 5 artefactos de arquitectura | Tech Lead | **APPROVED 2026-06-09** |
| ✅ Code Review | CR-FEAT-006-sprint7.md | Tech Lead | **APPROVED 2026-06-09** (re-review) |
| ✅ QA Doble Gate | QA-FEAT-006-sprint7.md | QA Lead + PO | **APPROVED 2026-06-09** |
| ✅ Go/No-Go PROD v1.6.0 | RELEASE-v1.6.0.md | Release Manager | **GO — 2026-06-09** |

---

## Sprint Goal

> **"Cerrar FEAT-005 al 100% (US-403), resolver DEBT-008, formalizar contratos JWT (ACT-30) y arrancar FEAT-006 (Autenticación Contextual) con US-601/602 Must Have y US-603/604 Should Have."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad S1–S6 | 23.7 SP/sprint (media) |
| Capacidad comprometida | 24 SP |

---

## Backlog del Sprint 7 — Estado Semana 1

| ID | Jira | Título | SP | Estado |
|---|---|---|---|---|
| ACT-30 | SCRUM-23 | Claims JWT en OpenAPI + CR checklist | 1 | ✅ DONE |
| DEBT-008 | SCRUM-24 | SecurityDashboardUseCase → CompletableFuture.allOf() | 3 | ✅ DONE |
| US-403 | SCRUM-25 | Preferencias de seguridad unificadas | 3 | ✅ DONE |
| US-601 | SCRUM-26 | Bloqueo automático de cuenta | 5 | ✅ DONE (parcial — US-602 Semana 2) |
| US-604 | SCRUM-29 | Historial de configuración de seguridad | 4 | ✅ DONE |
| US-602 | SCRUM-27 | Desbloqueo de cuenta por enlace de email | 3 | ⏳ Semana 2 |
| US-603 | SCRUM-28 | Login contextual — alerta contexto inusual | 5 | ⏳ Semana 2 |
| **Total Semana 1** | | | **16 SP** | ✅ |
| **Total Semana 2** | | | **8 SP** | ⏳ |

---

## Release v1.6.0 — GO aprobado

| Campo | Valor |
|---|---|
| **Tag** | `v1.6.0` |
| **Contenido** | DEBT-008 + US-403 + US-601 + US-604 |
| **Go/No-Go** | ✅ GO — Release Manager — 2026-06-09 |
| **Deploy** | Kubernetes rolling update — 0 downtime |
| **Secret requerido** | `bankportal-account-secrets` con `ACCOUNT_UNLOCK_HMAC_KEY` |
| **Flyway V8** | AUTO en arranque — verified STG |

---

## Risk Register — Sprint 7 (actualizado)

| ID | Riesgo | Estado |
|---|---|---|
| R-S7-001 | Dashboard latencia PROD | ✅ Mitigado — 11ms STG (DEBT-008) |
| R-S7-002 | Claim twoFaEnabled no documentado | ✅ Mitigado — OpenAPI v1.4.1 (ACT-30) |
| R-S7-003 | US-403 sin cobertura R-F5-003 | ✅ Mitigado — disclaimer incolapsable (TC-S7-008) |
| R-F6-001 | Bloqueo legítimo por error tipeo | ✅ Mitigado — umbral 10 + aviso desde 7 |
| R-F6-002 | Falsos positivos VPN | ⏳ Semana 2 — US-603 |
| R-F6-003 | Scope context-pending en SecurityFilterChain | ⏳ Semana 2 — US-603 + SecurityFilterChainContextPendingTest |
| R-F6-004 | Flyway V8 en PROD | ✅ Mitigado — auto en arranque, STG OK |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-06-09*
*✅ SPRINT 7 SEMANA 1 CERRADA · v1.6.0 GO APROBADO · Semana 2 → US-602 + US-603*
