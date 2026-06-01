# SOFIA Guardrails — v1.0
**Origen:** RCA HOTFIX-S20 · 2026-03-30  
**Lecciones:** LA-020-09 · LA-020-10 · LA-020-11  
**Script:** `.sofia/scripts/guardrail-pre-gate.js`

---

## Por qué existen estos guardrails

Sprint 20 se cerró con 16 ficheros Java bajo el paquete incorrecto `es.meridian.bankportal`,
métodos inexistentes referenciados en generadores de PDF/CSV, y sin `SpringContextIT`.
Los 446 tests unitarios pasaron correctamente porque Mockito bypasea el contexto Spring.
El error solo era detectable compilando o arrancando el contexto real.
Ninguno de los tres mecanismos de control (Developer, Code Reviewer, QA) lo detectó.

---

## GR-001 — Paquete raíz Java (BLOQUEANTE · Developer · G-4b)

**Qué detecta:** ficheros generados con paquete inferido del cliente/documentación en lugar del proyecto real.

**Cuándo ejecutar:** antes de crear cualquier fichero `.java` nuevo en el sprint.

```bash
# Leer el paquete raíz REAL desde disco:
cat apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/twofa/BackendTwoFactorApplication.java | head -1
# → package com.experis.sofia.bankportal.twofa;
# Raíz = com.experis.sofia.bankportal  (eliminar último segmento)

# Confirmar que no hay otros árboles en src/main/java:
ls apps/backend-2fa/src/main/java/
# → SOLO: com   (NUNCA: es, meridian, bankportal sueltos)
```

**Regla:** `package` de todo fichero nuevo debe empezar con `com.experis.sofia.bankportal`.

---

## GR-002 — API Surface (BLOQUEANTE · Developer · G-4b)

**Qué detecta:** llamadas a métodos que no existen en la entidad real.

**Cuándo ejecutar:** antes de escribir código que usa una clase de dominio existente.

```bash
# Verificar que el método existe antes de usarlo:
grep "getTransactionDate\|getConcept\|getBalanceAfter" \
  apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/Transaction.java
# Si no aparece → el método no existe → no usar

# Métodos REALES de Transaction:
#   getTransactionDate() (Instant), getConcept(), getAmount(), getBalanceAfter(), getType()
# INEXISTENTES (error HOTFIX-S20):
#   getValueDate(), getDescription(), getBalance(), getCurrency(), getAccountingDate()
```

---

## GR-003 — SpringContextIT (BLOQUEANTE · Developer · G-4b)

**Qué detecta:** paquetes incorrectos, beans faltantes, columnas inexistentes, properties no configuradas.

**Cuándo ejecutar:** debe existir desde el primer day del sprint. Bloqueante para G-4b.

```bash
ls apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/SpringContextIT.java
# Si no existe → crearlo ANTES que cualquier clase de negocio.
```

**Archivos ya creados:**
- `apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/SpringContextIT.java`
- `apps/backend-2fa/src/test/java/com/experis/sofia/bankportal/integration/config/IntegrationTestBase.java`

**Test TC-IT-001-A** (`context_startsWithoutErrors`): habría detectado el paquete incorrecto en 30 segundos.

---

## GR-004 — mvn compile (BLOQUEANTE · Developer + Orchestrator · G-4b)

**Qué detecta:** clases no escaneadas por Spring, imports incorrectos, dependencias faltantes.

**Cuándo ejecutar:** obligatorio antes de declarar G-4b aprobado.

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21 mvn compile -q -f apps/backend-2fa/pom.xml
# EXIT 0 = BUILD SUCCESS = compilación correcta
# EXIT 1 = GATE BLOQUEADO — no aprobar G-4b hasta resolver
```

**Distinción crítica:** `mvn test` (tests unitarios Mockito) puede dar EXIT 0 aunque el proyecto
no compile en contexto Spring real. `mvn compile` es la única garantía real.

---

## GR-005 — Code Reviewer Package Cross-Check (BLOQUEANTE · CR · G-5)

**Qué detecta:** paquetes incorrectos que no se detectaron en GR-001 o que el Developer pasó por alto.

**Cuándo ejecutar:** antes de emitir veredicto en Code Review.

```bash
# Verificar que los ficheros nuevos del sprint usan el paquete correcto:
grep -rn "^package" apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/export/
grep -rn "^package" apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/transaction/
# Toda línea debe empezar con: package com.experis.sofia.bankportal.

# Verificar que no quedan árboles huérfanos:
ls apps/backend-2fa/src/main/java/
# SOLO debe existir: com
```

**Regla CR:** Consistencia interna entre ficheros incorrectos NO es corrección.
Siempre contrastar contra el paquete raíz del proyecto, no entre los ficheros nuevos.

---

## GR-006 — Code Reviewer API Surface (BLOQUEANTE · CR · G-5)

**Qué detecta:** referencias a métodos inexistentes que GR-002 no detectó.

**Cuándo ejecutar:** durante el Code Review de generadores/servicios que usan entidades de dominio.

```bash
# Extraer métodos usados en los generadores:
grep -oh "get[A-Z]\w*()" apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/export/service/generator/*.java | sort -u

# Contrastar con métodos reales de Transaction:
grep -oh "public [^ ]* get\w*()" apps/backend-2fa/src/main/java/com/experis/sofia/bankportal/account/domain/Transaction.java

# Diferencia = BLOQUEANTE
```

---

## GR-QA-001 — Reservado (placeholder NC-CMMI-001)

Numeración reservada por NC-CMMI-001 (auditoría QA S18-S26, 2026-05-20). Sin contenido funcional. No actuar sobre este GR; será asignado en una acción correctiva posterior si emerge un guardrail de QA previo al G-6 distinto del cubierto por GR-QA-002.

---

## GR-QA-002 — Evidencia ejecutable para claims PASS (BLOQUEANTE · QA Tester · G-6)

**Origen:** NC-CMMI-001 Fase 4 (acción preventiva). Cierra DEBT-056.

**Qué exige:** todo `*Test` y `*IT` declarado **PASS** en el QA Report debe ir acompañado de evidencia ejecutable verificable por terceros. Sin evidencia, el claim se marca **BLOCKED**, nunca PASS, y G-6 queda BLOQUEADO.

**Evidencia mínima por clase declarada PASS:**

```
[ ] Ruta del XML: target/{surefire|failsafe}-reports/TEST-{FQCN}.xml (presente en disco al cierre del run)
[ ] commit SHA en HEAD al ejecutar (git rev-parse HEAD)
[ ] timestamp ISO-8601 del cierre del run
[ ] conteo del XML: tests / failures / errors / skipped
[ ] perfil Maven activo (ej. `-Pintegration`) o `default` si surefire
```

**Comando canónico (backend):**

```bash
# Unit tests (surefire)
mvn test
# Integration tests (failsafe, perfil integration -> incluye **/*IT.java)
mvn verify -Pintegration
```

**Checklist pre-G-6 (QA Tester, BLOQUEANTE):**

```bash
# 1. HEAD limpio + commit SHA capturado
git status --porcelain | grep -q . && echo "BLOQUEADO: working tree sucio" && exit 1
git rev-parse HEAD > .sofia/tmp/qa-evidence-sha.txt

# 2. Ejecutar surefire + failsafe (perfil integration explícito)
python3 .sofia/tmp/run-mvn.py test
python3 .sofia/tmp/run-mvn.py verify -Pintegration

# 3. Cada claim PASS en el QA Report referencia un XML existente
python3 -c "
import re,glob,sys
report=open('docs/qa/QA-FEAT-XXX-sprintYY.md').read()
claims=re.findall(r'([A-Za-z][A-Za-z0-9_]+(?:Test|IT))\s*[:|]\s*PASS', report)
xmls={p.rsplit('/',1)[-1].replace('TEST-','').replace('.xml','').split('.')[-1]
      for p in glob.glob('apps/backend-2fa/target/*-reports/TEST-*.xml')}
missing=[c for c in claims if c not in xmls]
if missing: print('BLOQUEADO claims sin XML:',missing); sys.exit(1)
print('OK',len(claims),'claims con evidencia')
"
```

**Cómo detecta el reviewer / Workflow Manager:**

```bash
# Buscar claims PASS sin XML adjunto en el QA Report
grep -E "[A-Za-z]+(Test|IT)\s*[:|]\s*PASS" docs/qa/QA-FEAT-*.md > /tmp/claims.txt
# Para cada claim, comprobar XML en target/*-reports/. Falta uno -> BLOQUEANTE.
```

**Antipatrón histórico cubierto (DEBT-055 + NC-CMMI-001):**
Reporte G-6 S25 declaraba "TC-IT-005 PASS — 5 ITs @SpringBootTest" para `PfmControllerIT`. Reproducción en HEAD ese sprint: 0 PASS / 1 ERROR estructural (failsafe-plugin ausente, 22/22 `*IT.java` huérfanos del lifecycle). Con failsafe configurado (Fase 3 Parte A) + perfil `integration-compose` operativo: 5/5 PASS reproducible (Fase 3 Parte B, commit `d38cbe2`). El claim era correcto en intención pero **no ejecutable** entonces. GR-QA-002 evita que esta clase de claim pase G-6 sin evidencia.

**Status:** registrado en BankPortal. Candidato a promoción SOFIA-CORE en Fase 5 (LA-026-09).

---

## Ejecución automática — script unificado

```bash
# Antes de G-4b (Developer + Orchestrator):
node .sofia/scripts/guardrail-pre-gate.js --gate G-4b

# Antes de G-5 (Code Reviewer):
node .sofia/scripts/guardrail-pre-gate.js --gate G-5

# Salida EXIT 0 = todos los checks OK → puede aprobarse el gate
# Salida EXIT 1 = checks fallidos listados → GATE BLOQUEADO
```

---

## Integración en el pipeline SOFIA

| Gate | Guardrails obligatorios | Quién ejecuta |
|---|---|---|
| G-4b | GR-001, GR-002, GR-003, GR-004 | Developer + Orchestrator |
| G-5  | GR-005, GR-006 | Code Reviewer |
| G-6  | GR-003 (SpringContextIT PASS verificado) | QA Lead |

---

## GR-CONFIG-001 — Resolubilidad de placeholders en profiles (BLOQUEANTE · DevOps · G-4b/pre-G-7)

**Qué detecta:** placeholders Spring `${a.b.c}` sin default y dotted (no env-style) que no están resueltos en la cadena de yml de un profile de contexto completo. Previene la clase de regresión DEBT-064 (vaciado de `application-integration-compose.yml` → "Could not resolve placeholder ..." en los IT).

**Cuándo ejecutar:** antes de G-4b (tras tocar cualquier `application*.yml`, `@Value` o `@ConfigurationProperties`) y en el checklist DevOps pre-G-7.

```bash
node .sofia/scripts/validate-yaml-profiles.js            # enforce: exit!=0 si profile BLOQUEANTE no resuelve R
node .sofia/scripts/validate-yaml-profiles.js --report   # tabla R/A por profile, exit 0
```

**Regla:** para los profiles en `BLOCKING` del script (S27: `integration-compose`, único con `@SpringBootTest` de contexto completo activo), `R ⊆ A` es obligatorio. `test`, `integration` (vestigial post-DEBT-064) y los profiles main → warning (main externaliza `bank.core.*` a entorno; bloquear daría falsos positivos). Ampliar `BLOCKING` (1 línea) si un sprint añade otro profile full-context.

**Origen:** DEBT-054 (SCRUM-178) · LA-027-05 · regresión DEBT-064.

---

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-03-30 | Creación post HOTFIX-S20 — LA-020-09/10/11 |
| 1.1 | 2026-06-01 | GR-CONFIG-001 (DEBT-054) — resolubilidad placeholders, bloqueante en integration-compose |
