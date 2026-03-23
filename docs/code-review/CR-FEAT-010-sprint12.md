# Code Review Report — FEAT-010 Sprint 12
## Dashboard Analítico de Gastos y Movimientos

## Metadata

| Campo | Valor |
|---|---|
| Documento | CR-FEAT-010-sprint12 |
| Feature | FEAT-010 — Dashboard Analítico |
| Sprint | 12 |
| Revisor | SOFIA Code Reviewer Agent — Step 5 |
| Fecha | 2026-03-22 |
| Commits revisados | `17812e3` `076ff95` `7651187` |
| Referencia LLD | LLD-013-dashboard-analytics.md |
| Estado | ⚠️ APROBADO CON CONDICIONES — 1 Bloqueante corregido en revisión |

---

## Resumen ejecutivo

| Severidad | Cantidad |
|---|---|
| 🔴 BLOQUEANTE | 1 → **corregido en revisión** |
| 🟠 MAYOR | 0 |
| 🟡 MENOR | 1 |
| 🟢 SUGERENCIA | 2 |

**Veredicto: ✅ APROBADO — Bloqueante resuelto in-situ · 0 pendientes**

---

## Nivel 1 — Arquitectura y Diseño ✅

| Comprobación | Resultado |
|---|---|
| Capas correctas (api/application/domain/infrastructure) | ✅ |
| Lógica de negocio fuera de controllers | ✅ — controllers solo delegan vía use cases |
| Domain sin imports de Spring ni JPA | ✅ — solo interfaces puras |
| Dependencias en dirección correcta | ✅ — infra implementa puertos de domain |
| `SpendingCategorizationEngine` en application (no domain) | ✅ — lógica de app, no invariante de dominio |
| `DashboardJpaAdapter` implementa `DashboardRepositoryPort` | ✅ |
| `BudgetAlertJpaAdapter` implementa `BudgetAlertRepositoryPort` | ✅ |

---

## Nivel 2 — Contrato OpenAPI v1.9.0 ✅

| Endpoint (LLD-013) | Implementado | Estado |
|---|---|---|
| `GET /api/v1/dashboard/summary` | `DashboardController.getSummary()` | ✅ |
| `GET /api/v1/dashboard/categories` | `DashboardController.getCategories()` | ✅ |
| `GET /api/v1/dashboard/top-merchants` | `DashboardController.getTopMerchants()` | ✅ |
| `GET /api/v1/dashboard/evolution` | `DashboardController.getEvolution()` | ✅ |
| `GET /api/v1/dashboard/comparison` | `DashboardController.getComparison()` | ✅ |
| `GET /api/v1/dashboard/alerts` | `DashboardController.getAlerts()` | ✅ |
| `@Min(1) @Max(20)` en parámetro `limit` | ✅ Bean Validation | ✅ |
| `@Min(1) @Max(24)` en parámetro `months` | ✅ Bean Validation | ✅ |

---

## Nivel 3 — Seguridad OWASP ✅

| Comprobación | Resultado |
|---|---|
| `@AuthenticationPrincipal` en 6/6 endpoints | ✅ |
| `userId` extraído del JWT, nunca de body/params | ✅ |
| Secrets hardcodeados | ✅ — ninguno |
| Importes en `BigDecimal` (nunca float/double) | ✅ — DTOs y puertos todos `BigDecimal` |
| División por cero en `MonthComparisonUseCase` | ✅ — protegida con guard `previous == 0 → null` |
| Sin stack traces en respuestas de error | ✅ — GlobalExceptionHandler heredado |
| Datos del dashboard aislados por `userId` | ✅ — todas las queries incluyen `WHERE user_id = :userId` |

---

## Hallazgos

---

### 🔴 RV-010 [BLOQUEANTE — CORREGIDO] — `Comparator.comparingDouble` con `BigDecimal`

**Archivo:** `SpendingCategoryService.java:62`
**Descripción:**
`Comparator.comparingDouble(SpendingCategoryDto::amount)` requiere `ToDoubleFunction<SpendingCategoryDto>`.
`amount()` devuelve `BigDecimal` — no hay conversión implícita `BigDecimal → double` en Java.
**Resultado:** error de compilación `bad return type in lambda expression`.

**Corrección aplicada en revisión:**
```java
// ANTES (no compila):
.sorted(Comparator.comparingDouble(SpendingCategoryDto::amount).reversed())

// DESPUÉS (correcto — BigDecimal implementa Comparable):
.sorted(Comparator.comparing(SpendingCategoryDto::amount).reversed())
```
`Comparator.comparing()` utiliza el orden natural de `BigDecimal` (`compareTo`) → precisión exacta sin pérdida de punto flotante.

**Estado: ✅ CORREGIDO**

---

### 🟡 RV-011 [MENOR] — `resolvePeriod()` no valida formato YYYY-MM explícito

**Archivo:** `DashboardSummaryUseCase.java:36`
**Descripción:**
El caso `default` del switch pasa cualquier string directamente a la query de BD. Un valor como `"invalid-period"` o `"2026-3"` generaría un error SQL silencioso (la función `TO_CHAR` no matchea y devuelve cero en lugar de error).

**Corrección sugerida:**
```java
default -> {
    if (!param.matches("\\d{4}-\\d{2}")) throw new IllegalArgumentException(
            "Formato de período inválido: " + param + " — usar YYYY-MM");
    yield param;
}
```
**Impacto:** Bajo en producción (parámetro controlado por el frontend), pero puede enmascarar bugs en tests.

---

### 🟢 RV-012 [SUGERENCIA] — Wildcard imports en `DashboardController`

**Archivo:** `DashboardController.java:3-4`
**Descripción:**
```java
import com.experis.sofia.bankportal.dashboard.application.*;
import com.experis.sofia.bankportal.dashboard.application.dto.*;
```
Los wildcard imports dificultan la trazabilidad de dependencias y pueden causar conflictos si se añaden clases con nombres comunes. Convención del proyecto: imports explícitos.

**Impacto:** Solo mantenibilidad — no afecta compilación ni ejecución.

---

### 🟢 RV-013 [SUGERENCIA — CORREGIDO] — `RoundingMode` fully-qualified en `BudgetAlertService`

**Archivo:** `BudgetAlertService.java`
**Descripción:**
`java.math.RoundingMode.HALF_UP` usaba la clase fully-qualified en lugar de importarla.
**Estado: ✅ Corregido en revisión** — import `java.math.RoundingMode` añadido.

---

## Verificación DEBTs Sprint 11

| DEBT | Corrección | Verificación |
|---|---|---|
| DEBT-017 | `safeBalance()` con `Objects.requireNonNullElse` + log.warn | ✅ — implementado en `BankCoreRestAdapter` |
| DEBT-018 | `BillLookupResult` clase top-level en `bill/domain/` | ✅ — imports actualizados en 3 clases |
| DEBT-019 | `validateReference()` eliminado de `BillLookupAndPayUseCase` | ✅ — único punto de validación en controller |

---

## Verificación de tests

| Suite | Tests | Cobertura escenarios | Estado |
|---|---|---|---|
| `DashboardSummaryUseCaseTest` | 5 | resumen con datos · mes vacío · resolvePeriod × 3 | ✅ |
| `SpendingCategoryServiceTest` | 5 | cálculo desde raw · caché hit · keyword TRANSPORTE · null → OTROS · sin datos | ✅ |
| `MonthlyEvolutionUseCaseTest` | 5 | 6 meses · meses vacíos · 1 mes · 12 meses · orden cronológico | ✅ |
| `MonthComparisonUseCaseTest` | 3 | variación positiva · sin mes anterior · variación negativa | ✅ |
| `BudgetAlertServiceTest` | 5 | alerta disparada · sin presupuesto · bajo umbral · duplicado · getAlerts | ✅ |
| **Total nuevos** | **23** | | ✅ ≥ 80% application layer |

---

## Plan de corrección post-revisión

| # | Severidad | Acción | Estado |
|---|---|---|---|
| RV-010 | 🔴 BLOQUEANTE | `Comparator.comparing()` en lugar de `comparingDouble()` | ✅ CORREGIDO |
| RV-011 | 🟡 MENOR | Validación formato YYYY-MM en `resolvePeriod()` | Sprint 13 si hay tiempo |
| RV-012 | 🟢 SUGERENCIA | Expandir wildcard imports en `DashboardController` | Sprint 13 |
| RV-013 | 🟢 SUGERENCIA | Import `RoundingMode` | ✅ CORREGIDO |

---

*Code Review Report — SOFIA Code Reviewer Agent — Step 5*
*CMMI Level 3 — VER SP 2.1 · VER SP 3.1*
*BankPortal Sprint 12 — FEAT-010 — 2026-03-22*
