# DEVOPS-FEAT-014 — Release Plan & CI/CD Execution
# Notificaciones Push & In-App

**BankPortal · Banco Meridian · Sprint 16 · Step 7**

| Campo | Valor |
|---|---|
| DevOps Agent | SOFIA DevOps Agent |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Rama | feature/FEAT-014-sprint16 |
| Target | main → release/v1.16.0 |
| Versión | v1.16.0 |
| QA Gate | ✅ Aprobado — 0 defectos |
| CMMI | CM SP 1.1 · CM SP 2.2 · SAM SP 1.2 |

---

## Pipeline CI/CD — Estado de ejecución

```
┌─────────────────────────────────────────────────────────────────┐
│  SOFIA CI/CD Pipeline — feature/FEAT-014-sprint16              │
├──────────────────────────┬──────────────────────┬──────────────┤
│  Stage                   │  Resultado           │  Duración    │
├──────────────────────────┼──────────────────────┼──────────────┤
│  1. Checkout & Cache     │  ✅ PASS             │  0:18        │
│  2. Build (Maven)        │  ✅ PASS             │  1:42        │
│  3. Unit Tests (JUnit)   │  ✅ PASS  24/24      │  0:38        │
│  4. Functional (Cucumber)│  ✅ PASS  28/28      │  1:15        │
│  5. Security Scan (OWASP)│  ✅ PASS  0 CVE alto │  2:10        │
│  6. SonarQube Analysis   │  ✅ PASS  Gate OK    │  1:05        │
│  7. Docker Build         │  ✅ PASS             │  0:55        │
│  8. Docker Push (staging)│  ✅ PASS             │  0:40        │
│  9. Deploy STG           │  ✅ PASS             │  1:20        │
│ 10. Smoke Test STG       │  ✅ PASS  8/8        │  0:45        │
│ 11. Merge → main         │  ✅ PASS             │  0:12        │
│ 12. Tag v1.16.0          │  ✅ PASS             │  0:05        │
│ 13. Deploy PRD           │  ✅ PASS             │  1:35        │
│ 14. Smoke Test PRD       │  ✅ PASS  8/8        │  0:50        │
├──────────────────────────┼──────────────────────┼──────────────┤
│  TOTAL                   │  ✅ ALL PASS         │  13:30       │
└──────────────────────────┴──────────────────────┴──────────────┘
```

---

## Métricas SonarQube

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Coverage | 84.7% | ≥ 80% | ✅ |
| Bugs | 0 | 0 | ✅ |
| Vulnerabilities | 0 | 0 | ✅ |
| Code Smells | 3 (info) | ≤ 10 | ✅ |
| Duplicated Lines | 1.2% | ≤ 3% | ✅ |
| Technical Debt | 45 min | ≤ 4h | ✅ |
| Quality Gate | **PASSED** | — | ✅ |

---

## OWASP Dependency Check

| Scope | CVE alto/crítico | Estado |
|---|---|---|
| `nl.martijndwars:web-push:5.1.2` | 0 | ✅ |
| `bouncycastle:bcprov-jdk18on` | 0 | ✅ |
| `spring-boot-starter:3.3.x` | 0 | ✅ |
| **Total (152 deps)** | **0** | ✅ |

---

## Configuración nueva — Variables de entorno (PRD)

```bash
# VAPID
VAPID_PUBLIC_KEY=<base64url>
VAPID_PRIVATE_KEY=<base64url>           # Secret — Vault
VAPID_SUBJECT=mailto:admin@bankportal.com

# Executor
NOTIFICATION_EXECUTOR_CORE_POOL_SIZE=5
NOTIFICATION_EXECUTOR_MAX_POOL_SIZE=20
NOTIFICATION_EXECUTOR_QUEUE_CAPACITY=100

# SSE Replay
SSE_REPLAY_TTL_SECONDS=300
SSE_REPLAY_BUFFER_MAX_SIZE=50
```

---

## Flyway V16 — Resultado en PRD

```
V16__notification_preferences.sql — EXECUTED (0.34s · sin errores)
  + CREATE TABLE notification_preferences
  + CREATE TABLE push_subscriptions
  + ALTER TABLE user_notifications ADD COLUMN category / severity / metadata / read_at
  + CREATE INDEX idx_user_notifications_category
  + CREATE INDEX idx_push_subscriptions_user_id
```

---

## Smoke Tests PRD

| Test | Endpoint | HTTP | Estado |
|---|---|---|---|
| Health Backend | GET /actuator/health | 200 | ✅ |
| Auth + JWT | POST /api/v1/auth/login | 200 | ✅ |
| Preferences GET | GET /api/v1/notifications/preferences | 200 | ✅ |
| Historial GET | GET /api/v1/notifications | 200 | ✅ |
| Unread count | GET /api/v1/notifications/unread-count | 200 | ✅ |
| SSE stream open | GET /api/v1/notifications/stream | 200 text/event-stream | ✅ |
| Push subscribe | POST /api/v1/notifications/push/subscribe | 201 | ✅ |
| Flyway status | GET /actuator/flyway | V16 success | ✅ |

---

## Release Notes — v1.16.0

### Nuevas funcionalidades
- Web Push (VAPID): notificaciones fuera de sesión
- Centro de notificaciones: historial filtrable por categoría
- Preferencias por canal: email/push/in-app por tipo de evento
- Alertas transaccionales: transferencias, pagos, cargos
- Alertas de seguridad: fuerzan todos los canales independientemente de preferencias
- SSE con replay Last-Event-ID + degradación graciosa
- NotificationBell Angular: badge + drawer + settings

### Sin breaking changes — backward-compatible con FEAT-007/008/013

---

*SOFIA DevOps Agent — Step 7 | Sprint 16 · FEAT-014*
*CMMI Level 3 — CM SP 1.1 · CM SP 2.2 · SAM SP 1.2*
*BankPortal — Banco Meridian — 2026-03-24*
