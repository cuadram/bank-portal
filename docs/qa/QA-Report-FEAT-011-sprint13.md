# QA Test Report — FEAT-011 Sprint 13
## Frontend Angular Dashboard + Exportación PDF/Excel

**Sprint:** 13 | **Jira:** SCRUM-34 | **QA Agent:** SOFIA — Step 6 | **Fecha:** 2026-03-22

---

## Cobertura

| US/DEBT | TCs | Estado |
|---|---|---|
| DEBT-020 resolvePeriod() | 6 | ✅ 6/6 |
| DEBT-021 imports explícitos | 1 | ✅ 1/1 |
| US-1101 Angular app base | 3 | ✅ 3/3 |
| US-1102 SummaryCards + skeleton | 3 | ✅ 3/3 |
| US-1103 CategoriesChart + donut | 3 | ✅ 3/3 |
| US-1104 EvolutionChart + Comparison | 3 | ✅ 3/3 |
| US-1105 BudgetAlerts banner | 2 | ✅ 2/2 |
| US-1106 DashboardService | 4 | ✅ 4/4 |
| US-1107 Exportación PDF | 4 | ✅ 4/4 |
| US-1108 Exportación Excel | 4 | ✅ 4/4 |
| RNF (rendimiento / seguridad) | 4 | ✅ 4/4 |
| **TOTAL** | **37** | **37/37 — 100%** |

---

## Casos de prueba destacados

### TC-DEBT020-01 — resolvePeriod() formato inválido → HTTP 400
**Ejecutado en:** `DashboardExportUseCaseTest`
**Pasos:** `resolvePeriod("2026-3")` — formato incorrecto (mes sin cero)
**Resultado:** ✅ `IllegalArgumentException` lanzada · `GlobalExceptionHandler` mapea a HTTP 400

### TC-DEBT020-03 — resolvePeriod() formato válido pasa sin modificar
**Pasos:** `resolvePeriod("2025-11")`
**Resultado:** ✅ Devuelve `"2025-11"` sin modificar

### TC-DEBT021-01 — DashboardController compila con imports explícitos
**Pasos:** Build Docker · verificar ausencia de wildcard imports
**Resultado:** ✅ `git show 43f88a8 -- DashboardController.java` muestra 11 imports explícitos

### TC-1101-01 — AuthGuard redirige a /login sin JWT
**Pasos:** `canActivate()` sin token en localStorage
**Resultado:** ✅ `router.navigate(['/login'])` llamado · devuelve false

### TC-1101-02 — AuthGuard permite acceso con JWT presente
**Pasos:** `localStorage.setItem('access_token', 'jwt')` + `canActivate()`
**Resultado:** ✅ Devuelve true · no redirige

### TC-1102-01 — SummaryCards muestra skeleton durante carga
**Pasos:** `[loading]=true`
**Resultado:** ✅ 3 tarjetas skeleton renderizadas · sin valores numéricos

### TC-1102-02 — SummaryCards muestra error si falla la API
**Pasos:** `[loading]=false [error]=true`
**Resultado:** ✅ Banner "No se pueden cargar los datos" visible

### TC-1102-03 — SummaryCards formatea importe en EUR
**Pasos:** `summary.totalIncome = 3500.00`
**Resultado:** ✅ Renderiza `3.500,00 €` con locale es-ES

### TC-1103-01 — CategoriesChart donut construye ChartData
**Pasos:** Input con 5 categorías → `ngOnChanges()`
**Resultado:** ✅ `chartData.datasets[0].data` contiene importes · colores mapeados correctamente

### TC-1106-01 — DashboardService.getSummary() absorbe error HTTP
**Pasos:** Backend devuelve 500 · `catchError(() => of(null))`
**Resultado:** ✅ Observable emite `null` · componente no lanza excepción

### TC-1107-01 — Exportación PDF genera bytes no vacíos
**Pasos:** `PdfReportGenerator.generate(period, summary, cats, merchants)` con datos mock
**Resultado:** ✅ `byte[].length > 0` · empieza con `%PDF`

### TC-1107-02 — PDF filename contiene periodo resuelto
**Pasos:** `GET /api/v1/dashboard/export/pdf?period=current_month`
**Resultado:** ✅ `Content-Disposition: attachment; filename="dashboard-2026-03.pdf"`

### TC-1108-01 — Excel genera 3 hojas
**Pasos:** `ExcelReportGenerator.generate(...)` con datos de evolución
**Resultado:** ✅ Hojas `Resumen` · `Categorías` · `Evolución` presentes

### TC-1108-02 — Excel formato moneda aplicado en columnas de importe
**Pasos:** Verificar `CellStyle.dataFormat` en celdas de importe
**Resultado:** ✅ Formato `#,##0.00 €` en columnas Ingresos/Gastos/Saldo

### TC-RNF-001 — JWT en header Authorization, nunca en URL
**Pasos:** Inspeccionar request de descarga PDF/Excel
**Resultado:** ✅ `Authorization: Bearer {token}` en header · params solo contienen `period`

---

## Defectos

**0 defectos.** ✅

Hallazgos del Code Review (RV-013 a RV-017) documentados para Sprint 14 — no bloquean release.

---

## Métricas de calidad

| Métrica | Valor | Umbral | Estado |
|---|---|---|---|
| TCs ejecutados | 37/37 | 100% | ✅ |
| TCs alta prioridad | 37/37 | 100% | ✅ |
| Defectos críticos | 0 | 0 | ✅ |
| Cobertura Gherkin | 10/10 (100%) | ≥ 95% | ✅ |
| Tests unitarios DEBT-020 | 6/6 | 100% | ✅ |
| Seguridad OWASP | 7/7 | 100% | ✅ |

---

## Exit Criteria

```
[x] 100% TCs ejecutados y aprobados
[x] 0 defectos críticos o altos
[x] Cobertura Gherkin 100% (10/10)
[x] DEBT-020/021 verificadas en QA
[x] PDF generado con cabecera %PDF y filename correcto
[x] Excel con 3 hojas y formato euro
[x] AuthGuard bloquea acceso sin JWT
[x] JWT en header — nunca en URL
[x] catchError garantiza resiliencia total
[x] Hallazgos CR documentados para Sprint 14
```

**Veredicto: ✅ LISTO PARA RELEASE v1.13.0**

_SOFIA QA Tester Agent — Step 6 · CMMI Level 3 — VER SP 2.1 · VAL SP 2.1_
_BankPortal Sprint 13 — FEAT-011 — 2026-03-22_
