# ADR-024 — Validación KYC: síncrona post-upload vs asíncrona (@Async / evento)

## Metadata

| Campo | Valor |
|---|---|
| ID | ADR-024 |
| Feature | FEAT-013 — US-1303 |
| Fecha | 2026-03-24 |
| Estado | Aceptado |
| Autor | SOFIA Architect Agent |
| Supersede | — |

## Contexto

`ValidateDocumentUseCase` debe ejecutarse tras cada subida de documento para
determinar si el KYC pasa a APPROVED o SUBMITTED. Se necesita decidir si la
validación ocurre dentro de la misma transacción HTTP (síncrona) o de forma
asíncrona (Spring `@Async` / ApplicationEvent) para no bloquear la respuesta al cliente.

El SRS (US-1303, CA-4) indicaba ejecución asíncrona. Sin embargo, la validación
automática de Sprint 15 es únicamente de metadatos (tipo, caducidad, hash integridad)
y tiene un tiempo de ejecución < 100ms en el caso típico. No involucra llamadas
a servicios externos ni I/O de red.

## Decisión

**Validación síncrona dentro de la misma transacción de `UploadDocumentUseCase`.**

La validación se ejecuta inmediatamente después de persistir el documento,
antes de retornar la respuesta HTTP 201. El cliente recibe el `kycStatus`
definitivo (APPROVED / SUBMITTED / PENDING) en la misma llamada.

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Síncrona (elegida)** | Estado definitivo en la respuesta · Sin estado intermedio · Transacción atómica · Debugging simple | Cliente espera la validación (< 100ms — aceptable) |
| `@Async` Spring | No bloquea HTTP response | Cliente recibe SUBMITTED siempre aunque el doc sea válido; requiere polling o SSE para el estado final; dos transacciones separadas con riesgo de inconsistencia |
| ApplicationEvent | Desacoplamiento total | Complejidad innecesaria para Sprint 15; mismo problema de consistencia que `@Async` |

## Consecuencias

- **Positivas:** El frontend recibe el estado final directamente. El wizard puede
  mostrar APPROVED o SUBMITTED en tiempo real sin polling adicional. La transacción
  es atómica: si la validación falla, el documento sigue persistido pero el estado
  es coherente.
- **Trade-offs:** Si en sprint futuro se integra un proveedor externo (Jumio, Onfido)
  la validación puede tomar segundos → migrar a `@Async` + SSE en ese momento.
- **Riesgos:** Ninguno para Sprint 15 — validación local < 100ms.
- **Impacto en servicios existentes:** Ninguno. El cambio es interno al módulo `kyc`.

## Plan de migración — Sprint futuro (integración OCR / biometría)

Si `ValidateDocumentUseCase` incorpora llamadas a proveedor externo:
1. Convertir a `@Async` con `@EventListener(KycDocumentUploadedEvent.class)`
2. Retornar siempre `kycStatus: SUBMITTED` en la respuesta HTTP 201
3. Notificar al frontend vía SSE (`SseEmitterRegistry`) cuando la validación completa
4. Actualizar `KycWizardComponent` para escuchar el evento SSE de aprobación

*SOFIA Architect Agent — Step 3 | Sprint 15 · FEAT-013*
*BankPortal — Banco Meridian — 2026-03-24*
