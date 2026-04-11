# Análisis Funcional — FEAT-007: Consulta de Cuentas y Movimientos
**Sprint 9 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V10 migración BD, accounts/transactions tablas, US-702/703/704/705]*

---

## Contexto de negocio

La funcionalidad central de cualquier portal bancario es la consulta de cuentas y
movimientos. Este módulo integra los datos del Core Banking para mostrar al cliente
el saldo disponible y el historial de movimientos con capacidad de búsqueda, filtrado
y categorización automática de gastos.

---

## FA-007-A — Consulta de Cuentas y Saldos

**Módulo:** Cuentas
**Actores:** Cliente
**Regulación:** PSD2 Art. 67 (AIS — Account Information Services)

### Descripción funcional
El cliente visualiza todas sus cuentas bancarias vinculadas (corriente, ahorro, nómina)
con su saldo disponible y retenido actualizado. Los datos se obtienen del Core Banking
en tiempo real a través del CoreBankingAccountAdapter.

### Reglas de negocio
- **RN-F007-01:** El saldo disponible y el saldo retenido se muestran siempre separados
- **RN-F007-02:** El IBAN se muestra en formato estándar europeo (ES + 22 dígitos)

---

## FA-007-B — Historial de Movimientos

**Módulo:** Cuentas / Transacciones
**Actores:** Cliente
**Regulación:** PSD2 Art. 67 (AIS), normativa EU de acceso a historial

### Descripción funcional
El cliente accede al historial paginado de movimientos de cada cuenta, ordenado
cronológicamente. Puede filtrar por tipo (cargo/abono), fecha y concepto.

### Reglas de negocio
- **RN-F007-03:** Los movimientos negativos representan cargos; los positivos representan abonos
- **RN-F007-04:** El historial disponible cubre al menos los últimos 13 meses (normativa EU)

---

## FA-007-C — Búsqueda por Concepto

**Módulo:** Cuentas / Transacciones
**Actores:** Cliente
**Regulación:** PSD2 Art. 67

### Descripción funcional
El cliente puede buscar movimientos por texto libre en el campo concepto. La búsqueda
es tolerante a erratas y devuelve resultados relevantes aunque la coincidencia no sea exacta.

### Reglas de negocio
- **RN-F007-05:** La búsqueda por concepto opera sobre los últimos 13 meses de movimientos

---

## FA-007-D — Categorización Automática de Gastos

**Módulo:** Cuentas / Transacciones
**Actores:** Sistema (automático)
**Regulación:** GDPR (tratamiento de datos financieros)

### Descripción funcional
Cada movimiento recibe automáticamente una categoría de gasto (alimentación, transporte,
ocio, etc.) basada en el concepto y el emisor. La categoría facilita el análisis posterior
en el dashboard de gastos.

### Reglas de negocio
- **RN-F007-06:** La categorización es automática; el cliente puede corregirla manualmente
