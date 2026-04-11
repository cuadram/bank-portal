# Análisis Funcional — FEAT-010: Dashboard Analítico de Gastos
**Sprint 12 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: V13 migración BD, SpendingCategorizationEngine.java, BudgetAlertService.java, US-1002/1005]*

---

## Contexto de negocio

El cliente dispone de una visión analítica de sus gastos e ingresos para comprender
sus patrones financieros y tomar mejores decisiones. El dashboard consolida movimientos
de todas las cuentas, los agrupa por categoría y período, y genera alertas cuando se
acerca al presupuesto mensual establecido.

---

## FA-010-A — Resumen de Gastos por Categoría

**Módulo:** Dashboard / Analítica
**Actores:** Cliente
**Regulación:** GDPR (tratamiento datos financieros personales)

### Descripción funcional
El cliente visualiza un desglose de sus gastos del mes actual por categoría
(alimentación, transporte, ocio, servicios, etc.), con el porcentaje que representa
cada categoría sobre el total y la evolución respecto al mes anterior.

### Reglas de negocio
- **RN-F010-01:** Las categorías de gasto se calculan de forma asíncrona; la vista puede tener un desfase máximo de 5 minutos
- **RN-F010-02:** Los movimientos sin categoría asignada aparecen en la categoría "Otros"

---

## FA-010-B — Evolución Mensual de Gastos e Ingresos

**Módulo:** Dashboard / Analítica
**Actores:** Cliente
**Regulación:** GDPR

### Descripción funcional
El cliente visualiza la evolución de sus gastos e ingresos en los últimos 12 meses,
en formato gráfico. Puede comparar cualquier mes con el anterior para identificar
desviaciones.

### Reglas de negocio
- **RN-F010-03:** La comparativa mensual cubre los últimos 12 períodos completos

---

## FA-010-C — Alertas de Presupuesto

**Módulo:** Dashboard / Analítica
**Actores:** Cliente, Sistema (automático)
**Regulación:** GDPR

### Descripción funcional
El cliente establece un presupuesto mensual total. Cuando el gasto acumulado alcanza
el porcentaje de alerta configurado (por defecto 80%), BankPortal envía una notificación
proactiva para que el cliente ajuste sus gastos.

### Reglas de negocio
- **RN-F010-04:** El presupuesto mensual es establecido por el cliente; no tiene valor predeterminado
- **RN-F010-05:** Solo se genera una alerta de presupuesto por período y umbral (sin repeticiones)
