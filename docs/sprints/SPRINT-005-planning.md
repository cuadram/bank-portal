# Sprint Planning — Sprint 5 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 5 |
| **Período** | 2026-05-12 → 2026-05-23 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Ritual de kick-off — Revisión de acciones Sprint 4 Retro (ACT-10)

| Acción | Estado | Verificación |
|---|---|---|
| ACT-17 DEBT-006: clave dual rotación HMAC | ⏳ En backlog Sprint 5 | 5 SP planificados — 1er ítem del sprint |
| ACT-18 Gate arquitectura: LLD obligatorio | ⏳ Aplicar desde hoy | Gate de arquitectura actualizado abajo |
| ACT-19 OpenAPI v1.3.0 — endpoints FEAT-003 | ⏳ Bloqueante día 1 | Pre-requisito antes del primer commit |
| ACT-20 Code Review checklist: OpenAPI verificada | ⏳ Aplicar desde hoy | CR checklist actualizado abajo |
| ACT-21 ADR-005 movido a adr/ | ✅ Ejecutado en retro S4 | `docs/architecture/adr/ADR-005-jwt-rsa256.md` |

---

## Gate de arquitectura actualizado (ACT-18)

A partir de Sprint 5, el gate de arquitectura requiere explícitamente:

```
Gate de Arquitectura — artefactos obligatorios:
✅ HLD (siempre)
✅ LLD-backend-{feature}.md (para toda feature con endpoints nuevos o cambios en dominio)
✅ LLD-frontend-{feature}.md (para toda feature con nuevos componentes Angular o stores)
✅ ADR para toda decisión técnica no trivial
```

---

## Code Review checklist actualizado (ACT-20)

A partir de Sprint 5, el Code Reviewer verifica explícitamente:

```
CR Checklist — nuevas líneas obligatorias:
✅ openapi-2fa.yaml actualizada para TODOS los endpoints nuevos/modificados
✅ Version bump en OpenAPI (x.y.z) refleja los cambios del sprint
```

---

## Sprint Goal

> **"Implementar DEBT-006 (rotación HMAC con clave dual), cerrar el gap documental de FEAT-003 (OpenAPI v1.3.0 + LLD formal) y arrancar FEAT-004 (Centro de Notificaciones de Seguridad) con las US de mayor valor: historial, badge y marcado de leídas."**

---

## Velocidad y capacidad

| Parámetro | Valor |
|---|---|
| Velocidad S1–S4 | 24 SP × 4 sprints (muy alta confianza) |
| Factor de ajuste Sprint 5 | 1.0 |
| **Capacidad comprometida** | **24 SP** |

---

## Backlog del Sprint 5

| ID | Título | SP | Tipo | Prioridad | Dependencias |
|---|---|---|---|---|---|
| ACT-19 | OpenAPI v1.3.0 — endpoints FEAT-003 documentados | 1 | documental | Alta · bloqueante día 1 | FEAT-003 ✅ |
| LLD-003 | LLD-backend-trusted-devices.md + LLD-frontend-trusted-devices.md | 2 | documental | Alta · ACT-18 | FEAT-003 ✅ |
| DEBT-006 | Rotación HMAC key con ventana de gracia (clave dual) | 5 | tech-debt | Alta · R-S5-001 | FEAT-003 ✅ |
| US-301 | Ver historial de notificaciones de seguridad (paginado + filtros) | 4 | feature | Must Have | Flyway V7 |
| US-302 | Marcar notificaciones como leídas (individual + todas) | 2 | feature | Must Have | US-301 |
| US-303 | Badge de notificaciones no leídas en header del portal | 3 | feature | Must Have | US-301/302 |
| US-304 | Acciones directas desde notificación (deep-links) | 4 | feature | Should Have | US-301 |
| US-305 | Notificaciones en tiempo real vía SSE | 3 | feature | Should Have | US-301 |
| **Total** | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
Día 1 — obligatorio antes del primer commit de código:
  ACT-19  → actualizar openapi-2fa.yaml v1.3.0        [1 SP · Backend Dev]
  Flyway V7 en plan BD STG → tabla user_notifications

Semana 1:
  LLD-003 → LLD backend + frontend FEAT-003            [2 SP · Architect]
  DEBT-006 → clave dual HMAC para rotación segura      [5 SP · Backend Dev]
  US-301  → historial notificaciones                   [4 SP · Backend + Angular]
    └─► depende de Flyway V7

Semana 2:
  US-302 → marcar leídas                              [2 SP · Backend + Angular]
    └─► depende de US-301
  US-303 → badge en header                            [3 SP · Angular]
    └─► depende de US-301/302
  US-304 → deep-links accionables                     [4 SP · Angular]
    └─► depende de US-301
  US-305 → SSE tiempo real                            [3 SP · Backend + Angular]
    └─► depende de US-301
```

---

## Pre-requisitos técnicos día 1

| Pre-requisito | Responsable | Bloqueante para | Estado |
|---|---|---|---|
| `openapi-2fa.yaml` → v1.3.0 con endpoints FEAT-003 | Backend Dev | ACT-20 CR checklist | ⏳ ACT-19 |
| LLD-003 aprobado por Tech Lead (ACT-18) | Architect | DEBT-006 + US-301 | ⏳ día 1 |
| ADR-009 — estrategia clave dual HMAC | Architect | DEBT-006 | ⏳ día 1 |
| Flyway V7 `user_notifications` en plan BD STG | DevOps | US-301 | ⏳ día 1 |
| No se requieren credentials nuevos — DEBT-006 reutiliza `TRUSTED_DEVICE_HMAC_KEY` + añade `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` | DevOps | DEBT-006 | ⏳ documentar en README |

---

## Migración Flyway V7 — tabla user_notifications

```sql
-- V7__create_user_notifications_table.sql
CREATE TABLE user_notifications (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type   VARCHAR(64) NOT NULL,
    title        VARCHAR(128) NOT NULL,
    body         TEXT,
    metadata     JSONB,
    is_read      BOOLEAN     NOT NULL DEFAULT false,
    action_url   VARCHAR(256),
    created_at   TIMESTAMP   NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP   NOT NULL DEFAULT now() + INTERVAL '90 days'
);

CREATE INDEX idx_user_notifications_user_unread
    ON user_notifications(user_id, created_at DESC)
    WHERE is_read = false;

CREATE INDEX idx_user_notifications_cleanup
    ON user_notifications(expires_at) WHERE is_read = true OR expires_at < now();
```

---

## DEBT-006 — Diseño técnico (clave dual HMAC)

**Problema:** rotación de `TRUSTED_DEVICE_HMAC_KEY` invalida todos los trust tokens activos inmediatamente.

**Solución — clave dual:**
```yaml
trusted-device:
  hmac-key:          ${TRUSTED_DEVICE_HMAC_KEY}          # clave actual (sign + verify)
  hmac-key-previous: ${TRUSTED_DEVICE_HMAC_KEY_PREVIOUS} # clave anterior (verify only)
  hmac-key-grace-days: ${TRUSTED_DEVICE_HMAC_GRACE_DAYS:30}
```

**Flujo de verificación:**
1. Intentar verificar con clave actual → si OK, aceptar
2. Si falla → intentar verificar con clave anterior (si aún dentro de ventana de gracia)
3. Si falla → solicitar OTP (comportamiento actual)

**Flujo de rotación operativa:**
1. Generar nueva clave
2. Mover `HMAC_KEY` → `HMAC_KEY_PREVIOUS`
3. Establecer nueva clave en `HMAC_KEY`
4. Desplegar — todos los tokens antiguos siguen siendo válidos durante 30 días
5. Tras 30 días → vaciar `HMAC_KEY_PREVIOUS`

**Requiere ADR-009** — documenta la decisión de clave dual y el protocolo de rotación.

---

## Nuevo credential Sprint 5 (README-CREDENTIALS.md — ACT-15 pattern)

```markdown
| bankportal-trusted-device-hmac-key-previous | Secret text | Clave HMAC anterior — ventana de gracia rotación FEAT-003 |
```

Este credential se establece durante la rotación operativa — vacío en instalación nueva.

---

## Risk Register — Sprint 5

| ID | Riesgo | P | I | Exposición | Plan |
|---|---|---|---|---|---|
| R-S5-001 | DEBT-006: rotación HMAC invalida tokens en prod | M | M | 🟡 | ✅ ACT-17 — clave dual en Sprint 5 |
| R-S5-002 | OpenAPI desactualizada en prod | B | M | 🟡 | ✅ ACT-19 día 1 bloqueante |
| R-F4-001 | SSE threads en servidor US-305 | M | M | 🟡 | SseEmitter con pool; 1 conexión por usuario |
| R-F4-002 | Tabla notifications crece sin límite | B | B | 🟢 | @Scheduled cleanup nocturno (patrón US-204) |
| R-F4-003 | Badge incorrecto si SSE cae | M | B | 🟢 | Polling fallback 60s |

---

## Gates HITL Sprint 5

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 ADR-009 + LLD-003 | ADR-009 + 2 LLD | Tech Lead | 24 h |
| 🔒 Code Review | CR-FEAT-004-sprint5.md | Tech Lead | 24 h/NC |
| 🔒 QA Doble Gate | QA-FEAT-004-sprint5.md | QA Lead + PO | 24 h |
| 🔒 Go/No-Go PROD v1.4.0 | RELEASE-v1.4.0.md | Release Manager | 4 h |

---

## Definición de Hecho — Sprint 5

Además del DoD base (CLAUDE.md v1.1) y los nuevos criterios de ACT-18/20:
- [ ] `openapi-2fa.yaml` v1.3.0 con endpoints FEAT-003 — verificado en CR (ACT-19/20)
- [ ] LLD-backend-trusted-devices.md + LLD-frontend-trusted-devices.md aprobados (ACT-18)
- [ ] ADR-009 (clave dual HMAC) aprobado antes del desarrollo de DEBT-006
- [ ] DEBT-006: `ValidateTrustedDeviceUseCase` verifica con clave actual → clave anterior → OTP
- [ ] DEBT-006: rotación operativa documentada en README-CREDENTIALS.md
- [ ] US-301: `GET /api/v1/notifications` paginado + filtros operativos
- [ ] US-302: `PUT /api/v1/notifications/read` + `PUT /api/v1/notifications/read-all` operativos
- [ ] US-303: badge en header con count en tiempo real
- [ ] US-304: deep-links a sesión y dispositivo desde notificación
- [ ] US-305: SSE endpoint + reconexión automática + polling fallback
- [ ] **OpenAPI actualizada a v1.4.0** con todos los endpoints nuevos (ACT-11 + ACT-20)
- [ ] Playwright E2E ≥ 10 tests nuevos PASS en Jenkins
- [ ] Job @Scheduled limpieza de notifications > 90 días operativo

---

## Proyección de releases

| Release | Contenido | Fecha estimada |
|---|---|---|
| v1.4.0 | DEBT-006 + FEAT-003 docs + FEAT-004 | 2026-05-23 |
| v1.5.0 | FEAT-005 (por definir tras Sprint 5 Review) | 2026-06-06 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal · 2026-05-09*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 5*
