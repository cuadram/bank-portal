# Análisis Funcional — FEAT-014: Notificaciones Push VAPID
**Sprint 16 · v1.16.0 · Estado: DELIVERED · 2026-03-24**

---

## Contexto de negocio

BankPortal introduce la capacidad de enviar notificaciones push directamente al
dispositivo móvil del cliente sin necesidad de intermediarios (brokers propietarios).
Se utiliza el protocolo VAPID (Voluntary Application Server Identification), estándar
abierto W3C/IETF, que garantiza la autenticidad del servidor emisor y el cifrado
extremo a extremo de las notificaciones.

Esta funcionalidad cubre una necesidad crítica de la banca digital moderna: mantener
al cliente informado en tiempo real sobre sus movimientos y eventos de cuenta,
contribuyendo a la detección temprana de operaciones fraudulentas y mejorando
la experiencia de usuario.

---

## FA-001 — Suscripción a Notificaciones Push

**Módulo:** Notificaciones  
**Actores:** Cliente (usuario de BankPortal), Dispositivo Móvil  
**Regulación:** GDPR (consentimiento explícito para comunicaciones push)

### Descripción funcional

El cliente activa las notificaciones push desde la configuración de su app.
BankPortal registra su dispositivo mediante un token VAPID único, que identifica
de forma segura tanto el servidor de envío como el dispositivo receptor.

El sistema admite hasta 5 dispositivos por cliente activos simultáneamente,
permitiendo al cliente usar la app desde su móvil, tablet u otros dispositivos.
El registro tiene una validez de 12 meses sin actividad, tras la cual expira
automáticamente para proteger la privacidad del cliente.

### Flujo principal
1. El cliente accede a "Configuración → Notificaciones" en la app
2. Activa el permiso de notificaciones en su dispositivo
3. BankPortal genera y registra el par de claves VAPID para ese dispositivo
4. El sistema confirma el registro y muestra el estado "Notificaciones activas"
5. El cliente recibe una notificación de bienvenida de confirmación

### Reglas de negocio
- **RN-001:** Solo dispositivos con token VAPID registrado activo reciben notificaciones
- **RN-002:** Máximo 5 dispositivos por cliente activos simultáneamente
- **RN-003:** El registro VAPID expira a los 12 meses sin actividad

### Condiciones de error / excepciones
- Si el cliente supera el límite de 5 dispositivos: debe desregistrar uno antes de registrar el nuevo
- Si el navegador/OS no soporta VAPID: se informa al cliente y se ofrecen canales alternativos (email/SMS)

---

## FA-002 — Envío de Notificaciones de Movimientos

**Módulo:** Notificaciones  
**Actores:** Core Banking (sistema emisor de eventos), Dispositivo del Cliente  
**Regulación:** GDPR (derecho a desactivar comunicaciones no esenciales)

### Descripción funcional

Cuando se produce un movimiento en la cuenta del cliente (cargo, abono, transferencia
emitida o recibida), BankPortal recibe el evento del Core Banking y envía una
notificación push al dispositivo del cliente en un máximo de 30 segundos.

Las notificaciones informan del tipo de movimiento, el importe y el saldo resultante,
permitiendo al cliente conocer su situación financiera en tiempo real sin necesidad
de abrir la app.

### Flujo principal
1. Core Banking emite evento de movimiento hacia BankPortal
2. BankPortal valida que el cliente tiene notificaciones activas para esa categoría
3. Formatea el mensaje con tipo, importe y saldo resultante
4. Envía la notificación push a todos los dispositivos registrados activos del cliente
5. Registra el envío para auditoría y resolución de incidencias

### Reglas de negocio
- **RN-004:** Las notificaciones se envían en tiempo real, máximo 30 segundos tras el evento
- **RN-005:** Los movimientos por importe inferior al umbral configurado no generan notificación por defecto

### Integraciones de negocio
- **Core Banking:** fuente de eventos de movimientos en tiempo real

---

## FA-003 — Gestión de Preferencias de Notificación

**Módulo:** Notificaciones  
**Actores:** Cliente  
**Regulación:** GDPR (control del cliente sobre sus datos y comunicaciones)

### Descripción funcional

El cliente puede personalizar qué tipo de notificaciones desea recibir,
activando o desactivando categorías (movimientos, alertas de seguridad,
comunicaciones comerciales, etc.). BankPortal respeta estas preferencias
en todos sus canales de notificación.

La normativa GDPR exige que al menos una categoría esencial de notificaciones
quede activa (alertas de seguridad), garantizando que el cliente siempre sea
informado de eventos críticos relacionados con su seguridad.

### Reglas de negocio
- **RN-006:** El cliente puede desactivar categorías individualmente; mínimo la categoría "Seguridad" debe permanecer activa

### Cobertura QA (Sprint 16)
- Test cases: 553 totales (acumulado) · Cobertura: 84%
- Verificación GDPR consentimiento: ✅
- Verificación flujo VAPID registro: ✅
