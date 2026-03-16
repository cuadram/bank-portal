# Release Notes — v1.5.0 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Versión** | v1.5.0 |
| **Fecha** | 2026-06-06 |
| **Sprint** | 6 |
| **Cliente** | Banco Meridian |
| **Tag git** | `v1.5.0` |
| **Servicios** | `bankportal-backend-2fa` · `frontend-portal` |

---

## Sprint Goal alcanzado ✅

> "Completar FEAT-004, arrancar FEAT-005, saldar deuda operativa DEBT-007 + ACT-23/25."
>
> **22/22 SP entregados (+ 2 SP buffer no consumidos)**

---

## Nuevas funcionalidades — FEAT-005: Panel de Auditoría de Seguridad

| US | Funcionalidad | Endpoints |
|---|---|---|
| US-401 | Dashboard de seguridad: KPIs 30d + SecurityScore (SECURE/REVIEW/ALERT) + gráfico actividad + eventos recientes | `GET /api/v1/security/dashboard` |
| US-402 | Exportar historial en PDF (OpenPDF, #1B3A6B) o CSV con hash SHA-256 (scope: data-rows-only) | `GET /api/v1/security/export?format=pdf\|csv&days=30\|60\|90` |

---

## FEAT-004 completada al 100%

| Mejora | Descripción |
|---|---|
| `buildBody()` exhaustivo | 12 tipos de evento con mensajes descriptivos (exhaustive switch Java) |
| Integración × 10 módulos | `NotificationService.createNotification()` llamado desde FEAT-001/002/003 |

---

## Deuda técnica resuelta

| ID | Descripción |
|---|---|
| DEBT-007 | SSE en producción: headers `X-Accel-Buffering: no` + `Cache-Control: no-cache, no-store` + `Connection: keep-alive` (ADR-010) |

---

## Acciones de mejora cerradas

| ID | Descripción |
|---|---|
| ACT-23 | `TrustedDevicesComponent.spec.ts` — 8 tests unitarios Angular, cobertura ~88% |
| ACT-25 | `HmacKeyRotationMonitorJob` — alerta diaria `HMAC_KEY_PREVIOUS_ROTATION_OVERDUE` en audit_log si clave anterior sigue configurada (03:00 UTC) |
| ACT-26 | `buildBody()` completo — cerrado junto con FEAT-004 integración |

---

## Infraestructura nueva

| Componente | Cambio |
|---|---|
| Nginx | Añadir regla `location /api/v1/notifications/stream` con `proxy_buffering off` y `proxy_read_timeout 600s` |
| CDN | Añadir Page Rule: `Cache-Level: Bypass` para `/api/v1/notifications/stream` |
| `pom.xml` | Nuevas dependencias: `openpdf:1.3.30` + `commons-csv:1.10.0` |

---

## Breaking changes

Ninguno. Todos los cambios son compatibles hacia atrás.

---

## Checklist de release

- [ ] Nginx: regla SSE `proxy_buffering off` desplegada
- [ ] CDN: Page Rule `Cache-Level: Bypass` para `/api/v1/notifications/stream` activa
- [ ] `pom.xml` con `openpdf` y `commons-csv` — verificar build CI ✅
- [ ] Smoke test: `GET /api/v1/security/dashboard` → 200
- [ ] Smoke test: `GET /api/v1/security/export?format=pdf&days=30` → 200 + PDF descargable
- [ ] Smoke test: `GET /api/v1/notifications/stream` → headers ADR-010 presentes
- [ ] Verificar audit_log: `HMAC_KEY_PREVIOUS_ROTATION_OVERDUE` solo aparece si la clave anterior está configurada

---

## Procedimiento de rollback

```bash
kubectl set image deployment/bankportal-2fa \
  bankportal-2fa=registry.meridian.internal/bankportal-backend-2fa:v1.4.0 \
  -n bankportal-prod
kubectl rollout status deployment/bankportal-2fa -n bankportal-prod
# Revertir regla Nginx y CDN si es necesario
```

---

## Deuda técnica generada

| ID | Descripción | Impacto | Sprint |
|---|---|---|---|
| DEBT-008 | `SecurityDashboardUseCase` — 5 consultas secuenciales → `CompletableFuture.allOf()` para ejecución paralela | Medio en PROD con carga alta | Sprint 7 |

---

*SOFIA DevOps Agent · BankPortal · Sprint 6 · 2026-06-06*
