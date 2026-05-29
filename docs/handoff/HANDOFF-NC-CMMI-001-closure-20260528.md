# HANDOFF — Cierre sesión NC-CMMI-001 · Inicio Sprint 27

**Generado:** 2026-05-28T21:50Z
**Sesión cerrada por:** Claude (asistente SOFIA) tras confirmación HITL-PO
**Proyecto:** BankPortal · Cliente: Banco Meridian
**Ubicación:** `/Users/cuadram/proyectos/bank-portal`

---

## Estado final de esta sesión

### NC-CMMI-001 — CERRADA end-to-end (6/6 fases, 9 commits)

| Fase | Commit | Descripción |
|---|---|---|
| F0 | `346cb26` | Setup NC + DEBT-061/062 + reclass DEBT-055 |
| F1 | `184e185` | Hotfix tests `main` + @Disabled item 4 + DEBT-063 |
| F2 | `296e372` | Audit retrospectiva S18-S26 (alcance 11→22) |
| F3A | `4d8fc59` | Failsafe-plugin + Jenkinsfile `-Pintegration` |
| F3B | `d38cbe2` | Matriz IT real + triage S2 + 9 @Disabled |
| F4 | `99779c4` | GR-QA-002 + SKILL qa-tester + 05-corrective-actions |
| F5 | `7440544` | LAs + cierre formal NC + DEBT-055 CLOSED |
| F6a | `f0d5a40` | Draft cliente (anexo + 3 variantes) |
| F6b | `e6c28f4` | Email enviado daniel@nemtec.es (variante A) |

### Git — estado en remoto

```
origin/develop                   → 205e171 (Merge: NC-CMMI-001 cerrada) ← PUNTA ACTUAL
                                   merge --no-ff de hotfix/qa-audit-s18-s26
origin/hotfix/qa-audit-s18-s26   → e6c28f4 (rama preservada, no borrada)
origin/main                      → sin tocar (decisión: main lo actualiza S27 release)
tag audit/NC-CMMI-001-closed     → 205e171 (apunta al merge commit)
```

Working tree local: en rama `hotfix/qa-audit-s18-s26`, limpio, sincronizado con origin.

### Métricas finales NC

- **22/22** `*IT.java` ejecutados por failsafe (antes: 0)
- **13 clases PASS** / **44 @Test verdes** / **9 @Disabled** con DEBT registrada / **0 fail** / **0 error**
- **0 defectos producción** mantenido durante S18-S26 (sin cambios respecto al baseline)
- **GR-GIT-001 OK** los 9 commits NC (0 borrados a lo largo de toda la auditoría)

### Balance debts

**8 OPEN / 6 CLOSED de 15 totales.**

Cerradas durante NC: DEBT-055, DEBT-056, DEBT-061, DEBT-062.
Diferidas a S27: **DEBT-063** (TIN/TAE, gate legal cliente), **DEBT-064** (Testcontainers vs daemon 29.4.1, migrar a integration-compose), **DEBT-065** (5 @WebMvcTest renombrar a *Test).

### LAs registradas

3 LAs en `session.lessons_learned` con `sofia_core_candidate=true`:
- **LA-026-09** — GR-QA-002 evidencia ejecutable obligatoria
- **LA-026-10** — Matriz IT real como artefacto G-6
- **LA-026-11** — CI profile alignment (candidato GR-DEVOPS-001)

**Promoción a SOFIA-CORE pendiente** (no se ha ejecutado `sofia-contribute.py`).

### Cliente notificado

Email enviado a `daniel@nemtec.es` el 2026-05-28T21:45Z con variante A (Transparencia proactiva) + anexo `07-client-communication.md`. Firma HITL-PO registrada en `06-nc-closure.md §10`.

---

## Pendientes para la siguiente sesión (ordenados por prioridad)

### 🔴 PRIORIDAD 1 — Sprint 27 Step 1 Scrum Master

**Es el siguiente paso natural del pipeline SOFIA.** Requiere inputs HITL-PO que **no se pueden inventar**:

1. **Sprint goal S27** (1-2 frases): ¿qué objetivo de producto/proceso persigue?
2. **Duración S27**: ¿2 semanas estándar? ¿otra?
3. **Capacity** (story points disponibles para el sprint).
4. **Decisión sobre los 21 BUG-PO diferidos de S26**: ¿cuáles entran como issues regulares en S27? ¿cuáles siguen diferidos? ¿alguno se reclasifica como deuda?
5. **Decisión sobre DEBT-063** (TIN/TAE simulador préstamos): ¿el gate legal con Banco Meridian está resuelto? Si sí, entra a S27 con DR-S27-001. Si no, sigue diferido offline.
6. **FEAT nueva** o **S27 enteramente saneamiento + deudas técnicas**: ¿hay user stories nuevas del cliente, o S27 se dedica a DEBT-063/064/065 + 21 BUG-PO + housekeeping?
7. **Decisión sobre ramas obsoletas**: hay 9 ramas `feature/FEAT-XXX-sprintNN` locales (S2 a S14) ya mergeadas. ¿Limpieza ahora o se difiere?

Sin estos inputs, el Step 1 produciría un Sprint Plan vacío o adivinado — **contradiría la lección NC-CMMI-001**.

### 🟡 PRIORIDAD 2 — Promoción LA-026-09/10/11 a SOFIA-CORE

Sesión dedicada cuando SOFIA-CORE esté limpio. Estado actual (verificado 2026-05-28):
- SOFIA-CORE en rama `feature/sprint-arq-S14` con 12 modificados + ~30 untracked in-flight.
- Existen ya 5 candidatas previas pendientes de `--accept`/`--reject`: LA-026-04/05/06/07/08.

**Pre-requisitos:**
1. Limpiar working tree SOFIA-CORE (terminar/commitear S14 in-flight).
2. Decidir qué hacer con las 5 LAs previas pendientes.
3. Decidir si LA-026-09/10/11 entran en la misma promoción S26 (requiere regenerar `la-promotion-request-S26.json`) o se trasladan a LA-027.

Comando canónico (cuando llegue el momento):
```bash
# desde SOFIA-CORE limpio
python3 scripts/sofia-contribute.py --accept --la LA-026-09 --source-project bank-portal
# repetir para LA-026-10, LA-026-11
```

### 🟢 PRIORIDAD 3 — Higiene del repo (opcional, no bloquea)

- Considerar borrar rama `hotfix/qa-audit-s18-s26` (local + remoto) ahora que está mergeada y taggeada. **Recomendación: conservarla 1-2 sprints más** como ancla histórica de la auditoría, después borrar.
- Borrar las 9 ramas `feature/FEAT-XXX-sprintNN` locales (S2-S14) mergeadas hace tiempo: `git branch -d feature/FEAT-001-sprint2 ...` (verificar `--merged` primero).

---

## Contexto operativo para reanudar

### Verificación inicial obligatoria de la siguiente sesión (LA-018-01 + GR-GIT-001)

```bash
cd /Users/cuadram/proyectos/bank-portal
git remote get-url origin                         # https://github.com/cuadram/bank-portal.git
git branch --show-current                         # debe estar en develop o hotfix
git log --oneline -1                              # 205e171 si en develop, e6c28f4 si en hotfix
git status --porcelain | grep "^ D" || echo OK   # GR-GIT-001: 0 borrados
cat .sofia/session.json | python3 -c "import sys,json; d=json.load(sys.stdin); print('status:',d['status'],'| current_sprint:',d['current_sprint'],'| resume_next:',d['resume_next'][:200])"
```

Esperado:
- `status: audit-completed`
- `current_sprint: 27` (sin feature todavía)
- `resume_next` apunta a "push + merge + Step 1 S27 + promoción LA SOFIA-CORE diferida" — **los 3 primeros ya hechos en sesión actual** (push, merge, tag). Lo único pendiente es Step 1 S27 + promoción CORE.

### Recordatorios SOFIA críticos (de memorias)

- `cd` no funciona en MCP shell: pasar `cwd` explícito.
- `mvn` está en allowlist desde commit `998f430` de SOFIA-CORE (TIMEOUT 600s).
- Java 21 home: `/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home`.
- Wrapper Maven: `.sofia/tmp/run-mvn.py` (gitignored, recrear cada sesión si no existe).
- Inline `VAR=val cmd` rejected en shell: usar Python wrapper o spawnSync.
- Compose canónico: `infra/compose/docker-compose.yml` (PG 5433, Redis 6380, backend 8081, frontend 4201).
- OTP bypass local/staging: `123456`.

### Atlassian

cloudId `8898340d-94ed-45c2-8831-395d407a4e77`, spaceId `393220`, Jira project `SCRUM`, board ID `1`. Transición "Finalizada": ID `31`. Sprint Jira S26 (container ID 497) ya cerrado en UI desde 2026-05-10. **No existe sprint Jira S27 todavía** — su creación es parte del Step 1 que está pendiente.

---

## Documentación de referencia para la siguiente sesión

| Documento | Propósito |
|---|---|
| `docs/audit/QA-AUDIT-S18-S26/00-README.md` | Índice y status de las 6 fases (todas DONE) |
| `docs/audit/QA-AUDIT-S18-S26/06-nc-closure.md` | Acta formal cierre NC (referencia auditoría) |
| `docs/audit/QA-AUDIT-S18-S26/07-client-communication.md` | Anexo técnico enviado a cliente (referencia comunicaciones futuras) |
| `.sofia/GUARDRAILS.md` | GR-QA-002 (activo desde próximo G-6) |
| `.sofia/skills/qa-tester/SKILL.md` | SKILL actualizado con evidencia ejecutable |
| `.sofia/skills/scrum-master/SKILL.md` | A leer antes de Step 1 S27 |
| `.sofia/session.json` | Estado canónico — `current_sprint=27`, `resume_next` actualizado |

---

*Handoff generado al cierre de NC-CMMI-001 · SOFIA · BankPortal · Banco Meridian · 2026-05-28*
