# Security Report — BankPortal Sprint 12 — FEAT-010
## Dashboard Analítico de Gastos y Movimientos

**Clasificación:** CONFIDENCIAL — USO INTERNO
**Fecha:** 2026-03-22
**Generado por:** SOFIA Security Agent — Step 5b
**CMMI:** VER SP 2.1 · VER SP 3.1 · PCI-DSS Req. 6.3

---

## 1. Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| 🟢 **Semáforo global** | **VERDE — Pipeline puede continuar a QA** |
| CVEs Críticos (CVSS ≥ 9.0) | **0** |
| CVEs Altos (CVSS ≥ 7.0) | **0** |
| CVEs Medios (CVSS ≥ 4.0) | **0** |
| Secrets detectados | **0** |
| Hallazgos SAST | **1** (informativo — RV-011 menor, Sprint 13) |
| Evidencia en producción | ✅ Backend healthy · V13 aplicada en BD |

---

## 2. Análisis SAST — Módulo dashboard FEAT-010

| ID | CWE | OWASP | Descripción | Archivo | Estado |
|---|---|---|---|---|---|
| S-SEC-001 | — | — | `resolvePeriod()` no valida formato YYYY-MM explícito — input malformado → 0 resultados silenciosos | `DashboardSummaryUseCase.java` | ⚠️ INFO — RV-011 (Sprint 13) |

### Comprobaciones OWASP — resultado

| Comprobación | Resultado | Evidencia |
|---|---|---|
| CWE-89 SQL Injection | ✅ PASS | JdbcClient con parámetros nombrados en todas las queries |
| CWE-798 Hard-coded credentials | ✅ PASS | Sin credentials en código del dashboard |
| OWASP A01 Broken Access Control | ✅ PASS | `@AuthenticationPrincipal` en 6/6 endpoints · `WHERE user_id = :userId` en todas las queries |
| OWASP A03 Injection | ✅ PASS | `@Min(1) @Max(20)` en `limit` · `@Min(1) @Max(24)` en `months` |
| OWASP A04 Insecure Design — caché | ✅ PASS | ADR-019: caché invalidada por evento tras nueva transacción |
| OWASP A05 Misconfiguration — perfil | ✅ PASS | `BankCoreRestAdapter` con `@Profile("production")` intacto |
| OWASP A09 Logging — PII en logs | ✅ PASS | `SpendingCategorizationEngine.mask()` trunca a 20 chars · sin PII completa |
| División por cero en variación % | ✅ PASS | `MonthComparisonUseCase.variation()` devuelve `null` si `previous == 0` |

---

## 3. Verificación DEBTs Sprint 11 en producción

| DEBT | Fix implementado | Verificación |
|---|---|---|
| DEBT-017 | `safeBalance()` — `Objects.requireNonNullElse(response, ZERO)` + log WARN | ✅ Código en producción · backend healthy |
| DEBT-018 | `BillLookupResult` clase top-level en `bill/domain/` | ✅ 3 imports actualizados · compila correctamente |
| DEBT-019 | `validateReference()` eliminado de use case | ✅ Validación única en `BillController` via `@Pattern` |

---

## 4. Análisis de dependencias nuevas

| Dependencia | Versión | CVE | Estado |
|---|---|---|---|
| spring-jdbc (JdbcClient) | incluido en Spring Boot 3.3.4 | Ninguno | ✅ |
| No hay nuevas dependencias en FEAT-010 | — | — | ✅ |

Dashboard usa solo JdbcClient (parte de Spring Framework) — sin dependencias externas nuevas.

---

## 5. Secrets Scan

| Patrón | Archivos nuevos | Hallazgos |
|---|---|---|
| API keys / tokens | 11 archivos Java nuevos dashboard | **0** |
| Passwords en literales | 11 archivos | **0** |
| `.env` con claves reales | `infra/compose/.env` | **0** (claves generadas localmente, `.gitignore`) |

---

## 6. Evidencia de ejecución en producción

```
Backend:  ✅ healthy  (docker ps: Up X minutes healthy)
Flyway:   ✅ V13 aplicada — "dashboard analytics" SUCCESS
BD:       ✅ spending_categories + budget_alerts creadas
          ✅ UNIQUE constraints + FK + CHECK constraints activas
Stack:    ✅ PostgreSQL 16.13 + Redis 7 + Tomcat 10.1.30
```

---

## 7. Plan de remediación

| # | Hallazgo | Acción | Sprint |
|---|---|---|---|
| S-SEC-001 | RV-011 `resolvePeriod()` sin validación YYYY-MM | Añadir regex guard + HTTP 400 | Sprint 13 |

---

## 8. Criterio de aceptación de seguridad

```
[x] Zero CVEs críticos — CUMPLIDO
[x] Zero CVEs altos — CUMPLIDO
[x] Zero secrets en código — CUMPLIDO
[x] OWASP A01 (userId del JWT, queries por user_id) — CUMPLIDO
[x] OWASP A03 (Bean Validation en parámetros) — CUMPLIDO
[x] Sin PII en logs del dashboard — CUMPLIDO
[x] DEBTs 017/018/019 verificadas en producción — CUMPLIDO
[x] Backend healthy con V13 en BD — VERIFICADO EN PRODUCCIÓN
```

**Semáforo final: 🟢 VERDE**

---

*Security Report — SOFIA Security Agent — Step 5b*
*CMMI Level 3 — VER SP 2.1 · VER SP 3.1 · PCI-DSS Req. 6.3*
*BankPortal Sprint 12 — FEAT-010 — 2026-03-22*
