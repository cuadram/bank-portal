# GR-FE-002 — E2E UI-driven obligatoria + OBS-XXX inline obligatoriamente escalado a DEBT formal

| Campo | Valor |
|---|---|
| ID propuesto | GR-FE-002 |
| Tipo | guardrail-proposal |
| Severidad propuesta | **alta** |
| Origen | bank-portal Sprint 26 (Step 7 · 4 hallazgos visuales detectados por PO post-G-6) |
| Fecha generación artefacto | 2026-05-10 |
| Estado | DEFERRED · pendiente S04 SOFIA-CORE (ADR + PR a `MANIFEST.guardrails[]`) |
| Owner propuesto | Architect SOFIA-CORE S04 + actualización 2 skills (`code-reviewer/SKILL.md` + `qa-tester/SKILL.md`) |

---

## 1. Contexto técnico

Sprint 26 generó 4 hallazgos durante la verificación visual del PO en Step 7 (DevOps), pese a que el pipeline había aprobado correctamente Step 5 (Code Review · APPROVED · 0 blockers), Step 5b (Security · APPROVED), y Step 6 (QA · APPROVED CON CONDICIONES — pero con cobertura 84.3% instr y 6/6 E2E).

### Los 4 hallazgos

| Hallazgo | Tipo | DR | DEBT |
|---|---|---|---|
| B.4 frontend NO maneja 409 CONCURRENCY_CONFLICT | robustez frontend | DR-S26-007 | DEBT-Q-073 |
| Hallazgo 1: `goalOwnerGuard` redirige a `/login` (3 sistemas auth coexistiendo · DEBT-033 abandonada) | defecto crítico auth | DR-S26-008 | DEBT-FE-074 |
| OBS-008: modal aportación selector cuenta única hardcoded | fidelidad UX | DR-S26-008 | DEBT-FE-075 |
| OBS-009: saldos placeholder en aportación | fidelidad UX | DR-S26-008 | DEBT-FE-075 |

### Por qué escaparon del pipeline

#### Causa raíz 1 — E2E API-driven exclusivamente
Los E2E del Sprint 26 (Playwright · 6/6 PASS) ejercían el **contrato API** (POST/GET/PUT con assertions sobre status code y body), pero NO renderizaban la UI real ni interactuaban con el DOM. Por tanto:

- B.4: el frontend obvia el manejo defensivo de 409 → no se manifiesta en E2E API-driven (el test no llama al frontend, sino directamente al backend)
- OBS-008/009: el selector de cuentas con saldos reales/placeholders es estado de DOM → invisible al E2E API-driven

#### Causa raíz 2 — OBS-XXX inline en código sin escalado a DEBT formal
Durante la revisión Code Review (Step 5), se detectaron al menos 3 comentarios inline tipo:

```typescript
// OBS-008: cuenta única hardcoded por placeholder; revisar antes de prod
// OBS-009: saldos hardcoded; integrar /api/v1/accounts cuando esté listo
```

Estos comentarios NO escalaron a entrada DEBT formal en el informe de Code Review (`STEP5-code-review-sprint26-FEAT-024.md`). Resultado: **deuda invisible** que no figuró en backlog ni se tracked en el sprint, hasta emerger en verificación visual del PO durante Step 7.

### Evidencia de uso real

| Sesión | Evento | Commit relacionado |
|---|---|---|
| Step 5 (Sprint 26) | Code Review APPROVED 0 blockers — pero OBS-XXX inline NO escalados | `dce45ad` Step 5 close (no genera DEBT entries) |
| Step 6 (Sprint 26) | QA E2E API-driven 6/6 PASS — los 4 hallazgos invisibles | `1ccde9a` Step 6 close |
| Step 7 (Sprint 26) | Verificación visual PO descubre los 4 hallazgos | `2b98091` Step 7 close (DR-S26-007 + DR-S26-008 + DEBT-Q-073/FE-074/FE-075) |

---

## 2. Propuesta de regla canónica (dos partes)

### Parte A — E2E UI-driven obligatoria pre-G-5/G-6

Para features con cambios en componentes Angular/React (frontend):

1. Cobertura E2E debe incluir **al menos un test UI-driven** que renderice la pantalla afectada y ejerza interacción real con el DOM (Playwright `page.click`, `page.fill`, etc.) sobre cada componente nuevo
2. Test UI-driven debe verificar visibilidad y valores de elementos clave del DOM (no solo respuesta HTTP)
3. Si la feature crea/modifica selectores, modales, formularios o widgets dashboard: **al menos un E2E UI-driven obligatorio por componente nuevo**
4. Bloqueante en Gate G-6 (QA Tester) — el QA reporta count `e2e_ui_driven` separado de `e2e_api_driven`

### Parte B — OBS-XXX inline obligatoriamente escalado a DEBT formal

Para todo comentario inline `// OBS-XXX:` en código fuente (cualquier tipo de archivo):

1. El Code Reviewer debe identificar todos los `OBS-XXX` introducidos o modificados en el diff del Step 4 (grep automático en CI o checklist manual)
2. Cada `OBS-XXX` debe tener entrada equivalente en el informe Step 5 (`STEP5-code-review-*.md`) con: descripción, severidad, plan
3. Cada `OBS-XXX` con severidad ≥ medium debe abrir DEBT formal en `docs/backlog/`
4. Bloqueante en Gate G-5 (Code Review): comentarios `OBS-XXX` sin entrada en informe → reject

### Ejemplo de comportamiento esperado

```typescript
// Antes (Sprint 26):
// OBS-008: cuenta única hardcoded; revisar antes de prod
const cuenta = MOCK_ACCOUNT_ID;

// → no escala a DEBT, no aparece en informe CR, hallazgo descubierto en Step 7
```

```typescript
// Después (con GR-FE-002):
// DEBT-FE-NNN: cuenta única hardcoded; integrar GET /api/v1/accounts
const cuenta = MOCK_ACCOUNT_ID;

// → CR script automático detecta OBS o DEBT inline, valida que figura en informe + backlog/
// → si OBS sin entrada en backlog: rechaza Step 5
```

---

## 3. Path sugerido en SOFIA-CORE

| Aspecto | Valor |
|---|---|
| Archivos a modificar | `SOFIA-CORE/skills/code-reviewer/SKILL.md` + `SOFIA-CORE/skills/qa-tester/SKILL.md` |
| Manifest entry | `MANIFEST.guardrails["GR-FE-002"]` con `severity: high`, `applies_to: code-review + qa-test` |
| Tests requeridos | Test integración: feature con OBS sin escalado → CR rechaza; feature sin E2E UI-driven → QA rechaza |
| Skill changes | Update `code-reviewer/SKILL.md`: añadir checklist "OBS-XXX → DEBT escalado" como bloqueante en G-5; update `qa-tester/SKILL.md`: añadir métrica `e2e_ui_driven_count` separada del API-driven y bloqueante G-6 |
| Versionado | Bump version SOFIA-CORE a 2.8.X (cambio mayor en política) |

---

## 4. Severidad y prioridad

**Severidad: ALTA.**

Justificación:
- Sprint 26 demostró que el pipeline aprobó G-5/G-5b/G-6 pese a 4 hallazgos críticos
- Hallazgo 1 (auth guard) habría llegado a producción si el PO no hubiera hecho verificación visual
- El refactor parcial DEBT-033 que originó el bug ya existía antes pero nadie lo escaló a deuda crítica → patrón de "deuda invisible"
- Sin esta política, el riesgo de regresión en futuros sprints es alto

**Prioridad sugerida en backlog S04 SOFIA-CORE:** ALTA — política transversal que afecta múltiples agentes del pipeline.

---

## 5. Implementación gradual (sugerida)

| Fase | Acción | Cuándo |
|---|---|---|
| 1 | Update `code-reviewer/SKILL.md` con checklist OBS→DEBT (Parte B) | S04 SOFIA-CORE inicio |
| 2 | Update `qa-tester/SKILL.md` con E2E UI-driven count + bloqueo G-6 (Parte A) | S04 SOFIA-CORE inicio |
| 3 | Añadir entry `MANIFEST.guardrails["GR-FE-002"]` activo desde Sprint 27 BankPortal | S04 SOFIA-CORE cierre |
| 4 | Sprint 27 BankPortal: implementar DEBT-FE-075 (E2E UI-driven nuevos para FEAT-024 + retrofit selectivo) | S27 bank-portal |

---

## 6. Tests de aceptación (post-implementación)

| Caso | Input | Resultado esperado |
|---|---|---|
| Feature con `OBS-X:` inline + entry en informe CR + DEBT abierta | OK · CR pasa | OK G-5 |
| Feature con `OBS-X:` inline pero SIN entry en informe CR | Code Reviewer rechaza | BLOQUEO G-5 |
| Feature con cambio frontend pero `e2e_ui_driven_count = 0` | QA Tester rechaza | BLOQUEO G-6 |
| Feature sin cambio frontend (solo backend) | `e2e_ui_driven_count = 0` aceptable | OK G-6 |
| Regresión: feature compatible con guardrail | OK · sin cambio | OK |

---

## 7. Capturado en SOFIA-CORE como input S04

> Confirmación PO (2026-05-10): este artefacto será capturado en SOFIA-CORE como `S04-CAND-guardrail-promotion-channel` HIGH 2 SP — la propuesta concreta GR-FE-002 será evaluada dentro de ese ítem (o como ADR independiente dado su scope mayor).

---

*Artefacto generado en cierre Sprint 26 bank-portal · input para boot S04 SOFIA-CORE*
