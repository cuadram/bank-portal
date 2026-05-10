# Code Review Report — FEAT-024: Objetivos de Ahorro

## Metadata
- **Proyecto:** BankPortal | **Cliente:** Banco Meridian
- **Stack:** Java 21 / Spring Boot 3.x (hexagonal) + Angular 17
- **Sprint:** 26 | **Fecha:** 2026-05-08
- **Archivos revisados:** 47 backend (Java) + 21 frontend (TS/HTML/SCSS) = 68 ficheros nuevos · ~8.8K LOC
- **PR / Rama:** `feature/FEAT-024-sprint26` · HEAD `52e3d26` (sincronizado origin)
- **Referencia Jira:** SCRUM-163..173 (US-024-01..09 + DEBT-048/049/050/051)
- **Reviewer:** SOFIA Code Reviewer Agent v2.6
- **Alcance principal:** Step 4 Fase H (5 commits Fase H — `bb32da5`, `f38c6ad`, `20b64c1`, `4e12abd`, `8d4e0bd`); Fases A..G ya revisadas implícitamente al cierre de cada sub-fase y validadas en G-4 (gate previo).

---

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 0 | 0 | 0 | 1 |
| Contrato OpenAPI | 0 | 0 | 0 | 0 |
| Seguridad | 0 | 0 | 1 | 1 |
| Calidad de Código | 0 | 0 | 0 | 1 |
| Tests | 0 | 0 | 0 | 0 |
| Documentación | 0 | 0 | 1 | 1 |
| Convenciones Git | 0 | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **2** | **4** |

## Veredicto

**✅ APROBADO**

Cero bloqueantes y cero mayores. Los hallazgos menores y sugerencias se documentan abajo y pueden absorberse en este mismo PR si el Developer dispone de tiempo, pero no condicionan el avance a Step 6 (QA Tester).

---

## Hallazgos detallados

### 🟡 Menores

#### RV-MIN-01 — Javadoc a nivel de método ausente en controllers y use cases
- **Nivel:** Documentación
- **Archivos:** `savings/api/controller/SavingsController.java` (11 endpoints), `savings/application/usecase/*.java` (10 UCs · método `execute`)
- **Descripción:** El Javadoc a nivel de **clase** es excelente (`SavingsController` mantiene una tabla completa endpoint→UC; cada UC describe su responsabilidad). Sin embargo, los métodos públicos individuales (`listGoals`, `createGoal`, `getGoal`, …, `execute`) no tienen Javadoc por método. Cobertura: 13 con / 117 sin = **10%** en el módulo savings.
- **Por qué no es BLOQUEANTE:** El nivel 6 de la skill (Documentación) clasifica esto como menor cuando hay Javadoc de clase y los métodos son auto-explicativos por nombre + firma. Los nombres aquí son inequívocos (`listGoals`, `createGoal`, etc.) y el mapping endpoint→UC ya está documentado a nivel de clase.
- **Corrección sugerida:** Añadir Javadoc breve (1 línea + `@param`/`@return`) en los 11 endpoints del controller y los 10 `execute()` de los UCs.

#### RV-MIN-02 — Política de exposición de springdoc en producción no formalizada
- **Nivel:** Seguridad
- **Archivo:** `twofa/infrastructure/config/SecurityConfig.java:43-44` (commit `bb32da5`)
- **Descripción:** El permitAll de `/v3/api-docs`, `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` es correcto para staging/local (necesario para el smoke). Sin embargo, en producción el cliente Banco Meridian podría exigir restringir el acceso al schema OpenAPI a redes internas. El handoff (sec. 3.2) ya levanta la pregunta y sugiere un override por perfil (`application-prod.yml`).
- **Por qué no es BLOQUEANTE:** El schema OpenAPI no expone datos de cliente, sólo metadatos. Decisión política, no técnica. No bloquea la entrega.
- **Acción sugerida:** Crear DEBT-052 "springdoc en prod: política de exposición" como input para el release-manager pre-PROD (Step 7 / G-7). Decisión a tomar antes del primer despliegue a producción.

### 🟢 Sugerencias

#### RV-SUG-01 — Trazabilidad V18c→V31 en ADR-028
- **Nivel:** Documentación / Arquitectura
- **Archivo:** `docs/architecture/adr/ADR-028-*.md`
- **Descripción:** Los 3 ficheros Java (`SchedulingConfig`, `AutoContributionScheduler`, `ShedLockEnabledIT`) y la cabecera de `V31__shedlock.sql` mencionan correctamente el rename "originalmente V18c en S18 (ADR-028)". Convendría también añadir una nota retroactiva en el ADR-028 mismo para cerrar el círculo de trazabilidad histórica.
- **Acción sugerida:** Bloque "Update Sprint 26 (2026-05-08): migration renumerada V18c→V31 — ver Fase H.7" al final del ADR-028. El handoff (sec. 3.3) deja explícitamente esta decisión al Tech Lead.

#### RV-SUG-02 — `validate-smoke-vs-openapi.js` como guardrail bloqueante CI (GR-CI-002)
- **Nivel:** Calidad / Procesos
- **Archivo:** `.sofia/scripts/validate-smoke-vs-openapi.js` (197 líneas, exit codes 0/1/2)
- **Descripción:** El script funciona correctamente y detecta drift OpenAPI ↔ smoke en ambos sentidos. Está documentado como candidato GR-CI-002 (DEBT-049). La decisión de promoverlo a guardrail bloqueante en `guardrail-pre-gate.js` corresponde a Step 8b (Documentation Agent + FA-Agent) con aprobación del Tech Lead.
- **Acción sugerida:** Si el Tech Lead aprueba, activar desde Sprint 27. Riesgo bajo: el script es estable y el smoke ya es obligatorio.

#### RV-SUG-03 — Cobertura de bundle size y startup time en checklist pre-G-7
- **Nivel:** Calidad / Procesos
- **Archivo:** `.sofia/skills/devops/SKILL.md` líneas 853–894
- **Descripción:** Los 10 items actuales del checklist son sólidos y se autovalidaron operativamente al detectar los 3 bugs de Fase H. Como sugiere el handoff (sec. 3.6), candidatos extra para futuras versiones del checklist:
  - **Bundle size budget**: `ng build production` → comparar `dist/**/*.js` con sprint anterior, alertar si crecimiento >10%.
  - **Spring Boot startup time**: instrumentar `ApplicationStartedEvent` y validar <30s en compose externo.
- **Acción sugerida:** Promover en LA-026-H4 (nueva, no listada en handoff) si Tech Lead lo aprueba.

#### RV-SUG-04 — Helper `userId(HttpServletRequest)` repetido en otros controllers
- **Nivel:** Calidad de código (DRY)
- **Archivo:** `savings/api/controller/SavingsController.java:87-89` (y patrón equivalente en `account`, `transfer`, `beneficiary`, `scheduled`)
- **Descripción:** El patrón `private UUID userId(HttpServletRequest req) { return (UUID) req.getAttribute("authenticatedUserId"); }` aparece de forma idéntica o casi idéntica en al menos 5 controllers del proyecto (deuda heredada). No es introducido por este sprint, pero el sprint reproduce el patrón. Refactor candidato: helper estático en `twofa/infrastructure/security/AuthenticatedUser` o argument resolver custom Spring que inyecte directamente `UUID userId`.
- **Acción sugerida:** Crear DEBT-053 "Eliminar helper userId() duplicado en controllers" como deuda transversal.

---

## Métricas de calidad

| Métrica | Valor | Mínimo | Estado |
|---|---|---|---|
| Tests savings backend | **18** ficheros (145 tests) | ≥143 | ✅ |
| Tests PASS | **145/145** | 100% | ✅ |
| `mvn compile` warnings nuevos | **0** | 0 | ✅ |
| `ng build --configuration production` | **SUCCESS** | SUCCESS | ✅ (Fase H.6) |
| `SpringContextIT` presente | **Sí** | Sí | ✅ |
| `ShedLockEnabledIT` presente | **Sí** (2 tests) | — | ✅ NUEVO Fase H.2 |
| `SavingsFlywayIT` presente | **Sí** | — | ✅ |
| Cobertura aprox. (estimada por ratio test/main) | ~80% | ≥80% | ✅ |
| Complejidad ciclomática máxima | n/d (sin SonarQube en CR) | ≤10 | ⏸ Step 6 (QA) |
| Métodos públicos sin Javadoc en savings | 117 / 130 (clases) | — | 🟡 RV-MIN-01 |
| Desviaciones del contrato OpenAPI | **0** | 0 | ✅ |
| Endpoints expuestos `/api/v1/savings/**` | **6 paths** | per LLD §8 | ✅ |
| Migrations Flyway aplicadas | V29, V30, V31 | per LLD §6 | ✅ |
| Líneas modificadas en Fase H | 9 ficheros · ~129 ins / ~14 del | ≤400 | ✅ |
| Sincronización con origin | HEAD == origin/HEAD | required | ✅ `52e3d26` |

---

## Verificación de los puntos del Developer (handoff sec. 3)

| # | Punto | Veredicto |
|---|---|---|
| 3.1 | `SchedulingConfig.java` ubicado en `twofa/infrastructure/config/` | ✅ **CORRECTO**. 6 `@Configuration` ya viven ahí. SchedulingConfig es transversal — cualquier feature futuro con `@SchedulerLock` lo usará. |
| 3.2 | SecurityConfig permitAll springdoc | ✅ **CORRECTO** para staging/local. Convertir en RV-MIN-02 / DEBT-052 para decisión política pre-PROD. |
| 3.3 | V18c→V31 trazabilidad ADR-028 | ✅ Trazabilidad de código **correcta**. RV-SUG-01 sugiere completar con nota retroactiva en el ADR-028. |
| 3.4 | jwt-decode `^4.0.0` | ✅ **CORRECTO**. `import { jwtDecode }` (named) es API 4.x. Decisión bien fundamentada. |
| 3.5 | `validate-smoke-vs-openapi.js` GR-CI-002 | RV-SUG-02 — promoción opcional en Step 8b · activación recomendada desde Sprint 27. |
| 3.6 | Checklist devops pre-G-7 | ✅ **SUFICIENTE**. RV-SUG-03 sugiere bundle size + startup time como ítems 11-12 futuros. |

---

## Decisiones recomendadas al Tech Lead

| Decisión | Recomendación | Rationale |
|---|---|---|
| **G-5 (Code Review)** | ✅ Aprobar | Cero BLOQUEANTES, cero MAYORES, 145/145 tests |
| **LA-026-H1** (ng build production en Fase G) | ✅ Promover en Step 8b | Autovalidada al detectar 2 de 3 bugs Fase H |
| **LA-026-H2** (Flyway números estrictamente crecientes) | ✅ Promover en Step 8b | Lección clara · valor cross-proyecto |
| **LA-026-H3** (`compose down -v` + lista canónica al cierre Step 4) | ✅ Promover en Step 8b | Ya incluida en checklist pre-G-7 item 3 |
| **GR-CI-002** (validate-smoke-vs-openapi.js bloqueante) | 🟡 Activar desde Sprint 27 | Script estable · cierra DEBT-049 |
| **DEBT-052** (springdoc política prod) | ✅ Crear (nueva) | Decisión política con cliente Banco Meridian pre-PROD |
| **DEBT-053** (`userId()` helper duplicado) | 🟡 Backlog | Refactor transversal · prioridad baja |

---

## Acciones requeridas post-review

1. **Tech Lead aprueba G-5** → Workflow Manager notifica al QA Lead, pipeline avanza a Step 6 (QA Tester · gate HITL QA G-6).
2. **(Opcional, no bloqueante) Developer absorbe RV-MIN-01** en commit de seguimiento dentro del mismo PR.
3. **(Opcional) Tech Lead aprueba LAs y DEBTs** sugeridas → registrar en backlog y procesar en Step 8b.
4. **Step 5b (Security Agent)**: ejecución AUTO con gate bloqueante si CVEs críticos > 0.
5. **Sin re-review necesario.** Veredicto APROBADO en primera pasada.

---

**Próximo gate solicitado:** **G-5 · HITL TL** (Angel de la Cuadra)
**Comando esperado del PO/Tech Lead:** `apruebo G-5 · LAs <H1,H2,H3 / ninguna> · GR-CI-002 <activar / pendiente> · DEBT-052 <crear / no>`
