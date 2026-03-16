# Sprint Planning — Sprint 4 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 4 |
| **Período** | 2026-04-28 → 2026-05-09 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Ritual de kick-off — Revisión de acciones Sprint 3 Retro (ACT-10)

| Acción | Estado | Verificación |
|---|---|---|
| ACT-12 DoR: criterio header Deprecation | ⏳ Aplicar en Sprint 4 inicio | Ver sección "DoR actualizada" abajo |
| ACT-13 DEBT-004 ua-parser-java | ⏳ En backlog Sprint 4 | 2 SP planificados |
| ACT-14 Protocolo scope reduction intra-sprint | ⏳ Aplicar desde hoy | Comunicar al equipo en kick-off |
| ACT-15 Credentials integraciones nuevas en README | ⏳ Aplicar en Sprint 4 | Checklist pre-sprint expandido |
| ACT-16 DEBT-005 header Deprecation | ⏳ En backlog Sprint 4 | 1 SP planificado |

---

## DoR actualizada (ACT-12) — criterios de aceptación para endpoints deprecated

A partir de Sprint 4, todo endpoint marcado como deprecated en OpenAPI debe incluir
en su criterio de aceptación:

```gherkin
Escenario: Header Deprecation presente en response
  Dado que el endpoint está marcado como deprecated
  Cuando cualquier cliente hace una request a ese endpoint
  Entonces la response incluye el header:
    Deprecation: true
    Sunset: <fecha de eliminación prevista, ej. Sat, 01 Jan 2027 00:00:00 GMT>
    Link: </api/v1/2fa/deactivate>; rel="successor-version"
```

---

## Sprint Goal

> **"Cerrar FEAT-002 al 100% (token HMAC completo + página deny), arrancar FEAT-003 (dispositivos de confianza) con US-201/202/203/204 y saldar la deuda técnica de baja prioridad (DEBT-004/005)."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad Sprint 1/2/3 | 24 SP (constante — alta confianza) |
| Factor de ajuste | 1.0 |
| **Capacidad comprometida Sprint 4** | **24 SP** |

---

## Backlog del Sprint 4

| ID | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|
| DEBT-004 | `DeviceFingerprintService` → ua-parser-java | 2 | tech-debt | Media | US-101 ✅ |
| DEBT-005 | Header `Deprecation: true` en DELETE /deactivate | 1 | tech-debt | Media | DEBT-003 ✅ |
| US-105b | FEAT-002 cierre: `DenySessionByLinkUseCase` HMAC completo + página Angular | 5 | feature | Must Have | US-105 ✅ (MVP Sprint 3) |
| US-201 | Marcar dispositivo como de confianza tras login 2FA | 3 | feature | Must Have | FEAT-001 ✅, FEAT-002 ✅ |
| US-202 | Ver y eliminar dispositivos de confianza | 4 | feature | Must Have | US-201 |
| US-203 | Login sin OTP desde dispositivo de confianza | 6 | feature | Must Have | US-201 |
| US-204 | Expiración automática de dispositivos de confianza | 3 | feature | Must Have | US-201 |
| **Total** | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
Semana 1:
  DEBT-004 → ua-parser-java (Backend Dev — 2 SP)           [día 1-2]
  DEBT-005 → header Deprecation (Backend Dev — 1 SP)       [día 1]
  US-105b  → HMAC completo + página deny (Backend + Angular — 5 SP)
  US-201   → Marcar dispositivo confiable (Backend + Angular — 3 SP)
    └─► Flyway V6 (trusted_devices table) — día 1

Semana 2:
  US-202   → Gestionar dispositivos (Backend + Angular — 4 SP)
    └─► depende de US-201
  US-203   → Login sin OTP (Backend — 6 SP)
    └─► depende de US-201 (trusted_devices + TrustedDeviceAuthFilter)
  US-204   → Expiración automática (Backend — 3 SP)
    └─► depende de US-201
```

---

## Migración Flyway requerida — día 1

```sql
-- V6__create_trusted_devices_table.sql
CREATE TABLE trusted_devices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL UNIQUE,
    device_fingerprint_hash VARCHAR(64) NOT NULL,
    device_info     JSONB,
    ip_masked       VARCHAR(32),
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    last_used_at    TIMESTAMP   NOT NULL DEFAULT now(),
    expires_at      TIMESTAMP   NOT NULL,
    revoked_at      TIMESTAMP,
    revoke_reason   VARCHAR(32)
);

CREATE INDEX idx_trusted_devices_user
    ON trusted_devices(user_id) WHERE revoked_at IS NULL AND expires_at > now();
CREATE INDEX idx_trusted_devices_token
    ON trusted_devices(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_trusted_devices_cleanup
    ON trusted_devices(expires_at) WHERE revoked_at IS NULL;
```

---

## Pre-requisitos técnicos antes de iniciar

| Pre-requisito | Responsable | Bloqueante para | Estado |
|---|---|---|---|
| ADR-008 — Trust token cookie HttpOnly vs localStorage | Architect | US-201/203 | ⏳ Pre-Sprint 4 día 1 |
| Migración V6 en plan de BD STG | DevOps | US-201 | ⏳ Día 1 |
| Cookie config Spring Security (HttpOnly + Secure + SameSite) | Backend Dev | US-201 | ⏳ Día 1 |
| Credential `bankportal-trusted-device-hmac-key` en Jenkins + K8s | DevOps | US-203 | ⏳ Día 1 (ACT-15) |

> **ACT-15 aplicado:** el credential `bankportal-trusted-device-hmac-key` debe añadirse
> al `README-CREDENTIALS.md` antes del día 1 del sprint — no al generar el deployment.

---

## Tablero Kanban — Sprint 4 inicial

```
| READY              | IN PROGRESS | CODE REVIEW | QA | DONE |
|--------------------|-------------|-------------|----| -----|
| DEBT-004 (2 SP)    |      —      |      —      | —  |  —   |
| DEBT-005 (1 SP)    |             |             |    |      |
| US-105b  (5 SP)    |             |             |    |      |
| US-201   (3 SP)    |             |             |    |      |
| US-202   (4 SP)    |             |             |    |      |
| US-203   (6 SP)    |             |             |    |      |
| US-204   (3 SP)    |             |             |    |      |
```

---

## Risk Register — Sprint 4

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| R-F2-005 | Clientes integran DELETE /deactivate deprecated | B | M | 🟡 Media | DEBT-005 día 1 — header Deprecation visible desde el inicio del sprint |
| R-S4-001 | FEAT-003 US-203 (login sin OTP) complejidad mayor a 6 SP | M | M | 🟡 Media | Spike de 2h el día 1 para validar el filtro de Spring Security antes de comprometer |
| R-F3-001 | Trust token robado → acceso sin OTP | B | A | 🟡 Media | ADR-008 documenta las mitigaciones (HttpOnly + binding fingerprint) antes del desarrollo |
| R-F3-002 | Auditoría PCI-DSS omisión OTP | M | M | 🟡 Media | TRUSTED_DEVICE_LOGIN en audit_log — criterio de aceptación explícito en US-203 |
| R-F3-004 | Job de limpieza no ejecutado | B | B | 🟢 Baja | Verificación TTL también en el login como segunda línea |

---

## Gates HITL Sprint 4

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 ADR-008 | ADR-008-trust-token-cookie.md | Tech Lead | 24 h |
| 🔒 Code Review | CR-FEAT-003-sprint4.md | Tech Lead | 24 h/NC |
| 🔒 QA Doble Gate | QA-FEAT-003-sprint4.md | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.3.0 | RELEASE-v1.3.0.md | Release Manager | 4 h |

---

## Definición de Hecho — Sprint 4

Además del DoD base (CLAUDE.md v1.1):
- [ ] FEAT-002 CERRADA al 100%: `DenySessionByLinkUseCase` HMAC completo + página Angular `/session-denied`
- [ ] DEBT-004: `DeviceFingerprintService` usa ua-parser-java — Edge y Chrome detectados correctamente
- [ ] DEBT-005: `DELETE /api/v1/2fa/deactivate` devuelve headers `Deprecation: true` + `Sunset` + `Link`
- [ ] US-201: trust token creado como cookie HttpOnly, Secure, SameSite=Strict · stored in `trusted_devices`
- [ ] US-202: `GET /api/v1/trusted-devices` · `DELETE /api/v1/trusted-devices/{id}` · `DELETE /api/v1/trusted-devices` operativos
- [ ] US-203: login sin OTP desde dispositivo de confianza — `TrustedDeviceAuthFilter` operativo y auditado
- [ ] US-204: `@Scheduled` job limpieza nocturna operativo · TTL también verificado en login
- [ ] **OpenAPI actualizada** a v1.3.0 con todos los endpoints nuevos (ACT-11 DoD)
- [ ] Playwright E2E ≥ 8 tests nuevos para flujos de dispositivos de confianza — PASS en Jenkins
- [ ] `TRUSTED_DEVICE_LOGIN` en audit_log — cumplimiento PCI-DSS 4.0 req. 8.3 verificado
- [ ] ADR-008 aprobado por Tech Lead antes del inicio del desarrollo

---

## Proyección de releases

| Release | Contenido | Fecha estimada |
|---|---|---|
| v1.3.0 | FEAT-002 cerrada + FEAT-003 + DEBT-004/005 | 2026-05-09 |
| v1.4.0 | FEAT-004 (por definir con PO tras Sprint 4 Review) | 2026-05-23 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-04-28*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 4*
