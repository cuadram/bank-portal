# Runbook Operativo — backend-2fa v1.18.0
## BankPortal · Banco Meridian · FEAT-016 Gestión de Tarjetas

| Campo | Valor |
|---|---|
| Versión | v1.18.0 |
| Sprint | 18 · FEAT-016 |
| Servicio | `backend-2fa` |
| Puerto | 8080 |
| Health liveness | `GET /actuator/health/liveness` |
| Health readiness | `GET /actuator/health/readiness` |
| Métricas | `GET /actuator/prometheus` |
| Autor | SOFIA DevOps Agent |
| Fecha | 2026-03-25 |
| CMMI | CM SP 1.1 · CM SP 2.1 |

---

## 1. Información del servicio

### Dependencias en runtime

| Dependencia | Tipo | Crítica | Descripción |
|---|---|---|---|
| PostgreSQL 15 | BD | ✅ Sí | Tablas: cards, shedlock, audit_log, push_subscriptions |
| Redis 7 | Cache | ✅ Sí | Rate limiting, sesiones OTP, SSE replay |
| Core Banking Mock | HTTP externo | ✅ Sí (para cambio PIN) | `CORE_BANKING_URL` — timeout 3000ms |
| VAPID Push Service | HTTP externo | No | Notificaciones push post-operación |
| SMTP | Email | No | Alertas de seguridad (FEAT-005) |

### Variables de entorno obligatorias

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DB_URL` | JDBC connection string | `jdbc:postgresql://db:5432/bankportal` |
| `DB_USERNAME` | Usuario BD | `bankportal_app` |
| `DB_PASSWORD` | Password BD (secret) | — |
| `JWT_SECRET` | Clave RS256 private key (PEM) | — |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection | `redis` / `6379` |
| `CORE_BANKING_URL` | URL core bancario mock **[NUEVO v1.18.0]** | `http://core-banking:8081` |
| `CORE_BANKING_TIMEOUT_MS` | Timeout core (opcional, default 3000) | `3000` |
| `SHEDLOCK_DEFAULT_LOCK_AT_MOST_FOR` | Override lockAtMostFor (opcional) | `PT10M` |
| `VAPID_PUBLIC_KEY` | Clave pública VAPID | — |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID (secret) | — |
| `PUSH_ENCRYPTION_KEY` | Clave AES-256-GCM push subscriptions | — |

### Novedades v1.18.0 relevantes para operaciones

- **Tabla `cards`** — creada por Flyway V18. Índices en user_id, account_id, status.
- **Tabla `shedlock`** — creada por Flyway V18c. Gestiona lock del scheduler.
- **V18b** eliminó columnas `auth_plain` / `p256dh_plain` de `push_subscriptions` — **irreversible**.
- **`CORE_BANKING_URL`** es nueva variable obligatoria desde esta versión.
- **ShedLock** activo: solo 1 instancia ejecuta `ScheduledTransferExecutorJob` a la vez.

---

## 2. Arranque y parada

### Kubernetes (entorno productivo)

```bash
# Ver estado del deployment
kubectl get deployment backend-2fa -n bankportal
kubectl get pods -l app=backend-2fa -n bankportal

# Restart rolling (sin downtime)
kubectl rollout restart deployment/backend-2fa -n bankportal
kubectl rollout status deployment/backend-2fa -n bankportal --timeout=180s

# Escalar réplicas
kubectl scale deployment/backend-2fa --replicas=3 -n bankportal

# Ver logs en tiempo real
kubectl logs -f -l app=backend-2fa -n bankportal --tail=100

# Ver logs de una réplica específica
kubectl logs -f <pod-name> -n bankportal
```

### Docker Compose (entorno local / STG)

```bash
# Arrancar servicio
docker-compose -f infra/compose/backend-2fa/docker-compose.yml up -d

# Parar servicio
docker-compose -f infra/compose/backend-2fa/docker-compose.yml down

# Ver logs
docker-compose -f infra/compose/backend-2fa/docker-compose.yml logs -f backend-2fa

# Verificar health
docker inspect --format='{{.State.Health.Status}}' backend-2fa
```

---

## 3. Verificación post-deploy

Ejecutar en orden tras cada despliegue:

```bash
BASE_URL="https://api.bankportal.meridian.com"   # PROD
# BASE_URL="http://backend-2fa.bankportal-stg.svc"  # STG

# 1. Liveness
curl -f ${BASE_URL}/actuator/health/liveness
# Esperado: {"status":"UP"}

# 2. Readiness (DB + Redis conectados)
curl -f ${BASE_URL}/actuator/health/readiness
# Esperado: {"status":"UP","components":{"db":{"status":"UP"},"redis":{"status":"UP"}}}

# 3. Smoke test tarjetas [NUEVO v1.18.0]
TOKEN="<jwt-de-usuario-test>"
curl -s -H "Authorization: Bearer $TOKEN" ${BASE_URL}/api/v1/cards
# Esperado: 200 [] o array de tarjetas

# 4. Verificar tabla shedlock activa (STG/PROD via psql)
psql -U bankportal_app -d bankportal -c "SELECT name, lock_until FROM shedlock;"
# Esperado: fila 'scheduledTransferJob' con lock_until en el pasado (no bloqueado)

# 5. Verificar que columnas plain ya no existen [v1.18.0]
psql -U bankportal_app -d bankportal \
  -c "\d push_subscriptions" | grep -E "auth_plain|p256dh_plain"
# Esperado: sin output (columnas eliminadas por V18b)
```

---

## 4. Procedimiento de rollback

### Rollback estándar (Kubernetes rolling)

```bash
# Ver historial de rollouts
kubectl rollout history deployment/backend-2fa -n bankportal

# Rollback a revisión anterior
kubectl rollout undo deployment/backend-2fa -n bankportal

# Rollback a revisión específica
kubectl rollout undo deployment/backend-2fa -n bankportal --to-revision=<N>

# Verificar rollback
kubectl rollout status deployment/backend-2fa -n bankportal
curl -f https://api.bankportal.meridian.com/actuator/health/readiness
```

### ⚠️ Rollback crítico con V18b (DROP COLUMN)

**V18b eliminó `auth_plain` y `p256dh_plain` de forma irreversible.** Si el rollback requiere volver a una versión < v1.18.0 que necesite esas columnas:

```bash
# 1. DETENER el servicio inmediatamente
kubectl scale deployment/backend-2fa --replicas=0 -n bankportal

# 2. Notificar al DBA de guardia (SLA: 15 minutos)
#    Necesario: restaurar BD desde backup previo al deploy de v1.18.0

# 3. Una vez restaurada la BD, desplegar imagen anterior
kubectl set image deployment/backend-2fa \
  backend-2fa=${REGISTRY}/backend-2fa:v1.17.0 \
  -n bankportal

# 4. Escalar de nuevo
kubectl scale deployment/backend-2fa --replicas=2 -n bankportal
kubectl rollout status deployment/backend-2fa -n bankportal

# 5. Verificar health
curl -f https://api.bankportal.meridian.com/actuator/health/readiness
```

**Notificar obligatoriamente tras rollback:**
- PM del proyecto
- Tech Lead
- Cliente (Banco Meridian — contacto técnico)
- Completar plantilla de post-mortem en `docs/postmortem/`

---

## 5. Alertas y respuesta operativa

| Alerta | Causa probable | Acción inmediata | SLA |
|---|---|---|---|
| `Health liveness FAIL` | JVM caída o OOM | `kubectl rollout restart` → si persiste, rollback | 5 min |
| `Health readiness FAIL` | BD o Redis no disponible | Verificar conectividad BD/Redis → escalar si es carga | 10 min |
| `cards API 500` | Error en use-case o BD | Ver logs → verificar V18 aplicada → alertar Tech Lead | 15 min |
| `POST /block 500 masivo` | OtpValidationService caído o Redis | Verificar Redis → reiniciar si necesario | 10 min |
| `Core banking timeout` | `CORE_BANKING_URL` inaccesible | Verificar URL configurada → alertar equipo core | 10 min |
| `ShedLock bloqueado > 15min` | Instancia murió con lock activo | `UPDATE shedlock SET lock_until=NOW() WHERE name='scheduledTransferJob'` | 5 min |
| `Alta latencia > 500ms p95` | Carga inesperada o query lenta | Revisar métricas Prometheus → escalar réplicas | 15 min |
| `CVE Critical en imagen` | Dependencia vulnerable | Pipeline hotfix inmediato | 2h |
| `audit_log sin escritura` | AuditLogService caído | Ver logs error → reiniciar → alertar Tech Lead | 10 min |

---

## 6. Diagnóstico de incidencias frecuentes

### ShedLock bloqueado indefinidamente

```sql
-- Verificar estado del lock
SELECT name, lock_until, locked_at, locked_by
FROM shedlock
WHERE name = 'scheduledTransferJob';

-- Si lock_until < NOW() pero el job no arranca, limpiar manualmente
UPDATE shedlock
SET lock_until = NOW() - INTERVAL '1 second'
WHERE name = 'scheduledTransferJob';
```

### Tarjetas no aparecen en GET /api/v1/cards

```sql
-- Verificar que existen tarjetas para el usuario
SELECT id, pan_masked, status, user_id
FROM cards
WHERE user_id = '<user-uuid>';

-- Verificar que V18 se aplicó
SELECT version FROM flyway_schema_history
WHERE script LIKE '%V18%'
ORDER BY installed_on;
```

### POST /cards/{id}/pin devuelve 503

```bash
# Verificar que CORE_BANKING_URL está configurado
kubectl get deployment backend-2fa -n bankportal -o jsonpath='{.spec.template.spec.containers[0].env}' \
  | python3 -m json.tool | grep CORE_BANKING_URL

# Test de conectividad al core
kubectl exec -it <pod-name> -n bankportal -- \
  wget -qO- ${CORE_BANKING_URL}/health || echo "Core banking no accesible"
```

### Push subscriptions: usuario sin slots disponibles

```sql
-- Ver suscripciones del usuario
SELECT id, endpoint, created_at
FROM push_subscriptions
WHERE user_id = '<user-uuid>'
ORDER BY created_at DESC;

-- Limpiar suscripciones antiguas si > 5 (lock optimista ya previene, pero para diagnosticar)
SELECT COUNT(*) FROM push_subscriptions WHERE user_id = '<user-uuid>';
```

---

## 7. Comandos útiles

```bash
# Ver todas las migraciones aplicadas
psql -U bankportal_app -d bankportal \
  -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_on DESC LIMIT 10;"

# Ver métricas Prometheus del servicio (desde dentro del cluster)
curl http://backend-2fa.bankportal.svc:8080/actuator/prometheus \
  | grep -E "http_server_requests|jvm_memory|hikaricp"

# Ver últimas operaciones de tarjeta en audit_log
psql -U bankportal_app -d bankportal \
  -c "SELECT event_type, user_id, created_at FROM audit_log WHERE event_type LIKE 'CARD_%' ORDER BY created_at DESC LIMIT 20;"

# Comprobar que PAN no aparece en ningún log del pod
kubectl logs <pod-name> -n bankportal | grep -i "pan\|pan_masked" | head -5
# Esperado: sin líneas con datos de PAN en claro

# Ver locks activos de ShedLock
psql -U bankportal_app -d bankportal \
  -c "SELECT name, lock_until > NOW() as is_locked, locked_by FROM shedlock;"
```

---

## 8. Contactos de guardia

| Rol | Responsabilidad | Canal |
|---|---|---|
| Tech Lead | Decisiones de código y arquitectura | Teams — canal #bankportal-tech |
| DevOps / SRE | Infraestructura, deploy, rollback | Teams — canal #bankportal-ops |
| DBA de guardia | BD — emergencias Flyway / rollback | Teams — canal #bankportal-db |
| PM | Comunicación con cliente | Email directo |
| Security | Incidentes PCI-DSS / CVE | Teams — canal #security |

---

*Generado por SOFIA DevOps Agent — Sprint 18 — 2026-03-25*
*CMMI Level 3 — CM SP 1.1 · CM SP 2.1*
*BankPortal — Banco Meridian*
