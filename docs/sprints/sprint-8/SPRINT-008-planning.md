# Sprint 8 — Planning
## BankPortal · FEAT-004 Centro de Notificaciones + DEBT-009/010
*SOFIA Scrum Master Agent · 2026-03-17*

---

## 1. Sprint Goal

> **"Dar al usuario visibilidad completa y en tiempo real de la actividad de seguridad
> de su cuenta, cerrando la deuda técnica del flujo context-pending."**

Sprint 8 arranca FEAT-004 (Centro de Notificaciones de Seguridad) completo —
las 5 User Stories incluidas — más los dos ítems de deuda técnica identificados
al cierre de Sprint 7: DEBT-009 (JWT blacklist tras confirm-context) y DEBT-010
(centralización de extractIpSubnet).

---

## 2. Métricas de referencia

| Indicador | Valor |
|---|---|
| Velocidad media (7 sprints) | 23.85 SP |
| Capacidad Sprint 8 | **24 SP** |
| Features en curso | FEAT-004 (inicio) |
| Deuda técnica pendiente | DEBT-009, DEBT-010 |
| Release objetivo | v1.8.0 — 2026-03-31 |

---

## 3. Backlog del sprint

| ID | Descripción | SP | Tipo | Prioridad | Semana |
|---|---|---|---|---|---|
| DEBT-009 | JWT blacklist + issueFullSession() post confirmContext | 3 | Tech Debt | Must Have | S1 |
| DEBT-010 | Centralizar extractIpSubnet() en DeviceFingerprintService | 2 | Tech Debt | Should Have | S1 |
| ACT-31 | OpenAPI v1.5.0: endpoints FEAT-004 + SSE documentado | 1 | Documental | Must Have | S1 |
| V9 Flyway | user_notifications + notification_preferences tables | 2 | Infra | Must Have | S1 |
| US-301 | Ver historial de notificaciones paginado (90 días) | 4 | Feature | Must Have | S1 |
| US-302 | Marcar notificaciones como leídas (individual + todas) | 2 | Feature | Must Have | S1 |
| US-303 | Badge de notificaciones no leídas en header | 3 | Feature | Must Have | S2 |
| US-304 | Acciones directas desde notificación (deep-links) | 4 | Feature | Should Have | S2 |
| US-305 | Notificaciones en tiempo real vía SSE | 3 | Feature | Should Have | S2 |
| **Total** | | **24 SP** | | | |

---

## 4. Distribución por semana

### Semana 1 — 12 SP (fundamentos + backend core)

```
DEBT-009 [3 SP]  → JwtBlacklistService + issueFullSession() + test
DEBT-010 [2 SP]  → refactor extractIpSubnet centralizado
ACT-31   [1 SP]  → OpenAPI v1.5.0 + CR checklist
V9 Flyway [2 SP] → user_notifications + notification_preferences
US-301   [4 SP]  → NotificationHistoryUseCase + API + Angular NotificationCenterComponent
```

### Semana 2 — 12 SP (badge + tiempo real + acciones)

```
US-302 [2 SP]  → MarkNotificationsUseCase (individual + bulk) + optimistic UI
US-303 [3 SP]  → UnreadCountService + BadgeComponent (polling fallback 60s)
US-304 [4 SP]  → NotificationActionService (deep-links + revoke-from-notification)
US-305 [3 SP]  → SseNotificationController (Spring SseEmitter) + Angular SseService
```

---

## 5. Prerrequisitos técnicos día 1

| Pre-requisito | Bloqueante para | Acción |
|---|---|---|
| DEBT-009 completo antes de cualquier test US-603 en STG | Cierre técnico FEAT-006 | Día 1 Sprint 8 |
| ADR-012: diseño SSE (pool, 1 conn/usuario, reconexión) | US-305 | Gate 2 Arquitectura |
| LLD-008: NotificationCenter backend + frontend | US-301/302/303/304 | Gate 2 Arquitectura |
| LLD-009: SSE + JwtBlacklist | US-305, DEBT-009 | Gate 2 Arquitectura |
| Flyway V9 aprobado antes de código de US-301 | US-301 | Día 1 Sprint 8 |

---

## 6. Dependencias y riesgos Sprint 8

### Dependencias
- `audit_log` tabla disponible ✅ (US-301 lee de ella)
- FEAT-001/002/003/004 eventos generados ✅
- SSE requiere Spring WebFlux **o** `SseEmitter` asíncrono en Spring MVC — decisión ADR-012

### Riesgos priorizados

| ID | Riesgo | P | I | Mitigación |
|---|---|---|---|---|
| R-S8-001 | SSE connections abiertas consumen threads (R-F4-001) | M | M | SseEmitter pool limitado a 200 conn; 1 conn/usuario enforced en SecurityFilterChain |
| R-S8-002 | JWT blacklist en memoria — no escala a múltiples instancias | M | A | Redis para blacklist (DEBT-009); si Redis no disponible, TTL natural de 30min |
| R-S8-003 | Deep-links US-304 desde notificaciones rotos si la sesión ya expiró | B | B | Validar estado de sesión al hacer clic; mostrar mensaje contextual si expirada |
| R-S8-004 | user_notifications crece sin límite | B | B | Job @Scheduled nocturno purga > 90 días (patrón US-204, ya establecido) |

---

## 7. Definition of Done Sprint 8

- [ ] DEBT-009: JWT blacklist operativo en STG — test E2E confirm-context → full-session completo
- [ ] DEBT-010: cero duplicaciones de extractIpSubnet en codebase
- [ ] US-301: historial paginado 20/pág, filtros tipo evento, vacío state, 90 días
- [ ] US-302: mark-as-read individual + bulk, persiste entre sesiones
- [ ] US-303: badge actualizado en tiempo real (SSE o polling fallback 60s)
- [ ] US-304: deep-links operativos para sesiones, dispositivos; revoke desde notification
- [ ] US-305: SSE reconexión automática ≤5s; toast alertas críticas 8s auto-dismiss
- [ ] Flyway V9 ejecutado en STG sin errores
- [ ] OpenAPI v1.5.0 publicada con endpoints SSE documentados (ACT-31)
- [ ] Tests: ≥ 70 nuevos (unit + IT + E2E)
- [ ] 0 defectos críticos
- [ ] 5/5 gates HITL aprobados

---

## 8. Gates HITL Sprint 8

| Gate | Responsable | Contenido |
|---|---|---|
| Gate 1 — Planning | Product Owner | Este documento |
| Gate 2 — Arquitectura | Tech Lead | ADR-012 (SSE) + LLD-008 + LLD-009 |
| Gate 3 — Code Review S1 | Tech Lead | DEBT-009/010 + US-301 |
| Gate 4 — Code Review S2 | Tech Lead | US-302/303/304/305 |
| Gate 5 — QA | QA Lead | ≥70 tests, 0 defectos críticos |
| Gate 6 — DevOps | DevOps | Commit + merge + release v1.8.0 |

> Sprint 8 añade un gate adicional (6 en lugar de 5) dado el incremento de complejidad
> por SSE y JWT blacklist — dos subsistemas nuevos de infraestructura.

---

## 9. Release planning actualizado

| Release | Contenido | ETA |
|---|---|---|
| v1.7.0 | FEAT-006 completo (sprint 7) | 2026-03-24 — **pending merge** |
| v1.8.0 | FEAT-004 completo + DEBT-009/010 | 2026-03-31 |
| v1.9.0 | FEAT-007 (por definir en Sprint 8 Review) | 2026-04-14 |

---

*Generado por SOFIA Scrum Master Agent · BankPortal Sprint 8 · 2026-03-17*
*CMMI Level 3 — PP SP 2.1 Plan de proyecto actualizado*
