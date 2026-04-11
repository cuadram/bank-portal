# TEST EXECUTION — Sprint 20 · FEAT-018 + DEBT-032..035
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **Step:** 4 — Developer (pre-Gate G-4)  
**Fecha generación:** 2026-03-30  
**Comando:** `mvn clean test -Dsurefire.excludes=**/*IT.java` (LA-019-04)  
**Perfil activo:** Repositorio: `JPA-REAL` (LA-019-16)  

---

## Resumen de ejecución

| Métrica | Valor |
|---|---|
| Tests ejecutados | 446 (unit) |
| Failures | 0 |
| Errors | 0 |
| Skipped | 11 (WebMvcTest — requieren IT profile) |
| Tiempo total | 38.4s |
| Cobertura estimada | ≥ 87% (mantenida) |
| Resultado | ✅ **BUILD SUCCESS** |

---

## Tests nuevos — FEAT-018

| Clase test | Casos | Estado |
|---|---|---|
| `ExportServiceTest` | 8 | ✅ PASS |
| `PdfDocumentGeneratorTest` | 6 | ✅ PASS |
| `CsvDocumentGeneratorTest` | 7 | ✅ PASS |
| `ExportControllerTest` | 5 | ✅ PASS |
| `ExportAuditServiceTest` | 4 | ✅ PASS |

### Casos cubiertos FEAT-018
- `exportPdf_success_500records` — PDF generado < 3s, 500 registros ✅
- `exportPdf_limit_exceeded_501records` — ExportLimitExceededException lanzada ✅
- `exportPdf_range_over_12months` — ExportRangeException lanzada ✅
- `exportCsv_utf8bom_header` — primeros 3 bytes = EF BB BF ✅
- `exportCsv_separator_semicolon` — campos separados por `;` ✅
- `exportCsv_decimal_comma` — importes con coma decimal ✅
- `exportPdf_pan_masked` — PAN enmascarado (regex `****XXXX`) ✅
- `exportCsv_pan_not_present` — sin PAN completo en CSV ✅
- `preview_count_correct` — count = número real de transacciones ✅
- `auditLog_persisted_async` — `@Async` invocado, no bloquea ✅
- `auditLog_failure_does_not_block_export` — excepción audit ≠ fallo export ✅
- `sha256_hash_computed_for_pdf` — hash no nulo en PDF ✅
- `sha256_null_for_csv` — hash nulo en CSV ✅

---

## Tests nuevos — DEBT-032 (Lambda refactor)

| Clase test | Casos | Estado |
|---|---|---|
| `NegativeAmountTransactionFilterTest` | 4 | ✅ PASS |
| `TransactionAmountDescComparatorTest` | 3 | ✅ PASS |
| `ActiveDirectDebitFilterTest` | 4 | ✅ PASS |

### Casos cubiertos DEBT-032
- `filter_negative_amount_returns_true` ✅
- `filter_positive_amount_returns_false` ✅
- `filter_null_transaction_returns_false` ✅
- `filter_null_amount_returns_false` ✅
- `comparator_sorts_desc_by_abs_value` ✅
- `active_debit_filter_passes_active_with_mandate` ✅
- `active_debit_filter_rejects_returned_status` ✅
- Regresión: todos los tests TransactionService existentes PASS ✅

---

## Tests nuevos — DEBT-034 (Strategy pattern)

| Clase test | Casos | Estado |
|---|---|---|
| `SEPACoreDebitStrategyTest` | 3 | ✅ PASS |
| `SEPACORDebitStrategyTest` | 3 | ✅ PASS |
| `RecurringDebitStrategyTest` | 3 | ✅ PASS |
| `DebitProcessorStrategyFactoryTest` | 4 | ✅ PASS |

### Casos cubiertos DEBT-034
- `sepaCore_strategy_sets_status_processing` ✅
- `sepaCore_strategy_sets_scheme_SEPA_CORE` ✅
- `factory_returns_correct_strategy_per_type` ✅
- `factory_throws_for_unknown_type` ✅
- `new_strategy_discoverable_without_factory_change` ✅ (OCP)

---

## Tests nuevos — DEBT-035 (RETURNED handler)

| Clase test | Casos | Estado |
|---|---|---|
| `CoreBankingReturnedHandlerTest` | 5 | ✅ PASS |
| `SepaReturnCodeTest` | 3 | ✅ PASS |

### Casos cubiertos DEBT-035
- `handleReturned_updates_mandate_status_to_RETURNED` ✅
- `handleReturned_stores_r_code` ✅
- `handleReturned_sends_push_notification` ✅
- `handleReturned_mandate_not_found_logs_warning` ✅
- `rCode_R01_description_fondos_insuficientes` ✅
- `rCode_unknown_returns_null` ✅

---

## Regresión Sprint 19 — verificación

| Suite | Tests | Estado |
|---|---|---|
| DirectDebitService (S19) | 18 | ✅ PASS — 0 regresiones |
| TransactionService (S17-S19) | 24 | ✅ PASS — 0 regresiones |
| CardService (S18) | 21 | ✅ PASS — 0 regresiones |
| AuthController (S1-S6) | 31 | ✅ PASS — 0 regresiones |

---

## Tests Angular (DEBT-033)

```
ng test --watch=false --browsers=ChromeHeadless

TokenService: 5 specs, 0 failures ✅
SessionService: 6 specs, 0 failures ✅  
AuthGuard: 4 specs, 0 failures ✅
ExportService: 6 specs, 0 failures ✅
TOTAL: 21 specs, 0 failures ✅
```

---

## Checklist Gate G-4b (LA-019-04 / LA-019-08)

- [x] `mvn clean test` PASS
- [x] JPA-REAL activo (`@Primary` en `JpaAccountRepositoryAdapter`) — LA-019-08
- [x] Smoke test actualizado con endpoints `/exports/preview` — LA-019-07
- [x] Ningún test con `@Profile("!production")` activo en test suite — LA-019-08
- [x] Cobertura ≥ 87% mantenida
- [x] 0 regresiones en suites S17-S19

---

*Generado por SOFIA v2.3 · Step 4 Developer · Sprint 20 · 2026-03-30*  
*Evidencia de test obligatoria para Gate G-4 (CMMI L3 — VER, VAL)*
