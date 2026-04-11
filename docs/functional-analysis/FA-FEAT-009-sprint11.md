# Análisis Funcional — FEAT-009: Pagos de Recibos y Facturas
**Sprint 11 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V12 migración BD, bills/bill_payments tablas, US-903/904]*

---

## Contexto de negocio

El cliente puede consultar y pagar sus recibos domiciliados y facturas pendientes
directamente desde BankPortal, sin necesidad de acudir a una oficina ni usar otras
plataformas de pago. El módulo cubre recibos domiciliados del banco (utilities,
seguros, etc.) y pagos ad-hoc por referencia.

---

## FA-009-A — Consulta de Recibos Pendientes

**Módulo:** Pagos / Recibos
**Actores:** Cliente
**Regulación:** PSD2 (información de pagos)

### Descripción funcional
El cliente visualiza el listado de recibos domiciliados pendientes de pago, con emisor,
concepto, importe y fecha de vencimiento. Los recibos próximos a vencer se destacan
visualmente.

### Reglas de negocio
- **RN-F009-01:** Los recibos se muestran ordenados por fecha de vencimiento (más próximos primero)
- **RN-F009-02:** Un recibo en estado CANCELLED no puede volver a pagarse

---

## FA-009-B — Pago de Recibo

**Módulo:** Pagos / Recibos
**Actores:** Cliente
**Regulación:** PSD2 Art. 97 (SCA para importes elevados), SEPA Direct Debit

### Descripción funcional
El cliente selecciona un recibo pendiente y confirma el pago con cargo a una de sus
cuentas. BankPortal verifica la cobertura de saldo, ejecuta el cargo en el Core Banking
y marca el recibo como pagado. El cliente recibe confirmación inmediata.

### Reglas de negocio
- **RN-F009-03:** El pago de un recibo requiere saldo disponible suficiente en la cuenta origen
- **RN-F009-04:** El cliente puede elegir la cuenta cargo entre sus cuentas activas

---

## FA-009-C — Pago Ad-hoc por Referencia

**Módulo:** Pagos / Facturas
**Actores:** Cliente
**Regulación:** PSD2

### Descripción funcional
El cliente puede realizar un pago espontáneo indicando la referencia de la factura
(número de referencia del emisor), el importe y la cuenta cargo, sin necesidad de
que la factura esté previamente domiciliada en BankPortal.

### Reglas de negocio
- **RN-F009-05:** El número de referencia del pago ad-hoc se comunica al emisor para conciliación
