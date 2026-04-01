# LESSONS LEARNED — BankPortal · SOFIA v2.5
**Proyecto:** BankPortal · Banco Meridian
**Actualizado:** 2026-04-01 | **Total:** 38 lecciones (S19–S21 + STG Verification)
**Versión SOFIA:** 2.5

---

## Índice por sprint

| Sprint | IDs | Área principal |
|---|---|---|
| S19 | LA-019-03..16 | Process, Testing, Frontend, Backend, Architecture |
| S20 | LA-020-01..11, LA-TEST-001..004 | Process, Security, DevOps, Code Review |
| S21 | LA-021-01..03, LA-FRONT-001..005 | Process, Frontend, Testing |
| STG | LA-STG-001..002 | Frontend (verificación en producción STG) |

---

## Sprint 19 — FEAT-017 Domiciliaciones SEPA

### LA-019-03 · process
**Gates G-6..G-9 auto-aprobados incorrectamente.**
Corrección: cada gate HITL requiere parada explícita individual con pregunta al rol definido.

### LA-019-04 · testing
**Tests unitarios no detectan conflictos de beans Spring — requieren @SpringBootTest completo.**
Corrección: G-4 requiere IT smoke test por feature nueva.

### LA-019-05 · devops
**Build Angular sin --configuration=production no activa budget CSS ni environment.prod.ts.**
Corrección: CI y Dockerfile usan siempre `ng build --configuration=production`.

### LA-019-06 · process
**Patrón DEBT-022 no verificable automáticamente en Code Review.**
Corrección: Script grep DEBT-022 obligatorio en G-5.

### LA-019-07 · testing
**Smoke test desactualizado — no cubre endpoints del sprint corriente.**
Corrección: smoke-test actualizado obligatorio como artefacto de G-4.

### LA-019-08 · architecture
**@Profile(!production) activa Mock en STG — BD real nunca consultada.**
Corrección: Mocks solo con @Profile(mock) o @Profile(test). @Primary en adaptador real.

### LA-019-09 · config
**environment.prod.ts desincronizado con environment.ts.**
Corrección: Validación automática de campos en CI.

### LA-019-10 · frontend
**Módulos Angular nuevos no registrados en router.**
Corrección: Checklist G-4 incluye verificación de registro en app-routing.module.ts.

### LA-019-11 · frontend
**Componentes de ruta usan @Input para params — nunca se populan.**
Corrección: Usar siempre ActivatedRoute.paramMap en componentes de ruta.

### LA-019-12 · data
**UUIDs inválidos en seeds SQL (caracteres no hex).**
Corrección: Validar UUIDs con regex antes de ejecutar seeds.

### LA-019-13 · database
**timestamp without time zone vs Instant Java — incompatibilidad de tipos.**
Corrección: LLD incluye mapa de tipos BD→Java. Usar LocalDateTime para columnas sin timezone.

### LA-019-14 · frontend
**OnPush + paramMap no dispara CD al cambiar cuenta.**
Corrección: OnPush solo cuando se garantiza inmutabilidad y markForCheck() en todos los observables.

### LA-019-15 · backend
**Named params JdbcClient contaminados por concatenación de text blocks.**
Corrección: SQL dinámico siempre usa parámetros posicionales (?).

### LA-019-16 · process
**QA no declara si prueba contra Mock o BD real.**
Corrección: Informe QA obliga campo: Repositorio activo: MOCK|JPA-REAL.

---

## Sprint 20 — FEAT-018 Exportación

### LA-020-01 · process
**Jira debe actualizarse en cada step del pipeline sin instrucción explícita.**
Corrección: Regla permanente: transición automática en cada gate.

### LA-020-02 · security
**Hallazgos CVSS >= 4.0 deben resolverse en el mismo sprint donde se detectan.**
Corrección: No diferir si CVSS >= 4.0.

### LA-020-03 · architecture
**Audit log con datos derivados crea inconsistencia — enriquecer en momento de escritura.**
Corrección: DEBT-036: inyectar AccountRepository en ExportAuditService.

### LA-020-04 · devops
**Workflow Jira debe configurarse con todos los estados SOFIA antes del primer sprint.**
Corrección: Checklist onboarding incluye configuración workflow.

### LA-020-05 · process
**Documentation Agent (10 DOCX + 3 XLSX + dashboard) no ejecutado en Step 8.**
Corrección: Documentation Agent es BLOQUEANTE para Gate G-9. No se cierra sprint sin artefactos.

### LA-020-06 · process
**sprint-NN-planning-doc.docx es obligatorio en word/ de cada sprint — faltaba S18/S19/S20.**
Corrección: Checklist deliverables: planning-doc.docx bloqueante para Gate G-8 desde S21.

### LA-020-07 · dashboard
**Dashboard no se regeneraba en cada aprobación de gate, solo al cerrar sprint.**
Corrección: gate-dashboard-hook.js invocado en cada gate.

### LA-020-08 · process
**gen-fa-document.py no se invocaba automáticamente en Step 8b.**
Corrección: gen-fa-document.py debe ejecutarse en Step 8b de cada sprint.

### LA-020-09 · process ⚠️ CRÍTICA
**Developer Agent generó ficheros bajo paquete incorrecto (es.meridian) inferido de documentación.**
Corrección: REGLA PERMANENTE: antes de crear cualquier fichero Java, verificar package raíz real con `cat BankPortalApplication.java | head -1`.

### LA-020-10 · code-review ⚠️ CRÍTICA
**Code Reviewer validó consistencia interna entre ficheros nuevos pero no contra el codebase real.**
Corrección: REGLA PERMANENTE: el Code Reviewer DEBE ejecutar grep del package raíz contra los nuevos ficheros.

### LA-020-11 · testing ⚠️ CRÍTICA
**Sprint 20 cerrado sin SpringContextIT ni integration tests. mvn compile no ejecutado.**
Corrección: REGLA PERMANENTE: SpringContextIT es BLOQUEANTE para Gate G-4b. mvn compile (no mvn test) antes de declarar G-4b OK.

### LA-TEST-001 · backend
**ExportController usaba getAttribute("userId") pero JwtAuthenticationFilter escribe "authenticatedUserId".**
Corrección: al usar HttpServletRequest.getAttribute(), verificar el nombre del atributo contra el filtro que lo escribe.

### LA-TEST-002 · backend
**TransactionExportRepository filtraba t.type cuando ExportRequest.tipoMovimiento contiene categoría.**
Corrección: Distinguir siempre entre type (dirección financiera) y category (tipo negocio).

### LA-TEST-003 · backend
**Excepciones de dominio sin @ResponseStatus → HTTP 500 en lugar de 400/422.**
Corrección: Toda RuntimeException custom debe tener @ResponseStatus o estar en @ControllerAdvice.

### LA-TEST-004 · backend
**JdbcClient no convierte Instant automáticamente para TIMESTAMP without time zone.**
Corrección: Para TIMESTAMP usar Timestamp.from(instant) o LocalDateTime. Para TIMESTAMPTZ usar OffsetDateTime.

---

## Sprint 21 — FEAT-019 Centro de Privacidad

### LA-021-01 · process
**FA-Agent actualizaba functionalities en Gate 2b pero NO el array business_rules.**
Corrección: En Gate 2b, añadir business_rules junto a functionalities. total_business_rules = len(business_rules) NUNCA hardcodeado. validate-fa-index.js bloqueante.

### LA-021-02 · testing
**IntegrationTestBase no declaraba campos testUserId/testAccountId usados en ITs hijos.**
Corrección: IntegrationTestBase debe declarar todos los fixtures UUID comunes.

### LA-021-03 · process
**Documentation Agent generó solo 10 DOCX vs los 17 obligatorios.**
Corrección: Documentation Agent DEBE generar 17 documentos: 10 técnicos + 7 CMMI/Gestión. BLOQUEANTE para Gate G-8.

### LA-FRONT-001 · frontend
**Módulos Angular en features/ no registrados en app-routing.module.ts ni en sidebar.**
Corrección: al crear módulo en features/ → añadir ruta lazy en app-routing.module.ts + nav item en shell.component.ts en el MISMO step.

### LA-FRONT-002 · frontend
**Componente placeholder creado para resolver error de build pero llegó a imagen Docker de producción.**
Corrección: antes de crear placeholder, verificar si el backend tiene el endpoint implementado. Si existe, implementar el componente real.

### LA-FRONT-003 · frontend
**Import path incorrecto en componente anidado (1 nivel cuando eran 2).**
Corrección: calcular el path relativo desde la ubicación real del fichero, no desde el módulo.

### LA-FRONT-004 · frontend
**Backend endpoint no implementado pero ruta Angular registrada — página en blanco silenciosa.**
Corrección: antes de registrar ruta Angular, verificar que el endpoint backend existe. Si no → DEBT-XXX + ruta comentada.

### LA-FRONT-005 · frontend
**docker compose up sirve imagen preconstruida — cambios en source code no se reflejan.**
Corrección: cualquier cambio Angular requiere `docker compose build frontend` + `up -d --no-deps frontend`.

---

## STG Verification — BUG-VER-001/002 (2026-04-01)

> Detectados durante verificación navegada en Chrome de BankPortal v1.21.0 en STG.
> Incorporados como reglas permanentes en SOFIA v2.5.

### LA-STG-001 · frontend ⚠️ CRÍTICA
**`forkJoin` en ProfilePageComponent bloqueado por `catchError → EMPTY` — skeleton infinito.**

`forkJoin` requiere que TODOS sus observables emitan al menos un valor.
Si cualquier observable retorna `EMPTY` (completa sin emitir), `forkJoin` nunca emite.
Resultado: componente en skeleton eterno, sin error visible.

```typescript
// ❌ BLOQUEANTE en forkJoin
catchError(err => { return EMPTY; })

// ✅ CORRECTO — of([]) emite y permite que forkJoin complete
catchError(err => { return of([]); })   // para arrays
catchError(err => { return of(null); }) // para objetos
```

**Fix aplicado:** `profile.service.ts` — commit `5207961`
**Script de detección:** `stg-pre-check.js CHECK-1 (GR-007)` — bloqueante en G-4/G-5

---

### LA-STG-002 · frontend
**LoginComponent tenía versión `Sprint 13 · v1.13.0` hardcodeada en template — no se actualizaba.**

Versiones/sprints hardcodeados en templates producen deuda acumulativa: el texto
queda obsoleto en cada sprint y genera desconfianza en el usuario final.

```typescript
// ❌ INCORRECTO — hardcodeado
<small>Sprint 13 · v1.13.0</small>

// ✅ CORRECTO — desde environment.ts
readonly version = environment.version;  // '1.21.0'
readonly sprint  = environment.sprint;   // 21
readonly env     = environment.envLabel; // 'STG'
// Template:
<small>Entorno {{ env }} · Sprint {{ sprint }} · v{{ version }}</small>
```

**Campos obligatorios en environment.ts y environment.prod.ts desde SOFIA v2.5:**
`version`, `sprint`, `envLabel` — el Developer Agent los actualiza en Step 4 de cada sprint.

**Fix aplicado:** `login.component.ts` + `environment.ts/.prod.ts` — commit `bc367a8`
**Script de detección:** `stg-pre-check.js CHECK-2 (GR-008)` — bloqueante en G-4/G-5

---

### LA-STG-003 · frontend (implícita en DEBT-043)
**Endpoints `GET /profile/notifications` y `/profile/sessions` no implementados en backend.**

Frontend consumía 3 endpoints en `forkJoin`. Dos devolvían 404.
Combinado con LA-STG-001 (EMPTY en catchError), el componente quedaba en skeleton.

**Corrección:** antes de implementar forkJoin multi-endpoint, verificar que TODOS existen
en `@*Mapping` de algún Controller Java. Si falta → DEBT-XXX bloqueante para G-5.

**Script de detección:** `stg-pre-check.js CHECK-3 (GR-009)` — bloqueante en G-5

---

## Scripts de guardrail asociados

| Script | LAs cubiertas | Gate |
|---|---|---|
| `.sofia/scripts/guardrail-pre-gate.js` | LA-020-09/10/11 | G-4b, G-5 |
| `.sofia/scripts/validate-fa-index.js` | LA-021-01 | G-2b, G-3b, G-8b |
| `.sofia/scripts/stg-pre-check.js` | LA-STG-001/002/003 | G-4, G-5 |

---

*Generado por SOFIA Orchestrator · v2.5 · 2026-04-01*
