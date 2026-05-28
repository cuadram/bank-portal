# Fase 4 — Acciones correctivas y preventivas

**NC-CMMI-001** · Fase 4 · Branch `hotfix/qa-audit-s18-s26` · 2026-05-28

## Resumen ejecutivo

NC-CMMI-001 abrió por reporte QA-FEAT-023-sprint25.md G-6 S25 declarando "TC-IT-005 PASS — 5 ITs" sin evidencia ejecutable. Auditoría retrospectiva (Fase 2) demostró que **22/22 `*IT.java`** del backend eran huérfanos del lifecycle Maven (no failsafe-plugin configurado; perfil `integration` no incluía sufijo `*IT.java`; CI invocaba perfil fantasma `integration-tests`). 9 sprints (S18-S26) con claims IT no respaldados, 1 falsificado con evidencia directa (S25 / DEBT-055). Impacto producto: **NULO** (0 defectos producción en 27 sprints consecutivos). Gap de proceso de verificación, no de calidad de producto.

Esta fase consolida las acciones correctivas (lo ya hecho en F1+F3) y deja registradas las preventivas (GR-QA-002 + SKILL qa-tester) para impedir recurrencia.

## Acciones correctivas (ya aplicadas)

### AC-1 · Fase 1 — Hotfix de tests rotos en `main`
- **Commit:** `184e185` (2026-05-20)
- **Objeto:** 5/6 tests rotos del main reparados; item 4 (`AmortizationCalculatorTest TC-LOAN-001/004`) `@Disabled` por DEBT-063 (ambigüedad TIN/TAE, gate legal cliente).
- **Evidencia:** `mvn test` verde en HEAD post-commit.

### AC-2 · Fase 3 Parte A — Configuración estructural Maven failsafe
- **Commit:** `4d8fc59` (2026-05-28)
- **Cambios:**
  - `apps/backend-2fa/pom.xml`: `maven-failsafe-plugin` añadido al perfil `integration` (`includes=**/*IT.java`, goals `integration-test`+`verify`). Surefire/default intactos.
  - `apps/backend-2fa/Jenkinsfile:199`: `-Pintegration-tests` (fantasma) → `-Pintegration` (real).
- **Hallazgo colateral:** ningún pipeline CI ejecutaba los 22 IT.
- **Reconciliación adicional:** BUG-PO S25 universo 36→35 / diferidos 21→20 (off-by-one + BUG-PO-036 inexistente).

### AC-3 · Fase 3 Parte B — Ejecución matriz IT + triage S2
- **Commit:** `d38cbe2` (2026-05-28)
- **Resultado:** `mvn verify -Pintegration` ejecuta el 100% de los 22 IT (antes 0). Build VERDE: 13 clases PASS (44 @Test) / 9 `@Disabled` / 0 fail / 0 error.
- **Triage S2** (ninguno fix <30 líneas, validado empíricamente):
  - **DEBT-064** (Alta, 4 IT): Testcontainers 1.20.1 incompatible con daemon Docker Desktop 29.4.1 (`Status 400`, 3 estrategias). Migrar a `integration-compose` en S27.
  - **DEBT-065** (Media, 5 IT): `@WebMvcTest` mal clasificados como `*IT`. Renombrar a `*Test` en S27.
- **DEBT-055 — cerrable:** `PfmControllerIT` 5/5 PASS reproducible (claim S25 en intención correcto, no ejecutable entonces por failsafe ausente).

## Acciones preventivas (esta fase)

### AP-1 · GR-QA-002 — Evidencia ejecutable obligatoria para claims PASS
- **Fichero:** `.sofia/GUARDRAILS.md` (sección GR-QA-002, BLOQUEANTE · QA Tester · G-6).
- **Exige:** por cada `*Test`/`*IT` declarado PASS en QA Report, adjuntar `TEST-{FQCN}.xml` + commit SHA HEAD + timestamp + conteo del XML + perfil Maven activo.
- **Sin evidencia → claim BLOCKED, no PASS. G-6 BLOQUEADO.**
- **Cubre antipatrón:** DEBT-055 (S25). Cierra recurrencia del gap raíz de NC-CMMI-001.
- **Numeración:** GR-QA-001 reservado como placeholder (sin contenido).

### AP-2 · SKILL qa-tester — 3 ediciones quirúrgicas
- **Fichero:** `.sofia/skills/qa-tester/SKILL.md`
- **Cambios:**
  - **Paso 2b** (Auditoría de integration tests): añadida instrucción canónica `mvn verify -Pintegration` + obligación de adjuntar `failsafe-reports/` + regla "claim PASS solo con XML presente".
  - **Exit Criteria New Feature/Refactor**: 2 checkboxes nuevos:
    - `[ ] mvn verify -Pintegration ejecutado en HEAD (commit SHA registrado) — GR-QA-002`
    - `[ ] failsafe-reports/ adjuntos al QA Report con conteo PASS/FAIL/ERROR/SKIPPED por clase — GR-QA-002`
  - **Plantilla de output**: nueva sección "Evidencia ejecutable de IT (GR-QA-002 — OBLIGATORIO)" con tabla `FQCN | tests | F | E | S | Resultado | XML` y reglas explícitas.

### AP-3 · Checklist pre-G-6 (QA Tester, BLOQUEANTE)
Definido en GR-QA-002. Resumen operativo:

```bash
# 1. Working tree limpio + SHA capturado
git status --porcelain | grep -q . && exit 1
git rev-parse HEAD > .sofia/tmp/qa-evidence-sha.txt

# 2. Ejecutar surefire + failsafe
python3 .sofia/tmp/run-mvn.py test
python3 .sofia/tmp/run-mvn.py verify -Pintegration

# 3. Verificar que cada claim PASS del QA Report tiene XML en target/*-reports/
#    (snippet completo en GR-QA-002)
```

## Acciones detectivas (registradas, no ejecutadas en este hotfix)

### AD-1 · Script `validate-qa-evidence.sh` (LA candidata S27)
- **Objeto:** automatizar la verificación de claims PASS contra XML existentes en `failsafe-reports/`.
- **Estado:** **NO se crea en esta fase** (proporcionalidad CMMI L3: el guardrail manual GR-QA-002 cubre el gap; la automatización es mejora incremental).
- **Acción:** registrar como LA candidata en Fase 5 para promoción a SOFIA-CORE.

## Responsabilidades y firmas

| Acción | Responsable | Estado | Evidencia |
|---|---|---|---|
| AC-1 | Developer + QA | DONE | commit `184e185` |
| AC-2 | Developer | DONE | commit `4d8fc59` |
| AC-3 | QA + HITL-PO | DONE | commit `d38cbe2`, matriz en `04-build-fix-failsafe.md` |
| AP-1 | HITL-PO + QA Lead | DONE | `.sofia/GUARDRAILS.md` (este commit) |
| AP-2 | HITL-PO + QA Lead | DONE | `.sofia/skills/qa-tester/SKILL.md` (este commit) |
| AP-3 | QA Tester (operativo) | ACTIVO desde G-6 próximo (S27+) | GR-QA-002 |
| AD-1 | Diferido S27 | REGISTRADO | LA candidata Fase 5 |

## Trazabilidad CMMI L3

| Práctica CMMI | Cómo se atiende |
|---|---|
| **PP/QPM SP1.2** (collect/analyze process & product measurements) | Matriz IT real (F3B) + evidencia XML obligatoria (GR-QA-002) sustituyen claims sin respaldo. |
| **VER SP3.2** (analyze verification results) | Reporte QA debe enumerar resultados ejecutables por clase, no agregados sin XML. |
| **CM SP3.2** (perform configuration audits) | Pre-G-6 exige HEAD limpio + SHA registrado → auditable a posteriori. |

## Pendiente (Fase 5)

- Promover lecciones a SOFIA-CORE: **LA-026-09** (GR-QA-002), **LA-026-10** (matriz IT real como evidencia G-6), **LA-026-11** (CI profile alignment hallazgo Fase 3A).
- Cierre formal NC-CMMI-001 (`cmmi_nc[0].status = CLOSED`).
- Confirmar cierre DEBT-055 (evidencia 5/5 PASS).

## Pendiente (Fase 6)

- Comunicación al cliente Banco Meridian (draft de carta + firma HITL-PO).

*NC-CMMI-001 Fase 4 · SOFIA · BankPortal · Banco Meridian*
