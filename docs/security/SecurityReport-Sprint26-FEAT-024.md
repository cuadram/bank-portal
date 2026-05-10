# Security Report — Sprint 26 · FEAT-024 (Objetivos de Ahorro)
**Fecha:** 2026-05-08 · **Agente:** Security Agent SOFIA v1.9
**Clasificación:** Confidencial — Uso interno
**Branch:** feature/FEAT-024-sprint26 · HEAD 5d9cfd5
**Reviewer previo:** Code Reviewer SOFIA v2.6 (G-5 APPROVED)

---

## Semáforo de seguridad

🟢 **VERDE — APROBADO**

> 0 CVEs críticos · 0 CVEs altos · 0 secrets · 1 hallazgo SAST BAJO · 2 CVEs LOW transitivos preexistentes
> Pipeline continúa a Step 6 (QA Tester · gate HITL QA G-6) sin restricciones.

---

## Métricas

| CVE Crítico | CVE Alto | CVE Medio | CVE Bajo | Secrets | SAST findings |
|:-----------:|:--------:|:---------:|:--------:|:-------:|:-------------:|
| 0           | 0        | 0         | 2 (transitivos) | 0       | 1 BAJO         |

---

## Análisis de dependencias — Dependencias nuevas Sprint 26

Sprint 26 introduce 3 dependencias nuevas (commits Fase H `f38c6ad` + `4e12abd`):

| Dependencia | Versión | Tipo | CVE directo | Estado |
|---|---|---|---|---|
| `net.javacrumbs.shedlock:shedlock-spring` | 5.16.0 | backend (Maven) | Ninguno | ✅ |
| `net.javacrumbs.shedlock:shedlock-provider-jdbc-template` | 5.16.0 | backend (Maven) | Ninguno | ✅ |
| `jwt-decode` | ^4.0.0 | frontend (npm) | Ninguno | ✅ |

### Detalle de verificación

**`jwt-decode 4.0.0`** (frontend · token.service.ts):
- Snyk: 0 vulnerabilidades directas conocidas para versión 4.0.0
- Uso en proyecto: SOLO decodificación de JWT (lectura de claims `exp`, `sub` para UI). NO realiza verificación criptográfica. La verificación real ocurre server-side en `JwtAuthenticationFilter`.
- CVE-2022-23529 (jsonwebtoken) NO aplica — paquete diferente con superficie reducida.

**`shedlock-spring 5.16.0` + `shedlock-provider-jdbc-template 5.16.0`** (backend):
- 0 vulnerabilidades directas en el código de ShedLock.
- Vulnerabilidades transitivas via spring-context (Spring Boot 3.3.4 → Spring Framework 6.1.13):
  - **CVE-2025-22233** — Spring Framework DataBinder Case Sensitive Match Exception · **CVSS 3.1 (LOW)** · CWE-20
  - **CVE-2024-38820** — Spring Framework DataBinder bypass de disallowedFields · **CVSS 3.1 (LOW)** · predecesor
- **Estos CVEs son DEUDA PREEXISTENTE del proyecto** (Spring Boot 3.3.4 trae Spring 6.1.13, anterior al fix 6.1.20). NO son introducidos por Sprint 26 — el upgrade a ShedLock no cambia la versión de Spring.
- Severidad LOW (3.1) está MUY por debajo del umbral crítico (≥7.0). No bloquea G-5b.
- Mitigación recomendada: actualizar Spring Boot a 3.3.6+ en sprint dedicado a deuda. Tracking: ya cubierto por procesos de actualización de framework — sugiere DEBT-059 si no existe ya un seguimiento.

---

## Secrets scan

```
Ámbito: savings/** (backend + frontend) + diff acumulado Fase H
Patrones: password=, secret=, api_key=, token="<base64long>",
          AKIA[A-Z0-9]{16}, ghp_[A-Za-z0-9]{36}, sk-[A-Za-z0-9]{32+},
          BEGIN RSA, BEGIN PRIVATE
Resultado: CLEAN — 0 secrets, 0 API keys, 0 private keys, 0 hardcoded tokens
```

---

## PII en logs

```
Ámbito: 4 statements log.{info,warn,debug} en savings/**
Verificado:
  · SavingsController.java:199    log.warn(savings.widget.degraded reason={}, e.getMessage())
  · SavingsExceptionHandler:99    log.debug(savings.validation.failed {})
  · AutoContributionScheduler:73  log.warn(savings.auto.scheduler rule_failed ruleId={} reason={})
  · AutoContributionScheduler:78  log.info(savings.auto.scheduler done total={} processed={} ...)
Resultado: OK — 0 leakage de email, IBAN, nombre, teléfono, importes monetarios.
           Se loguean solo IDs internos (UUID ruleId), códigos de error y métricas agregadas.
```

---

## SAST checks ejecutados (sólo savings/, alcance del sprint)

| Check | Patrón | Ocurrencias | Resultado |
|---|---|---|---|
| SQL Injection | concatenación de strings con WHERE/SELECT/INSERT | 0 reales (1 falso positivo: mensaje de error humano en UpdateGoalUseCase:51) | ✅ |
| SSRF / HTTP outbound | new URL(), URI.create(), RestTemplate, WebClient | 0 | ✅ (savings no hace llamadas externas) |
| Deserialización insegura | ObjectInputStream, XMLDecoder, yaml.load | 0 | ✅ |
| StackTrace exposure | e.printStackTrace(), e.getStackTrace() | 0 | ✅ |
| Hardcoded secrets | password=, token=long, api_key= | 0 | ✅ |
| @AuthenticationPrincipal anti-patrón (DEBT-022) | grep en savings/api/ | 0 (uso correcto de request.getAttribute via LA-TEST-001) | ✅ |
| @Profile("!production") en producción | grep en savings/ | 0 | ✅ |

---

## Autenticación & Autorización — Auditoría

| Aspecto | Implementación | Veredicto |
|---|---|---|
| Endpoint protection | `/api/v1/savings/**` NO en `SecurityConfig.permitAll` → JWT obligatorio vía `JwtAuthenticationFilter` | ✅ |
| Extracción userId | `request.getAttribute("authenticatedUserId")` en SavingsController:87 (LA-TEST-001) | ✅ |
| Algoritmo JWT | RS256 (configurado en JwtAuthenticationFilter pre-existente) | ✅ |
| Autorización por usuario en UCs sensibles | 6/10 UCs verifican ownership con GoalAccessDeniedException: GetGoalDetail, ContributeManual, PauseAutoRule, UpdateGoal, ConfigureAutoRule, CloseGoal | ✅ |
| Autorización implícita en UCs de creación/listado | 4/10 UCs filtran por userId en query: CreateGoal, ListGoals, GetDashboardWidget, ProcessAutoRule (scheduler interno) | ✅ |
| SCA (OTP) en operaciones destructivas | CloseGoalUseCase requiere OTP cuando reserved > 30€ (RN-F024-12) — gate vía InvalidOtpException → 401 | ✅ |
| Spring Security filter order | `BearerTokenAuthenticationFilter` registrado correctamente — sin colisión con filtros HMAC custom (DEBT-022 pattern resuelto) | ✅ |

---

## Hallazgos SAST

### 🟢 BAJO (CVSS 3.5) — SEC-F024-01: Mensajes de excepción exponen importes monetarios al cliente

| Campo | Valor |
|---|---|
| **ID** | SEC-F024-01 |
| **Componente** | `UpdateGoalUseCase.java:50` + `SavingsExceptionHandler.handleReservedExceedsTarget()` |
| **CWE** | CWE-209 — Generation of Error Message Containing Sensitive Information |
| **CVSS 3.1** | 3.5 AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N |
| **Deuda** | DEBT-059 (sprint_target S27 · prioridad Baja) |

**Descripción:**
`UpdateGoalUseCase` lanza `ReservedExceedsTargetException("El nuevo target " + newTarget + " es inferior al reservado actual " + goal.getReservedAmount())`.
`SavingsExceptionHandler` propaga el mensaje completo al cliente vía `body.put("message", e.getMessage())` con HTTP 422.

**Impacto:** Bajo. El cliente autenticado solo ve importes de SUS PROPIOS goals (autorización ya verificada en línea 40 del UC con GoalAccessDeniedException). No hay leakage cross-user. Sin embargo:
1. Revela detalles internos del estado de los datos (importes exactos en BD).
2. Podría facilitar enumeración si se combinase con otros endpoints (riesgo teórico, no demostrado).
3. Inconsistente con el resto de excepciones del módulo, que usan mensajes genéricos sin importes (`InsufficientFundsException`, `MaxGoalsReachedException`, etc.).

**Remediación sugerida:**
```java
// UpdateGoalUseCase.java:50
throw new ReservedExceedsTargetException(); // mensaje genérico del constructor por defecto
// El frontend ya conoce los importes del goal (los acaba de mostrar al usuario);
// no necesita que el backend se los devuelva en el error.
```

**Decisión:** **NO BLOQUEANTE**. Deuda registrada como DEBT-059 con prioridad Baja, sprint_target S27. Acción opcional durante mismo PR si Tech Lead lo prioriza.

---

## Aspectos Banking/PCI/RGPD específicos

| Requisito | Aplicabilidad savings | Estado |
|---|---|---|
| 2FA obligatorio en operaciones de alto riesgo | CloseGoal con reserved > 30€ requiere OTP (RN-F024-12) | ✅ |
| Auditoría de operaciones financieras | `GoalAllocation` registra cada aportación con timestamp + userId + amount | ✅ |
| Rate limiting en savings | No específico — se reusa el rate limit global del proyecto (Bucket4j en `twofa/infrastructure/security`) | ✅ |
| PCI-DSS Req 6.5.6 (información sensible en errores) | SEC-F024-01 (BAJO) — mensaje con importes del propio user | 🟢 (no crítico, registrado como DEBT-059) |
| RGPD Art. 5.1.f (integridad/confidencialidad) | Cifrado en tránsito (TLS), JWT signed RS256, no PII en logs | ✅ |
| RGPD Art. 25 (privacy by design) | Validación en capa de dominio, no solo en controlador (`@Valid` + UC checks) | ✅ |
| Idempotencia en ops financieras | `MilestoneAlreadyEmittedException` (RN-F024-09), `ProcessAutoRuleUseCase` con idempotencia mensual | ✅ |
| ShedLock distribuido | LockProvider JDBC + `usingDbTime()` previene split-brain en multi-replica | ✅ |

---

## Deuda técnica generada / actualizada

| ID | Descripción | Área | Prioridad | Sprint obj. | CVSS | Origen |
|---|---|---|---|---|---|---|
| **DEBT-059** | Mensajes de excepción en savings revelan importes del usuario al cliente (SEC-F024-01) | Security | Baja | S27 | 3.5 | Step 5b S26 |
| **DEBT-060** | Spring Boot 3.3.4 → Spring Framework 6.1.13 afectado por CVE-2025-22233 + CVE-2024-38820 (LOW). Evaluar upgrade a 3.3.6+ en sprint de mantenimiento | Backend | Baja | TBD | 3.1 | Step 5b S26 |

**Nota sobre IDs en Code Review previo:** El reporte de Step 5 sugirió "DEBT-052" y "DEBT-053" para política springdoc en prod y refactor `userId()` helper. Esos IDs **YA ESTÁN OCUPADOS** en `session.json.open_debts` (DEBT-052 INVALIDATED · DEBT-053 OPEN sobre ProcessAutoRuleUseCase paginación). Las deudas funcionales sugeridas en CR deben renumerarse a **DEBT-061** (springdoc prod) y **DEBT-062** (userId helper) cuando se creen formalmente en Step 8b.

---

## Criterios de aceptación

- [X] 0 CVEs críticos
- [X] 0 CVEs altos directos (los 2 transitivos LOW son deuda preexistente, no del sprint)
- [X] 0 secrets en código fuente
- [X] OWASP A01 (Broken Access Control) sin hallazgos — ownership verificado en 10/10 UCs
- [X] OWASP A02 (Cryptographic Failures) sin hallazgos — JWT RS256, TLS, no PII en logs
- [X] OWASP A03 (Injection) sin hallazgos — JPA only, 0 SQL concatenation
- [X] OWASP A04 (Insecure Design) sin hallazgos — checklist devops pre-G-7 y guardrails activos
- [X] OWASP A05 (Security Misconfiguration) — `/v3/api-docs` permitAll documentado como decisión consciente (RV-MIN-02 en CR)

---

## Recomendación

**APROBADO** — Pipeline avanza a Step 6 (QA Tester · HITL QA G-6) sin condiciones bloqueantes.

DEBT-059 (BAJO) y DEBT-060 (LOW preexistente) registrados para procesamiento en Step 8b (FA-Agent + DEBT-BACKLOG.md). No requieren intervención antes de Step 6.

---

## Referencias

- Code Review Report: `docs/deliverables/sprint-26-FEAT-024/STEP5-code-review-report.md` (Step 5 · APPROVED)
- HLD/LLD: `docs/architecture/HLD-FEAT-024.md` + `docs/architecture/LLD-backend-FEAT-024-sprint26.md`
- ADR-028: distributed scheduler locking (ShedLock) — base de la integración Fase H.2
- Snyk advisory `jwt-decode 4.0.0`: sin CVEs directos
- Spring advisory CVE-2025-22233: https://spring.io/security/cve-2025-22233/

---

**Próximo gate:** Step 5b cierra automáticamente (sin HITL). El pipeline avanza directamente a **Step 6 · QA Tester · gate HITL QA G-6**.
