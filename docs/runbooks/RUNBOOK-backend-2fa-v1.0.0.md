# Runbook — backend-2fa — v1.0.0

## Información del servicio

| Campo | Valor |
|---|---|
| **Servicio** | `backend-2fa` |
| **Versión** | v1.0.0 |
| **Puerto** | 8081 |
| **Health Liveness** | `GET /actuator/health/liveness` |
| **Health Readiness** | `GET /actuator/health/readiness` |
| **Métricas** | `GET /actuator/prometheus` |
| **Namespace K8s (PROD)** | `bankportal` |
| **Namespace K8s (STG)** | `bankportal-stg` |
| **Namespace K8s (DEV)** | `bankportal-dev` |
| **Réplicas PROD** | 2 (HPA: 2-8) |
| **Imagen** | `registry.experis.com/bankportal/backend-2fa:v1.0.0` |
| **Feature** | FEAT-001 — 2FA TOTP |
| **Propietario** | Equipo SOFIA — Experis |

**Dependencias:**
- PostgreSQL 16 — tabla `users`, `totp_secrets`, `recovery_codes`, `audit_log`
- Módulo JWT (servicio externo) — emisión de JWT parcial (scope=2fa-pending)
- Kubernetes Secret `backend-2fa-secrets` — variables de entorno sensibles

---

## Comandos de operación

### Estado del servicio

```bash
# Ver estado del deployment
kubectl get deployment backend-2fa -n bankportal

# Ver réplicas y estado
kubectl get pods -l app=backend-2fa -n bankportal

# Health check externo PROD
curl -sf https://api.bankportal.meridian.com/actuator/health/readiness | jq .

# Health check interno (desde dentro del cluster)
kubectl exec -n bankportal deploy/backend-2fa -- \
  wget -qO- http://localhost:8081/actuator/health | jq .
```

### Logs

```bash
# Logs en tiempo real (todos los pods)
kubectl logs -f -l app=backend-2fa -n bankportal

# Logs últimas 2h
kubectl logs -l app=backend-2fa -n bankportal \
  --since=2h --prefix=true

# Logs de un pod específico
kubectl logs -f <pod-name> -n bankportal

# Buscar errores en logs
kubectl logs -l app=backend-2fa -n bankportal --since=1h \
  | grep -E '"level":"ERROR"'

# Buscar eventos de auditoría 2FA
kubectl logs -l app=backend-2fa -n bankportal --since=1h \
  | grep '"TWO_FA_'
```

### Arranque y parada

```bash
# Restart rolling (zero downtime)
kubectl rollout restart deployment/backend-2fa -n bankportal
kubectl rollout status deployment/backend-2fa -n bankportal

# Escalar manualmente (si HPA no responde a tiempo)
kubectl scale deployment backend-2fa --replicas=4 -n bankportal

# Pausar el rollout (en caso de incidente durante deploy)
kubectl rollout pause deployment/backend-2fa -n bankportal

# Reanudar el rollout
kubectl rollout resume deployment/backend-2fa -n bankportal
```

### Rollback

```bash
# Rollback a versión anterior inmediato
kubectl rollout undo deployment/backend-2fa -n bankportal

# Rollback a versión específica
kubectl rollout history deployment/backend-2fa -n bankportal
kubectl rollout undo deployment/backend-2fa --to-revision=<N> -n bankportal

# Verificar post-rollback
kubectl rollout status deployment/backend-2fa -n bankportal
curl -sf https://api.bankportal.meridian.com/actuator/health/readiness
```

### Docker Compose (entorno local/DEV sin Kubernetes)

```bash
# Levantar stack completo
cd infra/compose
cp .env.example .env          # rellenar valores
docker-compose up -d

# Verificar
docker-compose ps
docker-compose logs -f backend-2fa

# Parar
docker-compose down

# Parar y eliminar volúmenes (reset completo BD)
docker-compose down -v
```

---

## Alertas y respuesta

| Alerta | Causa probable | Acción inmediata |
|---|---|---|
| `Liveness probe failed` | Servicio caído, OOM kill, deadlock | `kubectl describe pod <pod>` → ver eventos. Si OOM: aumentar límite memory en deployment |
| `Readiness probe failed` | BD no disponible, Flyway fallando | Ver logs de arranque. Verificar conexión a PostgreSQL |
| `HTTP 5xx > 1%` | Error en código o BD saturada | Ver logs `level=ERROR`. Escalar réplicas. Rollback si persiste |
| `HTTP 429 > threshold` | Ataque de brute-force o DDoS en /verify | Revisar logs de auditoría. Considerar bloqueo por IP en ingress |
| `Latencia p95 > 200ms` | BD lenta o carga alta | Ver métricas Prometheus. Revisar queries lentas en PostgreSQL |
| `TOTP decryption error` | Rotación de TOTP_ENCRYPTION_KEY sin re-cifrado | No rotar la clave sin proceso de re-cifrado. Contactar Tech Lead |
| `Flyway migration failed` | Script SQL con error en arranque | Ver logs de arranque. Corregir migración y redeploy |
| `CVE Critical en imagen` | Dependencia vulnerable | Pipeline de hotfix inmediato — no esperar al próximo sprint |

---

## Gestión de secrets en producción

```bash
# Ver keys del Secret (sin valores)
kubectl get secret backend-2fa-secrets -n bankportal -o jsonpath='{.data}' | jq 'keys'

# Rotar TOTP_ENCRYPTION_KEY (proceso controlado)
# ⚠️ REQUIERE re-cifrado de todos los secretos TOTP existentes en BD
# Contactar al Tech Lead antes de ejecutar — proceso documentado en ADR-002

# Actualizar JWT secrets (sin impacto en sesiones actuales si se solapan ventanas)
kubectl patch secret backend-2fa-secrets -n bankportal \
  --type=json \
  -p='[{"op": "replace", "path": "/data/JWT_FULL_SECRET", "value": "<base64-nuevo>"}]'
kubectl rollout restart deployment/backend-2fa -n bankportal
```

---

## Diagnóstico de problemas frecuentes

### 2FA_ACCOUNT_LOCKED inesperado

```bash
# Verificar eventos de bloqueo para un usuario
kubectl exec -n bankportal deploy/backend-2fa -- \
  wget -qO- "http://localhost:8081/actuator/metrics/rate.limit.blocks" | jq .

# Consultar audit_log en BD (requiere acceso a PostgreSQL)
# psql -U bankportal_user -d bankportal -c \
#   "SELECT * FROM audit_log WHERE user_id='<uuid>' AND event_type='TWO_FA_ACCOUNT_LOCKED'
#    ORDER BY created_at DESC LIMIT 10;"
```

### Flyway falla al arrancar

```bash
# Ver los logs de Flyway
kubectl logs deploy/backend-2fa -n bankportal | grep -i "flyway"

# Las migraciones V1-V3 son idempotentes (IF NOT EXISTS)
# Si hay conflicto de checksum: requiere intervención manual en tabla flyway_schema_history
```

### Secreto TOTP no descifrable

Síntoma: `IllegalStateException: Error al descifrar secreto TOTP`
Causa: `TOTP_ENCRYPTION_KEY` rotada sin proceso de re-cifrado.
Acción: **No reiniciar el servicio.** Restaurar la clave anterior desde backup y contactar al Tech Lead.

---

## Contactos de escalado

| Nivel | Rol | Cuándo escalar |
|---|---|---|
| 1 | QA Lead | Defecto detectado en PROD |
| 2 | Tech Lead | Error de arquitectura, problema de secretos |
| 3 | PM (SOFIA) | Incidente > 1h sin resolución |
| 4 | Release Manager | Decisión de rollback en PROD |
| 5 | Cliente (Banco Meridian) | Impacto a usuarios finales confirmado |

---

*Generado por SOFIA DevOps Agent — 2026-03-14*
*Versión del runbook: 1.0 — actualizar en cada release*
