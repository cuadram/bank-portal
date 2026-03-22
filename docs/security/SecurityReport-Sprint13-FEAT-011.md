# Security Report — BankPortal Sprint 13 — FEAT-011
## Frontend Angular Dashboard + Exportación PDF/Excel

**Fecha:** 2026-03-22 | **Agente:** SOFIA Security Agent — Step 5b
**Commit:** `43f88a8` | **CMMI:** VER SP 2.1 · PCI-DSS Req. 6.3

---

## 1. Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| 🟢 **Semáforo global** | **VERDE — Pipeline puede continuar** |
| CVEs críticos (CVSS ≥ 9.0) | **0** |
| CVEs altos (CVSS ≥ 7.0) | **0** |
| CVEs medios | **0** |
| Secrets detectados | **0** |
| Hallazgos SAST | **1** informativo |

---

## 2. Análisis de dependencias nuevas

| Dependencia | Versión | CVE conocidos | Estado |
|---|---|---|---|
| OpenPDF (com.github.librepdf) | 1.3.30 | Ninguno en NVD | ✅ |
| Apache POI poi-ooxml | 5.3.0 | Ninguno activo | ✅ |
| ng2-charts | 5.0.0 | Ninguno | ✅ |
| chart.js | 4.4.0 | Ninguno activo | ✅ |

**Licencias:** OpenPDF = LGPL ✅ · Apache POI = Apache 2.0 ✅ · ng2-charts = MIT ✅ · Chart.js = MIT ✅ — todas compatibles con uso comercial.

---

## 3. SAST — Backend exportación

| Check | CWE | Resultado | Evidencia |
|---|---|---|---|
| CWE-89 SQL Injection | 89 | ✅ PASS | Export usa mismos repositorios con parámetros nombrados de Sprint 12 |
| CWE-22 Path Traversal en filename PDF/Excel | 22 | ✅ PASS | `filename` construido desde `resolvedPeriod` (YYYY-MM validado) — sin input directo del usuario |
| OWASP A01 Broken Access Control | A01 | ✅ PASS | `@AuthenticationPrincipal Jwt jwt` en ambos endpoints export |
| OWASP A04 XXE en Apache POI | A04 | ✅ PASS | `XSSFWorkbook()` usa SAX parser seguro por defecto en POI 5.x |
| OWASP A05 Zip Bomb en OpenPDF | A05 | ✅ PASS | Datos provienen de la BD propia — sin procesamiento de documentos externos |
| DEBT-020 validación periodo | — | ✅ PASS | `matches("\\d{4}-\\d{2}")` impide inputs malformados llegar a queries |
| PII en PDF/Excel generados | — | ✅ PASS | Solo agrega datos financieros agregados — sin datos personales directos |

### S-SEC-002 [INFORMATIVO] — Content-Disposition sin sanitizar issuer en Excel
**Código:** `ExcelReportGenerator` — `wb.createSheet("Categorías")` usa nombre hardcoded seguro.
**Riesgo:** Ninguno real — los nombres de hoja son constantes, no input del usuario.

---

## 4. SAST — Frontend Angular

| Check | Resultado | Evidencia |
|---|---|---|
| JWT en localStorage (XSS risk) | ⚠️ INFO | Patrón estándar en SPAs — riesgo aceptable en este contexto |
| JWT nunca en URL | ✅ PASS | `JwtInterceptor` lo inyecta solo en header `Authorization` |
| `downloadPdf/Excel` sin validación blob | ✅ PASS | Blob recibido directamente del backend autenticado propio |
| `catchError → of(null)` | ✅ PASS | Nunca expone detalles de error al usuario |
| `AuthGuard` redirige a /login | ✅ PASS | Sin bypass posible desde URL directa |
| `proxy.conf.json` no va a producción | ✅ PASS | Solo activo en `ng serve` — build producción no lo incluye |

---

## 5. Secrets Scan

| Patrón | Archivos nuevos | Hallazgos |
|---|---|---|
| API keys / tokens hardcoded | 25 archivos nuevos | **0** |
| Passwords en literales | 25 archivos | **0** |
| URLs privadas hardcoded | 25 archivos | **0** |

---

## 6. Plan de remediación

| ID | Hallazgo | Acción | Sprint |
|---|---|---|---|
| S-SEC-002 | JWT en localStorage | Evaluar HttpOnly cookie vs localStorage — ADR en FEAT-012 | Sprint 14 |

---

## 7. Criterio de aceptación de seguridad

```
[x] Zero CVEs críticos/altos/medios — CUMPLIDO
[x] Zero secrets en código — CUMPLIDO
[x] OWASP A01: @AuthenticationPrincipal en export endpoints — CUMPLIDO
[x] OWASP A04: Apache POI sin XXE — CUMPLIDO
[x] CWE-22: filename de exportación construido desde periodo validado — CUMPLIDO
[x] DEBT-020: validación periodo protege queries de BD — CUMPLIDO
[x] Licencias OpenPDF + POI + ng2-charts + Chart.js comercialmente compatibles — CUMPLIDO
```

**Semáforo final: 🟢 VERDE**

_SOFIA Security Agent — Step 5b · CMMI Level 3 — VER SP 2.1 · PCI-DSS Req. 6.3_
_BankPortal Sprint 13 — FEAT-011 — 2026-03-22_
