# STEP 4 — Cierre Fase H · FEAT-024 Objetivos de Ahorro

**Sprint:** 26 · **Feature:** FEAT-024 · **Step:** 4 (Developer) · **Fase:** H (G-4b guardrail)
**Fecha cierre:** 2026-05-08
**Branch:** feature/FEAT-024-sprint26
**HEAD:** 8d4e0bd
**Tests canónicos:** 145/145 PASS
**Gate pendiente:** G-4b (HITL TL approval para avanzar a Step 5)

---

## 1. Objetivo de Fase H

Fase H es el **guardrail G-4b** que cierra Step 4 (Developer) tras Fase G (Frontend). Sus objetivos:

1. Verificar que el backend (Fases A..F) y frontend (Fase G) compilan, arrancan, y se integran correctamente.
2. Cerrar las tres deudas técnicas pendientes que el Developer Agent puede asumir:
   - **DEBT-048** (OpenAPI 3.1 / springdoc accesible sin JWT) — H.3
   - **DEBT-049** (script validador OpenAPI vs smoke) — H.4
   - **DEBT-050** (checklist técnica devops pre-G-7) — H.5
   - **DEBT-051** (cableado real del LockProvider de ShedLock) — H.2
3. Validar end-to-end con compose + smoke + lista canónica de tests.
4. Entregar handoff limpio a Step 5 (Code Reviewer).

---

## 2. Sub-fases ejecutadas

| Sub-fase | Descripción | Resultado | Commit |
|---|---|---|---|
| H.1 | `mvn compile` diagnóstico | BUILD SUCCESS · 0 warnings nuevos | (lectura) |
| H.2 | SchedulingConfig + ShedLockEnabledIT (DEBT-051) | tests PASS · LockProvider Jdbc cableado | f38c6ad |
| H.3 | SecurityConfig springdoc paths sin JWT (DEBT-048) | curl /v3/api-docs sin Authorization → 200 | bb32da5 |
| H.4 | `validate-smoke-vs-openapi.js` (DEBT-049) | script funcional · candidato GR-CI-002 | 20b64c1 |
| H.5 | SKILL.md devops checklist pre-G-7 (DEBT-050) | 10 items obligatorios · 2358 bytes | 20b64c1 |
| **H.6** | Hotfix `ng build production` (descubierto en cierre) | jwt-decode + AutoRuleFormComponent decorator | 4e12abd |
| **H.7** | V18c → V31 rename Flyway + cierre verde | 145/145 PASS · tabla shedlock aplicada | 8d4e0bd |

H.6 y H.7 son sub-fases **no previstas** en el handoff original. Ambas se descubrieron al ejecutar la propia checklist H.5 — auto-validación operativa de la checklist nueva.

---

## 3. Bugs descubiertos por Fase H

### Bug H.6.1 · AutoRuleFormComponent decorator orphan (introducido en G.3)

**Síntoma:** `ng build --configuration production` falla con TS1206 `Decorators are not valid here` + TS-996001 `class is not a directive, component, or pipe`.

**Causa raíz:** El fichero `auto-rule-form.component.ts` tenía `interface UpcomingExecution { label: string; }` insertado entre el cierre `})` del `@Component` (línea 442) y la declaración `export class AutoRuleFormComponent` (línea 445). El compilador AOT trata el decorador como aplicado al `interface` (ilegal en TypeScript) y la clase queda sin decorador efectivo.

**Por qué pasó G.3, G.4 y G.5 sin detectarse:** `ng test` y `ng serve` (modo desarrollo) no aplican AOT estricto. Solo `ng build --configuration production` con AOT lo detecta. Ningún punto del pipeline anterior a Fase H ejecutaba ese build.

**Fix:** Mover la interface a la zona de tipos auxiliares antes de `DAY_OPTIONS`. Cambio puramente estructural, delta neto 0 bytes, 0 impacto funcional.

### Bug H.6.2 · jwt-decode falta en package.json (heredado pre-S15)

**Síntoma:** `Could not resolve "jwt-decode"` + `TS2307 Cannot find module 'jwt-decode'` en `core/auth/token.service.ts:4`.

**Causa raíz:** `token.service.ts` importa `{ jwtDecode } from 'jwt-decode'` desde al menos Sprint 15, pero la dependencia nunca llegó a `package.json`. Probablemente alguien la instaló localmente con `npm install jwt-decode` sin `--save` y el `package-lock.json` no se actualizó.

**Por qué nunca se detectó:** Sin `ng build production` ejecutándose en el pipeline (≥10 sprints sin esta validación), la falta no era visible. `ng test`/`ng serve` resolvían el módulo desde `node_modules` local del developer.

**Fix:** Añadir `"jwt-decode": "^4.0.0"` a `dependencies` (orden alfabético). Versión 4.x es la única compatible con el import named ya en uso (la 3.x usa default export).

### Bug H.7 · V18c__shedlock.sql out-of-order

**Síntoma:** `relation "shedlock" does not exist` al ejecutar `AutoContributionSchedulerIT` y `ShedLockEnabledIT`. La tabla nunca llegó a crearse.

**Causa raíz:** Flyway `out-of-order=false` (default seguro). La migración `V18c__shedlock.sql` se diseñó originalmente para ejecutarse en S18 (ADR-028), pero en este proyecto la BD tiene aplicadas V19..V30 desde sprints anteriores. Cuando Flyway encuentra una nueva V18c entre V18 y V19 ya aplicadas, la trata como out-of-order y la **ignora silenciosamente**.

**Fix:** `git mv V18c__shedlock.sql V31__shedlock.sql` (V30 era la última aplicada). Mantiene `out-of-order=false` en producción (más seguro) y permite que la migración se aplique en orden secuencial. El nombre `V18c` se conserva en comentarios para trazabilidad histórica del ADR-028.

---

## 4. Validación end-to-end (criterios cierre Step 4)

| Criterio handoff sección 5 | Resultado |
|---|---|
| `mvn -pl apps/backend-2fa compile` SUCCESS · 0 warnings nuevos | ✅ |
| Tests savings PASS · ≥143 + ShedLockEnabledIT | ✅ **145/145** |
| `docker compose up -d` · contenedores healthy | ✅ 5/5 healthy (postgres, redis, backend, frontend, mailhog) |
| `actuator/health` UP · DB UP · Redis UP | ✅ |
| Flyway V29 (savings) aplicada | ✅ |
| Flyway V31 (shedlock, antes V18c) aplicada | ✅ |
| Tabla shedlock creada con PK pk_shedlock | ✅ |
| OpenAPI `/api/v1/savings/**` completo | ✅ 6 paths (goals, goals/{id}, /auto-rule, /contributions, /milestones, /dashboard-widget) |
| SecurityConfig pasa springdoc sin JWT | ✅ HTTP 200 sin Authorization |
| `swagger-ui.html` accesible | ✅ HTTP 302 redirect típico |
| Frontend `ng build --configuration production` SUCCESS | ✅ (post-H.6) |
| `validate-smoke-vs-openapi.js` ejecuta correctamente | ✅ Reporta drift smoke-v1.25 vs OpenAPI S26 (correcto: smoke-test-v1.26.0.sh lo creará Step 7) |
| Commit final + push origin · HEAD == origin/HEAD | ✅ 8d4e0bd |
| GR-GIT-001: 0 deletados en working tree | ✅ |

---

## 5. Lecciones aprendidas candidatas (para Step 8b LA promotion)

### LA-026-H1 · ng build --configuration production en checklist pre-G-4b

**Regla candidata:** Cualquier sprint que toque frontend (Step 4 Fase G) DEBE ejecutar `ng build --configuration production` antes del cierre de Fase G, no esperar a Fase H. AOT detecta clases de errores que `ng test` y `ng serve` no detectan (decoradores mal posicionados, dependencias ausentes en package.json, tipos cíclicos, tree-shaking conflicts).

**Justificación:** En Fase H detectamos 2 bugs que llevaban semanas sin detectarse (jwt-decode heredado · ≥10 sprints) y 1 introducido en este mismo sprint (decorator orphan en G.3). Ambos hubieran llegado a producción si no hubiéramos levantado compose con `--build` en cierre.

**Implementación sugerida:** Añadir item nuevo a `.sofia/skills/ux-ui-designer/SKILL.md` y/o `.sofia/skills/angular-developer/SKILL.md` para que sea exit criteria de Fase G (no solo de Fase H).

### LA-026-H2 · Flyway: prefijo numérico estrictamente creciente

**Regla candidata:** Las migraciones Flyway con sufijo letra (`V<N>c__...sql` para "complementaria") **NO son seguras** en BD persistentes con migraciones N+1 ya aplicadas. Convención preferida: números estrictamente crecientes (V31, V32, ...). Si una migración llega tarde, va al final.

**Justificación:** `V18c__shedlock.sql` se diseñó para S18 (ADR-028) y se aplicó correctamente en su día. Pero al re-aparecer en S26 con V19..V30 ya en `flyway_schema_history`, Flyway con `out-of-order=false` (default) la ignoró silenciosamente. El bug solo se detectó al ejecutar `ShedLockEnabledIT.shedlockTable_exists`.

**Implementación sugerida:** Añadir a `.sofia/skills/architect/SKILL.md` la regla "nuevas migraciones Flyway siempre con número > max(flyway_schema_history.version) en cualquier entorno", y a `.sofia/skills/devops/SKILL.md` un check pre-deploy.

### LA-026-H3 · Primera ejecución compose + lista canónica obligatoria al cierre Step 4

**Regla candidata:** Antes de declarar Step 4 listo para gate G-4b, ejecutar `docker compose down -v && docker compose up -d --build` (BD recién flyway-poblada) seguido de la lista canónica completa de tests `-Dtest=...`. Sin `down -v`, residuos de runs anteriores en BD persistente pueden enmascarar fallos de aislamiento entre tests.

**Justificación:** En la primera ejecución de la lista canónica encontramos `AutoContributionSchedulerIT` falló con `expected:1 but was:0` debido a contaminación de estado. Tras `down -v` y reaplicación Flyway: 145/145 PASS. Sin esta práctica, hubiéramos cerrado Step 4 con tests rojos enmascarados.

---

## 6. Artefactos producidos (Fase H)

### Código del producto
- `apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/infrastructure/config/SchedulingConfig.java` (nuevo · 2120 bytes)
- `apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/savings/infrastructure/scheduler/ShedLockEnabledIT.java` (nuevo · 2627 bytes)
- `apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/infrastructure/config/SecurityConfig.java` (modificado · +2 líneas permitAll springdoc)
- `apps/backend-2fa/src/main/resources/db/migration/V31__shedlock.sql` (rename desde V18c · header actualizado)
- `apps/frontend-portal/package.json` (modificado · +1 línea jwt-decode dependency)
- `apps/frontend-portal/src/app/features/savings/components/auto-rule-form/auto-rule-form.component.ts` (modificado · interface movida · delta 0 bytes)

### Infraestructura SOFIA
- `.sofia/scripts/validate-smoke-vs-openapi.js` (nuevo · 6980 bytes · candidato GR-CI-002)
- `.sofia/skills/devops/SKILL.md` (modificado · +2358 bytes checklist pre-G-7)

### Persistence Protocol
- `.sofia/session.json` (actualizado · phases_completed += H_smoke · h_subphases_completed=[H.1..H.7])
- `.sofia/sofia.log` (8 entradas appendidas)
- `.sofia/snapshots/step-4-fase-h-cierre-<ts>.json`

---

## 7. Estado del pipeline

```
current_step: 4
status: gate_pending
gate_pending: G-4b
phases_completed: [A..H_smoke]
h_subphases_completed: [H.1, H.2, H.3, H.4, H.5, H.6, H.7]
HEAD: 8d4e0bd (sincronizado con origin)
deletados (GR-GIT-001): 0
```

---

## 8. Pendientes para Step 5 (Code Reviewer)

1. **Revisar 5 commits Fase H** (bb32da5, f38c6ad, 20b64c1, 4e12abd, 8d4e0bd) cuyos diffs son acotados pero tocan SecurityConfig, Flyway, package.json y SchedulingConfig (nuevos archivos transversales).
2. **Validar lecciones aprendidas LA-026-H1, H2, H3** y decidir si pasan a Step 8b para promoción a SOFIA-CORE.
3. **Confirmar criterios de cierre Step 4** según handoff sección 5.
4. **Aprobar gate HITL TL G-4b** para que el pipeline avance a Step 5 oficialmente.

---

**Generado por:** SOFIA Developer Agent · Step 4 · Fase H
**Para:** Code Reviewer (Step 5) · gate HITL TL G-4b
