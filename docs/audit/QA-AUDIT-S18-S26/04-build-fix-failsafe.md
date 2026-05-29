# Fase 3 — Fix estructural Maven failsafe (DEBT-062)

**NC-CMMI-001** · Fase 3 · Branch `hotfix/qa-audit-s18-s26`
**Parte A (commit `4d8fc59`):** corrección estructural de configuración.
**Parte B (este commit):** ejecución de matriz IT real + triage S2 + remediación.

## Diagnóstico confirmado (empírico)

El proyecto nombra sus 22 tests de integración con sufijo **`*IT.java`** (convención nativa de maven-failsafe). Pero:

| Mecanismo | Patrón configurado | ¿Matchea `*IT.java`? |
|---|---|---|
| surefire default (`surefire.excludes`) | excluye `*E2ETest.java`, `*IntegrationTest.java` (sufijos inexistentes, 0 ficheros) | NO |
| perfil Maven `integration` (includes) | `*Test.java`, `*E2ETest.java`, `*IntegrationTest.java` | NO |
| maven-failsafe-plugin | — (no existía) | — |

**Resultado:** los 22 `*IT.java` eran huérfanos de TODO perfil (default y `-Pintegration`). 100% no ejecutados por lifecycle. Confirma alcance corregido Fase 2 (22/22).

## Hallazgo adicional — confusión nominal de perfiles en CI

| Origen | Comando | Perfil real |
|---|---|---|
| `apps/backend-2fa/Jenkinsfile:199` | `mvn verify -Pintegration-tests` | **inexistente** → Maven lo descarta en silencio, 0 IT |
| `infra/jenkins/Jenkinsfile:61` | `mvn clean verify` (profile Spring `test`) | default → 0 IT |
| `.github/workflows/ci.yml` | `mvn test` (x2) | default → 0 IT |

Ningún pipeline CI ejecutaba los 22 IT. El `post{}` del Jenkinsfile (línea 204) ya recolectaba `failsafe-reports/**/*.xml` — el pipeline se diseñó esperando failsafe que nunca se configuró.

## Cambios aplicados (Parte A)

1. **`apps/backend-2fa/pom.xml`** — `maven-failsafe-plugin` añadido al perfil `integration`, includes `**/*IT.java`, goals `integration-test` + `verify`. Surefire y perfil default intactos (`mvn test` sigue limpio, 0 IT).
2. **`apps/backend-2fa/Jenkinsfile:199`** — `-Pintegration-tests` → `-Pintegration` (perfil real).

Decisión nomenclatura: consolidar en `integration` (descartada opción `it`/`integration-tests` por fragmentación nominal — docs QA históricas FEAT-001/008 ya usan `-Pintegration`).

## Parte B — Ejecución real y matriz (2026-05-28)

### Infraestructura levantada
Los 22 IT NO son homogéneos. Tres familias con infra distinta:

| Familia | Nº | Profile | Postgres | Redis |
|---|---|---|---|---|
| `@WebMvcTest` (slice) | 5 | — | no | no |
| `IntegrationTestBase` | 4 | `test` | Testcontainers | `localhost:6379` sin pw |
| `integration-compose` (Savings/Bizum/Pfm) | 13 | `integration-compose` | compose `5433` | compose `6380` con pw |

Levantado: compose canónico (`postgres` 5433 + `redis` 6380 con `--requirepass`) + contenedor Redis efímero `6379` sin password para `IntegrationTestBase`. JAVA_HOME 21 vía `.sofia/tmp/run-mvn.py`.

### Matriz real PASS/FAIL/ERROR — 22 IT (failsafe ejecuta el 100%)

| IT | Familia | @Test | Resultado |
|---|---|---|---|
| AutoContributionSchedulerIT | compose | 1 | ✅ PASS |
| BizumAdapterIT | compose | 2 | ✅ PASS |
| BizumExpireIT | compose | 2 | ✅ PASS |
| BizumFlywayIT | compose | 2 | ✅ PASS |
| BizumPrecisionIT | compose | 2 | ✅ PASS |
| ConfigureAutoRuleIdempotencyIT | compose | 1 | ✅ PASS |
| ContributeManualConcurrencyIT | compose | 1 | ✅ PASS |
| JpaAccountReserveAdapterIT | compose | 5 | ✅ PASS |
| MilestoneEmissionIT | compose | 1 | ✅ PASS |
| **PfmControllerIT** | compose | 5 | ✅ **PASS (DEBT-055 reproducido verde)** |
| SavingsControllerIT | compose | 15 | ✅ PASS |
| SavingsFlywayIT | compose | 5 | ✅ PASS |
| ShedLockEnabledIT | compose | 2 | ✅ PASS |
| SpringContextIT | TestcontainersBase | 1 | ⛔ @Disabled → DEBT-064 |
| DashboardJpaAdapterIT | TestcontainersBase | 1 | ⛔ @Disabled → DEBT-064 |
| AccountRepositoryAdapterIT | TestcontainersBase | 1 | ⛔ @Disabled → DEBT-064 |
| LoginControllerIT | TestcontainersBase | 1 | ⛔ @Disabled → DEBT-064 |
| AccountUnlockControllerIT | WebMvcTest | 1 | ⛔ @Disabled → DEBT-065 |
| LoginContextControllerIT | WebMvcTest | 1 | ⛔ @Disabled → DEBT-065 |
| SecurityConfigHistoryControllerIT | WebMvcTest | 1 | ⛔ @Disabled → DEBT-065 |
| SseNotificationControllerIT | WebMvcTest | 1 | ⛔ @Disabled → DEBT-065 |
| StatementControllerIT | WebMvcTest | 1 | ⛔ @Disabled → DEBT-065 |

**Resultado post-remediación:** 13 clases PASS (44 @Test verdes) · 9 @Disabled · **0 fail / 0 error**. Build `mvn verify -Pintegration` VERDE.

### DEBT-055 — cierre
`PfmControllerIT` declarado en G-6 S25 "5 ITs PASS" sin evidencia ejecutable (reproducción S25: 0 PASS/1 ERROR). Con failsafe configurado + perfil `integration-compose` operativo: **5/5 PASS reproducible**. El claim S25 era correcto en intención pero no ejecutable entonces (failsafe ausente). DEBT-055 cerrable con esta evidencia.

### Triage S2 — diagnóstico empírico de los 9 ERROR

Causa raíz inicial común: `Unable to find a @SpringBootConfiguration` (resuelto por failsafe). Al ejecutar, afloran DOS causas estructurales distintas, **ninguna fix <30 líneas**:

- **DEBT-064 (4 IT, Grupo Testcontainers):** las 3 estrategias de Testcontainers 1.20.1 fallan con `Status 400` contra el daemon Docker Desktop 29.4.1 (`Could not find a valid Docker environment`). No resoluble por env (`DOCKER_HOST`/socket override/Ryuk disabled probados). Es la misma razón por la que Savings/Bizum migraron a `integration-compose`. Remediación S27: migrar estos 4 a `integration-compose`.
- **DEBT-065 (5 IT, Grupo WebMvcTest):** son slices HTTP puros mal nombrados `*IT`. Prueba empírica con `@ContextConfiguration(classes=BackendTwoFactorApplication.class)` carga la app completa en un slice sin JPA → `NoSuchBeanDefinitionException: entityManagerFactory` (cadena `kycAuthorizationFilter→kycVerificationRepository→entityManagerFactory`). Remediación S27: renombrar a `*Test` (vuelven a surefire como slices).

Decisión HITL-PO: ambos a `@Disabled` + DEBT, corrección estructural diferida a S27 (proporcionalidad CMMI L3: no ampliar alcance de un hotfix de auditoría con migraciones/renames sobre clase guardrail GR-003).

## Reconciliaciones de configuración (este commit)

- **BUG-PO universo:** report `BUG-REPORT-PO-FEAT-023-sprint25.md` declaraba 36 (resumen ejecutivo: 9+14+13) pero el cuerpo enumera 35 (9 crít + 13 mayor + 13 menor). Off-by-one en celda "Mayor". Universo real = **35**, diferidos = **20** (no 21). No existe BUG-PO-036. `session.json.sprint_history.sprint_25.bug_po` corregido a `{total:35, deferred:20}`.

*NC-CMMI-001 Fase 3 Parte A · SOFIA · BankPortal · Banco Meridian*
