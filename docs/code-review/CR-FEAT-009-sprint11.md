# Code Review Report — FEAT-009 Sprint 11
## Core Bancario Real + Pagos de Servicios

## Metadata

| Campo | Valor |
|---|---|
| Documento | CR-FEAT-009-sprint11 |
| Feature | FEAT-009 — Core Bancario Real + Pagos de Servicios |
| Sprint | 11 |
| Revisor | SOFIA Code Reviewer Agent — Step 5 |
| Fecha | 2026-03-21 |
| Commits revisados | `9321c72` `7205b6d` `84f4ec7` `47bce6d` |
| Referencia LLD | LLD-012-core-integration-bills.md |
| Estado | ⚠️ APROBADO CON CONDICIONES — 2 Mayores requieren corrección y re-review |

---

## Resumen ejecutivo

| Severidad | Cantidad |
|---|---|
| 🔴 BLOQUEANTE | 0 |
| 🟠 MAYOR | **2** |
| 🟡 MENOR | 2 |
| 🟢 SUGERENCIA | 2 |

**Veredicto: ⚠️ APROBADO CON CONDICIONES — RE-REVIEW obligatorio tras corrección de RV-001 y RV-002**

---

## Nivel 1 — Arquitectura y Diseño ✅

| Comprobación | Resultado |
|---|---|
| Capas correctas (api / application / domain / infrastructure) | ✅ |
| Lógica de negocio fuera de controllers | ✅ — controllers solo delegan |
| Dependencias en dirección correcta | ✅ — domain no importa spring ni infra |
| `BillPaymentPort` en domain (no en infra) | ✅ — interfaz sellada correcta |
| `BankCoreRestAdapter` en `transfer/infrastructure/core/` | ✅ — separación correcta |
| `@Profile(production)` solo en `BankCoreRestAdapter` | ✅ — mock intacto en staging/test |
| `RateLimitFilter` en `transfer/infrastructure/` | ✅ — filtro transversal |

---

## Nivel 2 — Contrato OpenAPI ✅

| Endpoint (LLD-012 v1.8.0) | Implementado | Estado |
|---|---|---|
| `GET /api/v1/bills` | `BillController.listPending()` | ✅ |
| `POST /api/v1/bills/{id}/pay` | `BillController.payBill()` | ✅ |
| `GET /api/v1/bills/lookup?reference=` | `BillController.lookupBill()` | ✅ |
| `POST /api/v1/bills/pay` | `BillController.payInvoice()` | ✅ |
| HTTP 429 en endpoints de transferencia | `RateLimitFilter` | ✅ |
| HTTP 503 en fallo de core | `BankCoreRestAdapter.fallback*()` | ✅ |

---

## Nivel 3 — Seguridad OWASP ✅

| Comprobación | Resultado |
|---|---|
| Secrets hardcodeados | ✅ — `@Value` desde variables de entorno |
| `@AuthenticationPrincipal` en todos los endpoints | ✅ — `BillController` (4/4) |
| OTP obligatorio en toda operación financiera | ✅ — US-903 y US-904 |
| Referencia de factura enmascarada en logs | ✅ — `maskReference()` en BillLookupAndPayUseCase |
| Importe en `BigDecimal` (nunca float) | ✅ |
| IBAN no aplica (pagos de servicios) | N/A |
| idempotencyKey en todas las escrituras al core | ✅ |

---

## Hallazgos

---

### 🟠 RV-001 [MAYOR] — Audit log INITIATED antes de verificar OTP

**Archivo:** `BillPaymentUseCase.java:55`
**Descripción:**
`auditLog.record("BILL_PAYMENT_INITIATED")` se ejecuta **antes** de `twoFactorService.verifyCurrentOtp()`. Si el OTP es incorrecto, el evento `BILL_PAYMENT_INITIATED` queda huérfano en el audit trail — sin `BILL_PAYMENT_COMPLETED` ni `BILL_PAYMENT_FAILED`. Esto crea inconsistencia en las trazas de auditoría y puede confundir revisiones PCI-DSS.

**Código actual:**
```java
auditLog.record(userId, "BILL_PAYMENT_INITIATED", ...);  // ← antes del OTP
twoFactorService.verifyCurrentOtp(userId, cmd.otpCode()); // ← puede fallar aquí
```

**Corrección requerida:** Mover `BILL_PAYMENT_INITIATED` a **después** de la verificación OTP, o cambiarlo por `BILL_PAYMENT_OTP_REQUESTED` antes y `BILL_PAYMENT_INITIATED` después. Patrón consistente con `TransferUseCase`.

```java
twoFactorService.verifyCurrentOtp(userId, cmd.otpCode()); // ← OTP primero
auditLog.record(userId, "BILL_PAYMENT_INITIATED", ...);   // ← luego log
```

---

### 🟠 RV-002 [MAYOR] — BillLookupAndPayUseCase no persiste en bill_payments

**Archivo:** `BillLookupAndPayUseCase.java`
**Descripción:**
El SRS RF-905 y la tabla `bill_payments` (Flyway V12) definen que los pagos de facturas con referencia deben persistirse localmente para trazabilidad. El use case llama al core y registra el audit log, pero **nunca persiste el registro en `bill_payments`**. El campo `reference` en `bill_payments` está diseñado específicamente para este caso.

Sin persistencia local, no hay forma de consultar el historial de pagos de facturas del usuario, ni de deduplicar reintentos por `idempotencyKey` a nivel de BD.

**Corrección requerida:**
1. Crear `BillPaymentRepositoryPort` (o ampliar `BillRepositoryPort`) con método `saveBillPayment(BillPayment payment)`
2. Persistir el pago tras confirmar el `coreTxnId`
3. Devolver el `paymentId` persistido en `PaymentResultDto` (no un UUID aleatorio)

---

### 🟡 RV-003 [MENOR] — paymentId aleatorio en lugar del ID persistido

**Archivo:** `BillPaymentUseCase.java:70`, `BillLookupAndPayUseCase.java:57`
**Descripción:**
Ambos use cases devuelven `new PaymentResultDto(UUID.randomUUID(), ...)`. El `paymentId` debería ser el ID del registro persistido en `bill_payments` para que el cliente pueda consultarlo posteriormente. Un UUID aleatorio rompe la trazabilidad.

**Impacto:** Menor — ligado a RV-002. Se resuelve naturalmente al implementar la persistencia.

---

### 🟡 RV-004 [MENOR] — Doble validación de referencia con comportamiento inconsistente

**Archivo:** `BillController.java:72`, `BillLookupAndPayUseCase.java:60`
**Descripción:**
La validación del formato de referencia se hace dos veces:
- `@Pattern(regexp = "\\d{20}")` en el controller → devuelve HTTP 400 (Bean Validation)
- `validateReference()` en el use case → lanza `InvalidBillReferenceException` → debería devolver HTTP 422

Si el GlobalExceptionHandler mapea `InvalidBillReferenceException` a 422, el comportamiento
puede diferir según si la validación la rechaza el filtro Spring MVC (400) o el use case (422).

**Corrección sugerida:** Unificar — mantener solo `@Valid`/`@Pattern` en el controller (capa de entrada) y eliminar `validateReference()` del use case, dejando solo la excepción como salvaguarda.

---

### 🟢 RV-005 [SUGERENCIA] — BillLookupResult como record anidado en interfaz de dominio

**Archivo:** `BillPaymentPort.java`
**Descripción:**
`BillLookupResult` es un record anidado dentro de `BillPaymentPort`. Funciona correctamente, pero dificulta ligeramente la lectura al importarlo como `BillPaymentPort.BillLookupResult`. Considerar moverlo a `bill/domain/BillLookupResult.java` como clase independiente en el próximo sprint.

**Impacto:** Ninguno funcional — solo legibilidad.

---

### 🟢 RV-006 [SUGERENCIA] — BankCoreRestAdapter.getAvailableBalance() sin manejo de nulo

**Archivo:** `BankCoreRestAdapter.java:137`
**Descripción:**
Si el core devuelve un cuerpo malformado, `response.available()` puede ser null y generar NullPointerException posterior. Considerar agregar `Objects.requireNonNullElse(response.available(), BigDecimal.ZERO)`.

**Impacto:** Muy bajo en staging con mock — relevante cuando el core real esté integrado.

---

## Verificación de tests

| Suite | Tests | Cobertura escenarios | Estado |
|---|---|---|---|
| `BillPaymentUseCaseTest` | 5 | happy path + ya pagado + no encontrado + OTP inválido + listPending | ✅ |
| `BillLookupAndPayUseCaseTest` | 5 | lookup + ref inválida + pago exitoso + ref enmascarada + OTP inválido | ✅ |
| `RateLimitFilterTest` | 5 | dentro límite + 429 + tráfico legítimo + Redis down + solo POST | ✅ |
| **Total nuevos** | **15** | | ✅ ≥ 80% application layer |

---

## Plan de corrección

| # | Severidad | Acción | Prioridad |
|---|---|---|---|
| RV-001 | 🟠 MAYOR | Mover `BILL_PAYMENT_INITIATED` después de la verificación OTP | Antes de QA |
| RV-002 | 🟠 MAYOR | Persistir en `bill_payments` + devolver `paymentId` real | Antes de QA |
| RV-003 | 🟡 MENOR | Se resuelve con RV-002 | Con RV-002 |
| RV-004 | 🟡 MENOR | Unificar validación en capa controller | Este sprint si hay tiempo |
| RV-005 | 🟢 SUGERENCIA | Mover `BillLookupResult` a clase independiente | Sprint 12 |
| RV-006 | 🟢 SUGERENCIA | Null check en `getAvailableBalance()` | Sprint 12 |

---

*Code Review Report — SOFIA Code Reviewer Agent — Step 5*
*CMMI Level 3 — VER SP 2.1 · VER SP 3.1*
*BankPortal Sprint 11 — FEAT-009 — 2026-03-21*
