#!/usr/bin/env python3
"""
SOFIA v1.6.1 — patch-persistence.py
Añade el Persistence Protocol a los skills que lo necesitan.
No sobreescribe skills — añade sección al final de cada SKILL.md.
Uso: python3 patch-persistence.py [repo_path]
"""

import os, sys, json, shutil, datetime

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser("~/proyectos/bank-portal")
SKILLS_DIR = os.path.join(REPO, ".sofia", "skills")
LOG        = os.path.join(REPO, ".sofia", "sofia.log")
SESSION    = os.path.join(REPO, ".sofia", "session.json")

GREEN  = "\033[0;32m"; YELLOW = "\033[1;33m"; RED = "\033[0;31m"
BOLD   = "\033[1m";    RESET  = "\033[0m"

def ok(msg):   print(f"  {GREEN}✅{RESET} {msg}")
def warn(msg): print(f"  {YELLOW}⚠️ {RESET} {msg}")
def fail(msg): print(f"  {RED}❌{RESET} {msg}")

# Configuración por skill: (step, step_name, output_path)
SKILL_CONFIG = {
    "scrum-master":         ("1",   "scrum-master",         "docs/backlog/"),
    "requirements-analyst": ("2",   "requirements-analyst", "docs/requirements/"),
    "architect":            ("3",   "architect",            "docs/architecture/"),
    "developer-core":       ("4",   "developer-core",       "src/"),
    "java-developer":       ("4",   "java-developer",       "src/"),
    "angular-developer":    ("4",   "angular-developer",    "src/"),
    "react-developer":      ("4",   "react-developer",      "src/"),
    "nodejs-developer":     ("4",   "nodejs-developer",     "src/"),
    "dotnet-developer":     ("4",   "dotnet-developer",     "src/"),
    "code-reviewer":        ("5",   "code-reviewer",        "docs/quality/"),
    "qa-tester":            ("6",   "qa-tester",            "docs/quality/"),
    "devops":               ("7",   "devops",               "infra/"),
    "jenkins-agent":        ("7",   "jenkins-agent",        "infra/"),
    "workflow-manager":     ("*",   "workflow-manager",     ".sofia/"),
    "documentation-agent":  ("3b",  "documentation-agent",  "docs/deliverables/"),
    "atlassian-agent":      ("*",   "atlassian-agent",      "jira/confluence"),
}

PROTOCOL_KEYWORDS = ["session.json", "sofia.log", "PERSISTENCE CONFIRMED", "snapshot", "artifacts"]

def score(path):
    try:
        content = open(path).read()
        return sum(1 for kw in PROTOCOL_KEYWORDS if kw in content)
    except:
        return 0

def build_block(step, step_name, output_path):
    step_name_upper = step_name.upper().replace("-", "_")
    return f"""

---

## Persistence Protocol — Implementación obligatoria (SOFIA v1.6)

**Este skill DEBE ejecutar los siguientes pasos antes de retornar al Orchestrator.**
Ver protocolo completo en `.sofia/PERSISTENCE_PROTOCOL.md`.

### Al INICIAR

```
1. Leer .sofia/session.json
2. Escribir en sofia.log:
   [TIMESTAMP] [STEP-{step}] [{step_name}] STARTED → descripción breve
3. Actualizar session.json: status = "in_progress", pipeline_step = "{step}", updated_at = now
```

### Al COMPLETAR

```javascript
const fs  = require('fs');
const now = new Date().toISOString();

// 1. Actualizar session.json
const session = JSON.parse(fs.readFileSync('.sofia/session.json', 'utf8'));
const step = '{step}';
if (!session.completed_steps.includes(step)) session.completed_steps.push(step);
session.pipeline_step          = step;
session.pipeline_step_name     = '{step_name}';
session.last_skill             = '{step_name}';
session.last_skill_output_path = '{output_path}';
session.updated_at             = now;
session.status                 = 'completed'; // o 'gate_pending' si hay gate
if (!session.artifacts) session.artifacts = {{}};
session.artifacts[step]        = [ /* rutas de artefactos generados */ ];
fs.writeFileSync('.sofia/session.json', JSON.stringify(session, null, 2));

// 2. Escribir en sofia.log (append-only)
const logEntry = `[${{now}}] [STEP-{step}] [{step_name}] COMPLETED → {output_path} | <detalles>\\n`;
fs.appendFileSync('.sofia/sofia.log', logEntry);

// 3. Crear snapshot
const snapPath = `.sofia/snapshots/step-{step}-${{Date.now()}}.json`;
fs.copyFileSync('.sofia/session.json', snapPath);
```

### Bloque de confirmación — incluir al final de cada respuesta

```
---
✅ PERSISTENCE CONFIRMED — {step_name_upper} STEP-{step}
- session.json: updated (step {step} added to completed_steps)
- sofia.log: entry written [TIMESTAMP]
- snapshot: .sofia/snapshots/step-{step}-[timestamp].json
- artifacts:
  · {output_path}<artefacto-principal>
---
```

> Si este skill **no** genera artefactos de fichero (ej: atlassian-agent opera
> sobre Jira/Confluence), usar las URLs o IDs de los recursos creados/actualizados.
"""

print()
print(f"{BOLD}╔══════════════════════════════════════════════════════════╗{RESET}")
print(f"{BOLD}║   SOFIA v1.6.1 — Patch Persistence Protocol (Python)    ║{RESET}")
print(f"{BOLD}╚══════════════════════════════════════════════════════════╝{RESET}")
print(f"  Repo: {REPO}\n")

patched = 0; skipped = 0; errors = 0

for skill, (step, step_name, output_path) in SKILL_CONFIG.items():
    skill_path = os.path.join(SKILLS_DIR, skill, "SKILL.md")

    if not os.path.isfile(skill_path):
        fail(f"{skill} → SKILL.md no encontrado")
        errors += 1
        continue

    s = score(skill_path)
    if s >= 4:
        warn(f"{skill} → ya tiene score {s}/5, sin cambios")
        skipped += 1
        continue

    # Backup
    shutil.copy2(skill_path, skill_path + ".bak")

    try:
        block = build_block(step, step_name, output_path)
        with open(skill_path, "a", encoding="utf-8") as f:
            f.write(block)
        new_s = score(skill_path)
        ok(f"{skill} → parcheado (score: {s}/5 → {new_s}/5)")
        patched += 1
    except Exception as e:
        fail(f"{skill} → error: {e}")
        shutil.copy2(skill_path + ".bak", skill_path)
        errors += 1

# ── Actualizar session.json ────────────────────────────────────────────────────
print(f"\n{BOLD}  Actualizando session.json{RESET}")
if os.path.isfile(SESSION):
    try:
        with open(SESSION) as f:
            d = json.load(f)
        now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        updates = {
            "version":           "1.6",
            "updated_at":        d.get("updated_at") or now,
            "pipeline_step_name": d.get("pipeline_step_name"),
            "started_at":        d.get("started_at"),
            "artifacts":         d.get("artifacts", {}),
            "gates":             d.get("gates", {}),
            "ncs":               d.get("ncs", {}),
            "security":          d.get("security") or {
                "scan_status": None, "semaphore": None,
                "cve_critical": 0, "cve_high": 0, "cve_medium": 0,
                "secrets_found": 0, "report_path": None, "gate_result": None
            }
        }
        d.update(updates)
        with open(SESSION, "w") as f:
            json.dump(d, f, indent=2)
        ok("session.json actualizado con todos los campos v1.6")
    except Exception as e:
        fail(f"Error actualizando session.json: {e}")
else:
    warn("session.json no encontrado")

# ── Crear snapshots/ ───────────────────────────────────────────────────────────
snaps = os.path.join(REPO, ".sofia", "snapshots")
os.makedirs(snaps, exist_ok=True)
ok("snapshots/ verificado")

# ── Escribir en sofia.log ──────────────────────────────────────────────────────
if os.path.isfile(LOG):
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(LOG, "a") as f:
        f.write(f"[{now}] [PATCH] [patch-persistence.py] COMPLETED → patched={patched} skipped={skipped} errors={errors}\n")

# ── Resumen ────────────────────────────────────────────────────────────────────
print()
print(f"{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
print(f"  {GREEN}✅ Parcheados:       {patched}{RESET}")
print(f"  {YELLOW}⚠️  Ya OK (saltados): {skipped}{RESET}")
print(f"  {RED}❌ Errores:          {errors}{RESET}")
print()
if errors == 0:
    print(f"  {GREEN}{BOLD}Siguiente paso:{RESET}")
    print(f"  bash {REPO}/.sofia/scripts/audit-persistence.sh")
else:
    print(f"  {RED}Revisa los errores anteriores{RESET}")
print(f"{BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}\n")
