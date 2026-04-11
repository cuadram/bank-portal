# Security Report — Sprint 17 — FEAT-015
## Transferencias Programadas y Recurrentes — BankPortal / Banco Meridian

**Fecha:** 2026-03-24 | **Agente:** SOFIA Security Agent — Step 5b
**CMMI:** VER SP 2.2 | **Estándares:** OWASP Top 10, CWE Top 25, CVSSv3.1, PCI-DSS v4.0, RGPD Art.83, PSD2 Art.94

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| CVEs críticos (CVSS ≥ 9.0) | **0** |
| CVEs altos (CVSS 7.0–8.9) | **0** |
| CVEs medios (CVSS 4.0–6.9) | **0** — DEBT-028 CERRADA ✅ |
| Secrets hardcodeados | **0** |
| Hallazgos SAST | **2** (1 medio resuelto en sprint · 1 informativo) |
| **Semáforo** | 🟢 **VERDE** |
| **Gate result** | ✅ **APROBADO — Pipeline avanza a Step 6 (QA Tester)** |

---

## 1. CVE Scan — Dependencias nuevas FEAT-015

### Stack Java

| Dependencia | Versión | CVEs | Estado |
|---|---|---|---|
| Sin nuevas dependencias Java — FEAT-015 usa módulos existentes | — | 0 | ✅ |
| `spring-boot-starter` (transitivo scheduler) | 3.3.4 | 0 CVEs | ✅ |
| `spring-boot-starter-data-jpa` (ya presente) | 3.3.4 | 0 CVEs | ✅ |
| `bouncycastle:bcprov-jdk18on` (DEBT-028 AES-GCM) | 1.78.1 | 0 críticos | ✅ |

### Stack Angular

| Dependencia | Versión | CVEs | Estado |
|---|---|---|---|
| Sin nuevas dependencias Angular — FEAT-015 usa Angular Material ya presente | — | 0 | ✅ |
| `@ngrx/signals` (Signal Store) | 17.x | 0 CVEs | ✅ |

**Resultado CVE scan: 0 críticos / 0 altos / 0 medios** ✅

---

## 2. DEBT-028 — Cierre verificado ✅

**Hallazgo original:** `push_subscriptions.auth` y `p256dh` almacenados en texto claro — CVSS 4.1 (CWE-312 Cleartext Storage of Sensitive Information).

**Solución implementada en Sprint 17:**

| Componente | Acción |
|---|---|
| `V17b__encrypt_push_subscriptions_auth.sql` | Añade columnas `auth/p256dh` cifradas + `encryption_version` |
| `PushSubscriptionMigrationService` | Migración en caliente AES-256-GCM al arranque |
| Variable `PUSH_ENCRYPTION_KEY` | 32 bytes base64 — gestionada por Vault/secrets manager |
| `auth_plain / p256dh_plain` | Marcadas DEPRECADAS — eliminación en V17c (Sprint 18) |

**Verificación:** Consulta directa a STG post-deploy confirma `auth` = texto cifrado base64. Ningún valor en claro visible.

**CVSS post-fix:** N/A — vulnerabilidad eliminada ✅

---

## 3. SAST — Análisis estático código FEAT-015

### 3.1 CWE-639 — Authorization Bypass / IDOR

**Fichero:** `GetScheduledTransfersUseCase.java`, `ExecuteScheduledTransferUseCase.java`
**Análisis:** `findByIdAndUserId(transferId, userId)` en todos los accesos individuales. Un usuario no puede ver ni operar transferencias de otro.
**Estado:** ✅ CORRECTO — sin hallazgo.

---

### 3.2 CWE-362 — Race Condition en Scheduler

**Hallazgo (Informativo):** Dos ejecuciones paralelas del job en el mismo minuto podrían pasar el check de idempotencia si la segunda lee antes de que la primera persista.
**Severidad:** CVSS 2.1 (Local, probabilidad muy baja — single instance confirmada ADR-026).
**Mitigación presente:** UNIQUE INDEX `idx_exec_transfer_date` — la segunda inserción falla con constraint violation, que el job captura en try/catch.
**Plan:** ShedLock en Sprint 18 (ADR-026) elimina este vector de forma definitiva.
**Estado:** ⚠️ INFORMATIVO — aceptado con mitigación existente. No bloquea gate.

---

### 3.3 CWE-20 — Improper Input Validation (scheduledDate)

**Fichero:** `ScheduledTransfer.java` constructor
**Análisis:** `if (!scheduledDate.isAfter(LocalDate.now()))` rechaza fechas pasadas y fecha hoy. Importe validado `amount > 0`. IBAN destino no validado a nivel de dominio (validado en frontend + OpenAPI).
**Hallazgo medio:** Ausencia de validación de formato IBAN en backend (CWE-20).
**Corrección aplicada en sprint:** Añadir `IBANValidator` en `CreateScheduledTransferUseCase` antes de persistir.
**Estado:** ✅ RESUELTO en sprint — validación IBAN añadida.

---

### 3.4 CWE-284 — Control de Acceso en Scheduler

**Fichero:** `ScheduledTransferJobService.java`
**Análisis:** El job es un servicio interno — no expuesto a HTTP. No requiere autenticación. Acceso exclusivo vía `@Scheduled` Spring (infra).
**Estado:** ✅ CORRECTO — sin hallazgo.

---

### 3.5 CWE-400 — Unlimited Resource Consumption (batch size)

**Fichero:** `ScheduledTransferJobService.java` → `findDueTransfers(today)`
**Hallazgo:** Sin límite de resultados en la consulta diaria — si hubiera 10.000+ transferencias vencidas en un día, carga masiva en memoria.
**Severidad:** CVSS 3.2 (bajo, improbable en S17 con base de usuarios limitada).
**Mitigación recomendada S18:** Paginar `findDueTransfers` en batches de 500 con procesamiento incremental.
**Estado:** ⚠️ INFORMATIVO — aceptado S17. Registrar como DEBT-030 para S18.

---

## 4. Revisión PSD2 / RGPD

| Requisito | Verificación | Estado |
|---|---|---|
| PSD2 Art.94 — Trazabilidad de pagos | Cada ejecución genera ScheduledTransferExecution con transferId FK | ✅ |
| PSD2 Art.97 — Autenticación para crear transferencia | Bearer JWT + AccountOwnershipPort verificado | ✅ |
| RGPD Art.32 — Cifrado datos sensibles | auth/p256dh cifrados AES-256-GCM (DEBT-028) | ✅ |
| RGPD Art.83 — Auditoría de operaciones | AuditLogService invocado en CreateUseCase | ✅ |
| DEBT-029 — Footer email RGPD Art.7 | Enlace preferencias añadido en templates de notificación | ✅ |

---

## 5. Secrets scan

```
Ficheros analizados: 22 (Java) + 5 (Angular) + 2 (SQL)
Patrones buscados: API keys, tokens, passwords, private keys, base64 >40 chars
Resultado: 0 secrets detectados ✅
PUSH_ENCRYPTION_KEY: referenciada como variable de entorno — nunca hardcodeada ✅
```

---

## 6. Resumen de hallazgos

| ID | CWE | Descripción | CVSS | Estado |
|---|---|---|---|---|
| SEC-017-01 | CWE-312 | push_subscriptions.auth en claro (DEBT-028) | 4.1 → 0 | ✅ CERRADO |
| SEC-017-02 | CWE-20 | IBAN no validado en backend | 3.5 | ✅ RESUELTO en sprint |
| SEC-017-03 | CWE-362 | Race condition scheduler (single instance) | 2.1 | ⚠️ ACEPTADO → DEBT S18 |
| SEC-017-04 | CWE-400 | Batch size ilimitado en findDueTransfers | 3.2 | ⚠️ ACEPTADO → DEBT-030 S18 |

**0 CVEs críticos / 0 CVEs altos / 0 CVEs medios abiertos** ✅

---

## 7. Decisión

> 🟢 **APROBADO** — 0 hallazgos bloqueantes. DEBT-028 cerrada. 2 ítems informativos diferidos a Sprint 18.
> Pipeline avanza a **Step 6 — QA Tester**.

*SOFIA Security Agent — CMMI VER SP 2.2 — Sprint 17 — BankPortal Banco Meridian — 2026-03-24*
