# Security Report — FEAT-016 Gestión de Tarjetas
## SecurityReport-Sprint18-FEAT-016 v1.0

| Campo | Valor |
|---|---|
| Documento | SecurityReport-Sprint18-FEAT-016 v1.0 |
| Feature | FEAT-016 — Gestión de Tarjetas |
| Sprint | 18 · v1.18.0 |
| Fecha | 2026-03-25 |
| Ejecutado por | SOFIA Security Agent |
| Semáforo | 🟢 VERDE — Pipeline continúa |
| CMMI | VER SP 3.1 · PPQA SP 1.1 · RSKM SP 2.1 |

---

## Resumen ejecutivo

| Categoría | Resultado |
|---|---|
| CVE Críticos (CVSS ≥ 9.0) | **0** |
| CVE Altos (CVSS 7.0–8.9) | **0** |
| CVE Medios (CVSS 4.0–6.9) | **0** |
| Secrets hardcodeados | **0** |
| Hallazgos SAST bloqueantes | **0** |
| Hallazgos SAST diferidos | **2** |
| Semáforo | **🟢 VERDE** |

**Veredicto: APROBADO — Step 5b completado. Pipeline puede continuar a QA.**

---

## 1. Análisis de dependencias (SCA)

### Librerías nuevas introducidas en Sprint 18

| Librería | Versión | CVSS | Estado |
|---|---|---|---|
| `net.javacrumbs.shedlock:shedlock-spring` | 5.13.0 | - | ✅ Sin CVEs conocidos |
| `net.javacrumbs.shedlock:shedlock-provider-jdbc-template` | 5.13.0 | - | ✅ Sin CVEs conocidos |
| Spring Boot 3.x (existente) | 3.2.x | - | ✅ Actualizado Sprint anterior |
| Spring Security (existente) | 6.2.x | - | ✅ Sin CVEs en scope |

**Resultado SCA:** 0 CVEs en librerías nuevas ni en el grafo de dependencias del módulo cards.

---

## 2. SAST — Análisis estático de código

### Superficies de ataque analizadas

| Superficie | Análisis |
|---|---|
| IDOR en endpoints `/cards/{id}/*` | `card.belongsTo(userId)` validado en **todos** los use-cases |
| Exposición de PAN | Solo `pan_masked` en BD, respuestas y audit. Ningún PAN en claro |
| PIN en tránsito | PIN recibido por HTTPS, hasheado con BCrypt **antes** de persistir/delegar |
| PIN en BD | No se almacena. Se delega hash a `CoreBankingPort` |
| OTP antes de operación sensible | Validado en: `blockCard`, `unblockCard`, `updateLimits`, `changePin` |
| Secrets hardcodeados | 0 encontrados (grep: `password`, `secret`, `token`, `key` = solo referencias a beans) |
| SQL Injection | JPA / JPQL con parámetros named — 0 queries dinámicas concatenadas |
| Logs con datos sensibles | `auditLog` usa `maskCardId(UUID)` — PAN nunca aparece en logs |

---

### SAST-S18-001 — Rate limiting en `/cards/{id}/pin` ⚠️ MEDIUM (diferido)

**Archivo:** `CardController.java` — `changePin()`

**Descripción:**
El endpoint de cambio de PIN no tiene rate limiting específico. Aunque requiere OTP válido (lo cual ya limita el ataque considerablemente), el espacio del PIN de 4 dígitos podría intentarse si un atacante obtuviese múltiples OTPs (ej. SIM swap). El rate limiting global de la API no es suficiente para un endpoint tan crítico en contexto PCI-DSS.

**Recomendación:** Añadir `@RateLimited(key="userId+cardId", maxAttempts=3, window=PT1H)` o equivalente en Redis.

**Impacto:** Bajo en contexto real (OTP requerido como barrera previa). Sin bloqueo para este sprint.

**Decisión:** Diferir como **DEBT-031** — Sprint 19.

```
CVSS 3.1: AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N → 4.2 MEDIUM
```

---

### SAST-S18-002 — CoreBankingAdapter sin forzar TLS en mock ℹ️ LOW (diferido)

**Archivo:** `CoreBankingAdapter.java`

**Descripción:**
El adaptador HTTP al core bancario (mock) usa `RestTemplate` sin configuración TLS explícita. En producción, la comunicación hacia el core bancario que procesa el PIN hash **debe** utilizar TLS mutuo (mTLS) o canal cifrado dedicado. El mock no implementa esta capa porque es un stub de desarrollo.

**Recomendación:** Documentar como prerequisito de producción. Crear ticket para configurar `SSLContext` + certificados mutuos antes del go-live.

**Decisión:** Diferir como **DEBT-032** — Pre-producción (fuera de roadmap sprint).

```
CVSS 3.1: AV:A/AC:H/PR:H/UI:N/S:U/C:L/I:L/A:N → 2.7 LOW
```

---

## 3. PCI-DSS Compliance — Módulo Cards

| Requerimiento PCI-DSS | Control implementado | Estado |
|---|---|---|
| Req. 3 — Proteger datos del titular | `pan_masked` único valor almacenado. PAN real solo en core bancario | ✅ |
| Req. 3.5 — Cifrado datos sensibles | PIN hasheado BCrypt antes de salir del dominio | ✅ |
| Req. 7 — Acceso por necesidad | IDOR check `belongsTo(userId)` en todos los use-cases | ✅ |
| Req. 8 — Identificación y autenticación | OTP SCA obligatorio para block/unblock/limits/pin | ✅ |
| Req. 10 — Auditoría y monitoreo | `AuditLogService` registra CARD_BLOCKED, CARD_UNBLOCKED, CARD_LIMITS_UPDATED, CARD_PIN_CHANGED | ✅ |

---

## 4. Validación de migraciones Flyway

| Migración | Análisis de seguridad | Estado |
|---|---|---|
| V18 — Tabla cards | Constraints correctos. INDEX en user_id. PAN masked, no PAN en claro | ✅ |
| V18b — DROP columnas plain push_subscriptions | **Cierra DEBT-028** — elimina `auth_plain` y `p256dh_plain` de producción. Ejecutar tras validar migración de datos AES-GCM (Sprint 17) | ✅ |
| V18c — Tabla shedlock | Estructura PK `name` · timestamps correctos · Sin datos sensibles | ✅ |

**Nota V18b:** Confirma cierre formal de DEBT-028 (CVSS 4.1). Riesgo R-016-01 queda cerrado.

---

## 5. Gestión de riesgos — impacto Sprint 18

| ID Riesgo | Descripción | Estado anterior | Estado Sprint 18 |
|---|---|---|---|
| R-016-01 | push_subscriptions.auth en claro en BD | Mitigando | **✅ CERRADO** — V18b elimina columnas plain |
| R-016-05 | >500 SSE concurrentes sin prueba carga | Planificado | 🔄 Sin cambio — pendiente prueba carga |
| R-015-01 | Scheduler duplicado multi-instancia | Mitigado-diferido | **✅ CERRADO** — ADR-028 ShedLock implementado |
| R-018-01 | IDOR en /cards/{id} | Nuevo S18 | **✅ MITIGADO** — `belongsTo()` + tests integración |
| R-018-02 | PAN en claro en logs o audit | Nuevo S18 | **✅ MITIGADO** — `maskCardId()` en todos los puntos |

**Riesgos cerrados en Sprint 18: 3** (R-016-01, R-015-01, R-018-01/02 mitigados)

---

## 6. Deuda técnica registrada en este sprint

| ID | Descripción | CVSS | Área | Sprint target |
|---|---|---|---|---|
| DEBT-031 | Rate limiting específico en `/cards/{id}/pin` | 4.2 | Security | Sprint 19 |
| DEBT-032 | mTLS en CoreBankingAdapter para producción | 2.7 | Security/Infra | Pre-producción |

---

## 7. Checklist de seguridad final

```
AUTENTICACIÓN Y AUTORIZACIÓN
✅ JWT RS256 — todos los endpoints protegidos
✅ OTP/SCA — operaciones sensibles (block/unblock/limits/pin)
✅ IDOR check — card.belongsTo(userId) en todos los use-cases
✅ 403 en acceso a tarjeta de otro usuario

DATOS SENSIBLES
✅ PAN: solo pan_masked almacenado. Nunca PAN en claro en BankPortal
✅ PIN: BCrypt hash via PasswordEncoder. No almacenado en BankPortal
✅ push_subscriptions: auth_plain/p256dh_plain eliminados (V18b — cierra DEBT-028)
✅ Logs y audit: maskCardId() en todos los puntos de trazabilidad

INYECCIONES
✅ SQL: JPA/JPQL con parámetros named. 0 concatenaciones
✅ Validación de entrada: @Valid + Jakarta Constraints en todos los requests
✅ PIN regex: bloquea PINs triviales (0000, 1111, 1234, etc.)

INFRAESTRUCTURA
✅ ShedLock: scheduler exclusivo multi-instancia (ADR-028)
✅ Rate limiting global API: heredado de infraestructura existente
⚠️ Rate limiting /pin: DEBT-031 (Sprint 19)
⚠️ mTLS CoreBankingAdapter: DEBT-032 (Pre-producción)

TRAZABILIDAD
✅ CARD_BLOCKED, CARD_UNBLOCKED, CARD_LIMITS_UPDATED, CARD_PIN_CHANGED auditados
✅ Retención de audit_log: política CMMI CM SP 1.2 activa
```

---

## Firma

| Agente | Resultado | Fecha |
|---|---|---|
| SOFIA Security Agent | 🟢 VERDE — Pipeline autorizado | 2026-03-25 |

---

*SOFIA Security Agent — Step 5b — Sprint 18 · FEAT-016*
*CMMI Level 3 — VER SP 3.1 · PPQA SP 1.1 · RSKM SP 2.1*
*BankPortal — Banco Meridian · v1.18.0*
