# LESSONS LEARNED — LA-019-04 al LA-019-18
## Análisis post-mortem: Bugs detectados en pruebas funcionales STG
### BankPortal v1.19.0 · Sprint 19 · 27-28 Mar 2026
### SOFIA v2.2 · Experis / Banco Meridian

---

## 1. RESUMEN EJECUTIVO

Durante la sesión de pruebas funcionales en STG de v1.19.0, se detectaron **16 bugs** que debieron haberse identificado en fases anteriores del pipeline SOFIA (Gates G-3 a G-6). Ninguno era de lógica de negocio compleja: todos correspondían a **errores de integración, configuración y contratos entre capas** que un conjunto de tests adecuado habría capturado.

El coste real: **4+ horas de depuración en tiempo de Tech Lead** que el pipeline debería haber absorbido automáticamente en CI.

---

## 2. INVENTARIO DE BUGS DETECTADOS

### CATEGORÍA A — Backend: Errores de arranque y configuración Spring

| ID | Bug | Gate que debió detectarlo | Tipo |
|---|---|---|---|
| BUG-01 | `ConflictingBeanDefinitionException`: bean `ibanValidator` duplicado entre `directdebit` y `beneficiary` | G-4 Dev / G-6 QA | Integración Spring |
| BUG-02 | HTTP 403 en lugar de 401 sin JWT — falta `AuthenticationEntryPoint` | G-6 QA | Seguridad / Configuración |
| BUG-03 | HTTP 500 en `DirectDebitController` — `@AuthenticationPrincipal(expression="userId")` incompatible con patrón DEBT-022 | G-4 Dev / G-5 Code Review | Contrato de capa |
| BUG-04 | Flyway V20 fallida — text block Java + concatenación string contamina named params (`:accountIdORDER`) | G-4 Dev | SQL / Flyway |
| BUG-05 | `MockAccountRepositoryAdapter` activo en STG con `@Profile("!production")` — nunca consulta la BD real | G-3 Arquitectura / G-6 QA | Configuración de perfil |
| BUG-06 | `transaction_date` es `timestamp without time zone`, pero el filtro pasaba `Instant` Java — comparación fallida | G-6 QA / G-4 Dev | Tipo de datos BD |

### CATEGORÍA B — Frontend Angular: Errores de compilación y runtime

| ID | Bug | Gate que debió detectarlo | Tipo |
|---|---|---|---|
| BUG-07 | `DirectDebitsModule` no registrado en `app-routing.module.ts` — ruta `/direct-debits` inexistente | G-4 Dev | Routing |
| BUG-08 | `CardDetailComponent` sin `templateUrl` HTML — error de compilación | G-4 Dev | Compilación |
| BUG-09 | `DirectDebit`, `DirectDebitPage`, `DebitFilterParams` no exportados en `mandate.model.ts` | G-4 Dev | Tipos TypeScript |
| BUG-10 | `params.set(k, v)` — tipo `{}` no asignable a `string\|number\|boolean` | G-4 Dev | Compilación TypeScript |
| BUG-11 | `SHARED_STYLES` declarada después de usarse — `TS2448 Block-scoped variable used before declaration` | G-4 Dev | Compilación TypeScript |
| BUG-12 | CSS de componentes supera `anyComponentStyle` budget (2kb→16kb) — build falla en producción | G-4 Dev / G-7 DevOps | Build config |
| BUG-13 | `environment.prod.ts` usa `apiBaseUrl` en lugar de `apiUrl` — todas las llamadas API fallan en build prod | G-7 DevOps / G-6 QA | Configuración de entorno |
| BUG-14 | `@Input() accountId` en `TransactionListComponent` nunca se popula — componente usado como ruta, no como hijo | G-4 Dev | Angular routing |
| BUG-15 | `ChangeDetectionStrategy.OnPush` impide re-render al cambiar cuenta — mismo componente, `paramMap` no dispara CD | G-6 QA | Angular CD |
| BUG-16 | UUIDs inválidos en seeds SQL (`card0001`, `benef001`) — formato no hex | G-6 QA / G-4 Dev | Datos de prueba |

---

## 3. ANÁLISIS CAUSA RAÍZ

### 3.1 Por qué no se detectaron en G-4 (Development)

**Causa raíz A: Tests unitarios con scope limitado**

Los tests unitarios de Sprint 19 mockeaban el contexto Spring completo. Ningún test levantaba el `ApplicationContext` real con todos los beans registrados, por lo que:
- El conflicto de bean `ibanValidator` (BUG-01) solo emerge al arrancar el contexto completo
- El `@AuthenticationPrincipal` incorrecto (BUG-03) solo falla con el filtro JWT real activo
- `MockAccountRepositoryAdapter` (BUG-05) pasaba todos los tests porque los tests también mockeaban el repo

**Causa raíz B: Ausencia de tests de integración Angular (ng test)**

El build de producción Angular (`ng build --configuration=production`) activa validaciones adicionales que el desarrollo local no activa:
- Budget CSS enforcement (BUG-12)
- `environment.prod.ts` en lugar de `environment.ts` (BUG-13)
- Errores de tipos estrictos en templates (BUG-08, BUG-09, BUG-10, BUG-11)

Ninguno de los tests generados por SOFIA incluía `ng build --prod` como paso de verificación en G-4.

**Causa raíz C: Patrón DEBT-022 no verificado en nuevos controllers**

El patrón DEBT-022 (`HttpServletRequest.getAttribute("authenticatedUserId")`) está documentado en `LESSONS_LEARNED.md` pero no hay ningún test automático que verifique que todos los controllers lo implementan correctamente. El `DirectDebitController` fue generado nuevo en S19 sin que el Code Reviewer (G-5) tuviera un checklist automatizado.

### 3.2 Por qué no se detectaron en G-5 (Code Review)

**Causa raíz D: Code Review manual sin checklist ejecutable**

El Code Review de S19 generó un documento `CR-FEAT-017-sprint19.md` con findings, pero no tenía un checklist de verificación automatizada que incluyera:
- ¿Todos los controllers nuevos usan el patrón DEBT-022? (BUG-03)
- ¿Todos los módulos Angular nuevos están registrados en el router? (BUG-07)
- ¿Los beans Spring tienen nombres únicos globalmente? (BUG-01)
- ¿El `environment.prod.ts` tiene todos los campos requeridos? (BUG-13)

### 3.3 Por qué no se detectaron en G-6 (QA)

**Causa raíz E: QA ejecutó tests contra mocks, no contra la BD real**

El `QA-FEAT-017-sprint19.md` registra 108 test cases PASS, pero todos se ejecutaron con el stack completo usando `MockAccountRepositoryAdapter`. Esto significa que:
- BUG-05 (Mock activo en STG) era invisible porque QA también usaba el mock
- BUG-06 (tipos fecha) nunca se probó porque el mock ignoraba los filtros de fecha
- El smoke test original (`smoke-test.sh`) de Sprint 12 no cubría los endpoints de S19

**Causa raíz F: No había smoke test actualizado para los nuevos endpoints**

El `smoke-test.sh` existente era de Sprint 12 y no cubría ningún endpoint de FEAT-017. SOFIA generó el smoke test nuevo `smoke-test-v1.19.sh` en la misma sesión de depuración, cuando ya había bugs en producción STG.

### 3.4 Por qué no se detectaron en G-7 (DevOps)

**Causa raíz G: CI pipeline no ejecuta build de producción Angular**

El pipeline Jenkins (`.sofia/jenkins/`) ejecuta `ng build` sin `--configuration=production`. Por tanto, los errores de budget CSS y `environment.prod.ts` no emergían en CI, solo al hacer `docker compose build --no-cache`.

---

## 4. ANÁLISIS DE IMPACTO POR CMMI NIVEL 3

Desde la perspectiva de CMMI L3, los fallos se distribuyeron así:

| Process Area CMMI | Fallo observado | Severidad |
|---|---|---|
| **VER** (Verification) | Tests no cubren contexto Spring real ni build producción Angular | ALTA |
| **VAL** (Validation) | Smoke test desactualizado — no valida funcionalidades del sprint corriente | ALTA |
| **PPQA** (Process & Product QA) | Checklist de Code Review no ejecutable/automatizable | MEDIA |
| **CM** (Config Management) | `environment.prod.ts` desincronizado con `environment.ts` | MEDIA |
| **REQM** (Requirements Mgmt) | Patrón DEBT-022 documentado pero no verificable automáticamente | MEDIA |
| **PP** (Project Planning) | Tests de integración Angular no planificados en scope de S19 | MEDIA |

---

## 5. LECCIONES APRENDIDAS

### LA-019-04 — Tests de integración Spring obligatorios en G-4

**Problema:** Los tests unitarios no detectan conflictos de beans, problemas de `@AuthenticationPrincipal` ni configuración de Security al arrancar el contexto real.

**Corrección:** A partir de S20, G-4 requiere al menos 1 `@SpringBootTest` de smoke por feature nueva que:
1. Levante el contexto Spring completo (sin mocks de repositorio)
2. Ejecute `GET /actuator/health` → 200
3. Ejecute el endpoint principal de la feature sin auth → 401
4. Ejecute el endpoint principal con JWT válido → 200 o 201

**Artefacto a generar:** `docs/qa/IT-SMOKE-FEAT-XXX.java` por sprint.

---

### LA-019-05 — Build de producción Angular en CI

**Problema:** `ng build` sin `--configuration=production` no activa budget CSS, `environment.prod.ts` ni strict templates.

**Corrección:** El paso de build Angular en Jenkins/GitHub Actions debe usar siempre `ng build --configuration=production`. Añadir al `Dockerfile` del frontend:
```dockerfile
RUN node_modules/.bin/ng build --configuration=production
```
(ya estaba, pero no se ejecutaba en CI antes del docker build).

**Verificación:** El Developer Agent debe ejecutar `docker compose build --no-cache frontend` como parte del checklist de G-4, no solo al final.

---

### LA-019-06 — Checklist DEBT-022 automatizable en Code Review

**Problema:** El patrón DEBT-022 estaba documentado pero no había verificación automática.

**Corrección:** Añadir al pipeline de Code Review (G-5) un script de verificación:
```bash
# Verificar que ningún Controller nuevo usa @AuthenticationPrincipal
grep -r "@AuthenticationPrincipal" apps/backend-2fa/src/main/java \
  --include="*.java" | grep -v "test" | grep -v "Mock"
# Si devuelve resultados → BLOQUEANTE
```
Este script debe ejecutarse en G-5 y su resultado incluirse en `CR-FEAT-XXX.md`.

---

### LA-019-07 — Smoke test actualizado obligatorio antes de G-6

**Problema:** El smoke test de S12 cubría endpoints que existían hace 7 sprints. Los endpoints de S19 (FEAT-017) no tenían cobertura de smoke.

**Corrección:** El Developer Agent debe generar `infra/compose/smoke-test-vX.YY.sh` como artefacto obligatorio de G-4, cubriendo:
1. Todos los endpoints nuevos del sprint
2. Los endpoints de regresión críticos
3. Login + JWT flow

Este script debe ejecutarse y pasar (100% OK) antes de aprobar G-6.

---

### LA-019-08 — Perfil de Spring en STG debe activar repositorios reales

**Problema:** `@Profile("!production")` activaba el Mock en STG, haciendo invisible que la BD real nunca se consultaba.

**Corrección:** La estrategia de perfiles debe ser:
- `@Profile("mock")` → MockRepositoryAdapter (solo para tests unitarios)
- Sin perfil específico → Implementación real (activa en dev, STG y prod)
- `@Primary` en el adaptador real para sobrescribir cualquier mock residual

**Regla:** Nunca usar `@Profile("!production")` en un adaptador mock. Siempre usar `@Profile("mock")` o `@Profile("test")` explícito.

---

### LA-019-09 — environment.prod.ts debe validarse contra environment.ts en CI

**Problema:** `environment.prod.ts` tenía `apiBaseUrl` mientras `environment.ts` tenía `apiUrl` — inconsistencia silenciosa que solo explota en el build de producción.

**Corrección:** Añadir un test de validación en CI:
```bash
# Verificar que environment.prod.ts tiene los mismos campos que environment.ts
node -e "
  const dev  = require('./src/environments/environment.ts');
  const prod = require('./src/environments/environment.prod.ts');
  const missing = Object.keys(dev).filter(k => !(k in prod));
  if (missing.length) { console.error('Missing in prod:', missing); process.exit(1); }
"
```

---

### LA-019-10 — Módulos Angular nuevos: verificar registro en router

**Problema:** `DirectDebitsModule` fue creado pero no registrado en `app-routing.module.ts`.

**Corrección:** El checklist de G-4 para features Angular debe incluir explícitamente:
- [ ] Módulo declarado en `app-routing.module.ts`
- [ ] Ruta accesible navegando manualmente a `/nueva-ruta`
- [ ] `AuthGuard` aplicado si requiere autenticación

---

### LA-019-11 — Components de ruta Angular no pueden usar @Input para parámetros de ruta

**Problema:** `TransactionListComponent` usaba `@Input() accountId` pero era un componente de ruta — el Input nunca se populaba.

**Corrección:** Regla de código para SOFIA Developer Agent:
> Si un componente se usa en `Routes[]`, los parámetros de ruta DEBEN leerse de `ActivatedRoute.paramMap` o `ActivatedRoute.snapshot.paramMap`, nunca de `@Input()`.

---

### LA-019-12 — Seeds SQL deben validarse con UUIDs correctos antes de committear

**Problema:** Seeds con `card0001-0000-0000-0000-000000000001` (contiene caracteres no hex) causaban errores en PostgreSQL.

**Corrección:** El Developer Agent debe validar todos los UUIDs en seeds con regex antes de ejecutar:
```python
import re
UUID_PATTERN = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
# Todos los UUIDs en el seed deben pasar este patrón
```

---

### LA-019-13 — Tipos de columnas BD deben documentarse y verificarse en tests

**Problema:** `transaction_date` es `timestamp without time zone` pero el adaptador pasaba `Instant` Java (que se convierte a `timestamptz`). La incompatibilidad no emergía con el mock.

**Corrección:** El Database Designer Agent debe incluir en el LLD un mapa de tipos:
```
columna → tipo PostgreSQL → tipo Java esperado
transaction_date → timestamp → LocalDateTime (no Instant)
created_at → timestamptz → Instant
```
Y el Developer Agent debe usarlo como referencia al escribir queries.

---

### LA-019-14 — @ChangeDetectionStrategy.OnPush requiere CD manual explícito

**Problema:** `OnPush` en `TransactionListComponent` impedía que Angular re-renderizara cuando `paramMap` emitía un nuevo valor, mostrando los movimientos de la primera cuenta para todas.

**Corrección:** Regla de uso de `OnPush`:
> Solo usar `ChangeDetectionStrategy.OnPush` cuando se garantiza que todos los inputs son inmutables y todos los observables se marcan con `markForCheck()` en cada emisión. Si hay dudas, usar la estrategia por defecto.

---

### LA-019-15 — Named params JdbcClient incompatibles con text blocks Java concatenados

**Problema:** Text block Java `""" ... """ + variable + """ ORDER BY"""` concatenaba el nombre del param con la palabra siguiente: `:accountIdORDER`.

**Corrección:** Al construir SQL dinámico con `JdbcClient` usar **siempre parámetros posicionales** (`?`) cuando el SQL se construye mediante concatenación. Reservar named params (`:nombre`) solo cuando el SQL es completamente estático.

---

### LA-019-16 — La arquitectura Mock/Real debe ser transparente para QA

**Problema:** QA ejecutaba tests contra `MockAccountRepositoryAdapter` creyendo que estaba probando la BD real.

**Corrección:** El informe de QA debe incluir explícitamente:
```
Repositorio activo: [MOCK | JPA-REAL]
Datos de prueba: [MOCK-HARDCODED | SEED-BD]
```
Si el repositorio es MOCK, el gate G-6 debe marcarse como INCOMPLETO hasta que se ejecute contra el repositorio real.

---

## 6. IMPACTO EN EL PIPELINE SOFIA v2.3

Las siguientes modificaciones deben aplicarse al pipeline SOFIA a partir de Sprint 20:

### Cambios en Gate G-4 (Development)
- [ ] Añadir step: `docker compose build --no-cache frontend` → debe compilar sin errores
- [ ] Añadir step: Verificar que nuevos módulos Angular están en router
- [ ] Añadir step: Ejecutar grep DEBT-022 — ningún controller nuevo usa `@AuthenticationPrincipal`
- [ ] Añadir step: Validar UUIDs en seeds SQL

### Cambios en Gate G-5 (Code Review)
- [ ] Checklist con scripts ejecutables (no solo revisión manual)
- [ ] Verificar `environment.prod.ts` vs `environment.ts` sincronizados
- [ ] Verificar perfil Spring de nuevos `@Component` adapters

### Cambios en Gate G-6 (QA)
- [ ] Smoke test actualizado obligatorio para el sprint — ejecutado contra STG real (no mock)
- [ ] Verificar perfil activo en STG: `SPRING_PROFILES_ACTIVE` debe ser `staging`, nunca `mock`
- [ ] Informe QA debe declarar explícitamente: repositorio real vs mock

### Cambios en Gate G-7 (DevOps)
- [ ] CI pipeline ejecuta `ng build --configuration=production`
- [ ] CI ejecuta smoke test básico tras el deploy en STG

---

## 7. MÉTRICAS DE ESTA SESIÓN

| Métrica | Valor |
|---|---|
| Bugs detectados en pruebas funcionales | 16 |
| Bugs de backend | 6 |
| Bugs de frontend Angular | 10 |
| Bugs que debían detectarse en G-4 | 11 |
| Bugs que debían detectarse en G-5 | 4 |
| Bugs que debían detectarse en G-6 | 8 |
| Bugs que debían detectarse en G-7 | 2 |
| Tiempo de depuración estimado | 4-5 horas |
| Tiempo que habría tomado con tests correctos | ~30 min CI |
| Coste de no prevención (estimado) | 4h × Tech Lead rate |

---

## 8. CONCLUSIÓN

El problema central no fue la calidad del código generado, sino la **ausencia de un anillo de verificación automática entre la generación de código y la validación de integración**. SOFIA genera código correcto individualmente, pero la integración de 20+ componentes (Spring beans, Angular modules, SQL, perfiles, environments) requiere tests de integración end-to-end que el pipeline actual no tenía.

La lección más importante:

> **"Unit tests passing ≠ system working"** (LA-018-01 ampliada)
> 
> Un sistema puede tener 708 unit tests en verde y aun así no arrancar porque dos beans tienen el mismo nombre, o no mostrar datos porque el repositorio está mockeado, o fallar el build de producción porque el presupuesto CSS se excedió en 221 bytes.

El pipeline SOFIA v2.3 debe incluir un **Gate de Integración** (G-4b) que ejecute automáticamente:
1. `docker compose up --build` completo
2. Health check del backend
3. Smoke test de todos los endpoints del sprint
4. Login + navegación básica del frontend

Solo cuando estos 4 pasos pasen en verde, SOFIA debe considerar el sprint listo para G-5.

---

*Documento generado por SOFIA v2.2 · XFORGE · Experis · 2026-03-28*
*Registrado como LA-019-04 a LA-019-16 en LESSONS_LEARNED.md*
*Revisión obligatoria en Sprint Planning de S20*
