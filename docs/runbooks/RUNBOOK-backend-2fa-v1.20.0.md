# Runbook — BankPortal backend-2fa v1.20.0
**Sprint:** 20 | **Release:** v1.20.0 | **Fecha:** 2026-03-30  
**SOFIA Step:** 7 — DevOps Agent  

---

## 1. Información del release

| Campo | Valor |
|---|---|
| Imagen Docker | `backend-2fa:v1.20.0` |
| Tag Git | `v1.20.0` |
| Rama origen | `sprint/20` |
| Flyway migrations | V21 |
| Breaking changes | Ninguno |
| Rollback safe | ✅ Sí |

---

## 2. Pre-despliegue — Checklist obligatorio

```bash
# 1. Verificar rama correcta
git checkout main && git pull origin main
git log --oneline -3

# 2. Verificar tag
git tag | grep v1.20.0

# 3. Backup BD (producción)
pg_dump -U bankportal bankportal_db > backup_pre_v1.20.0_$(date +%Y%m%d_%H%M).sql

# 4. Verificar espacio en disco (PDFBox añade ~5MB)
df -h /var/lib/docker
```

---

## 3. Despliegue

```bash
# Pull nueva imagen
docker compose pull backend-2fa

# Build y arranque
docker compose up -d --build --no-deps backend-2fa

# Verificar arranque
docker compose ps
docker compose logs backend-2fa --tail=50 | grep -E "Started|ERROR|Flyway"
```

### Verificación Flyway V21

```bash
# Confirmar migración ejecutada
docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "SELECT version, description, success FROM flyway_schema_history WHERE version='21';"
# Esperado: version=21, success=t

# Confirmar tabla creada
docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "\d export_audit_log"
```

### Verificación JPA-REAL (LA-019-08)

```bash
# Confirmar adaptador real activo — NO debe aparecer MockAccountRepositoryAdapter
docker compose logs backend-2fa | grep -i "mock\|jpa\|primary"
# Esperado: JpaAccountRepositoryAdapter registrado como @Primary
```

---

## 4. Smoke test v1.20.0

```bash
# Ejecutar smoke test actualizado (incluye endpoints /exports)
bash infra/compose/smoke-test-v1.20.sh

# Endpoints nuevos verificados en smoke test:
# GET  /api/v1/accounts/{id}/exports/preview  → 200
# POST /api/v1/accounts/{id}/exports/pdf      → 200 + PDF bytes
# POST /api/v1/accounts/{id}/exports/csv      → 200 + CSV bytes
# POST /api/v1/accounts/{id}/exports/pdf (sin JWT) → 401
# POST /api/v1/accounts/{id}/exports/pdf (cuenta ajena) → 403
```

---

## 5. Verificaciones funcionales post-despliegue

```bash
# Test export PDF básico (requiere token válido)
TOKEN="Bearer <JWT>"
ACCOUNT_ID="<uuid-cuenta>"

curl -s -X POST \
  "http://localhost:8080/api/v1/accounts/${ACCOUNT_ID}/exports/pdf" \
  -H "Authorization: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fechaDesde":"2026-01-01","fechaHasta":"2026-03-30"}' \
  --output /tmp/test_export.pdf

# Verificar PDF generado
file /tmp/test_export.pdf
# Esperado: PDF document

# Test preview
curl -s "http://localhost:8080/api/v1/accounts/${ACCOUNT_ID}/exports/preview\
?fechaDesde=2026-01-01&fechaHasta=2026-03-30" \
  -H "Authorization: ${TOKEN}"
# Esperado: {"count": N, "exceedsLimit": false, "limitMaxRecords": 500}

# Verificar audit log
docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "SELECT id, formato, num_registros, timestamp_utc FROM export_audit_log ORDER BY created_at DESC LIMIT 5;"
```

---

## 6. Rollback

```bash
# Si se detectan problemas críticos post-despliegue:

# 1. Volver a imagen anterior
docker compose stop backend-2fa
docker tag backend-2fa:v1.19.0 backend-2fa:rollback
docker compose up -d --no-deps backend-2fa

# 2. Rollback Flyway (solo si necesario — V21 es additive, no destructiva)
docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "DROP TABLE IF EXISTS export_audit_log;"
docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "DELETE FROM flyway_schema_history WHERE version='21';"

# 3. Verificar estado
docker compose ps && docker compose logs backend-2fa --tail=20
```

---

## 7. Monitoring post-release (primeras 2h)

```bash
# Errores en exportación
docker compose logs backend-2fa -f | grep -E "ExportLimit|ExportRange|AccessDenied|ERROR"

# Audit log creciendo (señal de uso real)
watch -n 30 'docker compose exec postgres psql -U bankportal -d bankportal_db \
  -c "SELECT COUNT(*) FROM export_audit_log WHERE timestamp_utc > now() - interval '\''1 hour'\'';"'

# Latencia PDF (alerta si > 3s)
docker compose logs backend-2fa | grep "Export PDF generado" | tail -20
```

---

## 8. Contactos de escalado

| Incidencia | Contacto |
|---|---|
| Error Flyway V21 | Tech Lead |
| PDF generation failure | Backend Dev |
| Audit log not persisting | Backend Dev + DBA |
| HTTP 403 inesperado | Security Team |

---

*Generado por SOFIA v2.3 · DevOps Agent · Step 7 · Sprint 20 · 2026-03-30*
