# Sprint 8 — Informe de Cierre
## BankPortal · FEAT-004 Centro de Notificaciones + DEBT-009/010
*SOFIA Scrum Master Agent · 2026-03-17*

---

## 1. Resumen ejecutivo

| Indicador | Valor |
|---|---|
| Sprint Goal | Visibilidad completa en tiempo real de actividad de seguridad |
| Story Points planificados | 24 SP |
| Story Points completados | 24 SP |
| Velocidad sprint | 24 SP |
| Velocidad media (8 sprints) | 23.875 SP/sprint |
| Tests nuevos | 59 |
| Defectos críticos | 0 |
| Gates HITL completados | 6/6 |

---

## 2. Trabajo completado

| ID | Descripción | SP | Semana | Commit |
|---|---|---|---|---|
| DEBT-009 | JWT blacklist Redis post-confirmContext | 3 | S1 | 6c1e311 |
| DEBT-010 | extractIpSubnet /24 centralizado | 2 | S1 | 6c1e311 |
| Flyway V9 | user_notifications + notification_preferences | 2 | S1 | 6c1e311 |
| ACT-31 | OpenAPI v1.5.0 endpoints FEAT-004 + SSE | 1 | S2 | 6fea87c |
| US-301 | Historial paginado 90d filtros eventType/unreadOnly | 4 | S1 | 6c1e311 |
| US-302 | Mark-as-read individual + bulk + SSE broadcast | 2 | S1 | 6c1e311 |
| US-303 | Badge unread-count @Cacheable 30s | 3 | S1 | 6c1e311 |
| US-304 | Deep-links + revoke session desde notificación | 4 | S2 | 6fea87c |
| US-305 | SSE stream + heartbeat + Angular SseService | 3 | S2 | 6fea87c |

**Total: 24/24 SP — 100%**

---

## 3. Artefactos técnicos

### Backend
- `JwtBlacklistService` — Redis TTL, integración SseRegistry (DEBT-009)
- `DeviceFingerprintService` — extractIpSubnet /24, maskIp() (DEBT-010)
- `V9__notification_center.sql` — 2 tablas + 3 índices + compatibilidad V7
- `NotificationHistoryUseCase` — paginación 90d, filtros, audita
- `MarkNotificationsUseCase` — mark individual/bulk + SSE broadcast
- `UnreadCountService` — @Cacheable 30s, @CacheEvict
- `NotificationController` — 4 endpoints US-301/302/303
- `NotificationActionService` — resolveActionUrl() + revokeSession() US-304
- `SseNotificationController` — GET /stream + POST /{id}/revoke-session US-305
- `SseHeartbeatScheduler` — @Scheduled heartbeat 30s (ADR-012)
- `SseRegistry` + `SseEvent` — pool 200 conn, 1/usuario (ADR-012)

### Frontend
- `SseNotificationService` — connect/disconnect, on(type), polling fallback 60s
- `NotificationCenterComponent` — US-301/302/304/305, toasts SSE, WCAG 2.1
- `notification.service.ts` — HTTP client wrapper

### Documentación
- `openapi-2fa.yaml` v1.5.0 — ACT-31 completo
- `ADR-012` — SseRegistry pool design
- `LLD-008` + `LLD-009` — Gate 2 arquitectura

---

## 4. Tests

| Nivel | S1 | S2 | Total |
|---|---|---|---|
| Unit | 25 | 9 | **34** |
| IT (Web) | 5 | 6 | **11** |
| E2E Playwright | — | 13 | **13** |
| **Total** | **30** | **28** | **59** |

---

## 5. Deuda técnica identificada Sprint 8

| ID | Descripción | Prioridad | Sprint sugerido |
|---|---|---|---|
| DEBT-011 | Redis Pub/Sub para SSE escalado horizontal (múltiples pods) | Media | Sprint 9 |
| DEBT-012 | Job nocturno purga user_notifications > 90 días | Media | Sprint 9 |
| SUG-S8-001 | Test de carga SSE: 200 conexiones concurrentes en STG | Media | Sprint 9 |

---

## 6. Release planning actualizado

| Release | Contenido | ETA | Estado |
|---|---|---|---|
| v1.7.0 | FEAT-006 Sprint 7 | 2026-03-24 | Pending merge |
| **v1.8.0** | **FEAT-004 Sprint 8** | **2026-03-31** | **Pending merge** |
| v1.9.0 | FEAT-007 (por definir Sprint 9) | 2026-04-14 | Backlog |

---

## 7. Retrospectiva (CMMI L3 — PMC SP 1.6)

**Lo que funcionó bien:**
- Gate 2 con ADR-012 resolvió el diseño SSE antes del código — cero retrabajo
- SseRegistry con 1 conn/usuario simplificó el broadcast y eliminó condiciones de carrera
- DEBT-009 completado en día 1 Semana 1 — desbloqueó tests E2E de US-603 en STG

**Áreas de mejora:**
- DEBT-011 (Redis Pub/Sub) debería planificarse antes de escalar a multi-pod
- El NotificationCenterComponent heredó lógica SSE mezclada — refactorizar en Sprint 9 a
  SseNotificationService dedicado (ya generado como `core/sse/sse-notification.service.ts`)

---

*SOFIA Scrum Master Agent · BankPortal Sprint 8 · 2026-03-17*
*CMMI Level 3 — PMC + PP proceso de medición aplicado · Velocidad media: 23.875 SP/sprint*
