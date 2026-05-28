# Fase 3 — Fix estructural Maven failsafe (DEBT-062)

**NC-CMMI-001** · Fase 3 · Branch `hotfix/qa-audit-s18-s26`
**Parte A (este commit):** corrección estructural de configuración. **Ejecución de matriz IT diferida a sesión dedicada (handoff).**

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

## Pendiente (Parte B — sesión dedicada)

- Ejecutar `mvn verify -Pintegration` con infra (Postgres vía Testcontainers; Redis `localhost:6379` sin password requerido por `IntegrationTestBase` — fricción con compose canónico que usa `--requirepass` en 6380).
- Capturar matriz real PASS/FAIL/ERROR de los 22 IT (incl. `PfmControllerIT` / DEBT-055).
- Triage S2: fix <30 líneas vs `@Disabled`+DEBT por cada IT que falle.
- Validar 3 clases base (`IntegrationTestBase`, `SavingsIntegrationTestBase`, `BizumIntegrationTestBase`).

## Reconciliaciones de configuración (este commit)

- **BUG-PO universo:** report `BUG-REPORT-PO-FEAT-023-sprint25.md` declaraba 36 (resumen ejecutivo: 9+14+13) pero el cuerpo enumera 35 (9 crít + 13 mayor + 13 menor). Off-by-one en celda "Mayor". Universo real = **35**, diferidos = **20** (no 21). No existe BUG-PO-036. `session.json.sprint_history.sprint_25.bug_po` corregido a `{total:35, deferred:20}`.

*NC-CMMI-001 Fase 3 Parte A · SOFIA · BankPortal · Banco Meridian*
