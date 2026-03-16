# Release Notes — v1.3.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.3.0 |
| **Fecha** | 2026-05-09 |
| **Sprint** | 4 |
| **Cliente** | Banco Meridian |
| **Tag git** | `v1.3.0` |
| **Servicios** | `bankportal-backend-2fa` · `frontend-portal` |

---

## Sprint Goal alcanzado ✅

> "Cerrar FEAT-002 al 100%, arrancar FEAT-003 con US-201/202/203/204 y saldar DEBT-004/005."
>
> **24/24 SP entregados**

---

## Nuevas funcionalidades — FEAT-003: Dispositivos de confianza

| US | Funcionalidad | Endpoints |
|---|---|---|
| US-201 | Marcar dispositivo como de confianza (opt-in) tras login 2FA · cookie HttpOnly ADR-008 | (extensión de `POST /api/v1/2fa/verify`) |
| US-202 | Ver y eliminar dispositivos de confianza | `GET /api/v1/trusted-devices` · `DELETE /api/v1/trusted-devices/{id}` · `DELETE /api/v1/trusted-devices` |
| US-203 | Login sin OTP desde dispositivo de confianza · auditado PCI-DSS req. 8.3 | (filtro en `POST /api/v1/auth/login`) |
| US-204 | Expiración automática 30 días · job nocturno 02:00 UTC | (interno `@Scheduled`) |

---

## FEAT-002 cierre

| US | Funcionalidad |
|---|---|
| US-105b | `DenySessionByLinkUseCase` HMAC-SHA256 completo · one-time use · comparación en tiempo constante |

---

## Deuda técnica resuelta

| ID | Descripción |
|---|---|
| DEBT-004 | `DeviceFingerprintService` migrado a ua-parser-java — Edge detectado correctamente |
| DEBT-005 | `DELETE /api/v1/2fa/deactivate` emite headers RFC 8594: `Deprecation: true` + `Sunset` + `Link` |

---

## Infraestructura nueva

| Componente | Cambio |
|---|---|
| PostgreSQL | Nueva tabla `trusted_devices` (Flyway V6) con índices optimizados |
| Cookie `bp_trust` | HttpOnly + Secure + SameSite=Strict + Path limitado a `/api/v1/auth/login` |
| `@Scheduled` job | Limpieza nocturna 02:00 UTC de trusted_devices expirados |
| K8s Secret nuevo | `bankportal-trusted-device-secrets` requerido antes del deploy |

---

## Breaking changes

Ninguno. Todos los cambios son compatibles hacia atrás.

---

## Secrets requeridos antes del deploy

```bash
# Ya debe existir (provisioned Sprint 4 día 1 — ACT-15)
kubectl get secret bankportal-trusted-device-secrets -n bankportal-prod
# Si no existe:
kubectl create secret generic bankportal-trusted-device-secrets \
  --from-literal=TRUSTED_DEVICE_HMAC_KEY=$(openssl rand -hex 32) \
  -n bankportal-prod
```

---

## Checklist de release

- [ ] Secret `bankportal-trusted-device-secrets` presente en K8s PROD
- [ ] Flyway V6 ejecutado (automático en startup)
- [ ] Smoke test: `GET /api/v1/trusted-devices` → 200 con JWT válido
- [ ] Smoke test: Login → checkbox "Recordar" → cookie `bp_trust` establecida
- [ ] Smoke test: Segundo login → sin OTP solicitado
- [ ] Verificar job `@Scheduled` en logs: próxima ejecución 02:00 UTC

---

## Procedimiento de rollback

```bash
kubectl set image deployment/bankportal-2fa \
  bankportal-2fa=registry.meridian.internal/bankportal-backend-2fa:v1.2.0 \
  -n bankportal-prod
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod
# Nota: Flyway V6 no se revierte automáticamente.
# La tabla trusted_devices puede coexistir con v1.2.0 sin impacto.
```

---

## Deuda técnica generada

| ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| DEBT-006 | Rotación de `TRUSTED_DEVICE_HMAC_KEY` sin ventana de gracia invalida todos los trust tokens | Medio | Sprint 5 |

---

*SOFIA DevOps Agent · BankPortal · Sprint 4 · 2026-05-09*
