#!/usr/bin/env python3
"""
gen-lessons-learned.py — SOFIA v2.6 (GENERICO)
Regenera LESSONS_LEARNED.md desde session.json (LA-022-02).
Lee proyecto y cliente desde session.json -- sin datos hardcodeados.
Ejecutar en Step 9 (Workflow Manager) obligatoriamente.
"""
import json, os, sys
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Resolver ROOT desde la ubicacion del script (.sofia/scripts/)
_SCRIPT_DIR = Path(__file__).parent
ROOT    = _SCRIPT_DIR.parent.parent.resolve()
SESSION = ROOT / '.sofia' / 'session.json'
OUTPUT  = ROOT / 'LESSONS_LEARNED.md'
LOG     = ROOT / '.sofia' / 'sofia.log'

# Leer proyecto desde session.json o sofia-config.json
def _read_project():
    cfg_path = ROOT / '.sofia' / 'sofia-config.json'
    ses_path = ROOT / '.sofia' / 'session.json'
    project, client = 'Proyecto', 'Cliente'
    if cfg_path.exists():
        try:
            cfg = json.loads(cfg_path.read_text())
            project = cfg.get('project', project)
            client  = cfg.get('client',  client)
        except Exception: pass
    elif ses_path.exists():
        try:
            ses = json.loads(ses_path.read_text())
            project = ses.get('project', project)
            client  = ses.get('client',  client)
        except Exception: pass
    return project, client

PROJECT_NAME, CLIENT_NAME = _read_project()

TYPE_EMOJI = {
    'process': '🔄', 'testing': '🧪', 'backend': '☕', 'frontend': '🅰️',
    'architecture': '🏗️', 'security': '🔒', 'dashboard': '📊', 'devops': '🚀',
    'database': '🗄️', 'config': '⚙️', 'data': '📦', 'code-review': '👁️',
    'documentation': '📄',
}

# Reglas permanentes genericas — no especificas de BankPortal/Java/Angular
PERMANENT_RULES_GENERIC = [
    ('LA-018-01', 'SIEMPRE leer session.json desde disco antes de actuar en continuacion de sesion'),
    ('LA-020-01', 'Jira transiciona en cada gate del pipeline sin instruccion explicita'),
    ('LA-020-02', 'CVSS >= 4.0 se resuelve en el mismo sprint — nunca diferir'),
    ('LA-020-07', 'Dashboard regenerado en cada gate (GR-011)'),
    ('LA-020-08', 'gen-fa-document.py obligatorio en Step 8b — verificacion blocking'),
    ('LA-020-09', 'Developer verifica package/namespace raiz ANTES de crear ficheros'),
    ('LA-020-10', 'Code Reviewer contrasta namespaces nuevos contra codebase real'),
    ('LA-020-11', 'Test de integracion BLOQUEANTE para G-4b — sin BUILD SUCCESS no hay gate'),
    ('LA-021-01', 'FA-Agent: total_business_rules dinamico — validate-fa-index en 2b/3b/8b'),
    ('LA-021-02', 'Base de tests declara TODOS los fixtures comunes (IDs, UUIDs, mocks)'),
    ('LA-021-03', 'Doc Agent: 17 DOCX + 3 XLSX REALES OBLIGATORIOS — bloqueante G-8'),
    ('LA-022-02', 'Step 9 regenera LESSONS_LEARNED.md desde session.json (este script)'),
    ('LA-022-05', 'Dashboard actualizado en CADA gate (GR-011 bloqueante)'),
    ('LA-022-07', 'Step 3b OBLIGATORIO post G-3 — verificar completed_steps antes de Step 4'),
    ('LA-022-08', 'Doc Agent genera BINARIOS REALES (.docx/.xlsx) — NUNCA .md como entregable'),
    ('LA-FRONT-001', 'Modulo/componente nuevo → ruta registrada + nav item en MISMO step'),
    ('LA-FRONT-004', 'Verificar endpoint backend existe ANTES de registrar ruta frontend'),
    ('LA-CORE-003', 'GR-CORE-003: SOFIA_REPO verificado en INIT y antes de cada escritura'),
    ('LA-CORE-004', 'Estructura canonica de directorios copiada desde repo-template al crear proyecto'),
]

def main():
    if not SESSION.exists():
        print(f'ERROR: {SESSION} no encontrado')
        sys.exit(1)

    s = json.loads(SESSION.read_text())
    las = s.get('lessons_learned', [])
    now = datetime.utcnow().strftime('%Y-%m-%d')
    sprint = s.get('current_sprint', 1)

    lines = [
        f'# LESSONS LEARNED — {PROJECT_NAME} · SOFIA v{s.get("sofia_version","2.6")}',
        f'**Proyecto:** {PROJECT_NAME} · {CLIENT_NAME}',
        f'**Actualizado:** {now} | **Total:** {len(las)} lecciones',
        f'**Versión SOFIA:** {s.get("sofia_version","2.6")}',
        '',
        '> **Fuente canónica:** `.sofia/session.json` (campo `lessons_learned`)',
        '> **Regenerar:** ejecutar `.sofia/scripts/gen-lessons-learned.py` en Step 9 (LA-022-02)',
        '',
        '---',
        '',
    ]

    by_sprint = defaultdict(list)
    for la in las:
        by_sprint[la['sprint']].append(la)

    for sp in sorted(by_sprint.keys()):
        lines.append(f'## Sprint {sp}')
        lines.append('')
        for la in by_sprint[sp]:
            emoji = TYPE_EMOJI.get(la['type'], '📌')
            lines.append(f'### {la["id"]} — {emoji} [{la["type"].upper()}]')
            lines.append(f'**Descripción:** {la["description"]}')
            lines.append(f'**Corrección:** {la["correction"]}')
            if la.get('registered_at'):
                lines.append(f'**Registrado:** {la["registered_at"][:10]}')
            lines.append('')

    lines += [
        '---',
        '',
        '## Índice por Tipo',
        '',
    ]
    by_type = defaultdict(list)
    for la in las:
        by_type[la['type']].append(la['id'])
    for t in sorted(by_type.keys()):
        lines.append(f'- **{t}:** {", ".join(by_type[t])}')
    lines.append('')
    lines += [
        '---',
        '',
        '## Reglas Permanentes Activas (SOFIA v2.6)',
        '',
        '| ID | Regla |',
        '|---|---|',
    ]
    for la_id, rule in PERMANENT_RULES_GENERIC:
        lines.append(f'| {la_id} | {rule} |')
    lines.append('')

    content = '\n'.join(lines)
    OUTPUT.write_text(content)

    # Log
    log_entry = f'[{datetime.utcnow().isoformat()}Z] [gen-lessons-learned] LESSONS_LEARNED.md regenerado — {len(las)} LAs — {PROJECT_NAME}/{CLIENT_NAME}\n'
    with open(LOG, 'a') as f:
        f.write(log_entry)

    print(f'OK LESSONS_LEARNED.md: {len(las)} LAs | {PROJECT_NAME} · {CLIENT_NAME} | {len(lines)} lineas')

if __name__ == '__main__':
    main()
