# Jenkins Credentials — BankPortal
## Guía de provisioning (actualizada Sprint 5 — DEBT-006 clave dual HMAC)

> ACT-15: documentar credentials de integraciones nuevas **antes del día 1** de cada sprint.

---

## Tabla maestra de credentials

| Credential ID | Tipo | Descripción | Feature / Deuda |
|---|---|---|---|
| `bankportal-jwt-private-key` | Secret text | Clave privada RSA-2048 PEM | FEAT-001 |
| `bankportal-jwt-public-key` | Secret text | Clave pública RSA-2048 PEM | FEAT-001 |
| `bankportal-totp-test-secret` | Secret text | Secreto TOTP base32 para tests E2E | FEAT-001 |
| `bankportal-aes-key` | Secret text | Clave AES-256 cifrado TOTP en BD | FEAT-001 |
| `bankportal-redis-url` | Secret text | URL Redis `redis://host:6379` | FEAT-001/002 |
| `bankportal-docker-registry` | Username/Password | Registry Docker interno | DevOps |
| `bankportal-sonar-token` | Secret text | Token SonarQube | DevOps |
| `kubeconfig-dev` | Secret file | Kubeconfig entorno DEV | DevOps |
| `kubeconfig-stg` | Secret file | Kubeconfig entorno STG | DevOps |
| `kubeconfig-prod` | Secret file | Kubeconfig entorno PROD | DevOps |
| `bankportal-session-hmac-key` | Secret text | HMAC key para enlaces "No fui yo" | FEAT-002 |
| `bankportal-email-api-key` | Secret text | API key SendGrid / SES | FEAT-002 |
| `bankportal-email-from` | Secret text | Email remitente alertas de seguridad | FEAT-002 |
| `bankportal-trusted-device-hmac-key` | Secret text | HMAC key actual — sign + verify trust tokens | FEAT-003 |
| `bankportal-trusted-device-hmac-key-previous` | Secret text | HMAC key anterior — verify only (ventana de gracia 30 días) | DEBT-006 |
| `bankportal-jwt-private-key-pem` | Secret text | Clave privada RSA-2048 PKCS8 en Base64 (STG) — DEBT-014 RS256 | DEBT-014 |
| `bankportal-jwt-public-key-pem` | Secret text | Clave pública RSA-2048 X509 en Base64 (STG) — DEBT-014 RS256 | DEBT-014 |
| `bankportal-jwt-private-key-pem-prod` | Secret text | Clave privada RSA-2048 PKCS8 en Base64 (PROD) — DEBT-014 RS256 | DEBT-014 |
| `bankportal-jwt-public-key-pem-prod` | Secret text | Clave pública RSA-2048 X509 en Base64 (PROD) — DEBT-014 RS256 | DEBT-014 |

---

## DEBT-006 — Clave dual para rotación HMAC (Sprint 5)

### Propósito
Permite rotar `TRUSTED_DEVICE_HMAC_KEY` en producción sin invalidar los trust tokens activos.
Durante la ventana de gracia (30 días), el sistema verifica con ambas claves.

### Provisioning inicial (instalación nueva)
```bash
# Clave anterior vacía en instalación nueva — no crea tokens con ella
kubectl create secret generic bankportal-trusted-device-secrets \
  --from-literal=TRUSTED_DEVICE_HMAC_KEY=$(openssl rand -hex 32) \
  --from-literal=TRUSTED_DEVICE_HMAC_KEY_PREVIOUS="" \
  -n bankportal-stg

# Jenkins: registrar credential vacío (no afecta el flujo de login)
# ID: bankportal-trusted-device-hmac-key-previous
# Description: HMAC key anterior para ventana de gracia rotación (vacío en instalación nueva)
# Value: (vacío)
```

### Protocolo de rotación operativa (cada 30–90 días)
```bash
# 1. Obtener la clave actual
CURRENT_KEY=$(kubectl get secret bankportal-trusted-device-secrets \
  -n bankportal-prod -o jsonpath='{.data.TRUSTED_DEVICE_HMAC_KEY}' | base64 -d)

# 2. Generar nueva clave
NEW_KEY=$(openssl rand -hex 32)

# 3. Actualizar el secret K8s:
#    - PREVIOUS = CURRENT (ventana de gracia 30 días)
#    - CURRENT  = NEW
kubectl patch secret bankportal-trusted-device-secrets -n bankportal-prod \
  --type='json' \
  -p='[
    {"op":"replace","path":"/data/TRUSTED_DEVICE_HMAC_KEY_PREVIOUS",
     "value":"'"$(echo -n $CURRENT_KEY | base64)"'"},
    {"op":"replace","path":"/data/TRUSTED_DEVICE_HMAC_KEY",
     "value":"'"$(echo -n $NEW_KEY | base64)"'"}
  ]'

# 4. Actualizar credentials Jenkins:
#    - bankportal-trusted-device-hmac-key → NEW_KEY
#    - bankportal-trusted-device-hmac-key-previous → CURRENT_KEY

# 5. Rolling restart para que los pods lean los nuevos secrets
kubectl rollout restart deployment/bankportal-2fa -n bankportal-prod

# 6. Verificar: smoke test de login con dispositivo de confianza existente
#    (debe seguir funcionando con la clave anterior durante 30 días)

# 7. Documentar la rotación en el Risk Register del sprint activo
#    SLA de rotación: 30 días para preventiva, 4h para emergencia
```

### Variables de entorno resultantes en `application.yml`
```yaml
trusted-device:
  hmac-key:           ${TRUSTED_DEVICE_HMAC_KEY}           # actual — sign + verify
  hmac-key-previous:  ${TRUSTED_DEVICE_HMAC_KEY_PREVIOUS}  # anterior — verify only (puede ser vacío)
  hmac-key-grace-days: ${TRUSTED_DEVICE_HMAC_GRACE_DAYS:30}
```

---

## Provisioning keypair RSA-256 (DEBT-002 — completado Sprint 2)

```bash
openssl genrsa -out jwt-private.pem 2048
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

kubectl create secret generic bankportal-jwt-keypair \
  --from-file=private.pem=jwt-private.pem \
  --from-file=public.pem=jwt-public.pem \
  -n bankportal-stg

rm -f jwt-private.pem jwt-public.pem
```

---

## Checklist pre-Sprint 5

### Credentials existentes (verificar antes del día 1)
- [ ] `bankportal-jwt-private-key` operativo en Jenkins
- [ ] `bankportal-jwt-public-key` operativo en Jenkins
- [ ] `bankportal-totp-test-secret` operativo en Jenkins + K8s STG
- [ ] `bankportal-aes-key` operativo en Jenkins
- [ ] `bankportal-redis-url` operativo en Jenkins
- [ ] `bankportal-session-hmac-key` operativo en Jenkins + K8s STG/PROD
- [ ] `bankportal-email-api-key` operativo en Jenkins + K8s STG/PROD
- [ ] `bankportal-trusted-device-hmac-key` operativo en Jenkins + K8s STG/PROD

### Nuevo credential Sprint 5 (DEBT-006 — día 1 bloqueante)
- [ ] `bankportal-trusted-device-hmac-key-previous` registrado en Jenkins ← **NUEVO DEBT-006**
- [ ] `bankportal-trusted-device-hmac-key-previous` sincronizado en K8s STG (valor vacío en instalación nueva)
- [ ] `bankportal-trusted-device-secrets` actualizado en K8s STG con campo `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS`
- [ ] ADR-009 aprobado antes del desarrollo de DEBT-006 ← **BLOQUEANTE**
- [ ] Pipeline ejecutado en rama `develop` sin errores

---

## Protocolo de rotación de credentials

```
1. Generar nuevo valor fuera de Jenkins (openssl rand o vault)
2. Jenkins → Manage → Credentials → actualizar sin cambiar ID
3. K8s → kubectl patch secret con nuevo valor
4. Rolling restart del deployment afectado
5. Smoke test inmediato (< 5 min tras restart)
6. Documentar en Risk Register del sprint activo

SLA: 4h para rotación de emergencia · 30 días para rotación preventiva
```

---

*SOFIA DevOps Agent · BankPortal · Sprint 5 — 2026-05-12*
*ACT-15 aplicado: credential DEBT-006 documentado antes del día 1 Sprint 5*
