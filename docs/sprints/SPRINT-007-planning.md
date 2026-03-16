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

## 🔒 Gate Sprint Planning — APROBADO

| Campo | Valor |
|---|---|
| **Gate** | Sprint Planning |
| **Aprobador** | Product Owner |
| **Fecha** | 2026-06-09 |
| **Decisión** | ✅ APPROVED |
| **Condiciones** | Ninguna — sprint arranca inmediatamente |

---

## Ritual de kick-off — Revisión de acciones Sprint 6 Retro (ACT-10)

| Acción | Estado | Verificación |
|---|---|---|
| ACT-27 Pre-commit checklist: Organize Imports antes de commit | ⏳ Aplicar desde hoy | Añadir al self-review del Developer antes del primer commit |
| ACT-28 DEBT-008: CompletableFuture.allOf() en SecurityDashboardUseCase | ⏳ En backlog Sprint 7 | 3 SP planificados |
| ACT-29 US-403 Preferencias de seguridad — incluir en Sprint 7 | ⏳ En backlog Sprint 7 | 3 SP planificados — cierre de FEAT-005 |
| ACT-30 Claims JWT en OpenAPI + CR checklist | ⏳ En backlog Sprint 7 | 1 SP documental — prerrequisito día 1 |

---

## Sprint Goal

> **"Cerrar FEAT-005 al 100% (US-403), resolver DEBT-008, formalizar contratos JWT (ACT-30) y arrancar FEAT-006 (Autenticación Contextual) con US-601/602 Must Have y US-603/604 Should Have."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad S1–S6 | 23.7 SP/sprint (media) |
| Factor Sprint 7 | 1.0 |
| **Capacidad comprometida** | **24 SP** |

---

## Backlog del Sprint 7

| ID | Jira | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|---|
| ACT-30 | SCRUM-23 | Claims JWT en OpenAPI + línea CR checklist | 1 | documental | Alta · bloqueante día 1 | OpenAPI v1.3.0 ✅ |
| ACT-28 / DEBT-008 | SCRUM-24 | SecurityDashboardUseCase → CompletableFuture.allOf() | 3 | tech-debt | Alta | FEAT-005 ✅ |
| US-403 | SCRUM-25 | Preferencias de seguridad unificadas (FEAT-005 cierre) | 3 | feature | Alta | FEAT-001/002/003/004 ✅ |
| US-601 | SCRUM-26 | Bloqueo automático de cuenta tras intentos fallidos | 5 | feature | Must Have | Flyway V8 |
| US-602 | SCRUM-27 | Desbloqueo de cuenta por enlace de email | 3 | feature | Must Have | US-601 |
| US-603 | SCRUM-28 | Login contextual — alerta por contexto inusual | 5 | feature | Should Have | ADR-011 + spike |
| US-604 | SCRUM-29 | Historial de cambios de configuración de seguridad | 4 | feature | Should Have | US-401 ✅ |
| **Total** | | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
Día 1 — prerrequisitos antes del primer commit:
  ACT-27  → self-review checklist actualizado (pre-commit Organize Imports)
  ACT-30  → openapi-2fa.yaml v1.4.0: claims JWT documentados en securitySchemes
  ADR-011 → nuevo scope JWT "context-pending" para US-603 (spike técnico)
  LLD-006 → LLD-backend-contextual-auth.md + LLD-frontend-security-prefs.md
  LLD-007 → LLD-backend-account-lock.md + LLD-frontend-config-history.md
  Flyway V8 → account_lock_status + known_subnets

Semana 1:
  DEBT-008 → CompletableFuture.allOf() en SecurityDashboardUseCase  [3 SP · Backend]
  US-403   → Preferencias unificadas (FEAT-005 cierre)               [3 SP · Angular]
  US-601   → Bloqueo automático de cuenta                            [5 SP · Backend]

Semana 2:
  US-602   → Desbloqueo por enlace email                            [3 SP · Backend]
  US-603   → Login contextual (nuevo scope JWT)                     [5 SP · Backend + Angular]
  US-604   → Historial de cambios de configuración                  [4 SP · Backend + Angular]
```

---

## Pre-requisitos técnicos día 1

| Pre-requisito | Responsable | Bloqueante para | Estado |
|---|---|---|---|
| ACT-27: self-review checklist Developer con Organize Imports | SM / Developer | Todos los commits del sprint | ⏳ |
| ACT-30: openapi-2fa.yaml v1.4.0 con claims JWT documentados | Backend Dev | ACT-20 CR checklist | ⏳ |
| ADR-011: nuevo scope JWT "context-pending" para US-603 | Architect | US-603 | ⏳ |
| LLD-006: LLD-backend-contextual-auth + LLD-frontend-security-prefs | Architect | US-601/602/603 | ⏳ |
| LLD-007: LLD-backend-account-lock + LLD-frontend-config-history | Architect | US-403, US-604 | ⏳ |
| Flyway V8: account_lock_status + known_subnets | Backend Dev | US-601, US-603 | ⏳ |

---

## Gates HITL Sprint 7

| Gate | Jira | Artefacto | Aprobador | SLA | Estado |
|---|---|---|---|---|---|
| ✅ Sprint Planning | SCRUM-22 | Este documento | Product Owner | 24 h | **APPROVED 2026-06-09** |
| 🔒 ADR-011 + LLD-006 + LLD-007 | — | ADR-011 + 4 LLDs | Tech Lead | 24 h | Pendiente |
| 🔒 Code Review | — | CR-FEAT-006-sprint7.md | Tech Lead | 24 h/NC | Pendiente |
| 🔒 QA Doble Gate | — | QA-FEAT-006-sprint7.md | QA Lead + PO | 24 h | Pendiente |
| 🔒 Go/No-Go PROD v1.6.0 | — | RELEASE-v1.6.0.md | Release Manager | 4 h | Pendiente |

---

## Definición de Hecho — Sprint 7

Además del DoD base (CLAUDE.md v1.2) y criterios ACT-18/20/22/27/30:
- [ ] ACT-27: Developer ejecuta Organize Imports antes de cada commit — 0 NCs de import residual
- [ ] ACT-30: openapi-2fa.yaml v1.4.0 con claims JWT documentados en securitySchemes
- [ ] LLD-006 + LLD-007 aprobados antes del primer commit (ACT-22 pattern)
- [ ] ADR-011 aprobado antes de US-603 (nuevo scope JWT)
- [ ] DEBT-008: dashboard latencia reducida — benchmark STG < 30ms
- [ ] US-403: preferencias de seguridad unificadas — R-F5-003 verificado
- [ ] US-601: bloqueo a los 10 intentos + aviso progresivo desde intento 7
- [ ] US-602: unlock link HMAC-SHA256 TTL 1h one-time use
- [ ] US-603: scope "context-pending" + confirmación email — subnets conocidas en BD
- [ ] US-604: historial de configuración visible desde Panel de Auditoría
- [ ] openapi-2fa.yaml v1.4.0 con endpoints nuevos FEAT-006
- [ ] Flyway V8 ejecutado en STG sin errores
- [ ] Playwright E2E ≥ 14 tests nuevos PASS en Jenkins
- [ ] SecurityEventType ampliado: ACCOUNT_LOCKED, ACCOUNT_UNLOCKED, LOGIN_NEW_CONTEXT

---

## Risk Register — Sprint 7

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| R-S7-001 | DEBT-008 latencia dashboard PROD | M | M | 🟡 | CompletableFuture paralelo |
| R-S7-002 | Claim twoFaEnabled JWT no documentado | B | M | 🟢 | ACT-30 — documentar día 1 |
| R-S7-003 | US-403 pendiente → R-F5-003 sin cobertura | M | B | 🟢 | US-403 en Sprint 7 |
| R-F6-001 | Bloqueo automático bloquea usuarios legítimos | M | M | 🟡 | Umbral 10 + aviso progresivo desde 7 |
| R-F6-002 | Login contextual: falsos positivos con VPNs | M | M | 🟡 | Whitelist corporativa; confirmación email |
| R-F6-003 | US-603: nuevo scope JWT impact en SecurityFilterChain | M | M | 🟡 | ADR-011 + spike día 1 — bloqueante |
| R-F6-004 | Flyway V8: ALTER TABLE users en PROD | B | M | 🟢 | Testar en STG con datos de volumen |

---

## Proyección de releases

| Release | Contenido | Fecha estimada |
|---|---|---|
| v1.6.0 | FEAT-005 cierre (US-403) + DEBT-008 + FEAT-006 | 2026-06-20 |
| v1.7.0 | FEAT-007 (por definir tras Sprint 7 Review) | 2026-07-04 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-06-09*
*✅ GATE APPROVED: Product Owner · 2026-06-09 · Sprint 7 en curso*
