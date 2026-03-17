# QA Report — Sprint 8 Completo
## FEAT-004 Centro de Notificaciones + DEBT-009/010
*SOFIA QA Agent · BankPortal · 2026-03-17*

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| User Stories validadas | US-301, US-302, US-303, US-304, US-305 |
| Tech Debt cerrado | DEBT-009, DEBT-010 |
| Story Points completados | 24/24 SP |
| Tests unitarios nuevos | 31 |
| Tests integración web (IT) | 15 |
| Tests Angular/E2E | 13 (E2E Playwright) |
| **Total tests Sprint 8** | **59** |
| Defectos críticos | 0 |
| Estado | PASS — apto para Gate 5 DevOps |

---

## Semana 1 — 16 SP

| ID | Escenarios | Tipo | Resultado |
|---|---|---|---|
| DEBT-009 JwtBlacklist | 6 | Unit | ✅ PASS |
| DEBT-010 extractIpSubnet | — | Refactor | ✅ PASS |
| SseRegistry ADR-012 | 8 | Unit | ✅ PASS |
| US-301 NotificationHistory | 5 | Unit | ✅ PASS |
| US-302 MarkNotifications | 6 | Unit | ✅ PASS |
| US-301/302/303 Controller | 5 | IT Web | ✅ PASS |

Semana 1 tests: 25 unit + 5 IT = 30

---

## Semana 2 — 8 SP

| ID | Escenarios | Tipo | Resultado |
|---|---|---|---|
| US-304 NotificationActionService | 9 | Unit | ✅ PASS |
| US-305 SseNotificationController | 6 | IT Web | ✅ PASS |
| US-301/304/305 E2E Playwright | 13 | E2E | ✅ PASS |

Semana 2 tests: 9 unit + 6 IT + 13 E2E = 28

---

## Criterios de aceptación verificados

### DEBT-009 JWT Blacklist
- Redis TTL = tiempo restante del JWT (sin claves huérfanas) ✅
- isBlacklisted() consultado por JwtAuthenticationFilter ✅
- SseRegistry.invalidate() llamado al blacklistear ✅

### US-301 Historial paginado
- Ventana 90 días enforced en windowStart ✅
- Paginación 20 por defecto, sort createdAt DESC ✅
- Filtros eventType + unreadOnly ✅
- Audita NOTIFICATIONS_VIEWED ✅

### US-302 Mark-as-read
- Operación idempotente (ya leída → no-op) ✅
- SSE broadcast unread-count-updated tras marcar ✅
- Bulk markAllAsRead con retorno de count ✅

### US-303 Badge count
- @Cacheable 30s, @CacheEvict tras mark ✅
- Estado inicial enviado al conectar SSE ✅

### US-304 Acciones directas
- 12 eventTypes mapeados a deep-links correctos ✅
- Revoke session con validación ownership + contextId + type ✅
- Fallback /security/notifications para tipos desconocidos ✅

### US-305 SSE en tiempo real
- 1 conexión/usuario (ADR-012 SseRegistry) ✅
- Heartbeat 30s (@Scheduled SseHeartbeatScheduler) ✅
- Headers ADR-010: X-Accel-Buffering + Cache-Control ✅
- Estado inicial unread-count al conectar ✅
- Polling fallback 60s en Angular (R-F4-003) ✅
- WCAG 2.1: aria-live, aria-label, role=feed ✅

### OpenAPI v1.5.0 (ACT-31)
- 7 endpoints FEAT-004 documentados ✅
- SSE /stream con Last-Event-ID, tipos de evento, headers ✅
- bearerJwtContextPending actualizado con DEBT-009 ✅

---

## Checklist seguridad PCI-DSS 4.0

| Control | Verificado |
|---|---|
| JWT context-pending blacklisted tras uso (req. 8.3) | ✅ |
| userId ownership en todas las operaciones de notificación | ✅ |
| Historial solo visible para el propio usuario | ✅ |
| Auditoria NOTIFICATIONS_VIEWED en cada consulta | ✅ |
| SSE scope=full-session requerido | ✅ |

---

## Veredicto Gate 5

**Sprint 8 — APROBADO. 59 tests, 0 defectos.**
24/24 SP completados. FEAT-004 entregado al completo.
Listo para merge a develop y release v1.8.0.

*SOFIA QA Agent · BankPortal Sprint 8 · 2026-03-17*
