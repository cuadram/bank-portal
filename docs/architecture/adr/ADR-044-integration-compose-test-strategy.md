# ADR-044 — Estrategia de tests de integración: perfil integration-compose

## Metadata
| Campo | Valor |
|---|---|
| ADR | ADR-044 |
| Sprint / Item | S27 · DEBT-064 (REQ-S27-02) |
| Fecha | 2026-06-01 |
| Estado | Propuesto |
| Decisor | Tech Lead (Angel de la Cuadra) |
| Stack | Spring Boot 3 / Java 21 · Maven failsafe · Docker Compose |

---

## Contexto
4 ficheros `*IT` usan **Testcontainers 1.20.1**, incompatible con el daemon de
Docker Desktop 29.4.1 (Status 400 en todas las estrategias de detección). Bloquea su
ejecución local y en CI. El resto de la suite IT (post NC-CMMI-001) ya se recolecta vía
`maven-failsafe-plugin` con el perfil `integration`.

## Decisión
Migrar esos 4 IT a un perfil **`integration-compose`** que levanta las dependencias
(PostgreSQL, Redis, etc.) mediante el `docker-compose.yml` canónico del proyecto
(`infra/compose/docker-compose.yml`, con `-f` explícito) + **fixtures SQL** de datos de
prueba, eliminando la dependencia de la API de Testcontainers.

## Opciones consideradas
| Opción | Pros | Contras |
|---|---|---|
| **integration-compose + fixtures SQL** (elegido) | Sin dependencia de la versión del daemon Docker · reutiliza el compose canónico ya usado en local · determinista | Requiere arranque/parada de servicios y carga de fixtures en el ciclo IT |
| Upgrade Testcontainers a versión compatible | Cambio menor | Acopla la suite a la compatibilidad daemon↔librería (causa raíz del problema); riesgo R-S27-01 |
| Mantener Testcontainers + pin de daemon | — | Frágil; impone versión de Docker al equipo/CI |

## Implementación
1. Crear perfil Maven `integration-compose` (failsafe recolecta los 4 `*IT` afectados).
2. Arranque de servicios vía `docker-compose -f infra/compose/docker-compose.yml up` (filtro `name=bankportal`).
3. Fixtures SQL idempotentes para el estado de prueba; limpieza entre clases.
4. Cada IT migrado genera su `TEST-{FQCN}.xml` (GR-QA-002) bajo `target/failsafe-reports/`.

## Riesgo asociado (del plan G-1)
**R-S27-01**: la migración puede exceder el timebox de 5 SP. Fallback documentado:
upgrade de Testcontainers y mover el remanente a S28.

## Consecuencias
- (+) 4/4 IT ejecutables sin acoplamiento al daemon Docker; evidencia XML para G-6.
- (+) Coherencia con el perfil `integration` ya existente (failsafe).
- (−) Mayor tiempo de ciclo IT por arranque de servicios (aceptable; aislado al perfil).

## Trazabilidad
SRS REQ-S27-02 · SCRUM-176 · DEBT-064 · GR-QA-002 (evidencia XML) · gate G-6.
