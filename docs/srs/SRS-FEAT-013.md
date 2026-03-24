# SRS-FEAT-013 — Onboarding KYC / Verificación de Identidad

## 1. Metadata

| Campo | Valor |
|---|---|
| **ID Feature** | FEAT-013 |
| **Proyecto** | BankPortal |
| **Cliente** | Banco Meridian |
| **Stack** | Java 21 + Spring Boot 3.3 · Angular 17 · PostgreSQL · Redis |
| **Tipo de trabajo** | new-feature |
| **Sprint objetivo** | 15 |
| **Jira Epic** | SCRUM-36 |
| **Prioridad** | Alta |
| **Solicitado por** | Product Owner — Banco Meridian |
| **Versión SRS** | 1.0 |
| **Estado** | APPROVED — Gate 1 PO (2026-03-23) |
| **Normativa** | PSD2 · AML Directive EU 2018/843 · RGPD Art.9 · Circular Banco España 1/2010 |

---

## 2. Descripción del sistema / contexto

BankPortal es el portal digital de Banco Meridian para clientes particulares.
Proporciona servicios de banca online: consulta de saldos, transferencias,
pagos de recibos, gestión de dispositivos de confianza y ahora la incorporación
de nuevos clientes mediante el proceso de verificación de identidad KYC.

**KYC (Know Your Customer)** es el procedimiento obligatorio por normativa bancaria
(PSD2, AML Directive EU 2018/843, Circular Banco de España 1/2010) que acredita
la identidad de cada cliente antes de activar su cuenta operativa. Sin KYC
aprobado, el usuario puede registrarse y acceder al portal pero no puede ejecutar
ninguna operación financiera (transferencias, pagos, disposición de efectivo).

El presente SRS define los requerimientos del módulo KYC de BankPortal:
subida de documentos de identidad, validación automática, revisión manual por
operadores del banco, notificaciones al cliente y bloqueo de acceso financiero
hasta la aprobación del proceso.

---

## 3. Alcance

**Incluido en FEAT-013:**
- Modelo de datos KYC (tablas `kyc_verifications` y `kyc_documents`) con migración Flyway V15
- API REST para subida de documentos de identidad (DNI, NIE, Pasaporte UE)
- Motor de validación automática básica (formato, caducidad, tipo)
- Gestión de estados KYC y notificaciones email + in-app
- Guard de bloqueo de acceso financiero para usuarios sin KYC aprobado
- Frontend Angular: wizard paso a paso para subida de documentos
- Endpoint de revisión manual para operadores con rol `ROLE_KYC_REVIEWER`
- Deuda técnica: RV-020 · SAST-001 · SAST-002

**Excluido explícitamente de FEAT-013:**
- Verificación biométrica facial o liveness detection (fase futura)
- Integración con proveedores externos de validación documental (Jumio, Onfido, etc.)
- Verificación por video llamada con operador
- KYC para personas jurídicas / empresas (solo personas físicas)
- Flujo de renovación de documentos caducados (FEAT-014)

---

## 4. Épica

**SCRUM-36 — Onboarding KYC / Verificación de Identidad**

Habilitar el flujo completo de alta de nuevos clientes de Banco Meridian
mediante la verificación documental de identidad, cumpliendo la normativa
AML/PSD2 y garantizando que solo usuarios verificados puedan ejecutar
operaciones financieras. Reduce el riesgo regulatorio del banco y permite
la captación digital de clientes sin presencia física en oficina.

---

## 5. User Stories

---

### US-1301 — Modelo de datos KYC + migración Flyway V15

**Como** sistema de BankPortal,
**quiero** un modelo de datos estructurado para registrar el proceso KYC de cada usuario y los documentos aportados,
**para** garantizar la trazabilidad completa del proceso de verificación con auditoría regulatoria.

**Story Points:** 3
**Prioridad:** Alta
**Dependencias:** Ninguna — prerequisito bloqueante para US-1302..1307

#### Criterios de Aceptación

```gherkin
Scenario: Migración Flyway V15 ejecuta sin errores en base de datos vacía
  Given un entorno de base de datos PostgreSQL limpio
  When se ejecuta la migración Flyway V15__kyc_onboarding.sql
  Then las tablas kyc_verifications y kyc_documents existen
  And cada usuario tiene como máximo una entrada activa en kyc_verifications
  And los índices sobre user_id y status están creados

Scenario: Integridad referencial entre kyc_documents y kyc_verifications
  Given una entrada en kyc_verifications con id = 'abc-123'
  When se intenta insertar un kyc_document con kyc_id = 'id-inexistente'
  Then la base de datos rechaza la inserción con error de clave foránea

Scenario: Idempotencia de la migración Flyway
  Given la migración V15 ya ejecutada en el entorno
  When se vuelve a ejecutar mvn flyway:migrate
  Then Flyway reporta estado OK sin re-ejecutar V15
  And no hay duplicados en las tablas KYC
```

#### DoD
- [ ] Migración Flyway V15 ejecuta sin errores en entorno local y CI
- [ ] Tablas y restricciones creadas según DDL especificado
- [ ] Test de migración en FlywayMigrationIT con Testcontainers
- [ ] Revisión Code Reviewer aprobada

---

### US-1302 — API de subida de documentos de identidad

**Como** nuevo cliente de Banco Meridian,
**quiero** subir una fotografía o escáner de mi DNI, NIE o Pasaporte,
**para** iniciar la verificación de mi identidad y poder operar con mi cuenta.

**Story Points:** 3
**Prioridad:** Alta
**Dependencias:** US-1301 (tablas KYC deben existir)

#### Criterios de Aceptación

```gherkin
Scenario: Subida exitosa de documento DNI en formato JPEG
  Given un usuario autenticado con KYC en estado PENDING
  When envía POST /api/v1/kyc/documents con un JPEG de 800KB y tipo DNI
  Then el sistema responde HTTP 201 con { "kycId": "...", "documentId": "...", "status": "SUBMITTED" }
  And el estado del KYC cambia a SUBMITTED
  And el fichero queda almacenado con hash SHA-256 calculado y registrado

Scenario: Rechazo de fichero que supera el límite de 10MB
  Given un usuario autenticado con KYC en estado PENDING
  When envía POST /api/v1/kyc/documents con un fichero de 11MB
  Then el sistema responde HTTP 400 con error FILE_TOO_LARGE
  And el estado KYC no cambia
  And el fichero no se almacena

Scenario: Rechazo de tipo MIME no permitido
  Given un usuario autenticado con KYC en estado PENDING
  When envía POST /api/v1/kyc/documents con un fichero .exe o .zip
  Then el sistema responde HTTP 400 con error INVALID_FILE_TYPE
  And el mensaje indica los formatos permitidos: image/jpeg, image/png, application/pdf

Scenario: Consulta de estado KYC actual
  Given un usuario autenticado con KYC en cualquier estado
  When envía GET /api/v1/kyc/status
  Then el sistema responde HTTP 200 con { "status": "SUBMITTED", "submittedAt": "...", "documents": [...] }

Scenario: Usuario con KYC ya aprobado intenta subir de nuevo
  Given un usuario autenticado con KYC en estado APPROVED
  When envía POST /api/v1/kyc/documents
  Then el sistema responde HTTP 409 con error KYC_ALREADY_APPROVED
```

#### DoD
- [ ] Endpoint POST /api/v1/kyc/documents operativo con validación multipart
- [ ] Endpoint GET /api/v1/kyc/status operativo
- [ ] Almacenamiento seguro en directorio configurado por `KYC_STORAGE_PATH`
- [ ] Hash SHA-256 calculado y persistido por documento
- [ ] Tests unitarios UploadDocumentUseCaseTest (≥ 5 escenarios, ≥ 80% cobertura)
- [ ] Test IT KycDocumentControllerIT con MockMvc

---

### US-1303 — Motor de validación automática de documentos

**Como** sistema de BankPortal,
**quiero** validar automáticamente los documentos recibidos según reglas básicas,
**para** aprobar directamente los casos claros sin carga de trabajo para los operadores.

**Story Points:** 2
**Prioridad:** Alta
**Dependencias:** US-1302 (documentos deben existir antes de validar)

#### Criterios de Aceptación

```gherkin
Scenario: Documento válido aprobado automáticamente
  Given un documento JPEG legible con fecha de caducidad futura y tipo DNI reconocido
  When el motor de validación automática procesa el documento
  Then el estado del KYC pasa a APPROVED
  And se genera el evento de notificación APPROVED para US-1304
  And se registra en kyc_verifications.reviewed_at con reviewer_id = 'system'

Scenario: Documento caducado derivado a revisión manual
  Given un documento con campo expires_at en el pasado
  When el motor de validación automática procesa el documento
  Then el estado del KYC permanece en SUBMITTED (no se aprueba automáticamente)
  And se marca el documento con validation_status = CADUCADO

Scenario: Documento con tipo no reconocido derivado a revisión manual
  Given un documento cuyo tipo no es DNI, NIE ni Pasaporte UE
  When el motor de validación automática procesa el documento
  Then el estado del KYC permanece en SUBMITTED
  And se marca validation_status = TIPO_NO_RECONOCIDO

Scenario: Validación automática no bloquea la respuesta HTTP al cliente
  Given un documento subido correctamente
  When el cliente recibe la respuesta HTTP 201
  Then la validación automática se ejecuta de forma asíncrona (post-response)
  And el cliente puede consultar el estado actualizado con GET /api/v1/kyc/status
```

#### DoD
- [ ] `ValidateDocumentUseCase` con reglas de caducidad y tipo
- [ ] Ejecución asíncrona (Spring `@Async` o event listener)
- [ ] Tests unitarios ValidateDocumentUseCaseTest (≥ 4 escenarios)
- [ ] Cobertura rama ≥ 80%

---

### US-1304 — Estado KYC y notificaciones al cliente

**Como** cliente de Banco Meridian,
**quiero** recibir una notificación cuando mi verificación de identidad sea aprobada o rechazada,
**para** saber cuándo puedo empezar a operar con mi cuenta bancaria.

**Story Points:** 3
**Prioridad:** Alta
**Dependencias:** US-1303 (la aprobación/rechazo lo dispara la validación)

#### Criterios de Aceptación

```gherkin
Scenario: Notificación email al aprobar KYC
  Given un KYC en estado SUBMITTED que pasa a APPROVED
  When el sistema actualiza el estado
  Then se envía un email al cliente con asunto "Tu cuenta Banco Meridian está activa"
  And el email contiene el enlace de acceso al dashboard
  And la notificación queda registrada en user_notifications

Scenario: Notificación email al rechazar KYC con motivo
  Given un KYC en estado SUBMITTED que un operador rechaza con motivo "Documento ilegible"
  When el operador ejecuta PATCH /api/v1/admin/kyc/{kycId} con action=REJECT
  Then se envía un email al cliente con asunto "Verificación de identidad no completada"
  And el email incluye el motivo del rechazo y pasos para reintentar
  And el estado KYC pasa a REJECTED

Scenario: Banner in-app mientras KYC está PENDING o SUBMITTED
  Given un usuario con KYC en estado PENDING o SUBMITTED
  When accede al dashboard de BankPortal
  Then se muestra un banner informativo "Verificación en curso — tus datos están siendo revisados"
  And el banner incluye enlace al wizard KYC para continuar si está incompleto

Scenario: Banner desaparece tras aprobación
  Given un usuario con KYC en estado APPROVED
  When accede al dashboard
  Then no se muestra ningún banner de verificación pendiente
```

#### DoD
- [ ] Envío email APPROVED y REJECTED con plantillas HTML
- [ ] Notificación in-app registrada en user_notifications (reutiliza FEAT-007)
- [ ] Tests unitarios GetKycStatusUseCaseTest + notificaciones (≥ 4 escenarios)
- [ ] Sin regresiones en NotificationService existente

---

### US-1305 — Guard de acceso financiero (KYC_REQUIRED)

**Como** sistema de BankPortal,
**quiero** bloquear el acceso a operaciones financieras para usuarios sin KYC aprobado,
**para** cumplir la normativa AML/PSD2 que prohíbe operar a clientes no verificados.

**Story Points:** 2
**Prioridad:** Alta
**Dependencias:** US-1301 (modelo KYC debe existir)

#### Criterios de Aceptación

```gherkin
Scenario: Usuario con KYC APPROVED accede a transferencias sin bloqueo
  Given un usuario autenticado con kyc_status = APPROVED
  When realiza POST /api/v1/transfers
  Then el sistema procesa la transferencia normalmente (HTTP 200 o 201)
  And no se aplica ningún bloqueo KYC

Scenario: Usuario con KYC PENDING bloqueado en transferencias
  Given un usuario autenticado con kyc_status = PENDING
  When intenta realizar POST /api/v1/transfers
  Then el sistema responde HTTP 403 con body { "error": "KYC_REQUIRED", "kycUrl": "/kyc/wizard" }
  And la transferencia no se ejecuta
  And el evento queda registrado en audit_log

Scenario: Usuario con KYC REJECTED bloqueado con mensaje específico
  Given un usuario autenticado con kyc_status = REJECTED
  When intenta realizar cualquier operación financiera
  Then el sistema responde HTTP 403 con error KYC_REJECTED con enlace de reintento

Scenario: Endpoints públicos no afectados por el guard KYC
  Given cualquier usuario (incluso sin autenticar)
  When accede a /auth/login, /2fa/verify o /actuator/health
  Then no se aplica ningún filtro KYC
  And el acceso sigue el flujo normal de autenticación

Scenario: Guard Angular redirige al wizard si KYC no aprobado
  Given un usuario con KYC no aprobado en la app Angular
  When intenta navegar a /transfers o /payments
  Then Angular KycGuard intercepta y redirige a /kyc/wizard
  And se muestra el mensaje "Completa tu verificación para acceder a esta función"
```

#### DoD
- [ ] `KycAuthorizationFilter` (backend) registrado en SecurityConfig tras `RevokedTokenFilter`
- [ ] `KycGuard` Angular en `CanActivateFn` para rutas financieras
- [ ] Endpoints protegidos: `/api/v1/transfers/**`, `/api/v1/payments/**`, `/api/v1/bills/**`
- [ ] Tests KycAuthorizationFilterTest (≥ 4 escenarios)
- [ ] Tests KycGuard Angular (≥ 3 escenarios)

---

### US-1306 — Frontend Angular: KYC wizard paso a paso

**Como** nuevo cliente de Banco Meridian,
**quiero** un asistente visual paso a paso para subir mis documentos de identidad,
**para** completar la verificación de forma intuitiva y conocer el estado del proceso en tiempo real.

**Story Points:** 5
**Prioridad:** Alta
**Dependencias:** US-1302 (API de subida), US-1304 (estado y notificaciones)

#### Criterios de Aceptación

```gherkin
Scenario: Usuario completa el wizard en 5 pasos y recibe confirmación
  Given un usuario con KYC en estado PENDING que accede a /kyc/wizard
  When completa los 5 pasos: bienvenida → tipo documento → frontal → reverso → confirmación
  Then el sistema muestra "Documentos enviados — te notificaremos cuando estén revisados"
  And el estado KYC se actualiza a SUBMITTED en tiempo real vía GET /api/v1/kyc/status

Scenario: Drag & drop de imagen aceptada
  Given el usuario está en el paso 3 (subida frontal)
  When arrastra y suelta un archivo JPEG o PNG menor de 10MB
  Then se muestra la previsualización de la imagen
  And el botón "Continuar" se habilita

Scenario: Fichero rechazado muestra error claro sin romper el wizard
  Given el usuario está en el paso 3 (subida frontal)
  When intenta subir un fichero PDF mayor de 10MB
  Then se muestra el mensaje "El archivo supera el tamaño máximo de 10MB. Prueba con una imagen JPEG o PNG."
  And el usuario permanece en el paso 3 para reintentar

Scenario: Wizard no exige reverso para Pasaporte
  Given el usuario selecciona tipo de documento = Pasaporte
  When avanza al paso 3
  Then el paso 4 (reverso) se omite automáticamente
  And el wizard salta directamente al paso 5 (confirmación)

Scenario: Usuario puede reiniciar el wizard si KYC está en REJECTED
  Given un usuario con KYC en estado REJECTED
  When accede a /kyc/wizard
  Then el wizard muestra el motivo de rechazo de la verificación anterior
  And permite iniciar un nuevo proceso de subida de documentos
```

#### DoD
- [ ] Módulo `KycModule` con lazy loading en Angular 17
- [ ] Componentes: `KycWizardComponent`, `KycUploadComponent`, `KycStatusComponent`
- [ ] Drag & drop con `@angular/cdk/drag-drop` o FileReader nativo
- [ ] Previsualización de imagen antes de enviar
- [ ] Tests Angular: `KycWizardComponent.spec.ts` (≥ 5 escenarios)
- [ ] Accesibilidad WCAG 2.1 AA en todos los pasos del wizard

---

### US-1307 — Endpoint de revisión manual para operadores KYC

**Como** operador de Banco Meridian con rol KYC_REVIEWER,
**quiero** revisar y aprobar o rechazar manualmente las verificaciones de identidad pendientes,
**para** garantizar la calidad del proceso KYC en los casos que la validación automática no puede resolver.

**Story Points:** 3
**Prioridad:** Media — Should Have
**Dependencias:** US-1302 (documentos subidos), US-1304 (notificaciones al aprobar/rechazar)

#### Criterios de Aceptación

```gherkin
Scenario: Operador aprueba un KYC en estado SUBMITTED
  Given un operador con ROLE_KYC_REVIEWER autenticado
  And existe un kyc_verification con id = 'kyc-001' en estado SUBMITTED
  When envía PATCH /api/v1/admin/kyc/kyc-001 con body { "action": "APPROVE" }
  Then el estado cambia a APPROVED
  And reviewed_at y reviewer_id quedan registrados
  And se dispara la notificación de aprobación al cliente (US-1304)
  And el sistema responde HTTP 200 con el KYC actualizado

Scenario: Operador rechaza un KYC con motivo obligatorio
  Given un operador con ROLE_KYC_REVIEWER autenticado
  When envía PATCH /api/v1/admin/kyc/kyc-001 con { "action": "REJECT" } sin campo reason
  Then el sistema responde HTTP 400 con error REASON_REQUIRED
  And el estado KYC no cambia

Scenario: Operador sin rol KYC_REVIEWER no puede acceder al endpoint
  Given un usuario autenticado con rol ROLE_USER (cliente normal)
  When intenta PATCH /api/v1/admin/kyc/cualquier-id
  Then el sistema responde HTTP 403 Forbidden
  And el intento queda registrado en audit_log con nivel WARNING

Scenario: Intento de modificar KYC ya en estado final APPROVED
  Given un KYC en estado APPROVED
  When un operador intenta PATCH /api/v1/admin/kyc/{id} con action=REJECT
  Then el sistema responde HTTP 409 con error KYC_ALREADY_IN_FINAL_STATE
  And el estado no cambia
```

#### DoD
- [ ] `KycAdminController` con endpoint PATCH seguro con `@PreAuthorize("hasRole('KYC_REVIEWER')")`
- [ ] `ReviewKycUseCase` con validación de estado final
- [ ] Tests ReviewKycUseCaseTest (≥ 4 escenarios)
- [ ] Test IT KycAdminControllerIT con Spring Security Test
- [ ] Entrada en audit_log por cada revisión manual

---

## 6. Requerimientos No Funcionales

> RNF delta sobre baseline BankPortal (ver SRS Baseline v1.0 — Sprint 1)

| ID | Categoría | Descripción | Criterio medible | Tipo |
|---|---|---|---|---|
| RNF-D13-01 | Seguridad | Documentos KYC cifrados en reposo (RGPD Art.9 — datos identidad) | AES-256-GCM en disco · acceso solo con `ROLE_KYC_REVIEWER` o propietario | Nuevo |
| RNF-D13-02 | Rendimiento | Subida de documento hasta 10MB | Timeout máximo 30s · respuesta HTTP antes de validación asíncrona | Nuevo |
| RNF-D13-03 | Seguridad | Hash SHA-256 de integridad por documento | Verificado en cada lectura de documento por el sistema | Nuevo |
| RNF-D13-04 | Trazabilidad | Auditoría completa del ciclo KYC | Cada cambio de estado registrado en audit_log con actor + timestamp | Nuevo |
| RNF-D13-05 | Retención de datos | Documentos KYC conservados según normativa | Mínimo 5 años desde aprobación · eliminación automática tras expiración | Nuevo |
| RNF-D13-06 | Rendimiento | Tiempo de respuesta validación automática | Completada en < 5s tras recepción del documento | Nuevo |

---

## 7. Restricciones

| ID | Tipo | Descripción |
|---|---|---|
| RR-013-01 | Normativa | PSD2: verificación identidad obligatoria antes de operaciones de pago |
| RR-013-02 | Normativa | AML Directive EU 2018/843: diligencia debida del cliente (CDD) |
| RR-013-03 | Normativa | RGPD Art.9: datos de identidad = datos especiales → consentimiento explícito + cifrado |
| RR-013-04 | Normativa | Circular Banco España 1/2010: identificación presencial o equivalente digital |
| RR-013-05 | Tecnología | Backend: Java 21 + Spring Boot 3.3 + PostgreSQL. Sin cambios de stack |
| RR-013-06 | Tecnología | Frontend: Angular 17 con lazy loading obligatorio para el módulo KYC |
| RR-013-07 | Tecnología | Almacenamiento: sistema de ficheros local con path configurable via `KYC_STORAGE_PATH` |
| RR-013-08 | Seguridad | No integrar proveedores externos de validación documental en FEAT-013 (fase futura) |

---

## 8. Supuestos y dependencias

**Supuestos documentados:**
- El usuario ya está registrado en BankPortal (FEAT-001) antes de iniciar el KYC
- La validación automática usa únicamente metadatos del documento (tipo, caducidad) — no OCR ni biometría
- El almacenamiento de documentos es local (`KYC_STORAGE_PATH`) — sin almacenamiento cloud en esta fase
- El rol `ROLE_KYC_REVIEWER` ya existe en el sistema de autorización de Banco Meridian

**Dependencias externas:**
- Flyway V15 debe ejecutar sin errores antes del deploy a STG (prerequisito bloqueante)
- `KYC_STORAGE_PATH` debe estar configurado en los entornos STG y PROD antes del deploy
- `ROLE_KYC_REVIEWER` debe estar asignado al menos a 1 usuario operador en STG para pruebas de aceptación

**Dependencias internas:**
- `NotificationService` (FEAT-007) reutilizado para notificaciones email e in-app
- `SseEmitterRegistry` (FEAT-007) reutilizado para actualizaciones en tiempo real del estado KYC
- `JwtAuthenticationFilter` + `authenticatedUserId` en request attribute — prerequisito de todos los controllers KYC

---

## 9. Matriz de Trazabilidad (RTM)

| ID | Proceso Negocio | RF/RNF | Componente Arquitectura | Caso de Prueba | Estado |
|---|---|---|---|---|---|
| US-1301 | Alta de cliente · AML CDD | RF-1301 · RNF-D13-04 | `kyc_verifications` · `kyc_documents` · Flyway V15 | FlywayMigrationIT | DRAFT |
| US-1302 | Subida documental · PSD2 | RF-1302 · RNF-D13-01 · RNF-D13-02 · RNF-D13-03 | `KycController` · `UploadDocumentUseCase` · `DocumentStorageService` | UploadDocumentUseCaseTest · KycDocumentControllerIT | DRAFT |
| US-1303 | Validación automática · AML | RF-1303 · RNF-D13-06 | `ValidateDocumentUseCase` · Spring `@Async` | ValidateDocumentUseCaseTest | DRAFT |
| US-1304 | Notificaciones · RGPD | RF-1304 · RNF-D13-04 | `GetKycStatusUseCase` · `NotificationService` · `UserNotification` | GetKycStatusUseCaseTest | DRAFT |
| US-1305 | Bloqueo operaciones · PSD2 AML | RF-1305 · RR-013-01 | `KycAuthorizationFilter` · Angular `KycGuard` | KycAuthorizationFilterTest | DRAFT |
| US-1306 | UX onboarding | RF-1306 · RNF-D13-02 | `KycModule` · `KycWizardComponent` · `KycUploadComponent` | KycWizardComponent.spec.ts | DRAFT |
| US-1307 | Revisión manual · CDD | RF-1307 · RNF-D13-04 | `KycAdminController` · `ReviewKycUseCase` | ReviewKycUseCaseTest · KycAdminControllerIT | DRAFT |
| RV-020 | Deuda técnica | — | `GetProfileUseCase` | UpdateProfileTest | DRAFT |
| SAST-001 | RGPD Art.25 | RNF-D13-04 | `UpdateProfileUseCase` · `AuditLogService` | AuditLogTest | DRAFT |
| SAST-002 | Seguridad | RNF-004 | `ProfileController` · Bucket4j | ProfileControllerTest | DRAFT |

---

## 10. DoD aplicable — BankPortal (CMMI Nivel 3)

### New feature (US-1301..1307)
- [ ] Código implementado en rama `feature/FEAT-013-sprint15`
- [ ] Code review aprobado (0 findings bloqueantes)
- [ ] Tests unitarios escritos con cobertura ≥ 80% en capa application
- [ ] Tests de integración pasando (Testcontainers donde aplica)
- [ ] Tests Angular con cobertura ≥ 70%
- [ ] Pipeline CI/CD verde (Jenkins)
- [ ] Flyway V15 validada en entorno CI
- [ ] Aprobación QA Lead (0 defectos críticos/mayores abiertos)
- [ ] Aprobación Product Owner sobre demo en STG

### Deuda técnica (RV-020 · SAST-001 · SAST-002)
- [ ] Fix implementado y cubierto con test
- [ ] Sin regresiones en suite existente (≥ 143 tests passing)
- [ ] Code review aprobado

---

*SOFIA Requirements Analyst — Step 2 | Sprint 15 · FEAT-013*
*CMMI Level 3 — RD SP 1.1 · RD SP 2.1 · RD SP 3.1 · REQM SP 1.1*
*BankPortal — Banco Meridian — 2026-03-24*
