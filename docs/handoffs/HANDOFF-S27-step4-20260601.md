# HANDOFF — Sprint 27 · Step 4 (DEVELOP) · 2026-06-01

> Feature **S27-saneamiento+deudas** · BankPortal / Banco Meridian · SOFIA v2.8
> Repo `/Users/cuadram/proyectos/bank-portal` · branch `develop` · remote `github.com/cuadram/bank-portal`

## Estado de git (CRÍTICO)
- **7 commits ahead de `origin/develop`, 0 behind. NADA pusheado** (pendiente autorización explícita de Angel).
- Working tree limpio salvo `.sofia/pav/` (backups, nunca se stagea).
- Commits S27 locales (orden cronológico inverso):
  - `6fa96e3` DEBT-062 verificación 17/17 IT verde + repara regresión DEBT-064
  - `64c3c1e` DEBT-059 sanear excepción savings (CWE-209)
  - `d55a195` DEBT-064 migrar 4 IT Testcontainers→integration-compose (26/26)
  - `78c3b2b` DEBT-065 reclasificar 5 slices @WebMvcTest *IT→*Test (rename-only)
  - `8e43409` LA-027-02 (ADR numbering governance)
  - `9add9c6` S27 re-sync Jira + Steps 2/3/3b + fix dashboard
  - `65a416b` S27 Step 1 Sprint Plan + G-1 (23 SP)

## Hecho esta sesión (Step 4 DEVELOP)
| Deuda | Jira | SP | Estado | Commit |
|---|---|---|---|---|
| DEBT-065 | SCRUM-177 | 2 | hecho (rename) · ver nota reconciliación | `78c3b2b` |
| DEBT-064 | SCRUM-176 | 5 | ✅ CLOSED (+nota corrección) | `d55a195` |
| DEBT-059 | SCRUM-180 | 1 | ✅ CLOSED | `64c3c1e` |
| DEBT-062 | SCRUM-175 | 1 | ✅ CLOSED | `6fa96e3` |

**Hito:** los **17 IT** del proyecto pasan en verde con `mvn -Pintegration-compose verify` (77 tests, 0F/0E, failsafe auto-descubre). DEBT-062 destapó y reparó una **regresión** que DEBT-064 había introducido al reescribir destructivamente `application-integration-compose.yml` (se vació config de dominio de la que dependían 13 IT). Reparado: fichero = original `8eee244` + deltas it-db + bloque aditivo `application.security.jwt`. Lección → **LA-027-04**.

## Registro de deudas
- **CLOSED S27:** DEBT-059, DEBT-062, DEBT-064.
- **OPEN:** DEBT-053, DEBT-054, DEBT-060, DEBT-063, DEBT-065(ver nota), DEBT-066.
- LAs S27 en `session.json.lessons_learned` (125 total): LA-027-01..04, todas `sofia_core_candidate=true` (promover en Step 9).

### ⚠️ Reconciliación pendiente — DEBT-065
Trabajo hecho y committed (`78c3b2b`): 5 slices `@WebMvcTest` renombrados `*IT`→`*Test`. PERO siguen `@Disabled` (la app está en paquete hermano `.twofa`, no alcanzable por `@WebMvcTest`; bloqueo estructural → **DEBT-066**, target S28). En `session.json` DEBT-065 figura **OPEN**. **Decisión para Angel:** cerrar DEBT-065 (reclasificación cumplida) con nota de que la cobertura runtime se difiere a DEBT-066, o mantenerlo OPEN. No tocado en esta sesión.

## SIGUIENTE TAREA — DEBT-054 (SCRUM-178, 3 SP) · GR-CONFIG-001
**Decisión de diseño ABIERTA — Angel no la confirmó aún. Empezar la próxima sesión por aquí.**

### Contexto verificado (no re-investigar)
- Problema: el `application.yml` de **test** (`src/test/resources/application.yml`, 594b) **ensombrece** al de main (5 KB) en el classpath de test, y solo aporta `totp`, `jwt`, `rate-limit`. Por eso cada profile-yml de test DEBE contener el resto (`bank.*`, `notification.*`, `notifications.*`, `session.deny-link`, `trusted-device`). Vaciar un profile-yml rompe el contexto (causa de la regresión DEBT-064).
- 8 ficheros yml: main {`application.yml`, `application-kyc.yml`, `application-prod.yml`, `application-staging.yml`}; test {`application.yml`, `application-test.yml`, `application-integration.yml`, `application-integration-compose.yml`}.
- `validate-yaml-profiles.js` **NO existe** → crear en `.sofia/scripts/`.
- `GUARDRAILS.md` (8938b) **no** tiene GR-CONFIG-001 → añadir.
- **No hay js-yaml ni python-yaml** → el validador debe ser **dependency-free** (parser YAML propio en node) para correr en CI sin instalar.
- Universo de placeholders (`grep -rhoE '\${[^:}]+}' src/main/java`): **18 total**, de los cuales **14 punteados** (`bank.core.*`, `bank.products.{loan.tae,deposit.tin,deposit.tae}`, `bank.savings.auto.{cron,lock-max,lock-min}`, `notification.email.{from,deny-base-url}`, `notifications.push.{vapid-public-key,vapid-private-key}`, `session.deny-link.hmac-key`, `trusted-device.hmac-key`) y **4 estilo-env** mayúsculas (`JWT_SECRET`, `JWT_PRE_AUTH_SECRET`, `TOTP_AES_KEY`, `TOTP_ISSUER`) que se resuelven por entorno/default.

### Diseño RECOMENDADO (a confirmar por Angel)
Validador con check central = **resolubilidad de placeholders** (preferido sobre el lint literal "replicar subárbol"):
1. Extraer de `src/main/java` los `${a.b.c}` sin default; **filtrar a punteados** (excluir env-style mayúsculas) → conjunto requerido R.
2. Para cada cadena de profile de **test** {`test`, `integration`, `integration-compose`}: aplanar (parser propio) `application.yml`(test) + `application-{profile}.yml` → conjunto disponible A.
3. Si `r∈R` no está en A → **ERROR** con tabla por-profile de claves faltantes; exit ≠ 0.
4. Profiles **main** (prod/staging/kyc) → modo **warning** (usan env vars; bloquear daría falsos positivos).

**Decisiones que faltan confirmar:**
- (a) Enfoque: **resolubilidad de placeholders** (recomendado) vs lint literal "replicar subárbol en todos los profile-yml".
- (b) Profiles main: **warning** (recomendado) vs bloqueante.

### Wiring previsto
- GR-CONFIG-001 en `.sofia/GUARDRAILS.md` (bloqueante en G-4b).
- Ítem en checklist devops pre-G-7 (SKILL devops).
- DoD (SRS REQ-S27-04): script + guardrail documentado + validación verde de los 4 profiles de test (los 17 IT ya en verde son la prueba de que R⊆A hoy).

## Otros pendientes (backlog S27 / horizonte)
- **DEBT-053** (SCRUM-179, 2 SP): paginar `AutoContributionScheduler` (LLD §11; `findDueForExecution` → `Page` + `while nextPageable`). Sin bloqueo.
- **BUG-PO PFM** (SCRUM-181 3 SP / SCRUM-182 6 SP): umbrellas visuales, requieren entorno frontend (4201) + prototipo PROTO-FEAT-023.
- **DEBT-063** (SCRUM-176? no — es legal): BLOQUEADA, legal gate Banco Meridian offline (DR-S27-001). Angel reporta cuando resuelva.
- **Push de los 7 commits**: pendiente autorización explícita de Angel.
- **Promoción LA-027-01..04 a SOFIA-CORE**: en Step 9.
- Cadencia Jira: las 8 issues siguen **En curso**; cierre formal en Step 9.

## Reanudar (boot protocol GR-CORE-037)
1. Leer `.sofia/session.json` (`current_step=4`), `pwd`/remote/branch (`develop`), este HANDOFF.
2. Para reactivar IT (si se necesita correr la suite):
   - `docker compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.it.yml up -d postgres redis-it`
   - `cat apps/backend-2fa/src/test/resources/it-db/it-db-setup.sql | docker exec -i bankportal-postgres psql -U bankportal -d bankportal -v ON_ERROR_STOP=1`
   - `mvn -Pintegration-compose verify` (desde `apps/backend-2fa`, `JAVA_HOME` openjdk@21).
3. Infra efímera **parada** al cerrar esta sesión (se relevanta con el paso 2).

_Generado al cierre de sesión 2026-06-01. Nada pusheado; mutaciones solo locales._
