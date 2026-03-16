# Sprint Planning — Sprint 3 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 3 |
| **Período** | 2026-04-14 → 2026-04-25 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Ritual de kick-off — Revisión de acciones Sprint 2 Retro (ACT-10)

| Acción | Estado | Efecto verificado |
|---|---|---|
| ACT-07 TOTP_TEST_SECRET en Jenkins | ✅ README-CREDENTIALS.md generado | Pendiente provisioning manual por DevOps |
| ACT-08 DEBT-003 REST semántico | ✅ OpenAPI v1.1.0 actualizada | En backlog Sprint 3 |
| ACT-09 OpenAPI JWT RS256 | ✅ Spec actualizada con alg: RS256 | Contrato documentado |
| ACT-10 Ritual kick-off | ✅ Esta revisión | Operativo desde Sprint 3 |
| ACT-11 DoD: OpenAPI obligatoria | ✅ CLAUDE.md v1.1 actualizado | Activo como criterio DoD |

---

## Sprint Goal

> **"Iniciar FEAT-002 (Gestión Avanzada de Sesiones): sesiones activas visibles, revocación remota con OTP y control de concurrencia — base de datos y backend operativos. Resolver DEBT-003 (REST semántico DELETE→POST)."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad Sprint 1 | 24 SP |
| Velocidad Sprint 2 | 24 SP |
| Velocidad media (2 sprints) | 24 SP — alta confianza |
| Factor de ajuste | 1.0 (baseline sólido) |
| **Capacidad comprometida Sprint 3** | **24 SP** |

---

## Backlog del Sprint 3

| ID | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|
| DEBT-003 | DELETE /deactivate → POST (REST semántico) | 2 | tech-debt | Alta | US-004 ✅ |
| US-101 | Ver sesiones activas con metadata de dispositivo | 5 | new-feature | Must Have | JWT RS256 ✅, Redis ✅ |
| US-102 | Cerrar sesión remota individual o todas | 5 | new-feature | Must Have | US-101 |
| US-104 | Control de sesiones concurrentes máximas | 5 | new-feature | Must Have | US-101 |
| US-103 | Timeout de inactividad configurable | 3 | new-feature | Should Have | US-101 |
| US-105 | Notificaciones de seguridad por login inusual | 4 | new-feature | Must Have | US-101, US-102, SMTP |
| **Total** | | **24 SP** | | | |

> **Nota US-105:** reducida a 4 SP en Sprint 3 (MVP: detección + email básico).
> El token HMAC del enlace "No fui yo" y la página de denegación se completan en Sprint 4.

---

## Orden de ejecución y dependencias

```
Semana 1:
  DEBT-003 → DELETE→POST (Backend Dev — 2 SP)     [día 1-2, paralelo con setup]
  US-101   → Sesiones activas GET (Backend + Angular Dev — 5 SP)

Semana 1-2:
  US-102   → Cierre remoto + Redis blacklist (Backend Dev — 5 SP)
    └─► depende de US-101 (tabla user_sessions debe existir)
  US-104   → Concurrencia LRU (Backend Dev — 5 SP)
    └─► depende de US-101 (tabla user_sessions)

Semana 2:
  US-103   → Timeout configurable (Backend + Angular Dev — 3 SP)
    └─► depende de US-101
  US-105   → Notificaciones email MVP (Backend Dev — 4 SP)
    └─► depende de US-101, US-102, SMTP configurado en STG
```

---

## Pre-requisitos técnicos antes de iniciar

| Pre-requisito | Responsable | Bloqueante para | Estado |
|---|---|---|---|
| TOTP_TEST_SECRET en Jenkins Credentials | DevOps | Pipeline E2E | ⚠️ PENDIENTE (ACT-07) |
| Proveedor SMTP en STG (Mailtrap o SES sandbox) | DevOps | US-105 | ⏳ Por provisionar |
| Migraciones BD: `user_sessions` + `known_devices` | Backend Dev | US-101/102/104 | ⏳ Día 1 |
| Rama `feature/FEAT-002-session-management` creada | SM/Dev | Sprint inicio | ⏳ Día 1 |

```sql
-- Migración V3__create_session_tables.sql
CREATE TABLE user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL UNIQUE,
    device_info     JSONB,
    ip_masked       VARCHAR(32),
    last_activity   TIMESTAMP NOT NULL DEFAULT now(),
    created_at      TIMESTAMP NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMP,
    revoke_reason   VARCHAR(64)
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id) WHERE revoked_at IS NULL;

CREATE TABLE known_devices (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint_hash VARCHAR(64) NOT NULL,
    first_seen              TIMESTAMP NOT NULL DEFAULT now(),
    last_seen               TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (user_id, device_fingerprint_hash)
);
```

---

## Tablero Kanban — Sprint 3 inicial

```
| READY              | IN PROGRESS | CODE REVIEW | QA | DONE |
|--------------------|-------------|-------------|----| -----|
| DEBT-003 (2 SP)    |      —      |      —      | —  |  —   |
| US-101   (5 SP)    |             |             |    |      |
| US-102   (5 SP)    |             |             |    |      |
| US-104   (5 SP)    |             |             |    |      |
| US-103   (3 SP)    |             |             |    |      |
| US-105   (4 SP)    |             |             |    |      |
```

---

## Risk Register — Sprint 3

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| NEW-R-003 | TOTP_TEST_SECRET no configurado en Jenkins — E2E flaky | M | M | 🟡 Media | DevOps provisiona día 1. Si no → E2E con mock TOTP en CI |
| R-F2-001 | Proveedor SMTP no disponible en STG antes de US-105 | M | M | 🟡 Media | Usar Mailtrap (STG) — configurar día 1 con DevOps |
| R-F2-002 | Falsos positivos en detección de dispositivo nuevo | M | B | 🟢 Baja | Hash combinado UA + IP subnet; ajustable post-deploy |
| R-F2-003 | Token blacklist Redis crece sin control | B | M | 🟢 Baja | TTL automático = session max lifetime (60 min) |
| R-F2-004 | Link "No fui yo" explotable como DoS | B | A | 🟡 Media | HMAC firmado + TTL 24h + un solo uso (Sprint 4) |

---

## Gates HITL Sprint 3

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 HLD/LLD FEAT-002 | HLD-FEAT-002.md + LLD-session-mgmt.md | Tech Lead | 24 h |
| 🔒 Code Review | CR-FEAT-002-sprint3.md | Tech Lead | 24 h/NC |
| 🔒 QA Doble Gate | QA-FEAT-002-sprint3.md | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.2.0 | RELEASE-v1.2.0.md | Release Manager | 4 h |

---

## Definición de Hecho — Sprint 3

Además del DoD base (CLAUDE.md v1.1) + Banco Meridian:
- [ ] DEBT-003 cerrada: `POST /api/v1/2fa/deactivate` en código + tests + OpenAPI
- [ ] `GET /api/v1/sessions` operativo con datos reales de `user_sessions`
- [ ] `DELETE /api/v1/sessions/{id}` con invalidación inmediata vía Redis blacklist
- [ ] Límite de 3 sesiones concurrentes con política LRU operativa
- [ ] Timeout de sesión configurable (15/30/60 min) persistido en BD
- [ ] Notificación email disparada en login desde dispositivo nuevo (MVP)
- [ ] Cobertura JaCoCo ≥ 80% en todos los nuevos servicios
- [ ] **OpenAPI actualizada** con todos los nuevos endpoints (ACT-11 DoD)
- [ ] Playwright E2E ≥ 5 tests nuevos para flujos de sesión — PASS en Jenkins

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-04-14*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 3*
