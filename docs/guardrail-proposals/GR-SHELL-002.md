# GR-SHELL-002 — Parser shell admite VAR=val cmd inline

| Campo | Valor |
|---|---|
| ID propuesto | GR-SHELL-002 |
| Tipo | guardrail-proposal |
| Severidad propuesta | **baja** |
| Origen | bank-portal Sprint 26 (Step 4 + Step 7) |
| Fecha generación artefacto | 2026-05-10 |
| Estado | DEFERRED · pendiente S04 SOFIA-CORE (ADR + PR a `MANIFEST.guardrails[]`) |
| Owner propuesto | Architect SOFIA-CORE S04 |

---

## 1. Contexto técnico

Durante Sprint 26 de bank-portal, el shell tool de SOFIA (`sofia-shell-bank-portal:run_command`) rechazó múltiples invocaciones del tipo:

```
JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/.../Home /opt/homebrew/bin/mvn test
```

con error:

```
ERROR: 'JAVA_HOME=...' no permitido. Usa: node, npm, npx, python3, ...
```

El parser shell trata `JAVA_HOME=val` como un comando independiente y aplica el filtro de allowlist sobre la primera "palabra", fallando antes de invocar `mvn`.

### Workaround vigente (W2)

Se creó `.sofia/tmp/run-mvn.py` como wrapper Python que setea `JAVA_HOME` en `os.environ` y luego llama a `subprocess.run(['/opt/homebrew/bin/mvn', ...])`. Funciona, pero:

- Wrapper se recrea por sesión (`.sofia/tmp/` está gitignored)
- Indirección innecesaria: parser shell debería entender el patrón canónico Bash `VAR=val cmd args...`
- Documentado en userMemories del proyecto como restricción conocida

### Evidencia de uso real

| Sesión | Evento | Commit relacionado |
|---|---|---|
| Step 4 Fase G/H (Sprint 26) | Necesidad de `JAVA_HOME=... mvn` para builds backend-2fa | (múltiples commits Step 4) |
| Step 7 DevOps (Sprint 26) | Smoke tests v1.26.0 + tests Maven | `2b98091` Step 7 close |
| Sprint 25 (referencia previa) | Mismo patrón ya identificado pero no escalado | (no commit) |

---

## 2. Propuesta de regla canónica

**GR-SHELL-002**: el parser shell SOFIA debe reconocer y procesar la sintaxis Bash canónica `VAR1=val1 VAR2=val2 ... cmd args...`, donde:

1. Asignaciones de variables de entorno preceden al comando
2. La asignación afecta solo a la invocación del comando (semántica `env -S`)
3. El comando real (primera palabra que no contenga `=`) se valida contra `ALLOWED_COMMANDS`
4. Las variables se aplican al entorno del subproceso, NO al shell del agente

### Ejemplo de comportamiento esperado

```python
# Permitido (cmd 'mvn' está en allowlist):
JAVA_HOME=/opt/homebrew/... mvn test

# Permitido (cmd 'python3' está en allowlist):
PYTHONPATH=/path/a:/path/b python3 script.py

# Rechazado (cmd 'rm -rf /' no está en allowlist):
SOMEVAR=x rm -rf /

# Rechazado (asignación sin cmd):
JAVA_HOME=/opt/...

# Rechazado (tras cualquier `=`, primera palabra sin `=` que NO esté en allowlist):
PATH=/x curl http://...
```

### Pseudocódigo de implementación

```python
def parse_shell_invocation(raw_cmd: str) -> tuple[dict, list[str]]:
    """
    Devuelve (env_vars: dict, cmd_args: list[str]).
    Lanza ShellNotAllowedError si el cmd resultante no está en allowlist.
    """
    tokens = shlex.split(raw_cmd)
    env_vars = {}
    i = 0
    # Recolectar asignaciones VAR=val mientras matcheen el patrón
    while i < len(tokens) and re.match(r"^[A-Z_][A-Z0-9_]*=", tokens[i]):
        k, v = tokens[i].split("=", 1)
        env_vars[k] = v
        i += 1
    cmd_args = tokens[i:]
    if not cmd_args:
        raise ShellNotAllowedError("Asignación VAR=val sin comando")
    if cmd_args[0] not in ALLOWED_COMMANDS:
        raise ShellNotAllowedError(
            f"'{cmd_args[0]}' no permitido. Usa: {', '.join(ALLOWED_COMMANDS)}"
        )
    return env_vars, cmd_args
```

---

## 3. Path sugerido en SOFIA-CORE

| Aspecto | Valor |
|---|---|
| Archivo a modificar | `SOFIA-CORE/scripts/parser_shell.py` (o equivalente que centralice la lógica de allowlist) |
| Tests requeridos | `tests/test_parser_shell.py` con casos: VAR válido + cmd allowed; VAR válido + cmd NOT allowed; VAR sin cmd; sin VAR (regresión); múltiples VARs; VAR con valor que contiene `=` |
| Manifest entry | `MANIFEST.guardrails["GR-SHELL-002"]` con `version: 2.7+1`, `applies_to: shell-tool`, `severity: low`, `description` resumida |
| Versionado | Bump version SOFIA-CORE a 2.7.X siguiente |

---

## 4. Severidad y prioridad

**Severidad: BAJA.**

Justificación:
- Workaround W2 (`run-mvn.py`) funciona y no bloquea ningún sprint
- No introduce riesgo de seguridad nuevo (allowlist sigue siendo gate)
- Beneficio: eliminar wrapper recreado por sesión + alineación con sintaxis Bash canónica

**Prioridad sugerida en backlog S04 SOFIA-CORE:** MEDIA — el ahorro de tiempo de sesión se amortiza rápidamente, pero no es bloqueante.

---

## 5. Tests de aceptación (post-implementación)

| Caso | Input | Resultado esperado |
|---|---|---|
| VAR + cmd allowed | `JAVA_HOME=/opt/jdk mvn -v` | OK · ejecuta mvn con env |
| VAR + cmd NOT allowed | `FOO=bar curl x` | ERROR allowlist |
| Solo VAR sin cmd | `JAVA_HOME=/opt/jdk` | ERROR `Asignación sin comando` |
| Múltiples VARs | `A=1 B=2 python3 -c "print(1)"` | OK · ejecuta python3 con A=1 B=2 |
| VAR con `=` en valor | `URL=http://x.com?a=b curl ...` | parser_shell rechaza por curl no allowed; pero parsing de VAR debe ser correcto |
| Regresión: sin VAR | `mvn test` | OK · sin cambio respecto al comportamiento previo |

---

## 6. Capturado en SOFIA-CORE como input S04

> Confirmación PO (2026-05-10): este artefacto será capturado en SOFIA-CORE como `S04-CAND-guardrail-promotion-channel` HIGH 2 SP — la propuesta concreta GR-SHELL-002 será evaluada dentro de ese ítem.

---

*Artefacto generado en cierre Sprint 26 bank-portal · input para boot S04 SOFIA-CORE*
