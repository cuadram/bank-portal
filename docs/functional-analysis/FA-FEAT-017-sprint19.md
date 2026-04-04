# Análisis Funcional — FEAT-017 · Domiciliaciones y Recibos (SEPA Direct Debit)

**BankPortal · Banco Meridian · Sprint 19 · v1.19.0**

| Campo | Valor |
|---|---|
| Feature | FEAT-017 |
| Sprint | 19 |
| Período | 2026-05-08 → 2026-05-22 |
| Versión FA | 2.1 |
| Generado por | FA-Agent · SOFIA v2.2 |
| Fecha | 2026-03-27 |

---

## Contexto de negocio

Las domiciliaciones bancarias (SEPA Direct Debit) son autorizaciones permanentes que un cliente concede a un acreedor para que le cargue en cuenta importes periódicos o puntuales. En la banca retail española, representan el mecanismo estándar de pago de suministros, cuotas de préstamo, seguros, suscripciones y cualquier servicio de cobro recurrente.

Con FEAT-017, Banco Meridian permite a sus clientes gestionar el ciclo completo de domiciliaciones directamente desde el portal digital, eliminando la necesidad de atención en sucursal para operaciones de alta y cancelación, y dotando al cliente de transparencia total sobre cobros futuros y el historial de recibos procesados.

El módulo se rige por el **SEPA Direct Debit Core Rulebook v3.4** (EPC), **PSD2 Arts. 77 y 80** (derechos del deudor) y el **RGPD Art. 6.1.b** (tratamiento de datos de pago con base contractual).

---

## Funcionalidades nuevas — Sprint 19

### FA-053 — Modelo de datos de mandatos y recibos SEPA

**Descripción funcional:**
El sistema necesita una estructura de datos que soporte el ciclo de vida completo de un mandato SEPA Direct Debit Core: desde su creación y activación hasta su cancelación, incluyendo el registro histórico de todos los recibos procesados bajo ese mandato.

**Entidades de negocio:**

**Mandato SEPA (`debit_mandates`):**
Un mandato es el documento legal por el cual el cliente (deudor) autoriza a un acreedor a cargar en su cuenta. Cada mandato tiene:
- Referencia única de mandato (UMR — Unique Mandate Reference), generada por BankPortal
- Identificación del acreedor: nombre, IBAN de la cuenta de destino del cobro
- Tipo de mandato: CORE (particulares) — FEAT-017 solo implementa CORE
- Estado del ciclo de vida: ACTIVE (mandato operativo), CANCELLED (revocado por el cliente), SUSPENDED (suspensión temporal, reservado para uso futuro)
- Fecha de firma: momento en que el cliente autorizó el mandato
- Fecha de cancelación: momento en que el cliente revocó el mandato

**Recibo domiciliado (`direct_debits`):**
Cada cobro individual procesado bajo un mandato es un recibo. El ciclo de vida de un recibo es:
- PENDING → en espera de procesamiento por el scheduler de cobros
- CHARGED → cobro exitoso ejecutado
- RETURNED → devuelto por el banco del acreedor (motivo: AM04 fondos insuficientes, MS02 rechazo acreedor, etc.)
- REJECTED → rechazado antes del procesamiento (saldo insuficiente en cuenta del deudor)

**Reglas de negocio:**
- RN-053-01: Cada mandato pertenece a exactamente un cliente y una cuenta bancaria
- RN-053-02: Un cliente puede tener múltiples mandatos activos con diferentes acreedores
- RN-053-03: Un cliente NO puede tener dos mandatos ACTIVE simultáneos con el mismo acreedor e IBAN (prevención duplicados)
- RN-053-04: La referencia de mandato (UMR) es única en todo el sistema, formato: BNK-{userId6}-{unixTimestamp}

---

### FA-054 — Consulta de domiciliaciones y recibos

**Descripción funcional:**
El cliente puede en cualquier momento consultar el estado de sus domiciliaciones. La consulta ofrece dos vistas complementarias:

**Vista de mandatos:** Muestra todas las domiciliaciones del cliente, tanto activas como canceladas, con la información completa del acreedor y el estado actual.

**Vista de recibos:** Muestra el historial cronológico de todos los cargos procesados (o intentados) bajo los mandatos del cliente, con posibilidad de filtrar por estado, mandato específico y rango de fechas.

**Casos de uso funcionales:**

*Caso 1 — El cliente quiere saber a quién tiene domiciliado el cobro del teléfono:*
Accede a la lista de mandatos, localiza el mandato activo del operador de telecomunicaciones, verifica el IBAN de cargo y el histórico de recibos para comprobar la regularidad de los cobros.

*Caso 2 — El cliente ve un cargo que no reconoce:*
Accede al historial de recibos, localiza el recibo por fecha e importe, identifica el mandato asociado y el acreedor, y puede iniciar la cancelación del mandato o reclamar el cargo.

*Caso 3 — El cliente quiere saber si le han cobrado la cuota del gimnasio este mes:*
Filtra recibos por mandato del gimnasio y mes en curso, verifica si hay un recibo en estado CHARGED para el período.

**Reglas de negocio:**
- RN-054-01: El cliente solo puede ver sus propios mandatos y recibos (aislamiento estricto por usuario)
- RN-054-02: Los recibos se muestran en orden cronológico descendente (más reciente primero)
- RN-054-03: La paginación es obligatoria, máximo 50 recibos por página
- RN-054-04: Un cliente sin domiciliaciones ve una pantalla vacía con invitación a crear la primera domiciliación

---

### FA-055 — Alta de nueva domiciliación con mandato SEPA

**Descripción funcional:**
El cliente puede autorizar directamente desde el portal que un acreedor le realice cargos periódicos. Este proceso sustituye la firma física del formulario SEPA de mandato que tradicionalmente se realiza en sucursal o mediante papel enviado al acreedor.

**Proceso de negocio — alta de mandato:**

*Paso 1 — Identificación del acreedor:*
El cliente introduce el nombre del acreedor (empresa o servicio al que autoriza los cobros) y el IBAN de la cuenta bancaria del acreedor desde la que se realizarán los cobros.

*Paso 2 — Validación IBAN:*
El sistema valida que el IBAN introducido es matemáticamente correcto (algoritmo ISO 13616 mod-97) y pertenece a un país SEPA. Esta validación se realiza en el propio portal antes de llegar al backend, evitando mandatos con IBANs inválidos que serían rechazados por la red SEPA.

*Paso 3 — Confirmación con autenticación fuerte (2FA):*
Dado que la creación de un mandato es una operación financiera de alto impacto (autoriza cobros futuros), el sistema exige confirmación mediante OTP de un solo uso. Esto cumple con los requisitos de Autenticación Reforzada (SCA) de PSD2 para operaciones sensibles.

*Resultado:*
El mandato queda registrado como ACTIVE. El cliente recibe inmediatamente una notificación push y un email confirmando la nueva domiciliación con los datos completos del acreedor. El mandato queda disponible para el acreedor para iniciar cobros.

**Reglas de negocio:**
- RN-055-01: Solo se pueden crear mandatos SEPA DD CORE en esta versión (B2B reservado para FEAT posterior)
- RN-055-02: El IBAN del acreedor debe cumplir ISO 13616 y pertenecer a un país SEPA (34 países)
- RN-055-03: No se pueden crear dos mandatos ACTIVE con el mismo acreedor e IBAN para el mismo cliente
- RN-055-04: La confirmación OTP es obligatoria y no omitible
- RN-055-05: La referencia de mandato (UMR) la genera el sistema, no la introduce el cliente ni el acreedor
- RN-055-06: Se genera audit log MANDATE_CREATED con: usuario, cuenta, acreedor, IBAN, timestamp, IP de origen

---

### FA-056 — Anulación / revocación de mandato domiciliado

**Descripción funcional:**
El cliente puede en cualquier momento solicitar la cancelación de una domiciliación. Este es un derecho reconocido por PSD2 Art. 77 y el SEPA DD Core Rulebook, que establece que el deudor puede revocar su consentimiento sin necesidad de justificación ante el acreedor.

**Proceso de negocio — cancelación de mandato:**

*Revisión del mandato:*
Antes de procesar la cancelación, el sistema comprueba si existe algún recibo en estado PENDING con fecha de cargo en los próximos 2 días hábiles (bancos y TARGET2 cerrados excluidos). Esta restricción proviene del PSD2 Art. 80, que establece que las instrucciones de pago ya iniciadas no pueden ser revocadas después del día hábil anterior al acordado.

*Si no hay recibo próximo (cancelación libre):*
El mandato pasa a estado CANCELLED. El acreedor no podrá iniciar nuevos cobros bajo este mandato. El cliente recibe confirmación push y email.

*Si hay recibo en los próximos 2 días hábiles (bloqueo PSD2 D-2):*
El sistema informa al cliente que existe un cobro inminente que no puede bloquearse por regulación. La cancelación quedará efectiva después de que ese recibo se procese (o sea devuelto). El cliente puede decidir esperar y cancelar posteriormente, o reclamar el cargo después de ser procesado.

**Reglas de negocio:**
- RN-056-01: Solo el titular del mandato puede cancelarlo (control de propiedad estricto)
- RN-056-02: La cancelación requiere OTP 2FA (operación de alto impacto)
- RN-056-03: No se puede cancelar si existe recibo PENDING con due_date <= hoy + 2 días hábiles (SEPA/TARGET2)
- RN-056-04: Un mandato CANCELLED no puede reactivarse; el cliente debe crear uno nuevo si quiere reautorizar
- RN-056-05: Se genera audit log MANDATE_CANCELLED con: usuario, mandato_id, acreedor, timestamp, IP de origen

---

### FA-057 — Notificaciones push en eventos de cobro y devolución

**Descripción funcional:**
El cliente recibe notificaciones push en tiempo real cuando se produce cualquier evento significativo en sus recibos domiciliados. Este módulo transforma la domiciliación de un proceso opaco (el cliente descubre el cargo cuando revisa el extracto) en un proceso transparente y proactivo.

**Eventos notificados:**

*Cobro procesado (DEBIT_CHARGED):*
Cuando el scheduler de cobros procesa con éxito un recibo domiciliado, el cliente recibe inmediatamente una notificación push informando del cargo: nombre del acreedor e importe. Esta notificación cumple con el mandato de PSD2 Art. 80 de informar al pagador de las transacciones iniciadas.

*Recibo devuelto (DEBIT_RETURNED):*
Si el banco del acreedor devuelve un recibo ya cobrado (por ejemplo, por error del acreedor o reclamación regulatoria), el cliente recibe notificación indicando la devolución y el motivo codificado SEPA (AM04 = fondos insuficientes, MS02 = decisión acreedor, etc.).

*Recibo rechazado (DEBIT_REJECTED):*
Si el sistema detecta que la cuenta no tiene saldo suficiente para cubrir el recibo en el momento del procesamiento, el recibo se rechaza antes de enviarse a la red SEPA y el cliente recibe notificación para que tome medidas (transferir fondos, negociar con el acreedor).

**Reglas de negocio:**
- RN-057-01: Las notificaciones son opcionales si el cliente no tiene token de dispositivo registrado (graceful degradation)
- RN-057-02: Los eventos se registran en audit log independientemente de si la notificación push es enviada
- RN-057-03: El tiempo máximo entre el evento y la notificación push es de 30 segundos

---

### FA-058 — Interfaz de usuario — Gestión de domiciliaciones (Angular)

**Descripción funcional:**
El módulo frontend proporciona al cliente de Banco Meridian una experiencia de usuario completa para la gestión de sus domiciliaciones, integrada de forma coherente con el resto del portal bancario.

**Pantallas y flujos de usuario:**

*Lista de domiciliaciones:*
Pantalla principal del módulo. Muestra todas las domiciliaciones del cliente con su estado visual (activa en verde, cancelada en gris). Permite acceder al detalle de cada mandato, iniciar una nueva domiciliación o cancelar una existente.

*Detalle de domiciliación:*
Muestra la información completa del mandato seleccionado: datos del acreedor, fecha de alta, historial de recibos paginado con fechas, importes y estados. Permite desde aquí iniciar la cancelación del mandato.

*Wizard de alta de domiciliación (3 pasos):*
Paso 1: Datos del acreedor (nombre + IBAN con validación en tiempo real).
Paso 2: Resumen y confirmación de los datos introducidos.
Paso 3: Autenticación OTP y confirmación final.
El wizard guía al cliente minimizando errores y cumpliendo los requisitos SCA.

*Confirmación de cancelación:*
Pantalla específica de confirmación de cancelación, con resumen del mandato a cancelar, advertencia sobre el impacto regulatorio (PSD2 D-2 si aplica) y solicitud de OTP.

*Historial de recibos:*
Vista agregada de todos los recibos del cliente con filtros (mandato, estado, rango de fechas) y posibilidad de exportar a PDF para justificantes contables o reclamaciones.

**Reglas de negocio UX:**
- RN-058-01: La validación del IBAN se realiza en el frontend antes de llamar al backend, con feedback visual inmediato
- RN-058-02: Los estados de mandato tienen codificación visual consistente en toda la aplicación
- RN-058-03: El módulo cumple WCAG 2.1 AA (0 violaciones axe-core)
- RN-058-04: El módulo se carga lazy-loading, sin impacto en el bundle principal del portal
- RN-058-05: Todos los mensajes de error son en lenguaje comprensible para el cliente (no códigos técnicos)

---

## Resumen de funcionalidades acumuladas

| ID | Nombre | Sprint | Feature | Estado |
|---|---|---|---|---|
| FA-001 a FA-052 | Funcionalidades S1–S18 | 1–18 | FEAT-001 a FEAT-016 | COMPLETED |
| **FA-053** | **Modelo datos mandatos y recibos SEPA** | **19** | **FEAT-017** | **IN_PROGRESS** |
| **FA-054** | **Consulta domiciliaciones y recibos** | **19** | **FEAT-017** | **IN_PROGRESS** |
| **FA-055** | **Alta domiciliación con mandato SEPA** | **19** | **FEAT-017** | **IN_PROGRESS** |
| **FA-056** | **Anulación / revocación de mandato** | **19** | **FEAT-017** | **IN_PROGRESS** |
| **FA-057** | **Notificaciones push cobro/devolución** | **19** | **FEAT-017** | **IN_PROGRESS** |
| **FA-058** | **Interfaz Angular domiciliaciones** | **19** | **FEAT-017** | **IN_PROGRESS** |

**Total funcionalidades acumuladas: 58**

## Resumen reglas de negocio FEAT-017

| ID | Funcionalidad | Descripción breve |
|---|---|---|
| RN-053-01 | FA-053 | Mandato pertenece a un cliente y una cuenta |
| RN-053-02 | FA-053 | Cliente puede tener múltiples mandatos activos |
| RN-053-03 | FA-053 | No duplicados: mismo acreedor + IBAN activo |
| RN-053-04 | FA-053 | UMR único, formato BNK-{userId6}-{timestamp} |
| RN-054-01 | FA-054 | Aislamiento estricto por usuario |
| RN-054-02 | FA-054 | Recibos en orden cronológico descendente |
| RN-054-03 | FA-054 | Paginación obligatoria, máx 50/página |
| RN-054-04 | FA-054 | Sin domiciliaciones → pantalla vacía amigable |
| RN-055-01 | FA-055 | Solo mandatos CORE en v1.19.0 |
| RN-055-02 | FA-055 | IBAN acreedor: ISO 13616, 34 países SEPA |
| RN-055-03 | FA-055 | No duplicados activos mismo acreedor+IBAN |
| RN-055-04 | FA-055 | OTP 2FA obligatorio en alta |
| RN-055-05 | FA-055 | UMR generado por sistema |
| RN-055-06 | FA-055 | Audit log MANDATE_CREATED |
| RN-056-01 | FA-056 | Solo titular puede cancelar |
| RN-056-02 | FA-056 | OTP 2FA obligatorio en cancelación |
| RN-056-03 | FA-056 | Bloqueo PSD2 D-2 si recibo PENDING inminente |
| RN-056-04 | FA-056 | Mandato CANCELLED no reactivable |
| RN-056-05 | FA-056 | Audit log MANDATE_CANCELLED |
| RN-057-01 | FA-057 | Push opcional si no hay token dispositivo |
| RN-057-02 | FA-057 | Audit log independiente del push |
| RN-057-03 | FA-057 | Push en < 30s tras evento |
| RN-058-01 | FA-058 | Validación IBAN en frontend |
| RN-058-02 | FA-058 | Codificación visual estados consistente |
| RN-058-03 | FA-058 | WCAG 2.1 AA: 0 violaciones |
| RN-058-04 | FA-058 | Módulo lazy-loaded |
| RN-058-05 | FA-058 | Errores en lenguaje cliente |

**Total reglas de negocio FEAT-017: 27**

---

*FA-Agent v2.1 · CMMI REQM SP 1.1, 1.3 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19 · 2026-03-27*
