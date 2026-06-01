# ADR-043 — GR-CONFIG-001: merge profundo de perfiles YAML con base compartida

## Metadata
| Campo | Valor |
|---|---|
| ADR | ADR-043 |
| Sprint / Item | S27 · DEBT-054 (REQ-S27-04) |
| Fecha | 2026-06-01 |
| Estado | Propuesto |
| Decisor | Tech Lead (Angel de la Cuadra) |
| Stack | Spring Boot 3 / Java 21 (backend-2fa, modulith) |

---

## Contexto
Los perfiles `application-{local,staging,...}.yml` duplican claves comunes y han
divergido entre entornos. No existe una base compartida ni validación que impida
claves huérfanas o conflictos. El riesgo es desalineación silenciosa de configuración
entre entornos (origen recurrente de incidencias de despliegue).

## Decisión
Adoptar una **base compartida `application-shared.yml`** importada por cada perfil de
entorno mediante `spring.config.import`, dejando en cada perfil **solo los deltas**
propios del entorno. Se añade un validador `validate-yaml-profiles.js` que se integra
como **bloqueo en G-4b** (GR-CONFIG-001).

## Opciones consideradas
| Opción | Pros | Contras |
|---|---|---|
| **shared.yml + spring.config.import** (elegido) | Idiomático Spring Boot 3 · merge determinista · una única fuente de verdad para claves comunes · validable | Requiere refactor inicial de los perfiles existentes |
| Profile groups (`spring.profiles.group`) | Nativo | Agrupa perfiles, no fusiona claves base; no resuelve la duplicación |
| Placeholders `${}` + properties externas | Flexible | Dispersa la config; difícil de validar estáticamente |

## Implementación
1. Extraer claves comunes a `application-shared.yml`.
2. En cada `application-{env}.yml`: `spring.config.import: optional:classpath:application-shared.yml` + solo deltas.
3. `validate-yaml-profiles.js`: detecta claves huérfanas/conflictivas y divergencias respecto a `shared`; exit≠0 si hay violación.
4. Integrar el validador como **gate bloqueante G-4b** (no se aprueba G-4b si el validador falla).

## Estrategia de perfiles (LA-019-08)
No altera la estrategia de adaptadores: adaptadores reales `@Primary` sin `@Profile`;
mocks `@Profile("mock")`; **nunca** `@Profile("!production")`. Esta ADR afecta solo a la
**configuración YAML**, no a la activación de beans.

## Consecuencias
- (+) Configuración multi-perfil consistente y auditable; alineado con RNF-CFG-001.
- (+) Regresión de configuración detectable en G-4b antes de build.
- (−) Coste puntual de refactor de los perfiles actuales (cubierto por los 3 SP de DEBT-054).

## Trazabilidad
SRS REQ-S27-04 · SCRUM-178 · GR-CONFIG-001 · gate de evidencia G-4b (bloqueante).
