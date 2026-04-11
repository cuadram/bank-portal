# SRS-FEAT-008 — Software Requirements Specification
# Transferencias Bancarias — BankPortal / Banco Meridian

## Metadata CMMI (RD SP 1.1 · RD SP 2.1 · RD SP 3.1)

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-008 |
| Versión | 1.0 |
| Feature | FEAT-008 — Transferencias Bancarias |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 10 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-20 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-31 |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de
FEAT-008 — Transferencias Bancarias. Define el comportamiento esperado del
sistema BankPortal para las operaciones de transferencia entre cuentas propias
y a terceros (beneficiarios), incluyendo los mecanismos de seguridad (PSD2 SCA),
gestión de beneficiarios y validación de límites operativos.

### 1.2 Alcance

FEAT-008 cubre exclusivamente:
- Transferencias entre cuentas propias del usuario (misma entidad bancaria)
- Transferencias a beneficiarios guardados (terceros, otras entidades)
- Gestión del catálogo de beneficiarios del usuario
- Validación de límites de transferencia (por operación, diario, mensual)
- Confirmación obligatoria mediante OTP (PSD2 SCA) en toda operación financiera

Quedan fuera de alcance: SEPA/SWIFT internacional, Bizum/SCT Inst, pagos
de facturas, transferencias programadas y análisis de gastos.

### 1.3 Documentos relacionados

| Documento | Versión | Relación |
|---|---|---|
| FEAT-007.md | 1.0 | Feature predecesora (consulta cuentas) |
| FEAT-008.md | 1.0 | Backlog de producto |
| SPRINT-010-planning.md | 1.0 | Planificación del sprint |
| ADR-001 | 1.1 (pendiente actualización RS256) | Decisión JWT |
| openapi-v1.6.0.yaml | 1.6.0 | Contratos API anteriores |

---

## 2. Descripción general del sistema

### 2.1 Perspectiva del producto

BankPortal es el portal bancario digital de Banco Meridian. Con FEAT-001→007
completados, la plataforma dispone de autenticación 2FA robusta, gestión de
sesiones, auditoría inmutable y consulta de cuentas. FEAT-008 añade la
capacidad operativa de mayor valor percibido: la posibilidad de mover dinero
sin acudir a la oficina.

### 2.2 Funciones principales de FEAT-008

- **F-001**: Iniciar y confirmar transferencias entre cuentas propias
- **F-002**: Iniciar y confirmar transferencias a beneficiarios guardados
- **F-003**: Gestionar el catálogo de beneficiarios (CRUD + validación IBAN)
- **F-004**: Validar límites de transferencia en tiempo real
- **F-005**: Exigir OTP en toda operación financiera (PSD2 SCA)
- **F-006**: Registrar toda operación en audit_log (PCI-DSS + trazabilidad)

### 2.3 Usuarios del sistema

| Actor | Descripción | Acceso |
|---|---|---|
| Usuario autenticado | Cliente con cuenta activa en Banco Meridian | JWT RS256 full-session |
| Sistema bancario core | Adaptador de integración (mock Sprint 10) | Interno |
| Redis | Almacén de contadores de límites | Interno |

---

## 3. Requerimientos funcionales

### RF-801: Transferencia entre cuentas propias

**ID:** RF-801 | **Prioridad:** Must Have | **US asociada:** US-801

El sistema debe permitir al usuario transferir fondos entre dos cuentas propias
activas en Banco Meridian, previa validación de saldo y confirmación OTP.

**Precondiciones:**
- Usuario autenticado con JWT RS256 scope=full-session
- Cuenta origen activa con saldo disponible >= importe solicitado
- Cuenta destino activa y diferente a la cuenta origen

**Flujo principal:**
1. Usuario selecciona cuenta origen, cuenta destino, importe y concepto
2. Sistema valida saldo disponible en cuenta origen
3. Sistema valida límites de transferencia (RF-804)
4. Sistema solicita OTP de confirmación
5. Usuario introduce OTP válido
6. Sistema persiste el movimiento en ambas cuentas de forma atómica (`@Transactional`)
7. Sistema emite evento SSE para actualizar saldos en tiempo real
8. Sistema registra en audit_log: TRANSFER_INITIATED, TRANSFER_OTP_VERIFIED, TRANSFER_COMPLETED

**Flujos alternativos:**
- 2a. Saldo insuficiente → HTTP 422 INSUFFICIENT_FUNDS · no se solicita OTP
- 3a. Límite superado → HTTP 422 DAILY_LIMIT_EXCEEDED / OPERATION_LIMIT_EXCEEDED
- 5a. OTP incorrecto → HTTP 422 OTP_INVALID + intentos restantes · audit: TRANSFER_OTP_FAILED

**Postcondiciones:**
- Saldo cuenta origen decrementado en el importe transferido
- Saldo cuenta destino incrementado en el importe transferido
- Movimiento visible en historial de ambas cuentas (FEAT-007 US-702)
- audit_log contiene los 3 eventos de trazabilidad

---

### RF-802: Transferencia a beneficiario guardado

**ID:** RF-802 | **Prioridad:** Must Have | **US asociada:** US-802

El sistema debe permitir transferencias a beneficiarios previamente guardados
en el catálogo del usuario, con confirmación OTP obligatoria (PSD2 SCA).

**Precondiciones:**
- Usuario tiene al menos un beneficiario activo en su catálogo
- Cuenta origen activa con saldo suficiente
- Límite diario/mensual no agotado

**Flujo principal:**
1. Usuario selecciona beneficiario del catálogo, cuenta origen, importe y concepto
2. Si es primera transferencia a este beneficiario: mostrar aviso + checkbox confirmación adicional
3. Sistema valida saldo + límites
4. Sistema solicita OTP
5. Usuario confirma con OTP válido
6. Sistema persiste el movimiento y actualiza acumulado diario en Redis
7. Sistema registra audit_log: TRANSFER_TO_BENEFICIARY_COMPLETED

**Regla de negocio — primera transferencia:**
La primera transferencia a un beneficiario nuevo requiere confirmación explícita
adicional (checkbox "Confirmo que este beneficiario es correcto") además del OTP.
Esta medida es anti-fraude y complementa el OTP según PSD2 Art. 97.

---

### RF-803: Gestión de beneficiarios

**ID:** RF-803 | **Prioridad:** Must Have | **US asociada:** US-803

El sistema debe permitir al usuario mantener su catálogo de beneficiarios:
alta, consulta, edición de alias y eliminación lógica.

**Reglas de negocio:**
- El alta de un beneficiario requiere OTP (PSD2 SCA — operación sensible)
- La edición del alias NO requiere OTP (cambio no financiero)
- La eliminación es lógica (soft delete con `deleted_at`) — no se borran datos históricos
- El IBAN debe validarse con el algoritmo estándar (módulo 97 ISO 13616)
- Máximo 50 beneficiarios activos por usuario (límite operativo)

**Validación IBAN:**
- Formato: 2 letras país + 2 dígitos control + BBAN (variable por país)
- Validación: commons-validator IBANValidator o equivalente certificado
- Error: HTTP 422 INVALID_IBAN con el campo inválido identificado

---

### RF-804: Validación de límites de transferencia

**ID:** RF-804 | **Prioridad:** Must Have | **US asociada:** US-804

El sistema debe validar límites operativos antes de cualquier transferencia,
rechazando operaciones que superen los límites configurados por el banco.

**Límites por defecto:**

| Límite | Valor por defecto | Granularidad |
|---|---|---|
| Por operación | 2.000 EUR | Por transacción individual |
| Diario | 3.000 EUR | Acumulado día natural (reset medianoche UTC) |
| Mensual | 10.000 EUR | Acumulado mes natural |

**Implementación del contador diario:**
- Almacenado en Redis con clave: `transfer:daily:{userId}:{fecha_UTC}`
- TTL: segundos hasta medianoche UTC del día actual
- Incremento atómico con `INCRBY` antes de persistir la transferencia
- Si falla Redis → fallback a consulta BD (degradación graceful, no bloqueo)

**Personalización:**
Los límites son configurados por el banco en `transfer_limits` y NO son
modificables por el usuario desde el portal. El usuario puede consultarlos
en "Configuración → Mis límites" (endpoint de solo lectura).

---

### RF-805: Deuda técnica — Tests de integración con Testcontainers

**ID:** RF-805 | **Prioridad:** Must Have | **Ticket:** DEBT-013

El sistema de tests debe incluir una suite de integración que valide el
comportamiento de los repositorios JPA contra una instancia real de PostgreSQL
levantada con Testcontainers, manteniendo retrocompatibilidad con los tests
unitarios H2 existentes.

**Requisitos:**
- Perfil Maven 'integration': activa Testcontainers PostgreSQL
- Perfil por defecto: mantiene H2 (sin cambio en los 72 tests existentes)
- Los tests de integración verifican las migraciones Flyway
- El Jenkinsfile ejecuta ambos perfiles en el stage de QA
- Cobertura de integración: todos los repositorios de FEAT-008 (beneficiaries, transfers)

---

### RF-806: Deuda técnica — Migración JWT a RS256

**ID:** RF-806 | **Prioridad:** Must Have | **Ticket:** DEBT-014

El sistema de autenticación debe migrar de HMAC-SHA256 (secreto compartido)
a RSA-SHA256 (par de claves asimétrico) para cumplir con ADR-001 y habilitar
verificación stateless en futuros microservicios.

**Requisitos:**
- Algoritmo: RS256 con keypair RSA-2048
- Emisión: clave privada (servidor) · Verificación: clave pública (puede ser distribuida)
- Configuración: `jwt.private-key-pem` y `jwt.public-key-pem` en Base64
- Tokens HS256 anteriores: rechazados con HTTP 401 TOKEN_ALGORITHM_REJECTED
- Impacto en STG: requiere `docker-compose down -v` para invalidar tokens existentes
- ADR-001 debe ser actualizado documentando la migración

---

## 4. Requerimientos no funcionales

### RNF-F8-001: Rendimiento

| Métrica | Valor objetivo | Percentil |
|---|---|---|
| Latencia de transferencia (validación + persistencia) | <= 500ms | p95 |
| Latencia de listado de beneficiarios | <= 200ms | p95 |
| Throughput máximo simultáneo | 50 transferencias/segundo | — |

**Justificación:** los tiempos son más estrictos que FEAT-007 dado que las
transferencias son operaciones críticas donde el usuario espera confirmación
inmediata de su banco.

### RNF-F8-002: Seguridad

- **PSD2 SCA obligatorio**: toda transferencia y alta de beneficiario requiere OTP
- **JWT RS256**: algoritmo asimétrico — cumple ADR-001
- **Atomicidad transaccional**: toda transferencia se persiste en un único `@Transactional`
- **Registro inmutable**: audit_log con todos los eventos de trazabilidad (PCI-DSS 10.2)
- **IBAN en tránsito**: nunca loguear IBANs completos — enmascarar últimos 4 dígitos en logs
- **Importe en BD**: almacenar en `DECIMAL(15,2)` — nunca como float (pérdida de precisión)

### RNF-F8-003: Disponibilidad y resiliencia

- **Redis no disponible**: fallback a BD para contadores de límites (degradación graceful)
- **API core no disponible**: respuesta HTTP 503 SERVICE_UNAVAILABLE con retry en cliente
- **Transacción parcial**: si falla el adaptador core tras debitar origen → rollback completo

### RNF-F8-004: Auditoría y trazabilidad

Toda operación de transferencia debe generar los siguientes eventos en audit_log:

| Evento | Cuándo | Datos obligatorios |
|---|---|---|
| TRANSFER_INITIATED | Al introducir datos | userId, cuentas, importe, IP |
| TRANSFER_OTP_VERIFIED | Al validar OTP correcto | userId, transferId |
| TRANSFER_COMPLETED | Al persistir el movimiento | userId, transferId, importe, saldo resultante |
| TRANSFER_OTP_FAILED | Al fallar OTP | userId, intentos restantes |
| BENEFICIARY_ADDED | Al añadir beneficiario | userId, IBAN enmascarado, alias |
| BENEFICIARY_DELETED | Al eliminar beneficiario | userId, beneficiaryId |

---

## 5. Requerimientos de integración

### RI-F8-001: Adaptador bancario core

El sistema debe integrar con el core bancario para la consulta de saldos
y la ejecución real de transferencias. En Sprint 10 se utiliza un mock
que simula el comportamiento del core con datos realistas.

**Interfaz sellada (patrón de adaptador hexagonal):**

```java
public interface BankCoreTransferPort {
    TransferResult executeOwnTransfer(OwnTransferCommand cmd);
    TransferResult executeExternalTransfer(ExternalTransferCommand cmd);
    BigDecimal getAvailableBalance(UUID accountId);
}
```

El swap mock → real se realiza en Sprint 11 mediante un adaptador de
infraestructura que implemente esta interfaz sin cambios en el dominio.

### RI-F8-002: Redis — contadores de límites

```
Clave:  transfer:daily:{userId}:{yyyy-MM-dd}
Tipo:   String (valor numérico en céntimos)
TTL:    segundos hasta medianoche UTC
Ops:    INCRBY (atómico) · GET · DEL (reset manual por admin)
```

---

## 6. Modelo de datos — Flyway V11

### 6.1 Tabla beneficiaries

```sql
CREATE TABLE beneficiaries (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alias        VARCHAR(64)  NOT NULL,
    iban         VARCHAR(34)  NOT NULL,
    holder_name  VARCHAR(128) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMP,   -- soft delete
    CONSTRAINT uq_beneficiary_user_iban
        UNIQUE (user_id, iban)
        WHERE deleted_at IS NULL
);

CREATE INDEX idx_beneficiaries_user_active
    ON beneficiaries(user_id)
    WHERE deleted_at IS NULL;
```

### 6.2 Tabla transfers

```sql
CREATE TABLE transfers (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL REFERENCES users(id),
    source_account   UUID           NOT NULL REFERENCES accounts(id),
    target_account   UUID,          -- NULL para transferencias externas (beneficiario)
    beneficiary_id   UUID           REFERENCES beneficiaries(id),
    amount           DECIMAL(15,2)  NOT NULL CHECK (amount > 0),
    concept          VARCHAR(256),
    status           VARCHAR(16)    NOT NULL DEFAULT 'PENDING',
    executed_at      TIMESTAMP,
    created_at       TIMESTAMP      NOT NULL DEFAULT now(),
    CONSTRAINT chk_transfer_status
        CHECK (status IN ('PENDING','COMPLETED','FAILED','CANCELLED')),
    CONSTRAINT chk_transfer_target
        CHECK (target_account IS NOT NULL OR beneficiary_id IS NOT NULL)
);

CREATE INDEX idx_transfers_user_created
    ON transfers(user_id, created_at DESC);
CREATE INDEX idx_transfers_source_account
    ON transfers(source_account, created_at DESC);
```

### 6.3 Tabla transfer_limits

```sql
CREATE TABLE transfer_limits (
    user_id               UUID           PRIMARY KEY REFERENCES users(id),
    per_operation_limit   DECIMAL(15,2)  NOT NULL DEFAULT 2000.00,
    daily_limit           DECIMAL(15,2)  NOT NULL DEFAULT 3000.00,
    monthly_limit         DECIMAL(15,2)  NOT NULL DEFAULT 10000.00,
    updated_at            TIMESTAMP      NOT NULL DEFAULT now()
);
```

---

## 7. Contratos de API

### 7.1 Transferencias

```
POST /api/v1/transfers/own
Auth: Bearer JWT RS256 scope=full-session
Body: {
  sourceAccountId: UUID,
  targetAccountId: UUID,
  amount: number (> 0, max 2 decimales),
  concept: string (max 256 chars),
  otpCode: string (6 dígitos)
}
Response 200: {
  transferId: UUID,
  status: "COMPLETED",
  executedAt: ISO8601,
  sourceBalance: number,
  targetBalance: number
}
Errores: 422 INSUFFICIENT_FUNDS | 422 OTP_INVALID | 422 DAILY_LIMIT_EXCEEDED
         422 OPERATION_LIMIT_EXCEEDED | 503 CORE_UNAVAILABLE

POST /api/v1/transfers/beneficiary
Auth: Bearer JWT RS256 scope=full-session
Body: {
  beneficiaryId: UUID,
  sourceAccountId: UUID,
  amount: number,
  concept: string,
  otpCode: string,
  firstTransferConfirmed: boolean (requerido si es primera transferencia)
}
Response 200: { transferId, status, executedAt, sourceBalance }
```

### 7.2 Beneficiarios

```
GET  /api/v1/beneficiaries
     Response 200: [ { id, alias, ibanMasked, holderName, createdAt, isFirstTransfer } ]

POST /api/v1/beneficiaries
     Body: { alias, iban, holderName, otpCode }
     Response 201: { id, alias, ibanMasked, holderName, createdAt }
     Error: 422 INVALID_IBAN | 422 OTP_INVALID | 409 BENEFICIARY_ALREADY_EXISTS

PUT  /api/v1/beneficiaries/{id}
     Body: { alias }  -- solo alias, sin OTP
     Response 200: { id, alias, ibanMasked, holderName }

DELETE /api/v1/beneficiaries/{id}
     Response 204 (soft delete)
     Error: 404 BENEFICIARY_NOT_FOUND

GET  /api/v1/transfers/limits
     Response 200: { perOperationLimit, dailyLimit, monthlyLimit, dailyUsed, dailyRemaining }
```

---

## 8. RTM — Requirements Traceability Matrix

| Requerimiento | US/DEBT | Sprint | Criterio Gherkin | Test unitario | Test integración | API Endpoint |
|---|---|---|---|---|---|---|
| RF-801 Transf. propias | US-801 | S1 | 4 escenarios | TransferUseCaseTest | TransferControllerIT | POST /transfers/own |
| RF-802 Transf. beneficiario | US-802 | S2 | 4 escenarios | TransferBeneficiaryUseCaseTest | — | POST /transfers/beneficiary |
| RF-803 Gestión beneficiarios | US-803 | S2 | 4 escenarios | BeneficiaryMgmtUseCaseTest | BeneficiaryControllerIT | GET/POST/PUT/DELETE /beneficiaries |
| RF-804 Límites | US-804 | S2 | 4 escenarios | TransferLimitServiceTest | — | GET /transfers/limits |
| RF-805 Testcontainers | DEBT-013 | S1 | 3 escenarios | — | PostgresIntegrationTest | — |
| RF-806 JWT RS256 | DEBT-014 | S1 | 4 escenarios | JwtTokenProviderTest | — | — |
| RNF-F8-002 Seguridad SCA | Todos US | S1+S2 | OTP en todos | — | TransferSecurityIT | — |
| RNF-F8-004 Auditoría | Todos US | S1+S2 | audit_log entries | AuditLogServiceTest | — | — |

---

## 9. Criterios de aceptación globales

- [ ] Ninguna transferencia se completa sin OTP válido — sin excepción
- [ ] El importe se almacena como DECIMAL(15,2), nunca como float
- [ ] El IBAN completo nunca aparece en logs — solo últimos 4 dígitos
- [ ] Toda transferencia fallida queda en audit_log con motivo
- [ ] El saldo nunca queda negativo (validación en dominio y en BD)
- [ ] Los contadores Redis se inicializan en 0 si no existen (no falla en usuario nuevo)
- [ ] El adaptador core es intercambiable (mock ↔ real) sin cambios en el dominio

---

*Generado por SOFIA Requirements Analyst Agent — Step 2*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1 · REQM SP 1.5*
*BankPortal Sprint 10 — FEAT-008 — 2026-03-20 — v1.0 PENDING APPROVAL*
