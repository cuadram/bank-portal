# Code Review — FEAT-011 Sprint 13
## Frontend Angular Dashboard + Exportación PDF/Excel

**Fecha:** 2026-03-22 | **Revisor:** SOFIA Code Reviewer Agent — Step 5
**Commit revisado:** `43f88a8` | **CMMI:** VER SP 2.2 · VER SP 3.1

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Archivos revisados | 25 (11 frontend + 8 backend + 6 tests + archivos config) |
| Hallazgos bloqueantes | **0** |
| Hallazgos mayores | **2** (no bloqueantes — Sprint 14) |
| Hallazgos menores | **3** (Sprint 14) |
| **Veredicto** | ✅ **APROBADO — Gate 5 puede concederse** |

---

## Hallazgos backend

### RV-013 [MENOR] — `try-catch` genérico en PdfReportGenerator
**Archivo:** `PdfReportGenerator.java`
**Código:** `catch (Exception e)` captura cualquier throwable, incluyendo errores de programación.
**Recomendación:** Capturar `DocumentException | IOException` de forma específica en Sprint 14.
**Impacto:** Bajo — el error se logea y relanza correctamente.

### RV-014 [MENOR] — `try-catch` genérico en ExcelReportGenerator
**Archivo:** `ExcelReportGenerator.java`
**Código:** Mismo patrón que RV-013.
**Recomendación:** Sprint 14 — misma corrección.

### RV-015 [MAYOR] — `DashboardExportUseCase` sin `@Transactional(readOnly = true)`
**Archivo:** `DashboardExportUseCase.java`
**Código:** Los métodos `generatePdf` y `generateExcel` hacen múltiples lecturas de BD sin transacción explícita.
**Recomendación:** Añadir `@Transactional(readOnly = true)` en ambos métodos para garantizar snapshot consistente. Sprint 14.
**Impacto:** Medio — en producción con carga concurrente podría leer datos inconsistentes entre llamadas.

---

## Hallazgos frontend

### RV-016 [MAYOR] — `DashboardComponent` sin `unsubscribe` en `forkJoin`
**Archivo:** `dashboard.component.ts`
**Código:** `forkJoin({...}).subscribe({...})` sin gestión del ciclo de vida — memory leak si el componente se destruye antes de completar.
**Recomendación:** Usar `takeUntilDestroyed()` (Angular 16+) o `Subject` + `takeUntil(destroy$)` en `ngOnDestroy`. Sprint 14.
**Impacto:** Medio — en navegación rápida podría acumular subscripciones.

### RV-017 [MENOR] — `AuthGuard` sin verificación de expiración del JWT
**Archivo:** `auth.guard.ts`
**Código:** Solo verifica presencia del token en localStorage, no su expiración.
**Recomendación:** Decodificar el JWT y verificar `exp` antes de conceder acceso. Sprint 14.
**Impacto:** Bajo — el backend rechazará el token expirado con 401 de todas formas.

---

## Aspectos positivos destacados

| Aspecto | Detalle |
|---|---|
| DEBT-020 ✅ | `resolvePeriod()` validación YYYY-MM limpia y testeable |
| DEBT-021 ✅ | 11 imports explícitos — visibilidad completa de dependencias |
| `catchError` en DashboardService ✅ | Todos los errores HTTP absorbidos → null, nunca rompe UI |
| `forkJoin` paralelo ✅ | 5 APIs en paralelo — carga óptima del dashboard |
| Skeleton loaders ✅ | UX correcta durante estados de carga |
| ADR-020 ✅ | Server-side PDF/Excel — decisión técnica sólida y justificada |
| OpenPDF LGPL ✅ | Licencia compatible con uso comercial |
| Apache POI 5.3.0 ✅ | Versión sin CVEs conocidos |
| `@AuthenticationPrincipal` en export ✅ | userId siempre del JWT, no de parámetros |
| `proxy.conf.json` ✅ | CORS resuelto sin cambios en backend para dev local |

---

## Plan de remediación

| ID | Hallazgo | Severidad | Sprint |
|---|---|---|---|
| RV-013 | catch genérico PdfReportGenerator | Menor | Sprint 14 |
| RV-014 | catch genérico ExcelReportGenerator | Menor | Sprint 14 |
| RV-015 | @Transactional(readOnly) en export use case | Mayor | Sprint 14 |
| RV-016 | unsubscribe forkJoin DashboardComponent | Mayor | Sprint 14 |
| RV-017 | JWT expiration check en AuthGuard | Menor | Sprint 14 |

---

## Criterio de salida

```
[x] 0 hallazgos BLOQUEANTES
[x] DEBT-020/021 implementadas correctamente y verificadas
[x] Seguridad: @AuthenticationPrincipal en todos los endpoints de exportación
[x] Angular AuthGuard protege /dashboard
[x] JwtInterceptor añade Bearer en todas las requests
[x] catchError garantiza resiliencia en DashboardService
[x] Tests DashboardExportUseCaseTest (6/6 cubren DEBT-020)
[x] Hallazgos mayores documentados para Sprint 14
```

**Veredicto: ✅ APROBADO**

_SOFIA Code Reviewer Agent — Step 5 — BankPortal Sprint 13 — FEAT-011 — 2026-03-22_
_CMMI Level 3 — VER SP 2.2 · VER SP 3.1_
