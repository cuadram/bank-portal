# Fase 2 · Matriz Retrospectiva S18-S26 — Integration Tests vs Lifecycle Maven

**NC-CMMI-001** · `hotfix/qa-audit-s18-s26` · Generado 2026-05-28
**Prácticas CMMI impactadas:** PP/QPM SP1.2 · VER SP3.2 · CM SP3.2
**Origen:** Fase 1 (hotfix) confirmó empíricamente que `PfmControllerIT` declarado PASS en S25 no es ejecutable. Esta fase extiende la verificación a los 9 sprints.

---

## 1. Hallazgo estructural (causa raíz, verificado en `apps/backend-2fa/pom.xml`)

`maven-surefire-plugin` (build default) — patrones efectivos:

| Scope | `<include>` | `<exclude>` |
|---|---|---|
| Build default | `**/*Test.java` | `**/*E2ETest.java`, `**/*IntegrationTest.java` |
| Perfil `-Pintegration` | `**/*Test.java`, `**/*E2ETest.java`, `**/*IntegrationTest.java` | `NINGUNO_EXCLUIDO_INTENCIONALMENTE` |

**Conclusión:** el patrón `**/*IT.java` **NO aparece en ningún `<include>` de ningún perfil**, y **no existe `maven-failsafe-plugin`** configurado. Por tanto:

> **Los 22 ficheros `*IT.java` del proyecto (100%, no 11/50%) son huérfanos del lifecycle Maven.** Nunca se ejecutan, ni con `mvn test` ni con `mvn test -Pintegration`. Suman **100 métodos `@Test`** de integración que jamás corrieron en build alguno.

### Corrección de alcance respecto a NC-CMMI-001 (aprobada HITL-PO 2026-05-28)

El `finding`/`root_cause` originales estimaron **"11 IT.java huérfanos (50% de 22)"**. La verificación exhaustiva del POM demuestra que **el alcance real es 22/22 (100%)**: ningún perfil incluye el sufijo `IT`. Se ajusta `cmmi_nc.scope` y `DEBT-062` en consecuencia.

---

## 2. Matriz IT × módulo × sprint origen × lifecycle

Estado lifecycle uniforme: **HUÉRFANO** (ningún include matchea). Columna "QA claim" indica si algún reporte S18-S26 declaró ese IT/su módulo como ejecutado y PASS.

| # | Fichero `*IT.java` | Módulo | @Test | Creado | Sprint origen | Lifecycle | QA claim PASS |
|---|---|---|---|---|---|---|---|
| 1 | auth/integration/AccountUnlockControllerIT | auth | 6 | 2026-03-17 | S18 (FEAT-016) | HUÉRFANO | S18 @SpringBootTest (L372) |
| 2 | auth/integration/LoginContextControllerIT | auth | 5 | 2026-03-17 | S18 (FEAT-016) | HUÉRFANO | S18 @SpringBootTest (L372) |
| 3 | audit/integration/SecurityConfigHistoryControllerIT | audit | 6 | 2026-03-17 | S18 (FEAT-016) | HUÉRFANO | S18 @SpringBootTest (L372) |
| 4 | notification/integration/SseNotificationControllerIT | notification | 6 | 2026-03-17 | S18 (FEAT-016) | HUÉRFANO | S18 @SpringBootTest (L372) |
| 5 | account/StatementControllerIT | account | 7 | 2026-03-19 | S18 (FEAT-016) | HUÉRFANO | S18 @SpringBootTest (L372) |
| 6 | integration/account/AccountRepositoryAdapterIT | account | 4 | 2026-03-26 | S19 (FEAT-017) | HUÉRFANO | S19 "9/9 PASS" (L36,683) |
| 7 | integration/auth/LoginControllerIT | auth | 5 | 2026-03-26 | S19 (FEAT-017) | HUÉRFANO | S19 "9/9 PASS" (L36,683) |
| 8 | integration/dashboard/DashboardJpaAdapterIT | dashboard | 8 | 2026-03-26 | S19 (FEAT-017) | HUÉRFANO | S19 "9/9 PASS" (L36,683) |
| 9 | integration/SpringContextIT | integration | 9 | 2026-03-30 | S19 (FEAT-017) | HUÉRFANO | S19/S21/S24 "SpringContextIT PASS" |
| 10 | integration/BizumAdapterIT | bizum | 2 | 2026-04-14 | S23 (FEAT-021) | HUÉRFANO | — (S23 sin claim IT) |
| 11 | integration/BizumExpireIT | bizum | 2 | 2026-04-14 | S23 (FEAT-021) | HUÉRFANO | — |
| 12 | integration/BizumFlywayIT | bizum | 2 | 2026-04-14 | S23 (FEAT-021) | HUÉRFANO | — |
| 13 | integration/BizumPrecisionIT | bizum | 2 | 2026-04-14 | S23 (FEAT-021) | HUÉRFANO | — |
| 14 | pfm/PfmControllerIT | pfm | 5 | 2026-04-17 | S25 (FEAT-023) | HUÉRFANO + ERROR estructural | **S25 "TC-IT-005 PASS — 5 ITs" (L60)** |
| 15 | account/JpaAccountReserveAdapterIT | account | 5 | 2026-04-28 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 16 | savings/SavingsControllerIT (api) | savings | 15 | 2026-04-28 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 17 | savings/SavingsFlywayIT | savings | 5 | 2026-04-28 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 18 | savings/AutoContributionSchedulerIT | savings | 1 | 2026-04-28 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 19 | savings/MilestoneEmissionIT | savings | 1 | 2026-04-28 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 20 | savings/infrastructure/scheduler/ShedLockEnabledIT | savings | 2 | 2026-05-07 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 21 | savings/api/ConfigureAutoRuleIdempotencyIT | savings | 1 | 2026-05-08 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |
| 22 | savings/api/ContributeManualConcurrencyIT | savings | 1 | 2026-05-08 | S26 (FEAT-024) | HUÉRFANO | S26 "145/145 IT PASS" (L17) |

**Totales:** 22 ficheros · 100 métodos `@Test` · 0 ejecutados por cualquier perfil Maven.

> Nota sprint-origen: anclado a fecha de primer commit (`git log --diff-filter=A`) cruzada con feature↔sprint de los reportes QA. S20/S22 no introdujeron `*IT.java` nuevos pero sus reportes reclamaron ITs preexistentes (ver `03-falsified-evidence-list.md`).
