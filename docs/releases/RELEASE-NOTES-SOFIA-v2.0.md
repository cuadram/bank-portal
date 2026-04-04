SOFIA v2.0 — Release Notes del paquete de despliegue

Fecha: 2026-03-26
Fichero: sofia-deploy-v2.0.zip

=== QUE INCLUYE ===

skills/ (20 skills)
  fa-agent/SKILL.md         ← NUEVO v2.0 (Analista Funcional)
  orchestrator/SKILL.md     ← ACTUALIZADO v2.0 (pipeline 14 steps)
  [18 skills mas]           ← v1.9/v1.10 sin cambios

scripts/
  gen-fa-document.py        ← NUEVO v2.0 (generador Word con python-docx)
  install-deps.sh           ← ACTUALIZADO v2.0 (incluye python-docx)

README-SOFIA-v2.0.md

=== CAMBIOS RESPECTO A v1.9.1 ===

1. FA-Agent v2.0
   - Generador: python-docx (no docx-js — generaba archivos corruptos)
   - docx-js omitia settings.xml, fontTable.xml, comments.xml en el ZIP
   - python-docx genera OOXML completo: Word abre sin errores
   - Gates: 2b (borrador), 3b (enriquecido), 8b (consolidado)

2. Orchestrator v2.0
   - Pipeline 14 steps (vs 11 en v1.9)
   - Steps 2b, 3b, 8b documentados con protocolo FA-Agent
   - Regla #9 añadida: FA Word acumulativo, nunca regenerar desde cero

3. install-deps.sh v2.0
   - Añade instalacion de python-docx via pip3 o python3 -m pip
   - Compatible con macOS (brew), Linux y entornos con --break-system-packages

=== INSTALACION ===

unzip sofia-deploy-v2.0.zip
bash .sofia/scripts/install-deps.sh
python3 -c "import docx; print('FA-Agent OK')"
