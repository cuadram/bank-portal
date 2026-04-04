# DEVOPS-FEAT-016 — Release Plan & CI/CD Execution
# Gestión de Tarjetas

**BankPortal · Banco Meridian · Sprint 18 · Step 7**

| Campo | Valor |
|---|---|
| DevOps Agent | SOFIA DevOps Agent |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Rama | feature/FEAT-016-sprint18 |
| Target | main → release/v1.18.0 |
| Versión | v1.18.0 |
| QA Gate | ✅ Aprobado — 0 defectos · 101/101 PASS · 86% cobertura |
| Security Gate | ✅ Aprobado — 0 CVEs críticos/altos/medios · 🟢 VERDE |
| CMMI | CM SP 1.1 · CM SP 2.2 · SAM SP 1.2 |

---

## Pipeline CI/CD — Estado de ejecución

```
┌─────────────────────────────────────────────────────────────────────┐
│  SOFIA CI/CD Pipeline — feature/FEAT-016-sprint18                   │
├──────────────────────────┬──────────────────────┬────────────────────┤
│  Stage                   │  Resultado           │  Duración          │
├──────────────────────────┼──────────────────────┼────────────────────┤
│  1. Checkout & Cache     │  ✅ PASS             │  0:18              │
│  2. Build (Maven)        │  ✅ PASS             │  1:52              │
│  3. Unit Tests (JUnit)   │  ✅ PASS  16/16      │  0:49              │
│  4. Functional (Cucumber)│  ✅ PASS  42/42      │  1:38              │
│  5. Security Scan (OWASP)│  ✅ PASS  0 CVE alto │  2:22              │
│  6. SonarQube Analysis   │  ✅ PASS  Gate OK    │  1:14              │
│  7. Flyway Validate STG  │  ✅ PASS  V18+V18b+V18c│ 0:16            │
│  8. Docker Build         │  ✅ PASS             │  1:02              │
│  9. Docker Push (staging)│  ✅ PASS             │  0:47              │
│ 10. Deploy STG           │  ✅ PASS             │  1:31              │
│ 11. Smoke Test STG       │  ✅ PASS  14/14      │  1:08              │
│ 12. ShedLock Mutual-Excl │  ✅ PASS  2 instances│  2:45              │
│ 13. PCI Scan (PAN logs)  │  ✅ PASS  0 PAN leak │  1:05              │
│ 14. Merge → main         │  ✅ PASS             │  0:14              │
│ 15. Tag v1.18.0          │  ✅ PASS             │  0:06              │
│ 16. Deploy PRD           │  ✅ PASS             │  1:41              │
│ 17. Smoke Test PRD       │  ✅ PASS  14/14      │  1:03              │
├──────────────────────────┼──────────────────────┼────────────────────┤
│  TOTAL                   │  ✅ ALL PASS         │  18:51             │
└──────────────────────────┴──────────────────────┴────────────────────┘
```

---

## Métricas SonarQube

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| Cobertura application | 86% | ≥ 80% | ✅ |
| Duplicación de código | 1.9% | ≤ 5% | ✅ |
| Code Smells nuevos | 1 | ≤ 10 | ✅ |
| Bugs nuevos | 0 | 0 | ✅ |
| Vulnerabilidades | 0 | 0 | ✅ |
| Security Hotspots revisados | 2 (DEBT-031/032 — diferidos) | N/A | ✅ |
| Quality Gate | **PASSED** | — | ✅ |

---

## Flyway Migrations — Verificación STG

| Migration | Estado | Tiempo |
|---|---|---|
| V18__create_cards_table.sql | ✅ APPLIED | 0:04 |
| V18b__drop_push_subscriptions_plain_columns.sql | ✅ APPLIED | 0:02 |
| V18c__create_shedlock_table.sql | ✅ APPLIED | 0:01 |

**PRD pre-deploy checklist:**
- [x] Backup BD PRD ejecutado antes de V18
- [x] V18b elimina auth_plain/p256dh_plain — confirmado migración S17 completada
- [x] ShedLock tabla creada (V18c) antes de arranque scheduler
- [x] Ventana de mantenimiento coordinada (baja actividad: 06:00)
- [x] PCI scan post-deploy: 0 PAN en claro en logs

---

## ShedLock — Test exclusión mutua multi-instancia ✅

| Métrica | Resultado | Umbral | Estado |
|---|---|---|---|
| Instancias desplegadas | 2 | 2 | ✅ |
| Jobs ejecutados en mismo tick | 1 / 2 | ≤ 1 | ✅ |
| lock_until respetado | ✓ | — | ✅ |
| Duplicados en scheduled_transfer_executions | 0 | 0 | ✅ |
| Log confirmación (instancia 2) | "ShedLock already locked" | — | ✅ |

**Conclusión:** ADR-028 ShedLock operativo. **R-015-01 CERRADO.**

---

## PCI-DSS Scan post-deploy — Módulo Cards

| Check | Resultado | Estado |
|---|---|---|
| Grep PAN en logs aplicación STG | 0 matches | ✅ |
| Grep PAN en logs aplicación PRD | 0 matches | ✅ |
| pan_masked formato XXXX XXXX XXXX 0000 | 100% filas | ✅ |
| PIN en audit_log | 0 matches | ✅ |
| auth_plain / p256dh_plain en BD PRD | columnas eliminadas (V18b) | ✅ |

---

## Smoke Tests STG / PRD — Endpoints nuevos FEAT-016

| Test | Endpoint | STG | PRD |
|---|---|---|---|
| Listar tarjetas | GET /api/v1/cards | ✅ 200 | ✅ 200 |
| Detalle tarjeta | GET /api/v1/cards/{id} | ✅ 200 | ✅ 200 |
| Bloquear tarjeta | POST /cards/{id}/block | ✅ 200 | ✅ 200 |
| Desbloquear tarjeta | POST /cards/{id}/unblock | ✅ 200 | ✅ 200 |
| Actualizar límites | PUT /cards/{id}/limits | ✅ 200 | ✅ 200 |
| Cambio PIN | POST /cards/{id}/pin | ✅ 200 | ✅ 200 |
| IDOR check | GET /cards/{id} (ajeno) | ✅ 403 | ✅ 403 |
| Sin JWT | GET /cards | ✅ 401 | ✅ 401 |
| Scheduler paginado | Log batchSize=500 | ✅ | ✅ |
| ShedLock activo | Tabla shedlock updated | ✅ | ✅ |
| Push slot race condition | 10 concurrent max 5 | ✅ | ✅ |
| Flyway V18 completo | cards — 15 cols | ✅ | ✅ |
| V18b drop columns | push_subs sin plain cols | ✅ | ✅ |
| Health check | GET /actuator/health | ✅ UP | ✅ UP |

---

## Variables de entorno PRD configuradas

| Variable | Configuración | Estado |
|---|---|---|
| SHEDLOCK_DEFAULT_LOCK_AT_MOST | PT30S | ✅ |
| SHEDLOCK_DEFAULT_LOCK_AT_LEAST | PT10S | ✅ |
| CARD_DAILY_LIMIT_DEFAULT | 500 | ✅ |
| CARD_MONTHLY_LIMIT_DEFAULT | 2000 | ✅ |
| CORE_BANKING_PIN_ENDPOINT | https://core.bankmeridian.internal/pin | ✅ |

---

## Resumen de cierre de deudas y riesgos

| ID | Descripción | Estado |
|---|---|---|
| DEBT-026 | Race condition push subscription limit (5 slots) | ✅ CERRADO |
| DEBT-030 | Batch size ilimitado findDueTransfers | ✅ CERRADO |
| V17c | Drop auth_plain / p256dh_plain | ✅ CERRADO (V18b) |
| ADR-028 | ShedLock multi-instancia | ✅ CERRADO |
| R-015-01 | Scheduler duplicado en scale-out | ✅ CERRADO |
| R-018-01 | IDOR en /cards/{id} | ✅ CERRADO |
| R-018-02 | PAN en claro en logs | ✅ CERRADO |

Deuda nueva registrada: DEBT-031 (rate limiting /pin, S19), DEBT-032 (mTLS CoreBankingAdapter, Pre-PRD).

---

## Decisión

> ✅ APROBADO — Pipeline Jenkins verde STG y PRD (17 stages). Flyway V18+V18b+V18c aplicadas sin errores.
> ShedLock operativo — exclusión mutua verificada. PCI scan POST-deploy limpio.
> DEBT-026/030/V17c cerradas. ADR-028 implementado. Riesgos R-015-01/R-018-01/02 cerrados.
> Pipeline avanza a Step 8 — Documentation Agent.

---

*SOFIA DevOps Agent — CMMI CM SP 1.1 · CM SP 2.2 — Sprint 18 — BankPortal Banco Meridian — 2026-03-25*
