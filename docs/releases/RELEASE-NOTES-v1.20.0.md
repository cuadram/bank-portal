# Release Notes — v1.20.0
**Proyecto:** BankPortal — Banco Meridian  
**Sprint:** 20 | **Fecha:** 2026-03-30  
**Rama:** `sprint/20` → `main`  
**Tag:** `v1.20.0`  

---

## 🚀 Novedades

### FEAT-018 — Exportación de Movimientos Bancarios (PDF/CSV)

Los usuarios de BankPortal ya pueden exportar su historial de movimientos bancarios en formato PDF y CSV directamente desde la vista de movimientos.

**Funcionalidades incluidas:**
- **Extracto PDF oficial** con cabecera Banco Meridian, hash SHA-256 de integridad y PAN enmascarado (PCI-DSS)
- **Exportación CSV** en formato europeo (UTF-8 BOM, separador `;`, coma decimal) compatible con Excel
- **Filtrado multicriteria** por tipo de movimiento, rango de fechas y cuenta antes de exportar, con contador previo de registros
- **Audit log GDPR/PCI-DSS** de todas las exportaciones con retención 7 años

**Regulación:** PSD2 Art.47 · GDPR Art.15/17 · PCI-DSS Req.3.4/10  
**Jira:** SCRUM-98, SCRUM-99, SCRUM-100, SCRUM-101

---

## 🔧 Deuda técnica resuelta

### DEBT-032 — Lambda Refactor
Lambdas anónimas complejas en `TransactionService`, `DirectDebitService` y `ScheduledTransferService` refactorizadas a clases con nombre. Mejora trazabilidad en stack traces de producción.  
**Jira:** SCRUM-102

### DEBT-033 — Angular AuthService Split
`AuthService` monolítico (380 líneas) dividido en `TokenService`, `SessionService` y `AuthGuard`. Eliminadas dependencias circulares detectadas en S18.  
**Jira:** SCRUM-103

### DEBT-034 — DebitProcessorStrategy
Implementado patrón Strategy en el procesamiento de domiciliaciones SEPA. Tres estrategias: `SEPACoreDebitStrategy`, `SEPACORDebitStrategy`, `RecurringDebitStrategy`. Extensible sin modificar código existente (OCP).  
**Jira:** SCRUM-104

### DEBT-035 — CoreBanking Webhook RETURNED
Handler completo para el estado RETURNED de CoreBanking. R-codes R01–R10 soportados. Notificación push al usuario con descripción legible del motivo de devolución SEPA.  
**Jira:** SCRUM-105

---

## 🔒 Seguridad

- **DEBT-038 resuelto:** Validación explícita `accountId ↔ userId` JWT en `ExportService`. HTTP 403 para acceso a cuenta ajena.
- **PCI-DSS Req.3.4:** PAN enmascarado en PDF y ausente en CSV — verificado en QA.
- Sin CVE nuevos. Semáforo de seguridad: 🟢 GREEN.

---

## 🗄️ Base de datos

### Migraciones Flyway
| Versión | Archivo | Descripción |
|---|---|---|
| V21 | `V21__export_audit_log.sql` | Nueva tabla `export_audit_log` (GDPR/PCI-DSS) |

### Cambios de esquema
```sql
-- Nueva tabla
export_audit_log (
    id, user_id, timestamp_utc, iban,
    fecha_desde, fecha_hasta, tipo_movimiento,
    formato, num_registros, ip_origen,
    user_agent, hash_sha256, created_at
)
```
**Rollback:** `DROP TABLE export_audit_log;` — sin impacto en tablas existentes.

---

## 📦 Dependencias nuevas

| Librería | Versión | Módulo | Licencia |
|---|---|---|---|
| `pdfbox` | 3.0.2 | backend-2fa | Apache 2.0 |

---

## ⚙️ Variables de entorno

Sin variables de entorno nuevas en v1.20.0.

---

## 🔄 Breaking changes

**Ninguno.** Todos los endpoints existentes son compatibles con versiones anteriores.

---

## 📊 Métricas del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 24 / 24 (100%) |
| Tests totales acumulados | 524 |
| Cobertura | 88% (+1% vs S19) |
| Defectos en producción | 0 |
| NCS | 0 |
| SP acumulados proyecto | 473 |

---

## 📋 Checklist de despliegue

- [ ] `docker compose pull && docker compose up -d --build`
- [ ] Verificar Flyway V21 ejecutado: `SELECT * FROM flyway_schema_history WHERE version='21'`
- [ ] Smoke test: `bash infra/compose/smoke-test-v1.20.sh`
- [ ] Verificar `export_audit_log` tabla creada: `\dt export_audit_log`
- [ ] Confirmar JPA-REAL activo en STG (LA-019-08)

---

*Generado por SOFIA v2.3 · DevOps Agent · Step 7 · Sprint 20 · 2026-03-30*
