# ADR-030 — Selección de librería de generación PDF
**Fecha:** 2026-03-30 | **Sprint:** 20 | **Estado:** ACCEPTED  
**Decisores:** Tech Lead, Architect  

## Contexto
FEAT-018 requiere generar extractos PDF de movimientos bancarios con cabecera corporativa, tabla de datos y hash SHA-256 de integridad. Se evaluaron dos opciones principales.

## Opciones evaluadas

| Criterio | Apache PDFBox 3.x | iText 7 |
|---|---|---|
| Licencia | Apache 2.0 ✅ | AGPL 3.0 / Comercial ❌ |
| Coste | Gratuito | €€€ licencia comercial |
| Capacidades S20 | Suficientes ✅ | Superiores (formas, tablas avanzadas) |
| Mantenimiento | Apache Foundation ✅ | iText Group ✅ |
| Curva aprendizaje | Media | Baja |
| Footprint JAR | ~5MB | ~10MB |

## Decisión
**Apache PDFBox 3.0.2** — licencia Apache 2.0, sin coste, capacidades suficientes para S20.

## Consecuencias
- Positivo: Sin coste de licencia, sin riesgo AGPL en distribución.
- Negativo: Generación de tablas más verbosa que iText — mitigado con helper `PdfTableBuilder`.
- Revisión: Si en S21+ se requieren PDF firmados digitalmente con certificado X.509, reevaluar iText o Bouncy Castle.

---

# ADR-031 — Estrategia de generación síncrona vs asíncrona
**Fecha:** 2026-03-30 | **Sprint:** 20 | **Estado:** ACCEPTED

## Contexto
La generación de PDF para 500 registros puede tomar hasta 3 segundos. Se evaluó si procesar en background con polling.

## Decisión
**Síncrono para S20** (≤ 500 registros, máximo permitido). La respuesta HTTP bloquea hasta que el byte array está listo. El frontend muestra spinner durante la espera.

Generación asíncrona con polling (job queue + SSE) queda como **DEBT-036** si en producción se detectan timeouts en conexiones lentas.

## Consecuencias
- Positivo: Implementación simple, sin infraestructura adicional (Redis queue, SSE).
- Negativo: En conexiones lentas (< 1 Mbps) el usuario puede percibir latencia > 3s.
- Mitigación: Límite de 500 registros es un guardrail efectivo.

---

*Generado por SOFIA v2.3 · Architect · ADR · Sprint 20 · 2026-03-30*
