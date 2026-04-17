# Security Report — Sprint 25 · FEAT-023 Mi Dinero PFM
**Fecha:** 2026-04-16 · **Agente:** Security Agent SOFIA v1.9
**Clasificación:** Confidencial — Uso interno
**Referencia:** SCRUM-154..162 · feature/FEAT-023-sprint25

---

## Semáforo de seguridad

🟢 **VERDE** — 0 CVEs críticos · 0 CVEs altos · 1 hallazgo SAST bajo (informativo) · 0 secrets

---

## Métricas

| CVE Crítico | CVE Alto | CVE Medio | Secrets | SAST findings |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1 (BAJO/INFO) |

---

## Análisis de dependencias

No se añaden dependencias nuevas en FEAT-023. El stack es idéntico al de Sprint 24:

| Dependencia relevante | Versión | CVE conocido | Estado |
|---|---|---|---|
| Spring Boot | 3.3.4 | Ninguno crítico | ✅ OK |
| jjwt | 0.12.6 | Ninguno crítico | ✅ OK |
| Bucket4j | 8.10.1 | Ninguno | ✅ OK |
| web-push (nl.martijndwars) | 5.1.1 | Ninguno activo | ✅ OK |
| bcprov-jdk18on | 1.78.1 | Ninguno | ✅ OK |
| Apache POI | 5.3.0 | Ninguno crítico | ✅ OK |
| PDFBox | 3.0.2 | Ninguno | ✅ OK |
| Resilience4j | 2.2.0 | Ninguno | ✅ OK |
| Testcontainers | 1.20.1 | N/A (scope test) | ✅ OK |

> **Conclusión:** 0 CVEs nuevos introducidos por FEAT-023. No se incorporan dependencias nuevas al pom.xml.

---

## Hallazgos SAST

### CRÍTICO (CVSS ≥ 7.0) — BLOQUEANTE
_Ninguno._

### ALTO (CVSS 4.0–6.9)
_Ninguno._

### BAJO / INFORMATIVO

| ID | Descripción | Componente | CWE | CVSS | Observación |
|---|---|---|---|---|---|
| SEC-F023-01 | `catch (Exception e)` sin log en `/pfm/widget` | `PfmController.java:124` | CWE-390 | 2.1 | Ya detectado por CR (RV-M02). Fix aplicado (log.warn). **CERRADO** |

---

## Revisión de patrones de seguridad PFM

### Autenticación & Autorización
- `getAttribute("authenticatedUserId")` ✅ — coincide con `JwtAuthenticationFilter` (LA-TEST-001)
- Todos los endpoints `/pfm/**` requieren JWT válido — SecurityConfig sin modificar ✅
- `userId(httpReq)` extrae UUID del JWT, no del path — sin posibilidad IDOR ✅
- `PUT /pfm/movimientos/{txId}/category` — txId validado contra userId propietario ✅

### Validación de entrada
- `@Valid` en `CreateBudgetRequest` y `CategoryOverrideRequest` ✅
- `amount_limit CHECK (> 0 AND <= 99999.99)` en BD + validación dominio ✅
- `threshold_percent CHECK (BETWEEN 50 AND 95)` — límites explícitos ✅
- `concept_pattern VARCHAR(200)` — longitud acotada ✅
- `category_code` validado contra enum `SpendingCategory` en dominio ✅

### Inyección SQL
- `JpaBudgetAdapter` usa Spring Data JPA con parámetros nombrados — sin concatenación SQL ✅
- `JdbcPfmTransactionReadAdapter` usa `JdbcClient` con parámetros posicionales ✅
- Seed V28 usa sentencias estáticas Flyway — sin interpolación dinámica ✅

### RGPD / Datos personales
- `pfm_user_rules` y `pfm_budgets`: `ON DELETE CASCADE` desde `users(id)` — GDPR Art.17 ✅
- `pfm_budget_alerts`: `ON DELETE CASCADE` desde `pfm_budgets(id)` — cadena completa ✅
- Solo se almacenan UUIDs y categorías — sin PII adicional ✅
- Datos de gasto derivados de `transactions` — no se duplican en claro ✅

### Race conditions
- `UNIQUE (user_id, category_code, budget_month)` en `pfm_budgets` ✅
- `UNIQUE (budget_id, alert_month)` en `pfm_budget_alerts` — máx. 1 alerta/mes ✅
- `UNIQUE (user_id, concept_pattern)` en `pfm_user_rules` ✅

### OWASP Top 10 (A01–A05)
| Riesgo | Estado |
|---|---|
| A01 Broken Access Control | ✅ userId siempre del JWT, nunca del path |
| A02 Cryptographic Failures | ✅ Sin datos cifrados incorrectamente |
| A03 Injection | ✅ JPA + parámetros posicionales |
| A04 Insecure Design | ✅ Arquitectura hexagonal — dominio aislado |
| A05 Security Misconfiguration | ✅ Sin @Profile(!production), secrets externos |

### Secrets scan
- 0 credenciales hardcodeadas en módulo PFM ✅
- 0 tokens o API keys en migrations SQL ✅

---

## Deuda técnica generada

_Ninguna deuda de seguridad nueva._

SEC-F023-01 (CWE-390, CVSS 2.1) ya corregido antes de este gate (RV-M02, fix Developer). No genera DEBT.

---

## Criterio de aceptación

- [x] 0 CVEs críticos
- [x] 0 CVEs altos
- [x] 0 secrets en código fuente
- [x] OWASP A01-A05 sin hallazgos críticos
- [x] RGPD: cascadas de eliminación correctas en todas las tablas PFM
- [x] Validación de entrada en todas las capas

---

## Recomendación

✅ **APROBADO** — Semáforo VERDE · 0 CVE crítico · 0 CVE alto · 0 deuda nueva

Pipeline puede avanzar a **Step 6 — QA Tester**.

---

*Generado por: Security Agent SOFIA v1.9 · Sprint 25 · FEAT-023 Mi Dinero PFM · 2026-04-16*
