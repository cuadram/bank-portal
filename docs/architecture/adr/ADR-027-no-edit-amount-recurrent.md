# ADR-027 — Edición de importe en transferencia recurrente activa: no permitido

## Metadata
- **Feature:** FEAT-015 | **Sprint:** 17 | **Fecha:** 2026-03-24
- **Estado:** Aceptado
- **Autor:** SOFIA Architect Agent + Tech Lead + Product Owner

---

## Contexto

El usuario puede querer modificar el importe de una transferencia recurrente
activa (ej: el alquiler sube de 850€ a 900€). La pregunta es si el sistema
debe permitir edición in-place del importe o requerir cancelar y crear una nueva.

**Restricciones regulatorias:**
- PSD2 Art. 94 exige trazabilidad completa de autorizaciones de pagos.
- Una modificación de importe en una autorización existente es, en sentido estricto,
  una nueva autorización y debería requerir un nuevo proceso de consentimiento/2FA.
- La tabla `audit_log` (FEAT-004) registra todas las operaciones; una edición
  crearía ambigüedad en el historial de la programada.

---

## Decisión

**No se permite edición de importe en transferencias recurrentes activas.**
El usuario debe cancelar la programada existente y crear una nueva con el importe actualizado.

Las operaciones `PATCH /pause` y `PATCH /resume` permanecen disponibles.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **No permitir edición — cancelar + crear nueva (elegida)** | Trazabilidad perfecta. Cumplimiento PSD2 Art.94 sin ambigüedad. Lógica simple. Historial inmutable. | UX requiere dos pasos. Pierde ID anterior (sin impacto técnico). |
| Permitir edición con nuevo 2FA | Semánticamente correcto como nueva autorización | Complejidad: ¿mantener ID? ¿crear nuevo `authorized_at`? ¿qué pasa con ejecuciones anteriores al mismo ID? Riesgo de audit gap. |
| Permitir edición sin restricciones | Máxima simplicidad UX | Viola PSD2 Art. 94. Audit log ambiguo. |

---

## Consecuencias

- **Positivas:** Historial de ejecuciones 100% trazable por ID de programada. Cumplimiento regulatorio sin overhead.
- **Trade-offs:** UX requiere dos pasos para cambiar importe.
- **UX:** Mostrar mensaje claro: "Para modificar el importe, cancela esta transferencia y crea una nueva con el importe actualizado."
- **Impacto en servicios existentes:** Ninguno. `PATCH /{id}` solo expone `pause` y `resume`.

---

*BankPortal — Banco Meridian — 2026-03-24*
