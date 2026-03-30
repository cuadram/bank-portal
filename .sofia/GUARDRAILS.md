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

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-03-30 | Creación post HOTFIX-S20 — LA-020-09/10/11 |
