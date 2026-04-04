# FA — Análisis Funcional FEAT-019
## Centro de Privacidad y Perfil de Usuario
**Proyecto:** BankPortal — Banco Meridian  
**SOFIA:** v2.3 | **FA-Agent:** v2.2 | **Step:** 2b  
**Sprint:** 21 | **Release:** v1.21.0 | **Fecha:** 2026-03-31  

---

## 1. Contexto de negocio

### 1.1 ¿Qué problema resuelve FEAT-019?

BankPortal ha construido durante 20 sprints un conjunto sólido de funcionalidades bancarias. Sin embargo, existe un **gap crítico**: el usuario no tiene ningún control sobre su propia identidad digital en la plataforma.

Concretamente:
- No puede ver ni editar sus datos personales desde la app (DEBT-039 — ProfileController nunca implementado)
- No puede gestionar qué datos ceden al banco para usos secundarios (marketing, analítica)
- No puede solicitar una copia de todos sus datos personales
- No puede solicitar la eliminación de su cuenta de forma autónoma

Esto no es solo una carencia de UX — es un **incumplimiento regulatorio GDPR** que expone a Banco Meridian a sanciones de hasta el 4% de su facturación global (Art.83 GDPR).

### 1.2 Valor de negocio para Banco Meridian

| Dimensión | Impacto |
|---|---|
| **Cumplimiento regulatorio** | Cierra gap GDPR Arts. 7, 12, 15, 16, 17, 20 — elimina riesgo sancionador |
| **Confianza del cliente** | El usuario percibe transparencia y control — métrica de satisfacción NPS |
| **Reducción de carga operativa** | Solicitudes de portabilidad y supresión gestionadas automáticamente — sin intervención de agentes |
| **Diferenciación competitiva** | Centro de privacidad con historial de consentimientos — por encima del mínimo legal |

---

## 2. Funcionalidades documentadas

### FA-019-A — Consulta y Edición de Perfil Personal
**Módulo:** profile | **Issue:** SCRUM-106 | **SP:** 4

**Descripción funcional:**
El usuario accede a una sección "Mi Perfil" desde el menú principal de BankPortal. En esta sección visualiza todos sus datos personales registrados en el banco: nombre completo, número de teléfono, dirección postal y correo electrónico.

Los datos están organizados en dos grupos: datos **editables** (nombre, teléfono, dirección) y datos **de solo lectura** (email — modificable únicamente en oficina por política del banco).

Si el usuario tiene pendiente o rechazado el proceso de verificación de identidad KYC, todos los campos se muestran en modo consulta hasta que complete dicho proceso.

**Escenario de uso principal:**
> María, usuaria de BankPortal, se muda de Madrid a Barcelona. Quiere actualizar su dirección postal. Accede a "Mi Perfil", modifica la dirección y guarda. El cambio queda registrado inmediatamente.

**Escenario — cambio de teléfono:**
> Juan quiere actualizar su número de móvil. Introduce el nuevo número. El sistema le solicita confirmar el cambio introduciendo un código OTP enviado al teléfono actual, garantizando que realmente controla el número registrado antes de cambiarlo.

**Reglas de negocio clave:**
- RN-F019-01: Email no modificable desde la app — solo lectura
- RN-F019-02: Cambio de teléfono requiere OTP en móvil actual
- RN-F019-03: KYC PENDING/REJECTED → modo solo lectura

---

### FA-019-B — Gestión de Sesiones Activas
**Módulo:** profile / session | **Issue:** SCRUM-107 | **SP:** 3

**Descripción funcional:**
Dentro de su perfil, el usuario puede consultar todos los dispositivos y sesiones desde los que tiene acceso activo a BankPortal. Para cada sesión se muestra: tipo de dispositivo (móvil, tablet, ordenador), dirección IP parcialmente oculta, y cuándo fue el último acceso.

El usuario puede cerrar cualquier sesión ajena a la actual con un solo toque. El cierre es inmediato — ese dispositivo pierde acceso al instante, aunque tenga un token JWT no expirado.

**Escenario de uso:**
> Carlos nota que tiene una sesión activa en "Chrome / Windows" que no reconoce. Desde su móvil, cierra esa sesión. El dispositivo desconocido queda sin acceso inmediatamente y Carlos recibe notificación de que se ha cerrado una sesión desde su cuenta.

**Reglas de negocio clave:**
- RN-F019-05: IPs enmascaradas — solo se muestran los últimos dígitos
- RN-F019-06: Cierre remoto inmediato via Redis blacklist JWT
- RN-F019-07: No se puede cerrar la sesión actualmente en uso

---

### FA-019-C — Centro de Privacidad — Gestión de Consentimientos GDPR
**Módulo:** privacy | **Issue:** SCRUM-108 | **SP:** 4

**Descripción funcional:**
El usuario accede a una sección "Privacidad" en su perfil donde gestiona de forma granular qué usos secundarios autoriza al banco para sus datos personales.

Los consentimientos disponibles son:
- **Marketing:** recibir ofertas y comunicaciones comerciales del banco
- **Analítica:** que el banco analice sus patrones de uso para mejorar el servicio
- **Comunicaciones:** boletines informativos y novedades del banco

Existe un cuarto consentimiento — **Seguridad** — que no puede desactivarse ya que corresponde a las alertas obligatorias de actividad sospechosa y bloqueos de cuenta.

Cada cambio queda registrado en un historial que el usuario puede consultar: qué cambió, cuándo y desde qué dispositivo. Este historial es inmutable — el banco puede demostrar en cualquier momento cuál era el estado del consentimiento en una fecha dada.

**Escenario de uso:**
> Ana decide que no quiere recibir más comunicaciones de marketing del banco. Va a "Privacidad", desactiva el consentimiento "Marketing" y guarda. Inmediatamente deja de recibir emails promocionales. En el historial queda registrado: "Marketing: Activo → Inactivo, 31/03/2026, 10:45h".

**Reglas de negocio clave:**
- RN-F019-09: Cada cambio genera entrada inmutable en consent_history
- RN-F019-10: Consentimiento SECURITY no desactivable bajo ninguna circunstancia
- RN-F019-11: Cambio de consentimiento de comunicaciones se propaga a preferencias de notificación

---

### FA-019-D — Portabilidad de Datos (Descarga JSON)
**Módulo:** privacy / export | **Issue:** SCRUM-109 | **SP:** 3

**Descripción funcional:**
El usuario puede solicitar en cualquier momento una copia completa de todos sus datos personales almacenados por el banco en BankPortal. El banco tiene la obligación legal de proporcionar esta información en un formato estructurado, legible por máquina (GDPR Art.20).

La solicitud es asíncrona: el sistema genera el fichero en segundo plano y notifica al usuario mediante push cuando está listo para descargar. El enlace de descarga es seguro y tiene una validez de 48 horas.

El fichero JSON contiene: datos del perfil, historial completo de consentimientos, lista de sesiones, registro de exportaciones realizadas y registro de solicitudes GDPR anteriores.

**Escenario de uso:**
> Pedro quiere cambiar de banco y necesita sus datos. Va a "Privacidad" → "Descargar mis datos". El sistema le confirma que recibirá una notificación cuando el fichero esté listo (máximo 24 horas). Al cabo de unos minutos recibe la notificación push. Descarga su fichero JSON con todos sus datos en un formato que puede entregar a otra entidad.

**Reglas de negocio clave:**
- RN-F019-12: Solo un export activo simultáneo por usuario
- RN-F019-13: SLA de generación máximo 24 horas
- RN-F019-14: Enlace firmado válido 48 horas
- RN-F019-15: JSON firmado con SHA-256 para garantizar integridad

---

### FA-019-E — Derecho al Olvido (Solicitud de Eliminación)
**Módulo:** privacy | **Issue:** SCRUM-110 | **SP:** 3

**Descripción funcional:**
El usuario puede solicitar la eliminación completa de su cuenta y datos personales de BankPortal. Este es el llamado "derecho al olvido" reconocido por el GDPR.

El proceso incluye dos capas de verificación para evitar eliminaciones accidentales: primero se requiere la introducción de un código OTP enviado al móvil del usuario, y después se envía un email de confirmación con un enlace de un solo uso. Solo tras completar ambas confirmaciones se suspende la cuenta.

Una vez confirmada la solicitud, la cuenta queda suspendida inmediatamente — el usuario no puede operar. Los datos personales identificativos (nombre, email) son anonimizados. El banco notifica al sistema core bancario para gestionar la baja completa. Todo el proceso se completa en un máximo de 30 días.

**Importante para el usuario:** la eliminación es irreversible. Los registros de operaciones bancarias (transferencias, domiciliaciones) se conservan por obligación legal y no se eliminan — solo se desvinculan de la identidad del usuario.

**Escenario de uso:**
> Laura decide cerrar su relación con el banco. Accede a "Privacidad" → "Eliminar mi cuenta". El sistema le informa de las consecuencias y le pide confirmación con OTP. Laura introduce el código. Recibe un email con un enlace de confirmación final. Al pulsar el enlace, su cuenta queda suspendida y recibe confirmación. En 30 días sus datos personales habrán sido completamente eliminados.

**Reglas de negocio clave:**
- RN-F019-17: Requiere OTP 2FA obligatorio — operación irreversible
- RN-F019-18: Email de confirmación de único uso, TTL 24 horas
- RN-F019-19: Cuenta DELETION_PENDING no puede realizar ninguna operación
- RN-F019-20: Audit log GDPR conservado 6 años incluso tras supresión
- RN-F019-21: Transferencias programadas activas canceladas antes de completar supresión

---

### FA-019-F — Log de Derechos GDPR (Panel Administrador)
**Módulo:** privacy / admin | **Issue:** SCRUM-111 | **SP:** 3

**Descripción funcional:**
Los administradores de Banco Meridian disponen de un panel para monitorizar todas las solicitudes de derechos GDPR recibidas: exportaciones de datos, solicitudes de eliminación y cambios de consentimiento relevantes.

Para cada solicitud se muestra su estado actual, la fecha de recepción y el tiempo restante para cumplir el SLA legal de 30 días. El sistema genera alertas automáticas cuando una solicitud lleva más de 25 días sin resolverse, para evitar incumplimientos.

**Reglas de negocio clave:**
- RN-F019-22: Acceso exclusivo a usuarios con rol ADMIN
- RN-F019-23: Alerta automática a los 25 días sin resolución
- RN-F019-24: Retención del log: 6 años

---

## 3. Deuda técnica abordada

### DEBT-036 — IBAN real en audit log de exportaciones
**Issue:** SCRUM-112 | **SP:** 2

El audit log de la funcionalidad de exportación de movimientos (FEAT-018) registraba un identificador interno de cuenta (`"ACCOUNT-" + id`) en lugar del IBAN real. Esto implicaba que el registro de trazabilidad GDPR estaba incompleto. Se corrige inyectando el repositorio de cuentas para obtener el IBAN en el momento de escritura del log.

### MB-020-03 — Paginación PDF para extractos largos
**Issue:** SCRUM-113 | **SP:** 2

Los extractos PDF con más de 50 movimientos (que requieren múltiples páginas) podían generar ficheros corruptos. Se corrige la gestión del stream de páginas en el generador PDF.

---

## 4. Reglas de negocio nuevas (RN-F019-xx)

| ID | Módulo | Descripción |
|---|---|---|
| RN-F019-01 | profile | El email no puede modificarse desde BankPortal — requiere trámite presencial |
| RN-F019-02 | profile | El cambio de teléfono requiere verificación OTP en el número actual antes de persistir |
| RN-F019-03 | profile | KYC PENDING o REJECTED → todos los campos del perfil son solo lectura |
| RN-F019-04 | audit | Todos los cambios de perfil generan entrada en audit_log con timestamp + IP |
| RN-F019-05 | session | Las IPs se muestran enmascaradas en la lista de sesiones activas |
| RN-F019-06 | session | El cierre remoto de sesión es inmediato — JWT invalidado en Redis blacklist |
| RN-F019-07 | session | No se puede cerrar la sesión actualmente en uso desde este endpoint |
| RN-F019-08 | session | Máximo 5 sesiones activas simultáneas por usuario |
| RN-F019-09 | consent | Cada cambio de consentimiento genera entrada inmutable en consent_history |
| RN-F019-10 | consent | El consentimiento SECURITY no puede desactivarse bajo ninguna circunstancia |
| RN-F019-11 | consent | Cambios de consentimiento COMMUNICATIONS se propagan a preferencias de notificación |
| RN-F019-12 | export | Solo puede haber un data-export activo (PENDING/IN_PROGRESS) por usuario |
| RN-F019-13 | export | SLA de generación de data-export: máximo 24 horas |
| RN-F019-14 | export | Enlace de descarga del data-export: firmado, TTL 48 horas |
| RN-F019-15 | export | JSON de portabilidad firmado con SHA-256 para garantizar integridad |
| RN-F019-16 | export | Notificación push al usuario cuando el data-export está listo |
| RN-F019-17 | deletion | La solicitud de supresión requiere OTP 2FA obligatorio |
| RN-F019-18 | deletion | El enlace de confirmación de supresión es de único uso con TTL 24 horas |
| RN-F019-19 | deletion | Una cuenta DELETION_PENDING no puede realizar ninguna operación bancaria |
| RN-F019-20 | audit | El audit log GDPR se conserva 6 años incluso tras la supresión de la cuenta |
| RN-F019-21 | deletion | Las transferencias programadas activas se cancelan antes de completar la supresión |
| RN-F019-22 | admin | Solo usuarios con rol ADMIN pueden consultar el log de derechos GDPR |
| RN-F019-23 | admin | Se genera alerta automática cuando una solicitud GDPR supera los 25 días sin resolución |
| RN-F019-24 | admin | El log de derechos GDPR se conserva un mínimo de 6 años |
| RN-F019-25 | gdpr | Los estados válidos de gdpr_requests son: PENDING, IN_PROGRESS, COMPLETED, REJECTED |

---

*Generado por SOFIA v2.3 — FA-Agent v2.2 — Step 2b — Sprint 21 — 2026-03-31*
