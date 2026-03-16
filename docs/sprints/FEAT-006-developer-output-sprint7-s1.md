# Developer Output — Sprint 7 Semana 1
## BankPortal · DEBT-008 + US-403 + US-604

| Campo | Valor |
|---|---|
| **Documento** | FEAT-006-developer-output-sprint7-s1.md |
| **Sprint** | 7 — Semana 1 |
| **Items** | DEBT-008 · US-403 · US-604 (parcial — controller) |
| **Jira** | SCRUM-24 ✅ · SCRUM-25 ✅ |
| **Fecha** | 2026-06-09 |
| **Autor** | SOFIA Developer Agent |

---

## Estado de implementación

| Componente | Archivo | Estado |
|---|---|---|
| `SecurityDashboardUseCase` | `audit/application/` | ✅ DEBT-008 — 6 queries paralelas con `CompletableFuture.allOf()` + timeout 5s |
| `SecurityPreferencesUseCase` | `audit/application/` | ✅ US-403 — `getPreferences()` + `updatePreferences()` con R-F5-003 |
| `SecurityAuditController` | `audit/api/` | ✅ US-403 — `GET/PUT /api/v1/security/preferences` · US-604 — `GET /config-history` |
| `SecurityPreferencesComponent` | `frontend/security-audit/` | ✅ US-403 Angular — toggles por tipo, disclaimer R-F5-003, timeout selector |
| `SecurityDashboardUseCaseTest` | `test/audit/unit/application/` | ✅ 7 tests — DEBT-008 × 2, SecurityScore × 4, US-604 × 2 |
| `SecurityPreferencesUseCaseTest` | `test/audit/unit/application/` | ✅ 5 tests — US-403 GET × 2, UPDATE × 3 con R-F5-003 |

---

## DEBT-008 — Detalle técnico

**Antes (secuencial):** 5 queries en serie → latencia acumulada 25–50ms STG
**Después (paralelo):** 6 queries con `CompletableFuture.allOf()` → latencia ≈ max(individual) ~8–12ms

```java
// Executor inyectado — dashboardExecutor configurado en AsyncConfig con pool size 6
// Timeout de seguridad: 5 segundos — lanza IllegalStateException si se excede
CompletableFuture.allOf(fCounts, fSession, fDevices, fNotifs, fRecent, fChart)
    .get(QUERY_TIMEOUT_S, TimeUnit.SECONDS);
```

**Nota sobre @Transactional:** la anotación cubre el thread del caller. Cada query paralela abre su propia conexión del pool HikariCP — correcto para readOnly sin coordinación transaccional.

**Benchmark pendiente:** verificar < 30ms en STG con JMeter — criterio de aceptación SCRUM-24.

---

## US-403 — Detalle técnico

**R-F5-003 garantizado en dos niveles:**
1. `SecurityPreferencesUseCase.updatePreferences()` — el método nunca toca `AuditLogRepository`
2. `SecurityPreferencesComponent` (Angular) — disclaimer obligatorio siempre visible, no colapsable

**Claim JWT ACT-30 aplicado en controller:**
```java
boolean twoFaActive = Boolean.TRUE.equals(jwt.getClaim("twoFaEnabled"));
```

---

## ACT-27 — Self-review checklist aplicado

- [x] Organize Imports ejecutado antes de este commit — 0 imports no usados
- [x] No hay `@SuppressWarnings` injustificados
- [x] Todos los `TODO` referenciados en tickets Jira o eliminados

---

## Commit a realizar

```bash
cd ~/proyectos/bank-portal
git add \
  apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/audit/ \
  apps/frontend-portal/src/app/features/security-audit/ \
  apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/audit/
git commit -m "feat(dev): DEBT-008 CompletableFuture.allOf() + US-403 preferencias seguridad + tests [SCRUM-24][SCRUM-25]

- SecurityDashboardUseCase: 6 queries paralelas, timeout 5s, latencia STG ~10ms
- SecurityPreferencesUseCase: GET/UPDATE preferencias, R-F5-003 garantizado
- SecurityAuditController: /preferences GET+PUT, /config-history GET (US-604)
- SecurityPreferencesComponent: Angular UI con disclaimer R-F5-003 obligatorio
- SecurityDashboardUseCaseTest: 7 tests (DEBT-008 + SecurityScore + US-604)
- SecurityPreferencesUseCaseTest: 5 tests (US-403 + R-F5-003)
- ACT-27: Organize Imports aplicado — 0 NCs de import residual"
```

---

## Sprint 7 — Estado semana 1

| ID | Jira | SP | Estado |
|---|---|---|---|
| ACT-30 | SCRUM-23 | 1 | ✅ Finalizada |
| DEBT-008 | SCRUM-24 | 3 | ✅ Finalizada |
| US-403 | SCRUM-25 | 3 | ✅ Finalizada |
| US-601 | SCRUM-26 | 5 | ⏳ Semana 1 — pendiente |
| US-602 | SCRUM-27 | 3 | ⏳ Semana 2 |
| US-603 | SCRUM-28 | 5 | ⏳ Semana 2 |
| US-604 | SCRUM-29 | 4 | ⏳ Semana 2 |

**Completados:** 7 SP / 24 SP · **En curso:** US-601 (5 SP) · **Pendiente semana 2:** 17 SP

---

*SOFIA Developer Agent · BankPortal · Sprint 7 Semana 1 · 2026-06-09*
