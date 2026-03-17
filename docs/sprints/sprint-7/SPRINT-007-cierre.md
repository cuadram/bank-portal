# Sprint 7 — Informe de Cierre
## BankPortal · FEAT-006 Autenticación Contextual y Bloqueo de Cuenta
*SOFIA Scrum Master Agent · 2026-03-17*

---

## 1. Resumen ejecutivo

Sprint 7 completado satisfactoriamente. Se entregó FEAT-006 al completo (17 SP de capacidad nueva)
más DEBT-008 (3 SP deuda técnica) y el cierre de FEAT-005 / US-403 (3 SP).

| Indicador | Valor |
|---|---|
| Sprint Goal | Implementar capa de protección proactiva PCI-DSS 4.0 req. 8.3.4 |
| Story Points planificados | 24 SP |
| Story Points completados | 24 SP |
| Velocidad sprint | 24 SP |
| Velocidad media histórica | 23.7 SP/sprint (7 sprints) |
| Defectos críticos en QA | 0 |
| Gates HITL completados | 5/5 |

---

## 2. Trabajo completado

| ID | Descripción | SP | Semana | Commit |
|---|---|---|---|---|
| ACT-30 | OpenAPI v1.4.0 claims JWT + CR checklist | 1 | S1 | - |
| DEBT-008 | SecurityDashboard CompletableFuture.allOf() | 3 | S1 | - |
| US-403 | Preferencias de seguridad unificadas (FEAT-005 cierre) | 3 | S1 | - |
| US-601 | Bloqueo automático de cuenta (ventana 24h, aviso desde intento 7) | 5 | S1 | - |
| US-602 | Desbloqueo por enlace email (token TTL 1h, anti-enumeration) | 3 | S2 | 118747f |
| US-603 | Login contextual — scope context-pending + ADR-011 | 5 | S2 | 118747f |
| US-604 | Historial de cambios de configuración (90 días, PCI-DSS 10.2) | 4 | S2 | (este sprint) |

**Total: 24/24 SP — 100% del sprint completado.**

---

## 3. Artefactos técnicos producidos

### Backend (Spring Boot)
- `AccountLockUseCase.java` — bloqueo progresivo, US-601
- `AccountUnlockUseCase.java` — desbloqueo email HMAC TTL 1h, US-602
- `LoginContextUseCase.java` — sealed interface ContextEvaluationResult, ADR-011, US-603
- `SecurityConfigHistoryUseCase.java` — historial 90d, CONFIG_EVENT_TYPES, US-604
- `SecurityConfigHistoryController.java` — GET /api/v1/security/config-history, US-604
- `AccountAndContextController.java` — /account/unlock + /auth/confirm-context
- `SecurityDashboardUseCase.java` — CompletableFuture.allOf() 6 queries paralelas, DEBT-008
- `V8__account_lock_and_known_subnets.sql` — Flyway V8

### Frontend (Angular 17 standalone)
- `AccountLockedComponent` — HTTP 423, solicitud de desbloqueo, US-601/602
- `ContextConfirmComponent` — deep-link confirm-context, 5 estados UI, WCAG 2.1, US-603
- `ConfigHistoryComponent` — historial con unusualLocation badge, filtro por período, US-604

### Decisiones arquitectónicas
- `ADR-011` — scope JWT context-pending, claim pendingSubnet, flujo US-603

### Tests
| Nivel | US-601 | US-602 | US-603 | US-604 | Total |
|---|---|---|---|---|---|
| Unit | 8 | 8 | 9 | 6 | 31 |
| IT (Web) | 5 | 5 | 4 | 5 | 19 |
| Angular | - | - | 6 | - | 6 |
| E2E Playwright | 6 | 5 | 6 | 8 | 25 |
| **Total** | **19** | **18** | **25** | **19** | **81** |

---

## 4. Criterios de aceptación verificados

### PCI-DSS 4.0
- req. 8.3.4: bloqueo por intentos fallidos — US-601 ✅
- req. 8.3.4: desbloqueo por proceso controlado — US-602 ✅
- req. 10.2: historial de cambios de configuración 90 días — US-604 ✅

### Seguridad
- Anti-enumeration en /account/unlock (204 siempre) ✅
- Tokens single-use: unlock TTL 1h + confirm-context TTL 30min ✅
- scope=context-pending segregado de full-session (ADR-011) ✅
- userId ownership verificado en confirmContext ✅
- Historial inmutable — solo lectura (R-F6-006) ✅

### Accesibilidad
- WCAG 2.1 AA: aria-live en ContextConfirmComponent ✅
- Roles semánticos en todos los componentes nuevos ✅

---

## 5. Deuda técnica identificada

| ID | Descripción | Prioridad | Sprint sugerido |
|---|---|---|---|
| DEBT-009 | jwtService.blacklist() + issueFullSession() tras confirmContext | Alta | Sprint 8 |
| DEBT-010 | DeviceFingerprintService.extractIpSubnet() — eliminar duplicación | Media | Sprint 9 |
| SUG-S7-001 | Test de carga: benchmark DEBT-008 (objetivo <30ms) en STG | Media | Sprint 8 |

---

## 6. Métricas de calidad

| Métrica | Valor | Objetivo | Estado |
|---|---|---|---|
| Tests totales sprint | 81 | ≥ 60 | ✅ |
| Defectos críticos | 0 | 0 | ✅ |
| Cobertura nuevos use cases | 100% escenarios DoD | 100% | ✅ |
| Gates HITL aprobados | 5/5 | 5/5 | ✅ |
| Flyway migrations | V8 sin errores | sin errores | ✅ |

---

## 7. Release planning

| Release | Contenido | Rama | Estado |
|---|---|---|---|
| v1.7.0 | FEAT-006 completo (US-601/602/603/604) + DEBT-008 + US-403 | feature/FEAT-006-sprint7-semana2 | Pending merge → develop → main |

Fecha estimada de release v1.7.0: **2026-03-24** (una semana desde cierre sprint).

---

## 8. Retrospectiva rápida (CMMI L3 — PMC SP 1.6)

**Lo que funcionó bien:**
- ADR-011 aprobado en Gate 2 sin ciclos de revisión adicionales
- Sealed interface ContextEvaluationResult eliminó runtime checks en el controller
- CompletableFuture.allOf() DEBT-008 mejoró latencia estimada ~4x

**Áreas de mejora:**
- DEBT-009 (JWT blacklist) debería haberse incluido en Sprint 7 — mover a Sprint 8 como Must Have
- Los tests de integración con @WebMvcTest requieren mock de JwtDecoder — añadir al template de sprint

---

*Generado por SOFIA Scrum Master Agent · BankPortal Sprint 7 · 2026-03-17*
*CMMI Level 3 — PMC + PP proceso de medición aplicado*
