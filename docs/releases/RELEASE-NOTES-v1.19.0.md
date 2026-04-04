# Release Notes — v1.19.0

**BankPortal · Banco Meridian · Sprint 19 · FEAT-017**

| Campo | Valor |
|---|---|
| Versión | v1.19.0 |
| Sprint | 19 |
| Feature | FEAT-017 Domiciliaciones y Recibos SEPA Direct Debit |
| Fecha release | 2026-05-22 |
| Preparado | DevOps Agent — SOFIA v2.2 |
| Estado QA | LISTO PARA RELEASE |

---

## Nuevas funcionalidades

### FEAT-017 — Domiciliaciones y Recibos SEPA Direct Debit

Los clientes de Banco Meridian pueden gestionar sus domiciliaciones bancarias directamente desde el portal digital:

- **Consulta de mandatos activos y cancelados** con historial de recibos paginado
- **Alta de nueva domiciliación** con validación IBAN (ISO 13616 · 34 países SEPA) + OTP 2FA
- **Cancelación de mandato** con protección PSD2 Art.80 D-2 (bloqueo si cobro en 2 días hábiles)
- **Notificaciones push** en cobro (DEBIT_CHARGED), devolución (DEBIT_RETURNED) y rechazo (DEBIT_REJECTED)
- **Módulo Angular** lazy-loaded `/direct-debits` con wizard de alta, historial exportable

**Normativa:** SEPA DD Core Rulebook v3.4 · PSD2 Art.77/80 · RGPD Art.6.1.b

---

## Deuda técnica resuelta

### DEBT-031 — Rate limiting /cards/{id}/pin (CVSS 4.2 · PCI-DSS 4.0 req.8)
- Bucket4j: máx 3 intentos/hora por cardId+userId
- 429 Too Many Requests al superar el límite
- Audit log PIN_RATE_LIMIT_EXCEEDED

---

## Cambios de base de datos

| Migración | Descripción | Reversible |
|---|---|---|
| V19__direct_debits.sql | Tablas debit_mandates + direct_debits + índices | Sí (DROP TABLE) |

**Nuevas tablas:** `debit_mandates`, `direct_debits`
**Nuevos tipos ENUM:** `mandate_type`, `mandate_status`, `debit_status`

---

## Nuevas variables de entorno

No se requieren nuevas variables de entorno en v1.19.0.
El módulo de domiciliaciones reutiliza las variables existentes de CoreBanking y NotificationService.

---

## Breaking changes

**Ninguno.** Extensión aditiva — sin cambios en contratos existentes.

---

## Instrucciones de despliegue

```bash
# 1. Build imagen
docker compose build --no-cache backend-2fa

# 2. Deploy STG
docker compose up -d backend-2fa

# 3. Verificar Flyway V19
docker logs bankportal-backend 2>&1 | grep -E 'V19|Flyway'
# Esperado: Successfully applied 1 migration to schema 'public' (V19__direct_debits)

# 4. Verificar endpoints
curl -H 'Authorization: Bearer {token}' https://stg.bankportal.bancomeridia.es/api/v1/direct-debits/mandates
# Esperado: 200 OK {content: [], totalElements: 0}

# 5. Build frontend
docker compose build --no-cache frontend-portal
docker compose up -d frontend-portal

# 6. Verificar lazy module
# Navegar a /direct-debits → Módulo carga < 3s
```

---

## Rollback

```bash
# Rollback a v1.18.0
docker compose down backend-2fa
docker compose up -d --scale backend-2fa=0
# Ejecutar V19__rollback.sql (DROP TABLE direct_debits; DROP TABLE debit_mandates; DROP TYPE ...)
docker image tag backend-2fa:v1.18.0 backend-2fa:latest
docker compose up -d backend-2fa
```

**Nota:** V19 es reversible. No hay DROP COLUMN ni operaciones irreversibles (a diferencia de V18b).

---

*DevOps Agent · CMMI CM SP 1.1 2.2 · SOFIA v2.2 · BankPortal — Banco Meridian · Sprint 19*