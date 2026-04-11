# ADR-025 — VAPID puro vs Firebase Cloud Messaging (FCM)

## Metadata

| Campo | Valor |
|---|---|
| ADR | 025 |
| Feature | FEAT-014 — Notificaciones Push & In-App |
| Fecha | 2026-03-24 |
| Estado | Propuesto — Pendiente aprobación Tech Lead |
| Autor | SOFIA Architect Agent |
| Supersede | — |

---

## Contexto

FEAT-014 requiere enviar notificaciones push al navegador del usuario cuando BankPortal no está abierto. Existen dos rutas técnicas principales:

1. **VAPID puro (RFC 8292 + W3C Web Push)** — estándar abierto, sin dependencias de terceros
2. **Firebase Cloud Messaging (FCM)** — servicio Google, requiere proyecto Firebase y cuenta GCP

El sistema ya tiene infraestructura Spring Boot (Java 21) y el stack no incluye ninguna dependencia de Firebase. La decisión afecta a costes, privacidad (RGPD) y complejidad operativa.

---

## Decisión

**Se implementa VAPID puro (`nl.martijndwars:web-push:5.1.2`) sin Firebase.**

Las claves VAPID (par EC P-256) se generan offline y se inyectan por variables de entorno (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). No se requiere cuenta GCP ni proyecto Firebase.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **VAPID puro (elegido)** | Sin cuenta terceros · RGPD más simple · Funciona en Chrome, Firefox, Safari ≥16.4 · Lib Java madura · Sin coste externo | No funciona en iOS < 16.4 · Requiere gestión propia de claves VAPID |
| FCM con VAPID fallback | Mayor cobertura iOS antigua · Dashboard Google | Dependencia Google · Procesamiento de payload en servidores Google (RGPD Art.28 requiere DPA) · Proyecto Firebase obligatorio · Complejidad mayor |
| Solo SSE in-app (sin push) | Máxima simplicidad | Push fuera de sesión no disponible — rompe requisito US-1404 |

---

## Consecuencias

**Positivas:**
- Sin dependencia de servicios externos de terceros → menor superficie de riesgo
- Payload cifrado end-to-end (ECDH P-256 + AES-128-GCM) entre backend y browser — Google no accede al contenido
- Sin implicaciones adicionales de RGPD Art.28 (no hay subcontratación de datos a Google)
- Rotación de claves VAPID posible offline sin afectar a suscripciones activas (solo nuevas)

**Trade-offs:**
- iOS < 16.4 (Safari) no recibe push — mitigado por fallback SSE in-app cuando hay sesión activa
- Las suscripciones existentes quedan inválidas si se rotan claves VAPID → limpiar `push_subscriptions` al rotar

**Riesgos y mitigación:**
| Riesgo | Mitigación |
|---|---|
| Cobertura iOS baja en usuarios con versiones antiguas | Fallback SSE activo · métricas de cobertura por `userAgent` en `push_subscriptions` |
| Pérdida de claves VAPID | Almacenar en secrets manager (Vault / k8s Secret) + backup cifrado |
| Suscripciones 410 Gone acumuladas | Cleanup automático al recibir HTTP 410 del Push Service (implementado en `WebPushService`) |

**Impacto en servicios existentes:**
- Ninguno. VAPID opera como canal adicional sin modificar contratos existentes.

---

*SOFIA Architect Agent — Sprint 16 · FEAT-014*
*CMMI Level 3 — TS SP 1.1*
*BankPortal — Banco Meridian — 2026-03-24*
