# Análisis Funcional — FEAT-016: Gestión Completa de Tarjetas
**Sprint 18 · v1.18.0 · Estado: DELIVERED · 2026-03-25**

---

## Contexto de negocio

La gestión de tarjetas bancarias es uno de los servicios más demandados por los
clientes en la banca digital. BankPortal implementa en este sprint el módulo
completo de gestión de tarjetas: consulta, bloqueo/desbloqueo, cambio de PIN,
gestión de límites, historial de transacciones y notificaciones push de operaciones.

Todas las operaciones con datos de tarjeta se ejecutan bajo los estándares de
seguridad PCI DSS v4.0, que establece los requisitos mínimos para el tratamiento
de datos de tarjetas de pago. El PIN nunca se almacena en BankPortal, transmitiéndose
cifrado directamente al Core Banking.

Esta feature fue también la más compleja en términos de superficie de ataque,
siendo objeto de auditoría de seguridad específica (DEBT-031 rate limiting en /pin,
pendiente Sprint 19).

---

## FA-007 — Consulta de Tarjetas del Cliente

**Módulo:** Tarjetas  
**Actores:** Cliente  
**Regulación:** PCI DSS v4.0

### Descripción funcional

El cliente accede al listado de todas sus tarjetas (débito y crédito) vinculadas
a su identidad en el banco. Para cada tarjeta visualiza: tipo, entidad emisora,
estado (activa/bloqueada/expirada), últimos 4 dígitos y fecha de caducidad.

El número completo de tarjeta nunca se muestra en la app, cumpliendo con la
normativa PCI DSS de enmascaramiento de datos de tarjeta (PAN masking).

### Reglas de negocio
- **RN-012:** El cliente solo visualiza tarjetas vinculadas a su identidad verificada en Core Banking
- **RN-013:** El número de tarjeta se muestra enmascarado (últimos 4 dígitos visibles)

### Integraciones de negocio
- **Core Banking:** fuente de datos de tarjetas y estados

---

## FA-008 — Bloqueo y Desbloqueo de Tarjeta

**Módulo:** Tarjetas  
**Actores:** Cliente  
**Regulación:** PCI DSS v4.0

### Descripción funcional

El cliente puede bloquear su tarjeta inmediatamente desde la app ante pérdida,
robo o uso sospechoso. El bloqueo es efectivo en todos los canales bancarios
(TPV, cajero, comercio electrónico) de forma inmediata.

Para el desbloqueo, si han transcurrido más de 60 minutos desde el bloqueo,
el sistema exige autenticación reforzada (2FA) para proteger al cliente ante
un posible robo del dispositivo durante el período de bloqueo.

El cliente no puede desbloquear tarjetas que hayan sido bloqueadas por el banco
(por fraude detectado u otras causas); en esos casos debe contactar con el soporte.

### Flujo principal (bloqueo)
1. Cliente accede al detalle de su tarjeta
2. Selecciona "Bloquear tarjeta"
3. Sistema solicita confirmación explícita
4. BankPortal envía la instrucción al Core Banking
5. Core Banking confirma el bloqueo; la tarjeta queda inoperativa en todos los canales
6. Cliente recibe notificación push de confirmación del bloqueo

### Reglas de negocio
- **RN-014:** El bloqueo es inmediato en todos los canales
- **RN-015:** El desbloqueo requiere 2FA si han transcurrido más de 60 minutos desde el bloqueo
- **RN-016:** Las tarjetas bloqueadas por el banco no pueden ser desbloqueadas por el cliente

---

## FA-009 — Cambio de PIN de Tarjeta

**Módulo:** Tarjetas  
**Actores:** Cliente  
**Regulación:** PCI DSS v4.0 (transmisión segura de PIN)

### Descripción funcional

El cliente puede cambiar el PIN de su tarjeta desde la app, sin necesidad de
acudir a una sucursal o cajero. El nuevo PIN se introduce directamente en el
teclado seguro de la app, se cifra en el dispositivo y se transmite al Core Banking
sin que BankPortal tenga acceso al valor del PIN en ningún momento.

El sistema verifica que el nuevo PIN no coincide con los últimos 3 PINs utilizados,
en línea con las buenas prácticas de seguridad bancaria.

### Flujo principal
1. Cliente accede al detalle de tarjeta → "Cambiar PIN"
2. BankPortal exige 2FA para autorizar la operación
3. Cliente introduce el nuevo PIN mediante teclado seguro
4. PIN se cifra en el dispositivo antes de enviarse
5. BankPortal transmite el PIN cifrado al Core Banking
6. Core Banking actualiza el PIN y confirma la operación
7. BankPortal notifica al cliente por push del cambio exitoso

### Reglas de negocio
- **RN-017:** Cambio de PIN requiere 2FA obligatorio; no puede coincidir con los últimos 3 PINs
- **RN-018:** El PIN no se almacena en BankPortal; se transmite cifrado directamente al Core Banking

---

## FA-010 — Gestión de Límites de Tarjeta

**Módulo:** Tarjetas  
**Actores:** Cliente  
**Regulación:** PCI DSS, PSD2 (límites de transacción)

### Descripción funcional

El cliente puede consultar y modificar los límites diarios de su tarjeta (límite
de compra, límite de disposición en cajero, límite de compra online). Los límites
están acotados por los máximos del contrato de tarjeta con el banco, que no
pueden superarse bajo ninguna circunstancia.

Los cambios de límites se aplican en el siguiente día hábil bancario para
garantizar la consistencia con los sistemas del Core Banking.

### Reglas de negocio
- **RN-019:** Los límites están acotados por los máximos del contrato; no pueden superarse
- **RN-020:** El cambio de límites tiene efecto en el siguiente día hábil bancario

---

## FA-011 — Notificaciones Push de Operaciones con Tarjeta

**Módulo:** Tarjetas / Notificaciones  
**Actores:** Core Banking (sistema emisor), Dispositivo del Cliente  
**Regulación:** GDPR

### Descripción funcional

El módulo de tarjetas se integra con el sistema de notificaciones push (FEAT-014)
para informar al cliente de cada operación con su tarjeta: cargos, abonos, intentos
rechazados y alertas de seguridad.

Especialmente relevante: los cargos rechazados también generan notificación, lo que
permite al cliente detectar intentos de uso fraudulento de su tarjeta incluso cuando
el cargo no llega a ejecutarse.

### Reglas de negocio
- **RN-021:** Las notificaciones de tarjeta se disparan también para cargos rechazados

---

## FA-012 — Historial de Transacciones de Tarjeta

**Módulo:** Tarjetas  
**Actores:** Cliente  
**Regulación:** PCI DSS, GDPR, Normativa EU (acceso a historial 13 meses)

### Descripción funcional

El cliente puede consultar el historial completo de transacciones de cada tarjeta
cubriendo los últimos 13 meses, en cumplimiento con la normativa europea de
acceso a información de pagos. Las transacciones en divisa extranjera muestran
tanto el importe original como el tipo de cambio aplicado, proporcionando
transparencia total sobre los costes de las operaciones internacionales.

### Reglas de negocio
- **RN-022:** El historial cubre los últimos 13 meses (normativa EU)
- **RN-023:** Las transacciones en divisa extranjera muestran importe original y tipo de cambio aplicado

---

## Cobertura QA (Sprint 18)

| Métrica | Valor |
|---|---|
| Test cases totales (acumulado) | 677 |
| Cobertura estimada | 86% |
| Test cases sprint 18 | 101/101 PASS |
| Defectos abiertos al cierre | 0 |
| Verificación PCI DSS | 16/16 ✅ |
| Verificación WCAG 2.1 AA | 8/8 ✅ |
| Contratos API verificados | 18/18 ✅ |
| p95 GET /cards | 194ms ✅ |
| p95 POST /cards/block | 312ms ✅ |

### Deuda técnica derivada (pendiente Sprint 19)
- **DEBT-031:** Rate limiting en endpoint `/cards/{id}/pin` (CVSS 4.2, Prioridad Media)
- **DEBT-032:** mTLS en CoreBankingAdapter (CVSS 2.7, Prioridad Baja, Pre-producción)
