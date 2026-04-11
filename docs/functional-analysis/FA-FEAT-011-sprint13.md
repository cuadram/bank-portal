# Análisis Funcional — FEAT-011: Exportación de Informes Financieros (PDF y Excel)
**Sprint 13 · Estado: DELIVERED**
*[RECONSTRUIDO — evidencia: DashboardExportUseCase.java, PdfReportGenerator.java, ExcelReportGenerator.java, pom.xml US-1107/US-1108 FEAT-011]*

---

## Contexto de negocio

Los clientes necesitan documentación de sus movimientos financieros para gestiones
fiscales, justificaciones de gastos o archivo personal. BankPortal genera informes
descargables en PDF (para imprimir/presentar) y Excel (para análisis), cubriendo
movimientos y el resumen analítico de gastos por período.

---

## FA-011-A — Exportación de Movimientos a PDF

**Módulo:** Dashboard / Exportación
**Actores:** Cliente
**Regulación:** GDPR (derecho de acceso a los propios datos), normativa fiscal

### Descripción funcional
El cliente genera un extracto oficial en PDF de los movimientos de una cuenta para
un período seleccionado. El PDF incluye cabecera con datos del banco y del titular,
tabla de movimientos con fecha, concepto, importe y saldo, y pie con información legal.

### Reglas de negocio
- **RN-F011-01:** El PDF de extracto incluye siempre los datos del titular y el período exacto
- **RN-F011-02:** El extracto PDF puede cubrir hasta 13 meses (normativa EU de acceso a historial)

---

## FA-011-B — Exportación de Movimientos a Excel

**Módulo:** Dashboard / Exportación
**Actores:** Cliente
**Regulación:** GDPR (portabilidad de datos), normativa fiscal

### Descripción funcional
El cliente descarga sus movimientos en formato Excel (.xlsx) para procesarlos con
herramientas de análisis propias. El fichero incluye columnas estructuradas (fecha,
concepto, categoría, importe, saldo) y una hoja resumen por categoría.

### Reglas de negocio
- **RN-F011-03:** El fichero Excel incluye una hoja de movimientos detallados y una hoja de resumen por categoría
- **RN-F011-04:** Los importes en Excel usan formato numérico (no texto) para permitir cálculos directos

---

## FA-011-C — Exportación del Informe Analítico de Gastos

**Módulo:** Dashboard / Exportación
**Actores:** Cliente
**Regulación:** GDPR

### Descripción funcional
El cliente exporta el resumen analítico de gastos del dashboard (categorías, evolución
mensual, comparativa) en PDF o Excel, para un período mensual o trimestral seleccionado.

### Reglas de negocio
- **RN-F011-05:** El informe analítico solo exporta períodos completos (no el mes en curso parcial)
