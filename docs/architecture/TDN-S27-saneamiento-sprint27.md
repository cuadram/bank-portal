# Technical Design Note — Sprint 27 · Saneamiento + Deudas — BankPortal / Banco Meridian

## Metadata
- Cliente: Banco Meridian · Tech Lead (HITL): Angel de la Cuadra
- Sprint: 27 · Feature: S27-saneamiento+deudas (sin FEAT nueva)
- Step 3 (Architect) · Gate de cierre: HITL TL (G-3)
- Entrada: SRS `docs/requirements/SRS-S27-saneamiento-sprint27.md` (8 REQ aprobados en G-2)
- Tipo de trabajo: refactor / maintenance / bug-fix

## 1. Alcance de impacto arquitectónico
BankPortal es un **modulith hexagonal** (24 módulos de dominio bajo un único despliegable
`backend-2fa`), **no microservicios**. Este sprint **no introduce módulos, contratos ni
modelos de datos nuevos**: la arquitectura vigente (HLD/LLD por feature S1–S26) permanece
sin cambios estructurales. El diseño aquí se limita a las decisiones puntuales de las
deudas con impacto técnico.

**Sin cambios de contrato OpenAPI**: ningún item del sprint modifica la superficie REST.

| REQ | Item | Impacto arquitectónico | Artefacto de diseño |
|---|---|---|---|
| REQ-S27-01 | DEBT-062 verificación IT lifecycle | Ninguno (verificación + acta) | — |
| REQ-S27-02 | DEBT-064 IT → integration-compose | Estrategia de test infra | **ADR-044** |
| REQ-S27-03 | DEBT-065 rename *IT→*Test | Ninguno (reclasificación surefire) | — |
| REQ-S27-04 | DEBT-054 GR-CONFIG-001 YAML merge | Arquitectura de configuración | **ADR-043** |
| REQ-S27-05 | DEBT-053 paginación scheduler | Patrón de procesado batch | §2.1 (nota) |
| REQ-S27-06 | DEBT-059 saneo excepción savings | Patrón error-handling / seguridad | §2.2 (nota) |
| REQ-S27-07/08 | BUG-PO 012-035 PFM visual | Ninguno (fidelidad UX vs PROTO-FEAT-023) | — |

## 2. Notas de diseño

### 2.1 DEBT-053 — Paginación de AutoContributionScheduler (LLD §11)
El scheduler procesa contribuciones cargando el conjunto completo. Se adopta **procesado
paginado** conforme al LLD §11 vigente:
- Repositorio: consulta paginada (`Pageable`, tamaño de página configurable vía YAML — clave en `application-shared.yml`, ver ADR-043).
- Iteración por páginas hasta agotar el conjunto; sin cargar todo en memoria.
- Idempotencia y orden estable por clave de negocio (evitar saltos/duplicados entre páginas).
- Equivalencia funcional con el comportamiento actual (criterio de aceptación REQ-S27-05).
- Estrategia de perfiles (LA-019-08): sin cambios; el bean del scheduler permanece `@Primary` sin `@Profile`.

### 2.2 DEBT-059 — Saneo de mensajes de excepción en savings (CWE-209)
Las excepciones de dominio `savings` exponen importes en el mensaje. Patrón a aplicar:
- **Mensaje de cara al cliente sin datos sensibles** (sin importes ni saldos): texto genérico + código de error.
- **Detalle financiero solo en logs de servidor** al nivel adecuado (no en la respuesta HTTP).
- Mapeo de excepción vía `@ControllerAdvice`/`@ResponseStatus` existente (LA-TEST-003): no se crea nuevo manejador, se sanea el contenido del mensaje.
- Alineado con RNF-004/005 (seguridad). Test que verifica ausencia de importes en el mensaje (REQ-S27-06).

## 3. Decisiones formales (ADR)
- **ADR-043** — GR-CONFIG-001: merge profundo de perfiles YAML (`application-shared.yml` import + validador + bloqueo G-4b).
- **ADR-044** — Estrategia de IT: perfil `integration-compose` con fixtures SQL (sustituye Testcontainers en los 4 IT de DEBT-064).

## 4. Reglas de diseño verificadas (lecciones aprendidas)
- **LA-019-08** (perfiles Spring): sin cambios; documentado en §2.1 y ADR-043.
- **LA-019-13** (mapa de tipos BD→Java): **N/A** — no hay tablas nuevas ni modificadas en este sprint.
- **LA-CORE / modulith**: el diseño respeta los límites de módulo hexagonal; no se introducen ciclos de dependencia nuevos.

## 5. Restricciones para el Developer (Step 4)
- No tocar superficie OpenAPI (sin cambios de contrato).
- Configuración: solo vía `application-shared.yml` + deltas por perfil (ADR-043); el validador debe quedar verde.
- IT migrados: generar `TEST-{FQCN}.xml` (GR-QA-002) antes de G-6.
- 0 ficheros borrados por commit (GR-GIT-001).

## 6. Handoff
Destino: **Step 3b (Documentation Agent + FA-Agent, AUTO)** → **Developer (Step 4)**.
HLD/LLD vigentes sin cambio; este TDN + ADR-043/044 son el diseño incremental del sprint.

---
✅ PERSISTIDO
- docs/architecture/TDN-S27-saneamiento-sprint27.md
- docs/architecture/adr/ADR-043-yaml-profile-deep-merge.md
- docs/architecture/adr/ADR-044-integration-compose-test-strategy.md
