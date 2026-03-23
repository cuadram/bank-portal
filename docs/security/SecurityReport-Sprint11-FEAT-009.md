# Security Report — BankPortal Sprint 11 — FEAT-009
## Core Bancario Real + Pagos de Servicios

**Clasificación:** CONFIDENCIAL — USO INTERNO
**Fecha:** 2026-03-21
**Generado por:** SOFIA Security Agent — Step 5b
**CMMI:** VER SP 2.1 · VER SP 3.1 · PCI-DSS Req. 6.3 · PSD2 Art. 74 + 97

---

## 1. Resumen ejecutivo

| Métrica | Resultado |
|---|---|
| 🟢 **Semáforo global** | **VERDE — Pipeline puede continuar a QA** |
| CVEs Críticos (CVSS ≥ 9.0) | **0** |
| CVEs Altos (CVSS ≥ 7.0) | **0** |
| CVEs Medios (CVSS ≥ 4.0) | **0** (nuevas dependencias limpias) |
| Secrets detectados | **0** |
| Hallazgos SAST | **1** (informativo — RV-006 del CR, ya documentado) |
| Recomendación | **✅ APROBAR — continuar a QA** |

---

## 2. Análisis SAST — Hallazgos estáticos

### 2.1 Nuevos componentes FEAT-009

| ID | CWE | Categoría OWASP | Descripción | Archivo | Estado |
|---|---|---|---|---|---|
| S-001 | — | A04 Insecure Design | `BankCoreRestAdapter.getAvailableBalance()` no tiene null check sobre `response.available()`. Si el core devuelve body malformado → posible NPE. | `BankCoreRestAdapter.java:137` | ⚠️ INFO — RV-006 del CR (Sprint 12) |

### 2.2 Comprobaciones OWASP sobre código nuevo

| Comprobación | Resultado | Evidencia |
|---|---|---|
| CWE-89 SQL Injection | ✅ PASS | JPA/ORM · sin concatenación en código nuevo |
| CWE-798 Hard-coded credentials | ✅ PASS | `@Value("${bank.core.api-key}")` · nunca literal en código |
| CWE-327 Algoritmos débiles | ✅ PASS | RS256 heredado de FEAT-008 · sin cambios criptográficos |
| OWASP A02 — JWT sin expiración | ✅ PASS | Heredado FEAT-008 · TTL configurado |
| OWASP A02 — OTP obligatorio en pagos | ✅ PASS | `verifyCurrentOtp()` en `BillPaymentUseCase` y `BillLookupAndPayUseCase` antes de ejecutar |
| OWASP A03 — Validación de entrada | ✅ PASS | `@Valid` + `@Pattern(regexp = "\\d{20}")` en referencia · `@DecimalMin("0.01")` en importe |
| OWASP A04 — Audit log INITIATED antes de OTP | ✅ PASS | RV-001 corregido en CR — OTP verificado ANTES del log |
| OWASP A05 — API key hardcodeada | ✅ PASS | `${bank.core.api-key}` via variables de entorno |
| OWASP A05 — Mock activo en staging/test | ✅ PASS | `@Profile("production")` en `BankCoreRestAdapter` · mock solo en staging/test |
| OWASP A07 — Rate limiting fail-open | ✅ PASS | Redis caído → operación permitida · no bloquea tráfico legítimo |
| Referencia de factura en logs | ✅ PASS | `maskReference()` — `1234****7890` · nunca referencia completa |
| Idempotencia en escrituras al core | ✅ PASS | `UUID idempotencyKey` en `executePayment()` · previene dobles cargos |
| PCI-DSS Req. 10.2 — Audit trail pagos | ✅ PASS | `BILL_PAYMENT_INITIATED` + `BILL_PAYMENT_COMPLETED` con `paymentId` + `coreTxnId` |

---

## 3. Análisis de dependencias — OWASP Dependency Check

### Nuevas dependencias FEAT-009

| Dependencia | Versión | CVE | CVSS | Estado |
|---|---|---|---|---|
| resilience4j-spring-boot3 | 2.2.0 | Ninguno conocido | — | ✅ |
| resilience4j-reactor | 2.2.0 | Ninguno conocido | — | ✅ |

### Dependencias heredadas — sin cambios respecto a Sprint 10

| Dependencia | Estado |
|---|---|
| spring-security-core 6.3.4 | ✅ Sin CVEs |
| jjwt-api 0.12.6 | ✅ Sin CVEs |
| postgresql driver 42.7.3 | ✅ Sin CVEs |
| openpdf 1.3.30 | ⚠️ CVE-2023-39580 CVSS 5.3 (registrado Sprint 10 · sin impacto en FEAT-009) |

**Resumen:** CVEs Críticos: 0 · CVEs Altos: 0 · CVEs Medios: 0 (nuevas deps) · 1 heredado medio sin impacto

---

## 4. Secrets Scan

| Patrón | Archivos escaneados | Hallazgos |
|---|---|---|
| API keys hardcoded | 22 archivos Java nuevos | **0** |
| `BANK_CORE_API_KEY` en código fuente | `BankCoreRestAdapter.java` | **0** — solo `@Value` |
| JWT tokens hardcoded | 22 archivos Java | **0** |
| Passwords en literales | 22 archivos Java | **0** |
| `.env` commiteado | `git status` | **0** — en `.gitignore` |

**Total secrets: 0** ✅

---

## 5. OWASP Top 10 — Estado FEAT-009

| Categoría | Estado | Evidencia |
|---|---|---|
| A01 — Broken Access Control | ✅ | `@AuthenticationPrincipal` en 4/4 endpoints · `findByIdAndUserId` valida ownership del recibo |
| A02 — Cryptographic Failures | ✅ | RS256 activo · importe en DECIMAL · referencia enmascarada |
| A03 — Injection | ✅ | JPA/ORM · Bean Validation con `@Pattern` en referencia |
| A04 — Insecure Design | ✅ | OTP antes de INITIATED (RV-001) · idempotencyKey en core |
| A05 — Security Misconfiguration | ✅ | `@Profile` correcto · API key en entorno · Rate limiter fail-open |
| A06 — Vulnerable Components | ⚠️ INFO | openpdf CVE-2023-39580 (heredado, sin impacto) |
| A07 — Auth Failures | ✅ | OTP en todo pago · PSD2 SCA |
| A08 — Integrity Failures | ✅ | `@Transactional` · persistencia en `bill_payments` (RV-002) |
| A09 — Logging Failures | ✅ | Referencia enmascarada · coreTxnId trazable · paymentId en audit |
| A10 — SSRF | ✅ | `BankCoreRestAdapter` llama a URL configurada por entorno · sin parámetros del usuario en URL del core |

---

## 6. Consideraciones específicas banking (PSD2 + PCI-DSS)

| Requisito | Estado | Observación |
|---|---|---|
| PSD2 Art. 74 — SCA en pagos de servicios | ✅ | OTP verificado en `BillPaymentUseCase` y `BillLookupAndPayUseCase` |
| PSD2 Art. 97 — SCA proporcional al riesgo | ✅ | Mismo nivel de autenticación que transferencias |
| PCI-DSS 4.0 Req. 6.3 — Vulnerabilidades identificadas | ✅ | Este reporte |
| PCI-DSS 4.0 Req. 10.2 — Audit trails | ✅ | `BILL_PAYMENT_INITIATED` + `COMPLETED` con `paymentId` + `coreTxnId` |
| Referencia de factura (dato sensible) | ✅ | Enmascarada en logs — nunca completa |
| `BANK_CORE_API_KEY` (secreto de integración) | ✅ | Solo en variables de entorno — credencial Jenkins |
| Rate limiting en endpoints financieros | ✅ | DEBT-016 implementado con fail-open |
| Idempotencia — sin dobles cargos | ✅ | `idempotencyKey` en toda escritura al core |

---

## 7. Plan de remediación

### Bloqueantes (antes de QA)
**Ninguno.** ✅

### Sprint 12
| # | Hallazgo | Acción |
|---|---|---|
| R-SEC-004 | S-001: NPE en `getAvailableBalance()` si body nulo | `Objects.requireNonNullElse(response.available(), BigDecimal.ZERO)` |
| R-SEC-005 | `BillLookupResult` anidado en interfaz (RV-005 CR) | Mover a clase independiente en domain |

---

## 8. Criterio de aceptación de seguridad

```
[x] Zero CVEs críticos — CUMPLIDO
[x] Zero CVEs altos — CUMPLIDO
[x] CVEs medios registrados — 1 heredado sin impacto
[x] Zero secrets en código fuente — CUMPLIDO
[x] OWASP A01-A05 sin hallazgos críticos — CUMPLIDO
[x] PSD2 SCA en todo pago de servicio — CUMPLIDO
[x] PCI-DSS Req. 10.2 audit trail — CUMPLIDO
[x] Referencia de factura enmascarada en logs — CUMPLIDO
[x] BANK_CORE_API_KEY solo en entorno — CUMPLIDO
[x] Idempotencia en escrituras al core — CUMPLIDO
```

**Semáforo final: 🟢 VERDE**
**Gate de seguridad: ✅ APROBADO — Pipeline continúa a QA**

---

*Security Report — SOFIA Security Agent — Step 5b*
*CMMI Level 3 — VER SP 2.1 · VER SP 3.1 · PCI-DSS Req. 6.3*
*BankPortal Sprint 11 — FEAT-009 — 2026-03-21*
