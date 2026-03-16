# Release Notes — v1.4.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.4.0 |
| **Fecha** | 2026-05-23 |
| **Sprint** | 5 |
| **Cliente** | Banco Meridian |
| **Tag git** | `v1.4.0` |
| **Servicios** | `bankportal-backend-2fa` · `frontend-portal` |

---

## Sprint Goal alcanzado ✅

> "Implementar DEBT-006, cerrar gap documental FEAT-003 y arrancar FEAT-004 con US-301/302/303/304/305."
>
> **24/24 SP entregados**

---

## Nuevas funcionalidades — FEAT-004: Centro de Notificaciones

| US | Funcionalidad | Endpoints |
|---|---|---|
| US-301 | Historial paginado de notificaciones de seguridad (90 días · filtros por tipo) | `GET /api/v1/notifications` |
| US-302 | Marcar leídas: individual (IDOR-safe O(1)) o todas | `PUT /api/v1/notifications/{id}/read` · `PUT /api/v1/notifications/read-all` |
| US-303 | Badge de no leídas en header del portal (Signal Store reactivo) | `GET /api/v1/notifications/unread-count` |
| US-304 | Deep-links a sesión / dispositivo desde notificación | (Angular Router) |
| US-305 | Notificaciones en tiempo real vía SSE · toast 8s · polling fallback 60s | `GET /api/v1/notifications/stream` |

---

## Deuda técnica resuelta

| ID | Descripción |
|---|---|
| DEBT-006 | Clave dual HMAC para rotación de `TRUSTED_DEVICE_HMAC_KEY` sin ventana de impacto UX (ADR-009) |

---

## Gap documental cerrado (ACT-18/19/20)

| Artefacto | Estado |
|---|---|
| `openapi-2fa.yaml` v1.3.0 — endpoints FEAT-002/003 documentados | ✅ ACT-19 |
| `LLD-backend-trusted-devices.md` | ✅ ACT-18 |
| `LLD-frontend-trusted-devices.md` | ✅ ACT-18 |
| `ADR-009-dual-hmac-key-rotation.md` | ✅ |
| Code Review checklist con OpenAPI | ✅ ACT-20 |

---

## Infraestructura nueva

| Componente | Cambio |
|---|---|
| PostgreSQL | Nueva tabla `user_notifications` (Flyway V7) con 3 índices |
| SSE | `SseEmitterRegistry` — límite 1 conexión SSE por usuario |
| K8s Secret | `bankportal-trusted-device-secrets` actualizado: nuevo campo `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` |
| `@Scheduled` | Cleanup nocturno de notificaciones > 90 días (02:30 UTC) |

---

## Breaking changes

Ninguno. Todos los cambios son compatibles hacia atrás.

---

## Secrets requeridos antes del deploy

```bash
# Actualizar bankportal-trusted-device-secrets con clave anterior vacía (DEBT-006)
kubectl patch secret bankportal-trusted-device-secrets -n bankportal-prod \
  --type='json' \
  -p='[{"op":"add","path":"/data/TRUSTED_DEVICE_HMAC_KEY_PREVIOUS","value":""}]'

# Verificar
kubectl get secret bankportal-trusted-device-secrets -n bankportal-prod \
  -o jsonpath='{.data}' | python3 -m json.tool
```

> ⚠️ `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS` debe estar vacío en la primera instalación.
> Solo se rellena durante rotaciones operativas — ver `README-CREDENTIALS.md`.

---

## Checklist de release

- [ ] K8s Secret `bankportal-trusted-device-secrets` actualizado con `TRUSTED_DEVICE_HMAC_KEY_PREVIOUS=""`
- [ ] Jenkins Credential `bankportal-trusted-device-hmac-key-previous` registrado (valor vacío)
- [ ] Flyway V7 ejecutado (automático en startup)
- [ ] Smoke test: `GET /api/v1/notifications` → 200 con JWT válido
- [ ] Smoke test: `GET /api/v1/notifications/unread-count` → 200
- [ ] Smoke test: `GET /api/v1/notifications/stream` → 200 text/event-stream
- [ ] Verificar job @Scheduled en logs: `cleanupExpired` programado para 02:30 UTC

---

## Procedimiento de rollback

```bash
kubectl set image deployment/bankportal-2fa \
  bankportal-2fa=registry.meridian.internal/bankportal-backend-2fa:v1.3.0 \
  -n bankportal-prod
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod

# Flyway V7 (user_notifications) coexiste con v1.3.0 sin impacto.
# La tabla quedará sin usar hasta volver a desplegar v1.4.0.
```

---

## Deuda técnica generada

| ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| DEBT-007 | Configuración CORS/Spring Security para SSE con CDN/proxy en PROD | Bajo-Medio | Sprint 6 |

---

*SOFIA DevOps Agent · BankPortal · Sprint 5 · 2026-05-23*
