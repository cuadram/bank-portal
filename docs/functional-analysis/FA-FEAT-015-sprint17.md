# Análisis Funcional — FEAT-015: Transferencias Programadas y Recurrentes
**Sprint 17 · v1.17.0 · Estado: DELIVERED · 2026-04-22**
*⚠️ Documento corregido — versión inicial documentaba erróneamente "Autenticación 2FA" (FEAT-001). FEAT-015 = Transferencias Programadas y Recurrentes, confirmado por V17 migración BD y snapshot sprint 17.*

---

## Contexto de negocio

Los clientes necesitan automatizar pagos recurrentes sin intervención manual en cada
vencimiento: recibos de alquiler, pagos a proveedores, transferencias periódicas a
familiares. Este módulo implementa la programación de transferencias únicas o recurrentes
(semanales, quincenales, mensuales) con control total del cliente sobre el ciclo de vida
de cada programación.

El sprint incluyó también la resolución de deuda técnica crítica (DEBT-027/028/029)
relativa a la seguridad del módulo de notificaciones push y la autenticación de recursos.

---

## FA-015-A — Programación de Transferencia Única (ONCE)

**Módulo:** Transferencias / Programadas
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (SCA para importes elevados), SEPA Credit Transfer

### Descripción funcional
El cliente programa una transferencia para que se ejecute en una fecha futura concreta.
BankPortal almacena la instrucción y el scheduler la ejecuta automáticamente en la
fecha indicada. El cliente recibe confirmación cuando la transferencia se ejecuta.

### Flujo principal
1. Cliente crea una transferencia programada indicando IBAN destino, importe, concepto y fecha
2. BankPortal valida los datos (IBAN, límites, fondos proyectados) y crea la programación en estado ACTIVE
3. En la fecha programada, el scheduler ejecuta la transferencia automáticamente
4. El cliente recibe notificación del resultado (SUCCESS o FAILED)

### Reglas de negocio
- **RN-F015-01:** Una transferencia programada puede cancelarse hasta el día anterior a la fecha de ejecución
- **RN-F015-02:** Si la cuenta no tiene fondos suficientes en la fecha de ejecución, la transferencia se marca como FAILED y se notifica al cliente

---

## FA-015-B — Transferencias Recurrentes (WEEKLY / BIWEEKLY / MONTHLY)

**Módulo:** Transferencias / Programadas
**Actores:** Cliente
**Regulación:** PSD2, SEPA Credit Transfer

### Descripción funcional
El cliente configura una transferencia recurrente que se ejecuta automáticamente según
la periodicidad elegida (semanal, quincenal, mensual) hasta una fecha de fin o un
número máximo de ejecuciones. El sistema gestiona automáticamente la siguiente fecha
de ejecución tras cada ciclo.

### Reglas de negocio
- **RN-F015-03:** Una transferencia recurrente puede pausarse temporalmente y reanudarse
- **RN-F015-04:** La cancelación de una transferencia recurrente no afecta a las ejecuciones ya completadas
- **RN-F015-05:** Las transferencias recurrentes mensuales que caen en días inexistentes (ej. 31 de febrero) se ejecutan el último día hábil del mes

---

## FA-015-C — Consulta y Gestión de Transferencias Programadas

**Módulo:** Transferencias / Programadas
**Actores:** Cliente
**Regulación:** PSD2

### Descripción funcional
El cliente consulta el listado de todas sus transferencias programadas (activas, pausadas,
completadas, canceladas) y el historial de ejecuciones de cada una. Puede editar el
importe y el concepto de las futuras ejecuciones de una recurrente activa.

### Reglas de negocio
- **RN-F015-06:** No se puede editar el IBAN destino de una transferencia recurrente activa; es necesario cancelar y crear una nueva
- **RN-F015-07:** El historial de ejecuciones es inmutable (registro de auditoría)

---

## Deuda técnica resuelta en este sprint

- **DEBT-027:** Actualización de dependencias de seguridad (SpringSecurity + JJWT)
- **DEBT-028:** SCA reforzada para operaciones programadas de alto importe (CVSS 4.1)
- **DEBT-029:** Mejora de logging de auditoría para eventos de transferencia programada

## Cobertura QA (Sprint 17)
- Tests acumulados: 615 · Cobertura: 85%
- Verificación anti-duplicación scheduler (ShedLock): ✅
- Verificación idempotencia ejecuciones: ✅
