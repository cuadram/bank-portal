# Code Review Report — S27 Saneamiento + Deudas tecnicas (rev.2, post-panel adversarial)
**Fecha:** 2026-07-17 · **Agente:** code-reviewer tier A + panel adversarial (3 subagentes) · **Rango:** 65a416b^..HEAD + fix DEBT-067 (working tree)

## Veredicto: APROBADO (tras corregir 1 hallazgo MAYOR)
Revision inicial single-pass = APROBADO limpio. El panel adversarial REFUTO ese veredicto y encontro un defecto real, ya corregido y re-verificado.

## Hallazgos del panel adversarial
### RV-001 (MAYOR, CORREGIDO) — Starvation en AutoContributionScheduler (DEBT-053 -> DEBT-067)
- Detectado por: subagente de correctness/concurrencia.
- Defecto: el drain-pagina-0 rompia el bucle cuando la cabeza del orden (Sort nextExecutionAt,id) se llenaba de reglas pegajosas (goal inactivo / excepcion rollback / idempotencia, que NO avanzan next_execution_at y se hunden hacia la cabeza). Con >page-size (200) pegajosas, las reglas sanas posteriores NO se procesaban NUNCA (starvation silenciosa, no diferimiento de un ciclo como decia el comentario). Regresion introducida por la paginacion de DEBT-053 (la version previa sin paginar procesaba todo).
- Fix (DEBT-067): paginacion por keyset (seek) sobre (next_execution_at, id). El cursor avanza siempre hacia delante; cada regla se intenta una vez y las pegajosas quedan detras del cursor. Eliminada la starvation.
- Ficheros: GoalAutoRuleRepositoryPort, JpaGoalAutoRuleRepository (@Query keyset), JpaGoalAutoRuleAdapter, AutoContributionScheduler.
- Verificacion: nuevo test unitario reglasSanasNoSufrenStarvation (PASS) + AutoContributionSchedulerIT keyset contra Postgres real (PASS).

### RV-002 (RIESGO REGISTRADO -> DEBT-066) — Cobertura de endpoints de seguridad
- Detectado por: subagentes de seguridad y QA.
- DEBT-065 renombro 5 *IT->*Test pero quedaron @WebMvcTest + @Disabled (no ejecutan): AccountUnlock, LoginContext, SecurityConfigHistory (seguridad), Statement, SSE. Sin cobertura ejecutable hoy. Registrado como DEBT-066 (candidato S28). Recomendacion: bloqueante para endpoints de auth/seguridad -> tests compensatorios.

### Refutados / residuales menores
- Falso-verde del validador (DEBT-054): REFUTADO — cadenas de perfil separadas (prod valida application-prod.yml, no los YAML de test). Residual menor: prod es warning, no bloqueante (por diseno).
- log.debug con importes en UpdateGoalUseCase (CWE-532): residual menor, aceptable si DEBUG off en prod.

## Checks automaticos: stg-pre-check EXIT 0 · GR-005 OK · Conventional Commits 100%.

---
_Rev.2 generada tras verificacion adversarial · 2026-07-17 · Veredicto APROBADO con RV-001 corregido y RV-002 registrado (DEBT-066)_


## Addendum rev.3 (DEBT-066 resuelto)
RV-002 cerrado via Opcion B: los 5 tests de endpoints sensibles se re-habilitaron como IT de contexto completo (perimetro de seguridad, sin token -> 401), restaurando cobertura ejecutable (22 IT/76/0). El modelo de authz por scope que asumian NO existe en la app y queda como SEC-OBS-S27-01 (decision S28). 13 unit skipped restantes (Amortization/Session/Notification) ajenos a seguridad -> DEBT S28.
