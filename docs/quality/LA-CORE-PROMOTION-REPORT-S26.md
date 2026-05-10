# LA-CORE Promotion Report — Sprint 26

| Campo | Valor |
|---|---|
| Timestamp generado | 2026-05-10 (revisión post C1-C4 PO) |
| Proyecto | bank-portal |
| Sprint | 26 |
| Feature | FEAT-024 Objetivos de Ahorro |
| Release target | v1.26.0 |
| Step | 9 (Workflow Manager) |
| Owner | SOFIA Workflow Manager |
| HITL aprobador (cierre S26) | Angel de la Cuadra (PO) |

---

## 1. Resumen ejecutivo

Tras revisión PO sobre el primer borrador, este report se reorganiza en **dos secciones independientes**:

- **Sección A** — 5 LAs S26 candidatas a promoción canónica vía `la-promote.js` → JSON de aceptación pendiente en SOFIA-CORE.
- **Sección B** — 2 guardrail-proposals (sin LA-026 propia que las respalde) que **NO entran por el flujo `la-promote.js`** y se difieren a Sprint S04 SOFIA-CORE como ADR + PR a `MANIFEST.guardrails[]`.

Adicionalmente, se documenta como referencia el dashboard fix aplicado (commit `c72461d`) **sin formalizarlo como LA**, por decisión PO γ (C4).

**Estado consolidado:**
- ✅ 1 LA-CORE aplicada durante el sprint (GR-SHELL-001)
- ✅ 3 LAs S26 ya promovidas a SOFIA-CORE (LA-026-01/02/03 → LA-CORE-065/066/067)
- ⏳ 5 LAs pendientes promoción canónica (Sección A)
- ⏳ 2 guardrail-proposals deferred a S04 SOFIA-CORE (Sección B)
- 📝 1 fix técnico sprint-level sin LA formal (dashboard wrapper · referenciado, no promocionado)

---

## 2. LAs aplicadas o ya promovidas (no requieren acción)

### GR-SHELL-001 ✅ APLICADA
| Campo | Valor |
|---|---|
| Tipo | guardrail oficial |
| Scope | tooling/mcp/shell |
| Severidad | media |
| Aplicada en | SOFIA-CORE commit `998f430` (2026-05-08, sesión SOFIA-CORE separada) |
| Sprint origen | S26 (Step 4 Fase H · DevOps preparation) |
| Descripción | mvn añadido a `ALLOWED_COMMANDS` del shell SOFIA + TIMEOUT_MS aumentado a 600.000 ms (10 min) |
| Acción Step 9 | Solo registrar consolidación |

### LAs S26 ya promovidas a LA-CORE

| LA local | Promovida como | guardrail oficial | sprint promo |
|---|---|---|---|
| LA-026-01 (gate-history mixes pending and approved) | LA-CORE-065 | GR-AUDIT-001 | S26 |
| LA-026-02 (cmmi process_areas incomplete declaration) | LA-CORE-066 | GR-CMMI-001 | S26 |
| LA-026-03 (mcp-shell stdio buffer limit large payloads) | LA-CORE-067 | GR-MCP-001 | S26 |

---

## 3. SECCIÓN A — 5 LAs candidatas a promoción canónica vía `la-promote.js`

Estas LAs tienen entry propia en `session.lessons_learned`, `scope=SOFIA-CORE`, `sofia_core_candidate=true`, `hitl_approved=true`. El script `la-promote.js --sprint 26` las evaluará y producirá `.sofia/la-promotion-request-S26.json`. Aceptación pendiente en sesión SOFIA-CORE futura vía `sofia-contribute.py --accept LA-XXX` (GR-CORE-026: NO se ejecuta desde bank-portal).

### A.1 LA-026-04 — `manifest-la-core-index-acepta-ids-locales-y-no-tiene-validacion`
| Campo | Valor |
|---|---|
| Severidad | **high** |
| Type | process/governance |
| guardrail_proposed | (TBD GR-CORE-XXX) |
| Problema | MANIFEST.la_core_index acumuló 8 entradas espurias con prefijo de ID local que nunca debieron entrar |
| Corrección sugerida | REGLA PERMANENTE: validación `^LA-CORE-\d+$` en sofia-contribute.py --accept |
| Step origen | Step 4 |

### A.2 LA-026-05 — `snapshot-intermedio-redundante-cuando-git-history-cubre-reversa`
| Campo | Valor |
|---|---|
| Severidad | baja |
| Type | process/governance/snapshots |
| guardrail_proposed | GR-SNAPSHOT-001 |
| Problema | Snapshots manuales innecesarios si git history cubre reversa |
| Corrección sugerida | Snapshots solo al cierre de step completo o cuando git no cubra |
| Step origen | Step 4 |

### A.3 LA-026-06 — `audit-must-follow-invocation-chain-not-just-grep-target-file`
| Campo | Valor |
|---|---|
| Severidad | media |
| Type | process/governance/audit |
| guardrail_proposed | GR-AUDIT-002 |
| Problema | Auditoría de comportamiento basada solo en grep en archivo objetivo es insuficiente |
| Corrección sugerida | Protocolo obligatorio: identificar callees + verificar cumplimiento en algún punto de la cadena |
| Step origen | Step 4 |

### A.4 LA-026-07 — `spring-boot-yaml-no-deep-merge-bank-and-jwt-blocks-between-profiles`
| Campo | Valor |
|---|---|
| Severidad | media |
| Type | tooling/spring-boot/config |
| guardrail_proposed | GR-CONFIG-001 |
| Problema | Spring Boot YAML profile-specific NO hace deep merge — un cambio en main puede romper en silencio |
| Corrección sugerida | Cambios en application.yml main bajo top-level keys redefinidas en profiles → replicación obligatoria en TODOS los profile-yml |
| Step origen | Step 4 |

### A.5 LA-026-08 — `testcontainers-docker-from-docker-fails-in-docker-desktop-macos`
| Campo | Valor |
|---|---|
| Severidad | media |
| Type | tooling/testcontainers/docker |
| guardrail_proposed | GR-IT-001 |
| Problema | Testcontainers docker-from-docker falla en docker-desktop macos; afecta IntegrationTestBase-children del proyecto |
| Corrección sugerida | (a) S27: migrar IntegrationTestBase-children al patrón BizumIntegrationTestBase; (b) Documentar limitación; (c) Guardrail alternativo |
| Step origen | Step 4 Fase F.4 |

---

## 4. SECCIÓN B — 2 guardrail-proposals deferred S04 SOFIA-CORE

Estas son **propuestas de guardrail sin LA-026 propia** que las respalde. Aparecen en summaries de Step 5/Step 7 como "candidatas" pero no tienen entry en `session.lessons_learned`. **NO entran por `la-promote.js`** — requieren tratamiento separado: ADR + PR específico a `SOFIA-CORE/MANIFEST.guardrails[]` en S04.

Se generan artefactos `docs/guardrail-proposals/<ID>.md` para servir como input al boot de S04 SOFIA-CORE.

### B.1 GR-SHELL-002 ⏳ deferred S04 SOFIA-CORE

| Campo | Valor |
|---|---|
| Tipo | guardrail-proposal (sin LA-026 origen) |
| Severidad | baja |
| Origen evidencia | Sprint 26 Step 4 + Step 7 (workaround W2: `.sofia/tmp/run-mvn.py`) |
| Mención en session.json | summary Step 5 + Step 7 (string en LA-candidates) |
| Tratamiento | NO promote.js · ADR + PR manual a `MANIFEST.guardrails[]` en S04 |
| Artefacto | `bank-portal/docs/guardrail-proposals/GR-SHELL-002.md` |

### B.2 GR-FE-002 ⏳ deferred S04 SOFIA-CORE

| Campo | Valor |
|---|---|
| Tipo | guardrail-proposal (sin LA-026 origen) |
| Severidad | alta |
| Origen evidencia | Sprint 26 Step 7 · 4 hallazgos visuales detectados por PO (B.4 retry 409 + Hallazgo 1 auth guard + OBS-008 + OBS-009) |
| Mención en session.json | summary Step 7 (string en LA-candidates) |
| Tratamiento | NO promote.js · ADR + PR manual a `MANIFEST.guardrails[]` en S04 |
| Artefacto | `bank-portal/docs/guardrail-proposals/GR-FE-002.md` |

---

## 5. Fix técnico sprint-level sin LA formal (decisión γ)

**Dashboard pipe-class type-mismatch fix** — descubierto durante revisión visual pre-G-8 (2026-05-10). Wrapper local `.sofia/tmp/dashboard-wrapper.js` v3 corrige el pintado de los pipeline steps (mismatch de tipos en `completedSteps.includes` y `S.current_step === s`).

| Campo | Valor |
|---|---|
| Tratamiento | Sprint-level fix · sin LA-026 formal |
| Evidencia | commit `c72461d` · `sofia.log` entry `[DASH-FIX]` 2026-05-10T11:06Z |
| Workaround vigente | `.sofia/tmp/dashboard-wrapper.js` v3 (gitignored, recreación por sesión) |
| Pattern review | Diferido a S04 SOFIA-CORE como wrapper-fix-pattern review (NO LA candidata, NO guardrail-proposal en este sprint) |

**Justificación decisión γ (PO):** el fix funciona localmente y resuelve el bug visual; promoverlo formalmente como LA o guardrail requiere análisis de patrón a nivel CORE que no encaja en cierre S26. S04 SOFIA-CORE es el sitio adecuado para evaluar si `gen-global-dashboard.js` debe absorber esta normalización canónicamente.

---

## 6. Procedimiento de ejecución

### 6.1 En esta sesión bank-portal (Step 9)

```bash
# 1. Generar artefactos guardrail-proposals (Sección B)
#    -> bank-portal/docs/guardrail-proposals/{GR-SHELL-002,GR-FE-002}.md

# 2. Generar JSON de promoción (Sección A)
node .sofia/scripts/la-promote.js --sprint 26
#    Output: .sofia/la-promotion-request-S26.json
#    Esperado: 5 candidates (LA-026-04..08)
#    Si reporta 8 (incluyendo LA-026-01/02/03 ya promovidas):
#    aplicar filtro manual en review (bug "la-promote no filtra promoted"
#    capturado como S04-CAND en SOFIA-CORE)

# 3. Inspeccionar JSON · validar las 5 LAs

# 4. Commit + push bank-portal con:
#    - Report corregido
#    - 2 guardrail-proposals
#    - JSON la-promotion-request-S26.json
```

### 6.2 En sesión SOFIA-CORE futura (post-cierre S26)

**Sección A — 5 LAs:**
```bash
cd $SOFIA_CORE_PATH
# Procesar JSON desde bank-portal/.sofia/la-promotion-request-S26.json
python3 scripts/sofia-contribute.py --accept LA-026-04
python3 scripts/sofia-contribute.py --accept LA-026-05
python3 scripts/sofia-contribute.py --accept LA-026-06
python3 scripts/sofia-contribute.py --accept LA-026-07
python3 scripts/sofia-contribute.py --accept LA-026-08
```

**Sección B — 2 guardrail-proposals:**
- Boot S04 SOFIA-CORE consume `bank-portal/docs/guardrail-proposals/*.md` como input para ADR + PR a `MANIFEST.guardrails[]`
- Capturado como `S04-CAND-guardrail-promotion-channel` HIGH 2 SP

---

## 7. Snapshot LAs estado final S26

| Campo | Valor |
|---|---|
| Total LAs en session.lessons_learned (antes Step 9) | 60 (recopiladas durante S1..S26) |
| LAs S26 generadas en este sprint | 8 entries reales (LA-026-01..08) |
| LAs S26 con scope=SOFIA-CORE pendientes | 5 (LA-026-04, 05, 06, 07, 08) |
| LAs S26 ya promovidas a LA-CORE | 3 (LA-026-01→065, 02→066, 03→067) |
| LAs CORE aplicadas durante S26 | 1 (GR-SHELL-001 · commit 998f430) |
| Guardrail-proposals deferred S04 SOFIA-CORE | 2 (GR-SHELL-002, GR-FE-002) |
| Fix sprint-level sin LA formal | 1 (dashboard wrapper · commit c72461d) |

---

## 8. Cambios respecto al primer borrador (revisión C1-C4 PO)

| Cambio | Impacto |
|---|---|
| Conteo correcto: 5 LAs candidatas (era 8 erróneo) | Corregido |
| LA-026-01/02/03 reclasificadas como ya promovidas (LA-CORE-065/066/067) | Sección 2 |
| GR-SHELL-002 + GR-FE-002 separadas como guardrail-proposals (NO entran la-promote.js) | Sección B + 2 artefactos |
| LA-026-09 NO se añade a session.lessons_learned (decisión γ) | Sección 5 |
| Tier-A sync diferido post-G-9 | Mantenido (no en este report) |

---

*SOFIA Workflow Manager · Sprint 26 · FEAT-024 · BankPortal · Banco Meridian · Revisión post C1-C4 PO*
