# Sprint 1 — Plan de Sprint

## Metadata

| Campo | Valor |
|---|---|
| Sprint | Sprint 1 |
| Proyecto | BankPortal — Banco Meridian |
| Período | 2026-03-16 → 2026-03-28 (10 días hábiles) |
| Sprint Goal | Backend 2FA completamente funcional: enrolamiento TOTP, verificación OTP en login y gestión de códigos de recuperación |
| Velocidad objetivo | 22 SP (baseline conservador 70%) |
| Feature cubierta | FEAT-001 — Autenticación de Doble Factor (2FA) |

---

## Capacidad del equipo — Sprint 1

| Factor | Detalle | Horas |
|---|---|---|
| Capacidad bruta | 2 developers × 10 días × 8h | 160h |
| Ceremonias | Planning + Daily×10 + Review + Retro (estimado) | −16h |
| Buffer impedimentos (10%) | — | −14h |
| **Capacidad neta** | | **130h** |
| **Ajuste primer sprint (70%)** | Sin datos históricos de velocidad | **~91h efectivas** |
| **SP objetivo** | Ratio estimado 4h/SP | **~22 SP** |

---

## Backlog seleccionado para Sprint 1

| ID | User Story | SP | Prioridad | Agente responsable | Estado inicial |
|---|---|---|---|---|---|
| US-001 | Activar 2FA con TOTP (enrolamiento) | 8 | Must Have | Java Developer + Angular Dev | TODO |
| US-002 | Verificar OTP en flujo de login | 8 | Must Have | Java Developer | TODO |
| US-006 | Setup de infraestructura TOTP | 3 | Must Have | Java Developer | TODO |
| US-003 | Generar y gestionar códigos de recuperación | 5 | Must Have | Java Developer | TODO |

**Total Sprint 1: 24 SP** *(+2 SP sobre objetivo — justificado porque US-006 es setup puro, bajo riesgo)*

---

## Backlog diferido a Sprint 2

| ID | User Story | SP | Prioridad | Motivo diferimiento |
|---|---|---|---|---|
| US-004 | Desactivar 2FA con confirmación | 5 | Should Have | Capacidad Sprint 1 cubierta; depende de US-001/002 |
| US-005 | Auditoría de eventos 2FA | 5 | Should Have | Requiere modelo de datos estabilizado en Sprint 1 |
| US-007 | Tests de integración E2E 2FA | 6 | Must Have | E2E requiere funcionalidad completa de Sprint 1+2 |

**Total Sprint 2: 16 SP** *(incluye integración, frontend completo y QA E2E)*

---

## Definition of Done — Sprint 1

Todos los items de Sprint 1 deben cumplir:

- [ ] Código en rama `feature/FEAT-001-2fa-backend` con PR creado
- [ ] Unit tests con cobertura ≥ 80% en los servicios nuevos
- [ ] Code Review completado sin NCs BLOQUEANTES pendientes
- [ ] Secretos TOTP cifrados con AES-256 (validado en Code Review)
- [ ] Endpoints protegidos por JWT (validado en Code Review)
- [ ] Artefactos en `docs/` actualizados (SRS, HLD, LLD)
- [ ] No hay riesgos R-001 o R-003 sin mitigación implementada

---

## Tablero Jira — Estado inicial Sprint 1

```
BACKLOG          │ READY              │ IN PROGRESS │ CODE REVIEW │ QA │ DONE
─────────────────┼────────────────────┼─────────────┼─────────────┼────┼──────
US-004 (5 SP)    │ US-006 (3 SP) ← 1° │             │             │    │
US-005 (5 SP)    │ US-001 (8 SP)      │             │             │    │
US-007 (6 SP)    │ US-002 (8 SP)      │             │             │    │
                 │ US-003 (5 SP)      │             │             │    │
```

> El equipo jalará trabajo de READY → IN PROGRESS respetando WIP limit de 3 por agente.
> US-006 (setup) entra primero para desbloquear dependencias técnicas.

---

## Rama Git

```
feature/FEAT-001-2fa-backend
```

---

## Acta de Sprint Planning

- **Fecha:** 2026-03-14
- **Participantes:** SM (SOFIA), PO (Seguridad TI — Banco Meridian), Tech Lead, Dev Backend, Dev Frontend
- **Sprint Goal acordado:** "Al finalizar Sprint 1, el backend de 2FA estará completamente funcional: un usuario puede enrolar su app autenticadora, el login exige OTP válido, y dispone de códigos de recuperación de un solo uso."
- **Capacidad acordada:** 24 SP
- **Riesgos comunicados al equipo:** R-001 (desincronización reloj), R-003 (brute-force), R-005 (compatibilidad librería)

---

## 🔒 GATE — Aprobación Product Owner

**Tipo:** Inclusión de FEAT-001 / US-001, US-002, US-003, US-006 en Sprint 1
**Aprobador requerido:** Product Owner (Seguridad TI — Banco Meridian)
**SLA:** 24h desde presentación del plan
**Estado:** ⏳ WAITING_FOR_APPROVAL
