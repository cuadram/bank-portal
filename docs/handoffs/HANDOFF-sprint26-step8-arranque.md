# HANDOFF Sprint 26 · Arranque próxima sesión SOFIA

**Generado:** 2026-05-08
**Sesión origen:** Step 7 DevOps cerrado y commiteado (`2b98091`)
**Sesión destino:** Step 8 Documentation Agent (siguiente)
**Owner:** SOFIA Documentation Agent → SOFIA FA-Agent → SOFIA Workflow Manager
**HITL:** Angel de la Cuadra (PO + TL + SM)

---

## 0. Comando de arranque

Pegar literalmente al inicio de la próxima sesión:

```
Continuamos bank-portal Sprint 26 / Step 8 Documentation Agent.

1. Lee: docs/handoffs/HANDOFF-sprint26-step8-arranque.md
2. Lee: .sofia/session.json
3. Verifica identidad: branch=feature/FEAT-024-sprint26 · HEAD=2b98091 · 0 deleted
4. Verifica: gate_pending=G-7 · status=gate_pending · current_step=7
5. Cuando confirmes: apruebo G-7 → procede Step 8

Aplica reglas estándar (Persistence Protocol, GR-GIT-001, regla de
confianza 95%, Spanish).
```

---

## 1. Estado pipeline al arranque

```json
{
  "current_sprint": 26,
  "current_step": 7,
  "pipeline_step": "7",
  "status": "gate_pending",
  "gate_pending": "G-7",
  "feature": "FEAT-024",
  "completed_steps.steps_len": 11,
  "dashboard_global.last_generated": "2026-05-08T13:09:31.028Z"
}
```

**Step 7 ya está marcado COMPLETED+APPROVED en `completed_steps.steps[10]`**. Solo falta que el HITL DV (Angel) emita `apruebo G-7` formal en chat para que el Orchestrator avance a Step 8.

---

## 2. Verificación cross-repo previa

| Repo | Branch | HEAD esperado | GR-GIT-001 |
|------|--------|---------------|------------|
| bank-portal | `feature/FEAT-024-sprint26` | `2b98091` | 0 deleted |
| SOFIA-CORE | `feature/sprint-arq-S03` | `998f430` | 0 deleted |

Ambos pushed a origin. Cero ahead/behind esperado.

---

## 3. Trabajo pendiente Step 8 (Documentation Agent)

Según `.sofia/skills/orchestrator/SKILL.md` y skill `documentation-agent/SKILL.md`:

### 3.1 Generar/actualizar documentación de release v1.26.0

- **CHANGELOG-v1.26.0.md** consolidando:
  - C1+C2+C3 fixes backend (BUG-Q-001, BUG-Q-008, BUG-Q-003)
  - B.4 quick patch frontend 409 (DR-S26-007)
  - Hallazgo 1 fix auth guard (DR-S26-008)
  - OBS-008+009 fix multi-cuenta selector (DR-S26-008)
- **Release notes**: features visibles al usuario final (Banco Meridian)
  - Aportaciones a metas con selector multi-cuenta + saldos visibles
  - Manejo robusto de concurrencia (mensaje claro si conflicto)
- **README/HOWTO** actualizar si procede.
- **Diagramas**: regenerar si hubo cambios estructurales (no esperados en Step 7).

### 3.2 Excel de seguimiento entrega cliente

- Actualizar `docs/deliverables/sprint-26-FEAT-024/seguimiento-cliente.xlsx`
  con métricas de cierre Sprint.

### 3.3 Gate G-8 HITL PM

Tras generar artefactos, solicitar aprobación HITL PM (Angel actuando como PM).

---

## 4. Trabajo pendiente Step 8b (FA-Agent)

**INPUT crítico**: `fa-index.json` NO modificado desde Step 7 (gobernanza). FA-Agent debe añadir 2 reglas nuevas:

### 4.1 Reglas a registrar

| ID | Descripción | Origen | Sprint |
|----|-------------|--------|--------|
| **RN-F024-16** | "Concurrencia POST contribución: tras 3 retries optimistas backend agotados, se devuelve 409 CONCURRENCY_CONFLICT. Frontend reintenta 1x con backoff 500ms; si persiste, mensaje UX inline 'Conflicto de concurrencia detectado. Espera unos segundos y reintenta la aportación.'" | DR-S26-007 (B.4) | S26 |
| **RN-F024-17** | "Selector cuenta origen en aportación manual: muestra todas las cuentas activas del usuario obtenidas de `GET /api/v1/accounts`, con prioridad de selección por defecto a `goal.sourceAccountId` si está en la lista, fallback a primera cuenta." | DR-S26-008 (OBS-008) | S26 |

### 4.2 Acciones FA-Agent

1. Editar `docs/functional-analysis/fa-index.json` añadiendo RN-F024-16 + RN-F024-17.
2. Ejecutar `python3 .sofia/scripts/gen-fa-document.py` para regenerar el Word doc.
3. Validar con `node .sofia/scripts/validate-fa-index.js` (esperado 8/8 PASS, total BR pasa de 246 a 248).
4. **OJO LA-CORE**: `gen-fa-document.py` siempre escribe `last_gate='8b'` independientemente del gate real. Verificar `session.json.last_gate` post-ejecución y corregir manualmente si procede.

### 4.3 Promoción LA candidatas a SOFIA-CORE

Tres LAs pendientes promoción (acción de Step 8b según pipeline):

| LA | Scope | Acción |
|----|-------|--------|
| **GR-SHELL-001** | mvn en allowlist + TIMEOUT 600s | ✅ YA APLICADA en commit SOFIA-CORE `998f430`. Solo registrar como promoción consolidada. |
| **GR-SHELL-002** | Parser shell SOFIA admite `VAR=val cmd args...` inline para eliminar wrapper python3 (W2) | Promoción + plan implementación S27/S28 |
| **GR-FE-002** | E2E UI-driven obligatoria pre-G-5/G-6 + política OBS-XXX → DEBT formal en informe Step 5 | Promoción + actualización skill `code-reviewer/SKILL.md` |

Procedimiento: `node .sofia/scripts/la-promote.js` genera JSON de promoción → luego `python3 sofia-contribute.py --accept` (HITL PO obligatorio).

---

## 5. Trabajo pendiente Step 9 (Workflow Manager) · cierre Sprint 26

Después de G-8 + 8b APROBADOS:

1. Cierre formal Sprint 26 en Jira (sprint id=497, transición ID=31 "Finalizada").
   - Recordatorio: la API MCP Atlassian no expone sprint lifecycle endpoints (LA-025-10 / GR-ATLASSIAN-001) → cierre via Jira UI obligatorio.
   - Usar JQL completa para listar issues, no rangos de IDs.
2. Tag git `v1.26.0` en bank-portal (commit `2b98091` o el que corresponda tras Step 8).
3. Actualizar `CLAUDE.md` con cierre Sprint 26 + arranque Sprint 27.
4. Snapshot final session.json.
5. Generar `LA-SYNC-REPORT-S26.md` consolidado.
6. Dashboard final regenerado `--gate G-9 --step 9`.

---

## 6. Sprint 27 (preliminar · entrada para próximo Step 1)

**Decisiones PO pendientes para arranque S27:**

### 6.1 Backlog técnico mínimo S27

| ID | Scope | Prioridad | Estimación |
|----|-------|-----------|------------|
| **DEBT-FE-074** | Refactor unificado auth (cierra DEBT-033) | **Alta** | 2-4 días Frontend TL |
| **DEBT-Q-073** | Refactor 409 handling clean (jitter + logging + endpoints) | Media | 1-2 días Frontend Dev |
| **DEBT-FE-075** | OBS-005 + cobertura E2E UI-driven + prototype-fidelity check | Media | 2-3 días Frontend + QA |
| **DEBT-052** | springdoc política prod (decisión pre-PROD con cliente Meridian) | Media | discusión política |
| **DEBT-053** | userId() helper duplicado controllers | Baja | refactor transversal |

### 6.2 Feature S27 (a definir por PO)

`FEAT-025` por determinar. Sugerido: feature funcional que NO toque auth (para no chocar con DEBT-FE-074 en curso).

---

## 7. Side-effects BBDD local-dev

Estado al cierre Step 7:

- `savings_goals` ACTIVE: 4 (legítimos tras cleanup E2E).
- `savings_goals.id=51000000-...-1101` ("Vacaciones Japón 2027"): `reservedAmount=3060` (modificado por smoke C4 desde 2700).
- Auto-rule del goal Vacaciones Japón: amount=30, dayOfMonth=5 (modificado por smoke C4.6).
- Cuentas usuario angel: 2 (Cuenta Corriente Nómina + Cuenta Ahorro Vacaciones).

Si se desea baseline limpia para arranque Step 8, ejecutar:
```bash
bash infra/scripts/cleanup-e2e-data-sprint26.sh
docker compose -f infra/compose/docker-compose.yml down -v
docker compose -f infra/compose/docker-compose.yml up -d
```

(NO requerido para Step 8 puramente documental.)

---

## 8. Stack docker compose al cierre

| Contenedor | Estado | Image | Notas |
|------------|--------|-------|-------|
| bankportal-postgres | Healthy (uptime 4h+) | postgres:16 | Schema version=33 (V32+V33 aplicadas) |
| bankportal-redis | Healthy | redis:7 | — |
| bankportal-backend | Healthy | bankportal-backend-2fa:local-dev (rebuilt 11:09) | Java 21, Spring Boot 3, fixes C1+C2+C3 en runtime |
| bankportal-frontend | Healthy | bankportal-frontend-portal:local-dev (rebuilt 13:05) | Angular 17, B.4+Hallazgo1+OBS-008/009 en runtime |
| bankportal-mailhog | Running | mailhog/mailhog | UI :8025 |

Ports: PG 5433→5432 · Redis 6380→6379 · backend 8081→8080 · frontend 4201→80 · Mailhog 8025.

---

## 9. Documentos clave generados Step 7

Para que la próxima sesión los referencie sin tener que buscar:

- `docs/handoffs/HANDOFF-sprint26-step7-devops-FINAL.md` (cierre Step 7)
- `docs/handoffs/HANDOFF-sprint26-step8-arranque.md` (este archivo)
- `docs/decisions/DR-S26-007-b4-quick-patch-409.md`
- `docs/decisions/DR-S26-008-auth-guard-multi-cuenta.md`
- `docs/backlog/DEBT-073-074-075-sprint26.md`
- `docs/quality/checklists/checklist-pre-G7-sprint26.md`
- `docs/quality/evidence/sprint-26/devops-step7-tests-21clases.log`
- `docs/quality/evidence/sprint-26/qa-retest-step7-fixes.log`
- `infra/compose/smoke-test-v1.26.0.sh`
- `infra/scripts/cleanup-e2e-data-sprint26.sh`

---

## 10. Lecciones aprendidas Step 7 (resumen ejecutivo)

Para reflexión PO antes de Sprint 27:

1. **Cobertura E2E API-driven exclusivamente NO es suficiente**. El Hallazgo 1 (auth guard) y OBS-008 (multi-cuenta) atravesaron G-5 y G-6 ocluidos. La política `GR-FE-002` propuesta para SOFIA-CORE intenta cerrar este gap.

2. **Comentarios `OBS-XXX` inline sin escalado a DEBT formal son deuda invisible**. 3 OBS detectadas en código S26 sin entrada en informe Step 5. Política nueva: cualquier `OBS-XXX` en código DEBE generar entrada en informe Code Reviewer.

3. **Refactors abandonados a medias generan riesgo**: DEBT-033 (auth refactor) creó código orfano (TokenService/SessionService sin escritor) que provocó el Hallazgo 1. Política sugerida: DEBTs de refactor de infraestructura crítica con prioridad Alta NO deben quedar abiertas más de N sprints.

4. **Decisiones técnicas con asunciones erróneas**: el Developer S26 asumió que NO existía endpoint `/accounts` en savings (OBS-008), cuando sí existe `GET /api/v1/accounts` desde Sprint 7 (US-701). Verificación de asunciones en Code Review reforzaría detección.

5. **MCP shell allowlist**: añadir `mvn` evitó round-trips humanos (LA aplicada). Pero parser inline `VAR=val cmd` (W2 wrapper python3) sigue pendiente de SOFIA-CORE. Trabajo de infraestructura SOFIA pendiente.

---

## 11. Validación final estado handoff

Antes de pegar el comando de arranque (sección 0), verificar:

```bash
# bank-portal
git -C /Users/cuadram/proyectos/bank-portal log --oneline -1
# esperado: 2b98091 feat(sprint26-step7): DevOps · G-7 APROBADO ...

git -C /Users/cuadram/proyectos/bank-portal status -sb
# esperado: ## feature/FEAT-024-sprint26...origin/feature/FEAT-024-sprint26 (sin ahead/behind)

# SOFIA-CORE
git -C /Users/cuadram/Library/CloudStorage/OneDrive-Personal/WIP/SOFIA-CORE log --oneline -1
# esperado: 998f430 feat(shell): GR-SHELL-001 · mvn en ALLOWED_COMMANDS + TIMEOUT 600s

# session.json
node -e "const s=require('/Users/cuadram/proyectos/bank-portal/.sofia/session.json'); console.log('step:', s.current_step, 'gate:', s.gate_pending, 'status:', s.status)"
# esperado: step: 7 gate: G-7 status: gate_pending
```

Si todo coincide → arrancar Step 8 con el comando de la sección 0.
