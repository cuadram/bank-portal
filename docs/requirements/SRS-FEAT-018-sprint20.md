# SRS — Software Requirements Specification
## FEAT-018: Exportación de Movimientos Bancarios
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **SOFIA Step:** 2 — Requirements Analyst  
**Versión:** 1.0 | **Fecha:** 2026-03-30  
**Estado:** BASELINE aprobado tras Gate G-1  

---

## 1. Propósito y alcance

### 1.1 Propósito
Especificar los requisitos funcionales y no funcionales para la funcionalidad de exportación de movimientos bancarios en formato PDF y CSV, incluyendo filtrado multicriteria y auditoría de acceso conforme a PSD2 Art.47 y GDPR Art.15.

### 1.2 Alcance
- **Incluido:** Exportación PDF, exportación CSV, filtros de movimientos, audit log de exportaciones.
- **Excluido:** Módulos de ingesta de movimientos, notificaciones push, integración con CoreBanking (ya implementada en S17-S19).
- **Deuda técnica asociada (mismo sprint):** DEBT-032, DEBT-033, DEBT-034, DEBT-035 — ver SRS-DEBT-S20.

### 1.3 Stakeholders
| Rol | Interés |
|---|---|
| Usuario final (titular cuenta) | Acceso a historial de movimientos exportable |
| Departamento de Compliance | Trazabilidad GDPR Art.15 y PSD2 Art.47 |
| Equipo de Seguridad | No exposición de PAN completo (PCI-DSS) |
| Administrador Banco Meridian | Audit log de accesos a datos personales |

---

## 2. Requisitos funcionales

### RF-018-01: Exportación de movimientos en PDF
**Prioridad:** ALTA | **Historia:** SCRUM-98 (3 SP)

| ID | Requisito |
|---|---|
| RF-018-01.1 | El sistema generará un documento PDF con los movimientos de la cuenta seleccionada en el rango de fechas especificado |
| RF-018-01.2 | El PDF incluirá cabecera corporativa: logo Banco Meridian, nombre del titular, IBAN, rango de fechas del extracto, fecha de generación |
| RF-018-01.3 | Cada fila contendrá: fecha valor, fecha contable, concepto, importe (EUR), saldo tras operación |
| RF-018-01.4 | El número de tarjeta se mostrará enmascarado: solo últimos 4 dígitos visibles (PCI-DSS) |
| RF-018-01.5 | El PDF se generará en tiempo < 3 segundos para hasta 500 registros |
| RF-018-01.6 | El historial máximo exportable será de 12 meses desde la fecha actual (PSD2 Art.47 §2) |
| RF-018-01.7 | Se incluirá hash SHA-256 del contenido en el pie de página como huella de integridad |
| RF-018-01.8 | Librería: Apache PDFBox 3.x (licencia Apache 2.0 — CONFIRMAR día 1 según R-020-01) |

### RF-018-02: Exportación de movimientos en CSV
**Prioridad:** ALTA | **Historia:** SCRUM-99 (2 SP)

| ID | Requisito |
|---|---|
| RF-018-02.1 | El sistema generará un archivo CSV con encoding UTF-8 BOM para compatibilidad con Microsoft Excel en español |
| RF-018-02.2 | Separador de campos: punto y coma (`;`) — estándar europeo |
| RF-018-02.3 | Columnas: `fecha_valor;fecha_contable;concepto;importe;divisa;saldo;tipo_movimiento;iban_cuenta` |
| RF-018-02.4 | El importe usará coma decimal (`,`) — formato europeo. Ej: `−125,50` |
| RF-018-02.5 | El PAN no se incluirá en el CSV. Tarjetas referenciadas por alias o últimos 4 dígitos |
| RF-018-02.6 | Primera fila: cabecera con nombres de columna |
| RF-018-02.7 | Nombre del archivo: `movimientos_{IBAN_last8}_{YYYY-MM-DD}.csv` |

### RF-018-03: Filtrado multicriteria previo a exportación
**Prioridad:** ALTA | **Historia:** SCRUM-100 (2 SP)

| ID | Requisito |
|---|---|
| RF-018-03.1 | El usuario podrá filtrar por: tipo de movimiento, rango de fechas (inicio/fin), cuenta/IBAN |
| RF-018-03.2 | Tipos de movimiento disponibles: TODOS, TRANSFERENCIA_EMITIDA, TRANSFERENCIA_RECIBIDA, DOMICILIACION, PAGO_TARJETA, INGRESO, COMISION |
| RF-018-03.3 | Antes de confirmar la exportación, el sistema mostrará el número de registros que se exportarán (preview count) |
| RF-018-03.4 | Si el número de registros supera 500, se mostrará mensaje informativo y se ofrecerá reducir el rango |
| RF-018-03.5 | Los filtros se mantienen durante la sesión del usuario (no persistidos entre sesiones) |
| RF-018-03.6 | Fecha mínima seleccionable: 12 meses atrás desde hoy |

### RF-018-04: Audit log de exportaciones
**Prioridad:** ALTA | **Historia:** SCRUM-101 (1 SP)

| ID | Requisito |
|---|---|
| RF-018-04.1 | Cada exportación generará una entrada en la tabla `export_audit_log` de forma asíncrona |
| RF-018-04.2 | Campos auditados: `id`, `user_id`, `timestamp_utc`, `iban`, `fecha_desde`, `fecha_hasta`, `tipo_movimiento`, `formato` (PDF/CSV), `num_registros`, `ip_origen`, `user_agent` |
| RF-018-04.3 | El fallo en el audit log NO bloqueará la exportación (async fire-and-forget con retry 3x) |
| RF-018-04.4 | Retención del audit log: 7 años (GDPR Art.17 §3.b) |
| RF-018-04.5 | El panel de administración mostrará el audit log con búsqueda por usuario y rango de fechas |

---

## 3. Requisitos no funcionales

| ID | Categoría | Requisito |
|---|---|---|
| RNF-018-01 | Rendimiento | PDF generado en < 3s para ≤ 500 registros (p95) |
| RNF-018-02 | Rendimiento | CSV generado en < 1s para ≤ 500 registros (p95) |
| RNF-018-03 | Seguridad | PAN enmascarado en todos los formatos de exportación (PCI-DSS Req.3) |
| RNF-018-04 | Privacidad | Hash SHA-256 en PDF garantiza integridad y no repudio |
| RNF-018-05 | Escalabilidad | Generación asíncrona para requests > 200 registros si tiempo estimado > 1s |
| RNF-018-06 | Accesibilidad | Botón de exportación con `aria-label` descriptivo (WCAG 2.1 AA) |
| RNF-018-07 | Disponibilidad | Funcionalidad disponible 99.5% del tiempo (same SLA BankPortal) |
| RNF-018-08 | Auditoría | Registro de cada exportación en < 500ms (async) |

---

## 4. Restricciones regulatorias

| Regulación | Artículo | Requisito |
|---|---|---|
| PSD2 | Art.47 | Los PSP deben poner a disposición del usuario información sobre operaciones de pago — historial 12 meses |
| GDPR | Art.15 | Derecho de acceso: el interesado tiene derecho a obtener copia de sus datos personales |
| GDPR | Art.17 §3.b | Retención mínima de log de acceso a datos: según obligación legal |
| PCI-DSS | Req.3.4 | El PAN debe enmascararse cuando se muestre — solo últimos 4 dígitos visibles |
| PCI-DSS | Req.10 | Registro y monitorización de todos los accesos a datos del titular de tarjeta |

---

## 5. Modelo de datos — nuevas entidades

### 5.1 Tabla `export_audit_log` (nueva — Flyway V21)
```sql
CREATE TABLE export_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    timestamp_utc   TIMESTAMPTZ NOT NULL DEFAULT now(),
    iban            VARCHAR(34) NOT NULL,
    fecha_desde     DATE NOT NULL,
    fecha_hasta     DATE NOT NULL,
    tipo_movimiento VARCHAR(50) NOT NULL DEFAULT 'TODOS',
    formato         VARCHAR(10) NOT NULL CHECK (formato IN ('PDF','CSV')),
    num_registros   INT NOT NULL,
    ip_origen       INET,
    user_agent      VARCHAR(500),
    hash_sha256     VARCHAR(64),   -- solo para PDF
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_export_audit_user_date ON export_audit_log(user_id, timestamp_utc DESC);
```

---

## 6. Interfaces externas

### 6.1 Nuevos endpoints API (OpenAPI v1 — extensión)
| Método | Path | Descripción |
|---|---|---|
| `POST` | `/api/v1/accounts/{accountId}/exports/pdf` | Genera y descarga PDF de movimientos |
| `POST` | `/api/v1/accounts/{accountId}/exports/csv` | Genera y descarga CSV de movimientos |
| `GET`  | `/api/v1/accounts/{accountId}/exports/preview` | Retorna count de registros según filtros |
| `GET`  | `/api/v1/admin/exports/audit-log` | Lista audit log (rol ADMIN) |

### 6.2 Request body (PDF/CSV)
```json
{
  "fechaDesde": "2026-01-01",
  "fechaHasta": "2026-03-30",
  "tipoMovimiento": "TODOS",
  "formato": "PDF"
}
```

---

## 7. Criterios de aceptación consolidados (DoD FEAT-018)

| # | Criterio |
|---|---|
| CA-01 | PDF descargable con cabecera Banco Meridian, hash SHA-256 visible en pie |
| CA-02 | CSV con UTF-8 BOM, separador `;`, coma decimal, sin PAN completo |
| CA-03 | Preview count correcto antes de exportar |
| CA-04 | Error informativo si > 500 registros |
| CA-05 | Audit log persistido en BD para cada export |
| CA-06 | PAN enmascarado en ambos formatos (validado con PCI-DSS checklist) |
| CA-07 | Rendimiento: PDF < 3s, CSV < 1s en p95 con 500 registros |
| CA-08 | Tests unitarios + IT con cobertura > 85% en clases nuevas |
| CA-09 | Smoke test actualizado con endpoint `/exports/preview` |

---

## 8. Deuda técnica — Requisitos DEBT-032..035

### DEBT-032 — Lambda Refactor
- **Aceptación:** 0 cambios de comportamiento · cobertura > 85% en clases extraídas · stack traces legibles en logs

### DEBT-033 — Angular AuthService Split
- **Aceptación:** `ng build --configuration=production` sin circular deps · tests E2E inalterados · `AuthService` deprecado con migration guide

### DEBT-034 — DebitProcessorStrategy
- **Aceptación:** Interface `DebitProcessingStrategy` implementada · Factory con lookup por tipo · extensible sin modificar Factory (OCP) · 0 regresiones S19

### DEBT-035 — CoreBanking Webhook RETURNED
- **Aceptación:** Mandato actualizado a RETURNED < 2s · push notification con R-code legible · R-codes R01..R10 soportados · audit trail persistido

---

*Generado por SOFIA v2.3 · Step 2 Requirements Analyst · Sprint 20 · 2026-03-30*  
*Aprobación pendiente: Gate G-2 (Product Owner)*
