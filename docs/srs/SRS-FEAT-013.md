# SRS-FEAT-013 — Software Requirements Specification
# Onboarding KYC / Verificación de Identidad — BankPortal / Banco Meridian

## Metadata CMMI (RD SP 1.1 · RD SP 2.1 · RD SP 3.1)

| Campo | Valor |
|---|---|
| Documento | SRS-FEAT-013 |
| Versión | 1.0 |
| Feature | FEAT-013 — Onboarding KYC / Verificación de Identidad |
| Proyecto | BankPortal — Banco Meridian |
| Sprint | 15 |
| Autor | SOFIA Requirements Analyst Agent |
| Fecha | 2026-03-23 |
| Estado | PENDING APPROVAL — Gate 2 |
| Jira Epic | SCRUM-36 |
| Dependencias | FEAT-001 (JWT/Auth), FEAT-012 (Perfil usuario) |

---

## 1. Introducción

### 1.1 Propósito

Este documento especifica los requerimientos funcionales y no funcionales de
FEAT-013 — Onboarding KYC. Define el comportamiento esperado del sistema
BankPortal para verificar la identidad de nuevos clientes de Banco Meridian
mediante la subida y validación de documentos de identidad oficiales, cumpliendo
la normativa AML, PSD2 y RGPD aplicable.

### 1.2 Alcance

FEAT-013 cubre:
- Modelo de datos y estados del proceso KYC
- Subida de documentos de identidad (DNI, NIE, Pasaporte)
- Validación automática de documentos (formato, caducidad, integridad)
- Notificaciones al usuario sobre el resultado (APPROVED/REJECTED)
- Bloqueo de operaciones financieras hasta KYC aprobado
- Wizard frontend paso a paso para guiar al usuario
- Endpoint de revisión manual para operadores del banco

Quedan fuera de alcance: verificación biométrica facial (FEAT-014), integración
con proveedores externos de identidad (eIDAS, Veridas), KYC corporativo (empresas).

### 1.3 Marco normativo

| Normativa | Artículo relevante | Requisito |
|---|---|---|
| AML Directive EU 2018/843 | Art. 13 | Identificación obligatoria de clientes antes de operar |
| PSD2 (EU 2015/2366) | Art. 97 | Autenticación reforzada en operaciones financieras |
| RGPD | Art. 9 | Datos biométricos / identidad tratados con garantías especiales |
| RGPD | Art. 5(e) | Limitación del plazo de conservación (5 años) |
| Banco de España Circ. 1/2010 | Norma 3ª | Identificación documental obligatoria |

### 1.4 Actores

| Actor | Descripción |
|---|---|
| **Nuevo cliente** | Usuario registrado con KYC pendiente — no puede operar financieramente |
| **Cliente verificado** | Usuario con KYC APPROVED — acceso completo al portal |
| **Revisor KYC** | Operador de Banco Meridian con rol `ROLE_KYC_REVIEWER` |
| **Sistema** | Motor de validación automática de documentos |

---

## 2. Requerimientos Funcionales

### 2.1 RF-013-01 — Estados del proceso KYC

**Descripción:** El sistema mantiene un estado KYC por usuario con las siguientes
transiciones permitidas:

```
NONE ──────────────────→ PENDING   (usuario inicia el proceso)
PENDING ───────────────→ SUBMITTED (documentos enviados)
SUBMITTED ─────────────→ APPROVED  (validación automática exitosa)
SUBMITTED ─────────────→ REJECTED  (validación falla o revisor rechaza)
SUBMITTED ─────────────→ EXPIRED   (documentos caducados antes de revisión)
REJECTED ──────────────→ PENDING   (usuario reintenta con nuevos documentos)
EXPIRED ───────────────→ PENDING   (usuario reenvía documentos)
```

**Estado inicial:** `NONE` para todos los usuarios existentes (retrocompatibilidad).
**Estado para operar financieramente:** solo `APPROVED`.

---

### 2.2 RF-013-02 — Subida de documentos

**Descripción:** El usuario autenticado puede subir documentos de identidad
para iniciar la verificación KYC.

**Tipos de documento aceptados:**
| Código | Descripción | Caras |
|---|---|---|
| `DNI` | Documento Nacional de Identidad (España) | 2 (frontal + reverso) |
| `NIE` | Número de Identidad de Extranjero | 2 (frontal + reverso) |
| `PASSPORT` | Pasaporte (cualquier país UE) | 1 (página datos) |

**Formatos aceptados:** `image/jpeg`, `image/png`, `application/pdf`
**Tamaño máximo:** 10 MB por fichero
**Procesamiento:** hash SHA-256 calculado al recibir para integridad

**Endpoint:** `POST /api/v1/kyc/documents` (multipart/form-data)
**Campos:** `documentType`, `side` (FRONT/BACK), `file`

---

### 2.3 RF-013-03 — Validación automática

**Descripción:** Tras recibir todos los documentos requeridos, el sistema
ejecuta validación automática básica.

**Reglas de validación:**
1. Formato de fichero válido (MIME type reconocido)
2. Fichero no corrupto (puede abrirse sin error)
3. Documento no caducado (campo `expires_at` del documento, si aplica)
4. Hash SHA-256 íntegro (recalculado y comparado con el almacenado)
5. Ambas caras presentes para documentos de 2 caras

**Resultado:**
- Todas las reglas pasan → estado KYC cambia a `APPROVED` automáticamente
- Al menos una regla falla → estado KYC cambia a `SUBMITTED` (revisión manual)

---

### 2.4 RF-013-04 — Consulta de estado KYC

**Descripción:** El usuario puede consultar su estado KYC actual en cualquier momento.

**Endpoint:** `GET /api/v1/kyc/status`
**Response:** estado actual, fecha de envío, motivo de rechazo (si aplica), enlace al wizard

---

### 2.5 RF-013-05 — Notificaciones

**Descripción:** El sistema notifica al usuario cuando su estado KYC cambia.

| Evento | Canal | Mensaje |
|---|---|---|
| KYC → APPROVED | Email + In-app | "Tu cuenta está verificada — ya puedes operar" |
| KYC → REJECTED | Email + In-app | "Verificación fallida — [motivo] — [cómo reintentar]" |
| KYC → SUBMITTED | In-app | "Documentos recibidos — en revisión (24-48h)" |
| KYC → EXPIRED | Email + In-app | "Tus documentos han caducado — vuelve a enviarlos" |

**In-app:** banner persistente en el dashboard mientras KYC ≠ APPROVED.

---

### 2.6 RF-013-06 — Bloqueo de operaciones financieras

**Descripción:** El sistema impide ejecutar operaciones financieras a usuarios
con KYC no aprobado.

**Operaciones bloqueadas:** transferencias, pagos de recibos, cualquier endpoint
bajo `/api/v1/transfers/**` y `/api/v1/bills/**`.

**Comportamiento:** `403 Forbidden` con body `{"error": "KYC_REQUIRED", "kycStatus": "<estado>", "kycWizardUrl": "/kyc"}`.

**Implementación:** `KycAuthorizationFilter` — `OncePerRequestFilter` que verifica
`kyc_verifications.status = APPROVED` para el usuario autenticado antes de
pasar a los controllers de operaciones financieras.

**Excepción:** usuarios con estado `NONE` (clientes pre-existentes) tienen
acceso completo durante período de gracia de 90 días (retrocompatibilidad).

---

### 2.7 RF-013-07 — Wizard frontend KYC

**Descripción:** El usuario accede a un asistente paso a paso en `/kyc` para
completar la verificación.

**Pasos:**
1. **Bienvenida** — explicación del proceso y documentos necesarios
2. **Selección** — el usuario elige tipo de documento (DNI/NIE/Pasaporte)
3. **Subida frontal** — drag & drop o selección de fichero, preview
4. **Subida reverso** — solo si documentType requiere 2 caras
5. **Confirmación** — resumen + estado en tiempo real via SSE

**Validaciones frontend:** tipo MIME, tamaño ≤ 10MB antes de enviar.

---

### 2.8 RF-013-08 — Revisión manual por operador

**Descripción:** El revisor KYC puede aprobar o rechazar verificaciones en
estado `SUBMITTED`.

**Endpoint:** `PATCH /api/v1/admin/kyc/{kycId}`
**Auth:** Bearer JWT + `ROLE_KYC_REVIEWER`
**Body:** `{ "action": "APPROVE" | "REJECT", "reason": "string" }`
**Auditoría:** cada decisión registrada en `audit_log` con `reviewerId`, `action`, `reason`, `timestamp`.

---

## 3. Requerimientos No Funcionales

### RNF baseline (heredados)

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF-001 | Rendimiento | API < 300ms p95 bajo carga nominal |
| RNF-002 | Seguridad | Todos los endpoints protegidos con JWT |
| RNF-003 | Trazabilidad | Audit log inmutable para operaciones sensibles |

### RNF delta FEAT-013

| ID | Categoría | Requerimiento |
|---|---|---|
| RNF-013-01 | Seguridad | Documentos KYC cifrados AES-256 en reposo (RGPD Art.9) |
| RNF-013-02 | Rendimiento | `POST /kyc/documents` procesa en < 5s para ficheros ≤ 10MB |
| RNF-013-03 | Privacidad | Documentos accesibles solo con rol `ROLE_KYC_REVIEWER` o propietario |
| RNF-013-04 | Retención | Documentos eliminados automáticamente tras 5 años (RGPD Art.5e) |
| RNF-013-05 | Disponibilidad | Proceso KYC disponible 99.5% — no bloquea el resto de la app |
| RNF-013-06 | Seguridad | `ROLE_KYC_REVIEWER` no puede acceder a operaciones financieras del usuario revisado |

---

## 4. User Stories

### US-1301 — Modelo de datos KYC

**Como** sistema, **quiero** persistir el estado KYC de cada usuario y sus
documentos subidos, **para** gestionar el proceso de verificación con
trazabilidad completa.

```gherkin
Feature: Modelo de datos KYC

  Scenario: Usuario nuevo tiene estado KYC inicial NONE
    Given un usuario se registra en BankPortal
    When se crea su cuenta
    Then su kyc_status es NONE

  Scenario: Estado KYC transiciona de NONE a PENDING
    Given el usuario con kyc_status NONE accede al wizard KYC
    When inicia el proceso
    Then su kyc_status cambia a PENDING y se registra en kyc_verifications

  Scenario: Flyway V15 aplica sin errores
    Given la BD está en schema versión V14
    When se ejecuta la migración V15
    Then las tablas kyc_verifications y kyc_documents existen con los índices correctos
```

**SP:** 3 | **Prioridad:** Must Have

---

### US-1302 — Subida de documentos

**Como** nuevo cliente, **quiero** subir mi documento de identidad, **para**
iniciar la verificación KYC.

```gherkin
Feature: Subida de documentos KYC

  Scenario: Usuario sube DNI frontal con formato válido
    Given el usuario tiene kyc_status PENDING y JWT válido
    When realiza POST /api/v1/kyc/documents con documentType=DNI, side=FRONT, file=imagen_jpeg_válida
    Then recibe 201 Created con documentId
    And el documento queda almacenado con hash SHA-256 calculado
    And se registra evento KYC_DOCUMENT_UPLOADED en audit_log

  Scenario: Fichero supera 10MB
    When realiza POST /api/v1/kyc/documents con fichero de 11MB
    Then recibe 400 Bad Request con error FILE_TOO_LARGE

  Scenario: Formato MIME no soportado
    When realiza POST /api/v1/kyc/documents con fichero .gif
    Then recibe 400 Bad Request con error UNSUPPORTED_FORMAT

  Scenario: Usuario no autenticado
    When realiza POST /api/v1/kyc/documents sin Authorization header
    Then recibe 401 Unauthorized
```

**SP:** 3 | **Prioridad:** Must Have

---

### US-1303 — Validación automática

**Como** sistema, **quiero** validar automáticamente los documentos recibidos,
**para** reducir la carga de revisión manual.

```gherkin
Feature: Validación automática KYC

  Scenario: Todos los documentos válidos — aprobación automática
    Given el usuario ha subido DNI frontal y reverso válidos y no caducados
    When el motor de validación ejecuta las reglas
    Then kyc_status cambia a APPROVED
    And se envía notificación email + in-app al usuario
    And se registra KYC_AUTO_APPROVED en audit_log

  Scenario: Documento caducado — derivar a revisión manual
    Given el usuario ha subido un DNI con fecha de caducidad pasada
    When el motor de validación ejecuta las reglas
    Then kyc_status cambia a SUBMITTED (no APPROVED)
    And se genera tarea para revisor KYC

  Scenario: Falta cara reverso del DNI
    Given el usuario solo ha subido la cara frontal del DNI
    When se ejecuta la validación
    Then no se ejecuta validación (incompleto)
    And kyc_status permanece en PENDING
```

**SP:** 2 | **Prioridad:** Must Have

---

### US-1304 — Estado KYC y notificaciones

**Como** cliente, **quiero** conocer el estado de mi verificación y recibir
notificaciones, **para** saber cuándo puedo operar con mi cuenta.

```gherkin
Feature: Estado KYC y notificaciones

  Scenario: Usuario consulta estado KYC pendiente
    Given el usuario tiene kyc_status SUBMITTED
    When realiza GET /api/v1/kyc/status
    Then recibe 200 OK con status=SUBMITTED y estimatedReviewTime

  Scenario: Notificación email al aprobar
    Given kyc_status cambia a APPROVED
    When el sistema procesa el cambio de estado
    Then se envía email "Tu cuenta está verificada" al usuario

  Scenario: Notificación email al rechazar con motivo
    Given un revisor rechaza la verificación con reason="Documento ilegible"
    When se guarda el rechazo
    Then se envía email con motivo y enlace para reintentar

  Scenario: Banner in-app mientras KYC no está APPROVED
    Given el usuario tiene kyc_status PENDING o SUBMITTED
    When accede al dashboard
    Then se muestra banner "Completa tu verificación para operar"
```

**SP:** 3 | **Prioridad:** Must Have

---

### US-1305 — Guard de acceso financiero

**Como** sistema, **quiero** bloquear operaciones financieras a usuarios sin
KYC aprobado, **para** cumplir la normativa AML/PSD2.

```gherkin
Feature: Guard de acceso financiero KYC

  Scenario: Usuario con KYC APPROVED puede transferir
    Given el usuario tiene kyc_status APPROVED
    When realiza POST /api/v1/transfers/own con datos válidos
    Then recibe 200 OK (flujo normal)

  Scenario: Usuario con KYC PENDING no puede transferir
    Given el usuario tiene kyc_status PENDING
    When realiza POST /api/v1/transfers/own
    Then recibe 403 Forbidden con error KYC_REQUIRED y kycWizardUrl=/kyc

  Scenario: Usuario con KYC NONE tiene período de gracia
    Given el usuario tiene kyc_status NONE y cuenta creada hace menos de 90 días
    When realiza POST /api/v1/transfers/own
    Then recibe 200 OK (período de gracia activo)

  Scenario: KycGuard Angular redirige a wizard
    Given el usuario intenta navegar a /transfers sin KYC aprobado
    When Angular evalúa KycGuard
    Then redirige a /kyc con mensaje informativo
```

**SP:** 2 | **Prioridad:** Must Have

---

### US-1306 — Frontend KYC wizard

**Como** nuevo cliente, **quiero** un asistente paso a paso para subir mis
documentos, **para** completar la verificación de forma intuitiva.

```gherkin
Feature: KYC Wizard Angular

  Scenario: Usuario completa wizard con DNI
    Given el usuario accede a /kyc con kyc_status PENDING
    When completa los 5 pasos (bienvenida, DNI, frontal, reverso, confirmación)
    Then los documentos se envían a POST /api/v1/kyc/documents
    And se muestra estado "Documentos enviados — en revisión"

  Scenario: Fichero demasiado grande bloqueado en frontend
    Given el usuario está en el paso de subida
    When selecciona un fichero de 11MB
    Then se muestra error "El fichero no puede superar 10MB" sin enviar al servidor

  Scenario: SSE actualiza estado en tiempo real
    Given el usuario está en el paso de confirmación
    When el motor de validación aprueba automáticamente
    Then el wizard muestra "✅ ¡Verificación completada!" sin recargar la página

  Scenario: Wizard no accesible si KYC ya está APPROVED
    Given el usuario tiene kyc_status APPROVED
    When navega a /kyc
    Then es redirigido a /dashboard
```

**SP:** 5 | **Prioridad:** Must Have

---

### US-1307 — Admin endpoint revisión manual

**Como** revisor KYC de Banco Meridian, **quiero** aprobar o rechazar
verificaciones manualmente, **para** garantizar la calidad del proceso KYC.

```gherkin
Feature: Revisión manual KYC

  Scenario: Revisor aprueba verificación en SUBMITTED
    Given kyc_status es SUBMITTED y el revisor tiene ROLE_KYC_REVIEWER
    When realiza PATCH /api/v1/admin/kyc/{kycId} con action=APPROVE
    Then kyc_status cambia a APPROVED
    And se registra KYC_MANUAL_APPROVED en audit_log con reviewerId

  Scenario: Revisor rechaza con motivo
    When realiza PATCH /api/v1/admin/kyc/{kycId} con action=REJECT, reason="Foto borrosa"
    Then kyc_status cambia a REJECTED
    And se envía email al usuario con el motivo

  Scenario: Usuario sin ROLE_KYC_REVIEWER no puede revisar
    Given el usuario tiene rol USER estándar
    When realiza PATCH /api/v1/admin/kyc/{kycId}
    Then recibe 403 Forbidden

  Scenario: No se puede aprobar una verificación en estado NONE
    Given kyc_status es NONE
    When el revisor intenta aprobar
    Then recibe 400 Bad Request con error INVALID_KYC_TRANSITION
```

**SP:** 3 | **Prioridad:** Should Have

---

## 5. Resumen de Story Points

| US | Descripción | SP | Prioridad |
|---|---|---|---|
| RV-020 | twoFactorEnabled desde BD | 1 | Must Have |
| SAST-001 | IP ofuscada en audit_log | 1 | Must Have |
| SAST-002 | Rate limiting /profile/password | 1 | Must Have |
| US-1301 | Modelo datos KYC + Flyway V15 | 3 | Must Have |
| US-1302 | API subida documentos | 3 | Must Have |
| US-1303 | Validación automática | 2 | Must Have |
| US-1304 | Estado KYC + notificaciones | 3 | Must Have |
| US-1305 | Guard financiero KYC_REQUIRED | 2 | Must Have |
| US-1306 | Angular KYC wizard | 5 | Must Have |
| US-1307 | Admin revisión manual | 3 | Should Have |
| **TOTAL** | | **24** | |

---

## 6. Nuevas entidades de BD (Flyway V15)

| Tabla | Propósito |
|---|---|
| `kyc_verifications` | Estado KYC por usuario — un registro por usuario |
| `kyc_documents` | Documentos subidos — múltiples por verificación |

---

## 7. Nuevos endpoints API

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/kyc/status` | JWT | Estado KYC del usuario autenticado |
| POST | `/api/v1/kyc/documents` | JWT | Subir documento de identidad |
| PATCH | `/api/v1/admin/kyc/{kycId}` | JWT + ROLE_KYC_REVIEWER | Aprobar/rechazar revisión |

---

## 8. RTM — Requirements Traceability Matrix

| US | RF | RNF | Gherkin | Jira |
|---|---|---|---|---|
| US-1301 | RF-013-01 | RNF-013-04 | 3 escenarios | SCRUM-40 |
| US-1302 | RF-013-02 | RNF-013-01/02/03 | 4 escenarios | SCRUM-41 |
| US-1303 | RF-013-03 | RNF-013-05 | 3 escenarios | SCRUM-42 |
| US-1304 | RF-013-04/05 | RNF-013-05 | 4 escenarios | SCRUM-43 |
| US-1305 | RF-013-06 | RNF-002 | 4 escenarios | SCRUM-44 |
| US-1306 | RF-013-07 | RNF-013-02 | 4 escenarios | SCRUM-45 |
| US-1307 | RF-013-08 | RNF-013-03/06 | 4 escenarios | SCRUM-46 |
| | | | **26 escenarios Gherkin total** | |

---

*SOFIA Requirements Analyst Agent — Step 2 Gate 2 pending*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1*
*BankPortal Sprint 15 — FEAT-013 — 2026-03-23*
