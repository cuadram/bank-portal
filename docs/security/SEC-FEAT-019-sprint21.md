# Security Report — Sprint 21 · FEAT-019
**Fecha:** 2026-03-31 · **Agente:** Security Agent SOFIA v1.9
**Clasificación:** Confidencial — Uso interno

---

## Semáforo de seguridad

🟡 **AMARILLO — APROBADO CON CONDICIONES**

> 0 CVEs críticos · 0 CVEs altos · 2 hallazgos SAST MEDIO (CVSS ≥ 4.0) · 1 BAJO
> Pipeline continúa a Step 6.
> LA-020-02: hallazgos CVSS ≥ 4.0 deben resolverse en Sprint 21 (mismo sprint).
> DEBT-040 y DEBT-041 creados con sprint_target S21.

---

## Métricas

| CVE Crítico | CVE Alto | CVE Medio | Secrets | SAST findings |
|:-----------:|:--------:|:---------:|:-------:|:-------------:|
| 0           | 0        | 0         | 0       | 3             |

---

## Análisis de dependencias — Dependencias nuevas FEAT-019

FEAT-019 no introduce nuevas dependencias en `pom.xml`.
Usa exclusivamente Spring Data JPA, Lombok y anotaciones estándar ya presentes.

| Dependencia referenciada | Versión | CVE conocido | Estado |
|---|---|---|---|
| `spring-boot-starter-data-jpa` | 3.3.4 (BOM) | Ninguno | ✅ |
| `spring-security-core` | 3.3.4 (BOM) | Ninguno | ✅ |
| `jjwt` | 0.12.6 | Ninguno | ✅ |
| `pdfbox` | 3.0.2 | Ninguno | ✅ |
| `bouncycastle bcprov-jdk18on` | 1.78.1 | Ninguno | ✅ |

---

## Secrets scan

```
Ámbito: apps/backend-2fa/.../privacy/** + apps/frontend-portal/.../privacy/**
Resultado: CLEAN — 0 secrets, passwords o API keys hardcodeados encontrados
```

---

## PII en logs

```
Ámbito: todos los log.* en privacy/**
Resultado: OK — 0 leakage de email, nombre, teléfono, IBAN en statements de log
Verificado: DeletionRequestService, DataExportService, ConsentManagementService
```

---

## Hallazgos SAST

### 🟡 MEDIO (CVSS 5.3) — SEC-F019-01: Race condition en DataExportService (RN-F019-19)

| Campo | Valor |
|---|---|
| **ID** | SEC-F019-01 |
| **Componente** | `DataExportService.requestExport()` |
| **CWE** | CWE-362 — Concurrent Execution Using Shared Resource (Race Condition) |
| **CVSS 3.1** | 5.3 AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N |
| **Deuda** | DEBT-040 (sprint_target S21) |

**Descripción:**
`requestExport()` realiza `findActiveByUserIdAndTipo()` + `save()` en la misma transacción
`@Transactional` con isolation por defecto (READ_COMMITTED). Dos requests HTTP concurrentes
del mismo usuario pueden superar la guardia `ifPresent(throw)` simultáneamente antes de que
ninguno haga commit, creando dos exports activos y violando RN-F019-19.

**Impacto:** doble generación de export, doble consumo de recursos, inconsistencia de datos
GDPR (el usuario recibe dos emails con datos personales).

**Riesgo en producción:** Bajo en condiciones normales (requiere concurrencia exacta),
pero el coste de materialización es alto (datos personales expuestos dos veces).

**Remediación:**
```sql
-- V22: añadir unique index parcial que impide dos exports activos
CREATE UNIQUE INDEX IF NOT EXISTS idx_gdpr_unique_active_export
  ON gdpr_requests(user_id, tipo)
  WHERE estado IN ('PENDING','IN_PROGRESS');
```
O alternativamente: `@Transactional(isolation = Isolation.SERIALIZABLE)` en `requestExport()`.
La opción de unique index es preferida (fuerza a nivel BD, no solo aplicación).
Registrado como **DEBT-040**.

---

### 🟡 MEDIO (CVSS 4.8) — SEC-F019-02: OTP de eliminación no validado en backend (RN-F019-25)

| Campo | Valor |
|---|---|
| **ID** | SEC-F019-02 |
| **Componente** | `PrivacyController.requestDeletion()` |
| **CWE** | CWE-287 — Improper Authentication |
| **CVSS 3.1** | 4.8 AV:N/AC:H/PR:L/UI:N/S:U/C:N/I:H/A:N |
| **Deuda** | DEBT-041 (sprint_target S21) |

**Descripción:**
`PrivacyController.requestDeletion()` contiene únicamente un comentario:
```java
// En producción: validar OTP contra OtpService antes de iniciar
deletionService.initiateDeletion(userId(req));
```
La validación OTP 2FA **no está implementada**. Cualquier usuario autenticado con JWT
válido puede iniciar la eliminación de su cuenta sin segundo factor.
RN-F019-25 lo marca como obligatorio. Clase `OtpService` ya existe en el proyecto (FEAT-001).

**Impacto:** Pérdida irrecuperable de cuenta sin confirmación del segundo factor.
Riesgo de account takeover si el JWT está comprometido.

**LA-020-02 aplica:** CVSS 4.8 ≥ 4.0 → debe resolverse en Sprint 21.

**Remediación:**
```java
// PrivacyController.requestDeletion()
@PostMapping("/deletion-request")
@ResponseStatus(HttpStatus.ACCEPTED)
public ResponseEntity<Map<String, String>> requestDeletion(
        @Valid @RequestBody DeletionRequestDto dto,
        HttpServletRequest req) {
    // RN-F019-25: validar OTP 2FA antes de iniciar eliminación
    UUID userId = userId(req);
    if (!otpService.isOtpValid(userId, dto.otpCode())) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "INVALID_OTP");
    }
    deletionService.initiateDeletion(userId);
    return ResponseEntity.accepted().body(Map.of(
        "message", "Email de confirmación enviado. Tienes 24 horas para confirmar."));
}
```
Registrado como **DEBT-041**.

---

### 🔵 BAJO (CVSS 2.1) — SEC-F019-03: Deletion confirmation token sin TTL 24h real (RN-F019-26)

| Campo | Valor |
|---|---|
| **ID** | SEC-F019-03 |
| **Componente** | `DeletionRequestService.confirmDeletion()` |
| **CWE** | CWE-613 — Insufficient Session Expiration |
| **CVSS 3.1** | 2.1 AV:N/AC:H/PR:L/UI:R/S:U/C:N/I:L/A:N |
| **Deuda** | DEBT-042 (sprint_target S22) |

**Descripción:**
`confirmDeletion(requestId)` valida que `estado == PENDING` pero no verifica el TTL de 24h
especificado en RN-F019-26. El token (requestId UUID) permanece válido indefinitamente.
`gdpr_requests.created_at` existe en BD y puede usarse para la comprobación.

**Impacto bajo:** requiere que el atacante tenga el UUID del requestId (no predecible),
lo que limita severamente la explotabilidad.

**Remediación:**
```java
// DeletionRequestService.confirmDeletion()
if (request.getCreatedAt().plusHours(24).isBefore(LocalDateTime.now())) {
    request.reject("TOKEN_EXPIRED");
    gdprRepo.save(request);
    throw new ResponseStatusException(HttpStatus.GONE, "DELETION_TOKEN_EXPIRED");
}
```
Registrado como **DEBT-042** (sprint_target S22 — CVSS < 4.0).

---

## OWASP Top 10 — Checklist FEAT-019

| OWASP | Descripción | Estado |
|---|---|---|
| A01 Broken Access Control | `@PreAuthorize` en AdminGdprController ✅ (fix RV-F019-01) | ✅ |
| A02 Cryptographic Failures | Sin cifrado de datos en reposo nuevo — consent_history no contiene PII crítica | ✅ |
| A03 Injection | Spring Data JPA con JPQL named params — sin SQL concatenado | ✅ |
| A04 Insecure Design | Race condition DataExportService (SEC-F019-01) | ⚠️ DEBT-040 |
| A05 Security Misconfiguration | OTP no validado en backend (SEC-F019-02) | ⚠️ DEBT-041 |
| A06 Vulnerable Components | 0 CVEs en dependencias | ✅ |
| A07 Auth Failures | `authenticatedUserId` por request attribute JWT (LA-TEST-001) | ✅ |
| A08 Data Integrity | consent_history append-only, RN-F019-16/37 ✅ | ✅ |
| A09 Logging Failures | Audit log en AdminGdprController, sin PII en logs | ✅ |
| A10 SSRF | Sin llamadas HTTP externas en FEAT-019 (webhook CoreBanking es placeholder) | ✅ |

---

## GDPR / PCI-DSS Compliance — FEAT-019

| Requisito | Estado | Observación |
|---|---|---|
| GDPR Art.7 — Consentimiento | ✅ | `consent_history` append-only, `ConsentType.isToggleable()` |
| GDPR Art.15/20 — Portabilidad | ✅ | `DataExportService` asíncrono, SLA 24h |
| GDPR Art.17 — Derecho al olvido | ⚠️ | OTP no validado (DEBT-041) |
| GDPR Art.5(1)(f) — Confidencialidad | ✅ | `@PreAuthorize ADMIN` en panel GDPR |
| GDPR Art.5(2) — Accountability | ✅ | Audit log en `AdminGdprController` |
| GDPR Art.12§3 — SLA 30 días | ✅ | `sla_deadline = created_at + 30d` |
| PCI-DSS Req.6 — Secure development | ✅ | 0 secrets, validación de inputs |

---

## Deuda técnica generada en FEAT-019

| ID | Descripción | Área | Prioridad | Sprint obj. | CVSS |
|---|---|---|---|---|---|
| DEBT-040 | Race condition DataExportService — unique index parcial en gdpr_requests | Security/Backend | **Alta** | S21 | 5.3 |
| DEBT-041 | OTP 2FA no validado en PrivacyController.requestDeletion — integrar OtpService | Security/Backend | **Alta** | S21 | 4.8 |
| DEBT-042 | Deletion confirmation token sin TTL 24h en DeletionRequestService | Security/Backend | Media | S22 | 2.1 |

---

## Criterio de aceptación

- [x] 0 CVEs críticos en dependencias
- [x] 0 CVEs altos en dependencias
- [x] 0 secrets en código fuente
- [x] OWASP A01-A03, A06-A10 sin hallazgos críticos
- [ ] DEBT-040 y DEBT-041 (CVSS ≥ 4.0) → resolución en S21 (LA-020-02)

---

## Recomendación

🟡 **APROBADO CON CONDICIONES**

Pipeline continúa a Step 6 (QA). DEBT-040 y DEBT-041 deben incorporarse al backlog
de Sprint 21 e implementarse antes del cierre del sprint.
DEBT-042 puede diferirse a S22 por CVSS < 4.0.

---
*Generado por SOFIA Security Agent v1.9 — 2026-03-31*
*Pipeline: Sprint 21 / FEAT-019 / Step 5b*
