# Informe técnico — Auditoría QA Retrospectiva S18–S26

**Proyecto:** BankPortal
**Cliente:** Banco Meridian
**Referencia interna:** NC-CMMI-001 (Major)
**Fecha:** 28 de mayo de 2026
**Documento:** Anexo técnico a la comunicación ejecutiva del mismo día

---

## 1. Resumen ejecutivo

Durante una revisión interna de calidad realizada el 20 de mayo de 2026, el equipo SOFIA detectó que el reporte QA del Sprint 25 declaraba un conjunto de tests de integración como “PASS” sin que existiera evidencia ejecutable que respaldara esa afirmación. La verificación inmediata confirmó que esos tests, técnicamente correctos en código, no se estaban ejecutando por una configuración estructural ausente en el ciclo de vida de construcción (Maven failsafe-plugin).

La auditoría extendida sobre los nueve sprints anteriores (S18–S26) reveló que **el 100% de los tests de integración del backend** (22 clases `*IT.java`) estaban en la misma situación: presentes en el código fuente, no ejecutados por ningún pipeline de CI. El hallazgo es **un gap de proceso de verificación**, no un defecto de calidad de producto.

**Impacto sobre el producto: nulo.** Cero defectos en producción durante toda la ventana auditada, y cero defectos en los 27 sprints consecutivos del proyecto. Las pruebas unitarias, funcionales, de seguridad, de accesibilidad y de aceptación se mantuvieron operativas y se ejecutaron con normalidad; el gap se limita a la capa de integración con base de datos real.

El equipo abrió formalmente una No Conformidad CMMI Nivel 3 (NC-CMMI-001), ejecutó las acciones correctivas estructurales en seis fases (commits `184e185` → `7440544`), y desplegó dos acciones preventivas que impiden la recurrencia. La NC se cierra el 28 de mayo de 2026 con evidencia ejecutable verificable.

## 2. Prácticas CMMI L3 implicadas

Tres áreas de proceso impactadas, todas remediadas:

| Práctica | Naturaleza del gap | Cómo se ha cerrado |
|---|---|---|
| **PP/QPM SP1.2** — Collect and analyze process and product measurements | Reportes con métricas agregadas no respaldadas por evidencia atómica | Matriz IT real por clase + XML por test obligatorio |
| **VER SP3.2** — Analyze verification results | Resultados de verificación aceptados sin validación cruzada | GR-QA-002 bloqueante en gate G-6 |
| **CM SP3.2** — Perform configuration audits | Auditorías de configuración no detectaban el gap del lifecycle Maven | Checklist pre-G-6 con `mvn verify -Pintegration` + commit SHA registrado |

## 3. Hallazgos técnicos

### 3.1 Causa raíz

Tres factores concurrentes:

1. **Configuración Maven incompleta:** el plugin `maven-failsafe-plugin` —responsable de ejecutar tests con sufijo `*IT.java` (convención nativa para integration tests)— nunca se añadió al `pom.xml` del backend. Los 22 IT del proyecto quedaron huérfanos del ciclo de vida.
2. **Perfil de CI inexistente:** el `Jenkinsfile` del backend invocaba `mvn verify -Pintegration-tests`, un perfil **inexistente**. Maven descarta silenciosamente perfiles no definidos; el comando se ejecutaba sin error visible pero sin tests.
3. **Cultura "trust the report":** ningún gate previo a este verificaba que los claims `PASS` del reporte QA estuvieran respaldados por evidencia ejecutable (XML de surefire/failsafe + commit SHA + timestamp).

### 3.2 Alcance verificado

- **Sprints con claims IT no respaldados:** S18, S19, S21, S22, S24, S25 (6 sprints).
- **Sprints limpios confirmados:** S20, S23 (no declararon claims IT).
- **Sprints con claims falsificables con evidencia directa:** S25 (1 caso reproducido empíricamente: `PfmControllerIT` declarado “5 ITs PASS” → reproducción al HEAD ese sprint: 1/5 ejecutado, 0 PASS, 1 ERROR estructural).

### 3.3 Métricas antes / después de la remediación

| Indicador | Antes | Después |
|---|---|---|
| Clases `*IT.java` ejecutadas por lifecycle | **0 / 22** | **22 / 22** |
| Pipelines CI ejecutando IT | 0 / 3 | 1 / 3 (Jenkinsfile del backend corregido) |
| Tests de integración con resultado verificable (XML) | 0 | 22 |
| Métodos `@Test` de integración verdes con evidencia | 0 | **44** |
| Defectos en producción durante S18–S26 | 0 | 0 _(sin cambios)_ |

## 4. Acciones correctivas ejecutadas

**AC-1 — Reparación de tests rotos** (commit `184e185`, 2026-05-20):
- 5 tests unitarios rotos en `main` reparados.
- 1 test deshabilitado (`AmortizationCalculatorTest TC-LOAN-001/004`) por ambigüedad regulatoria TIN/TAE en el simulador de préstamos — registrado como deuda DEBT-063, requiere gate legal del cliente.

**AC-2 — Configuración estructural Maven failsafe** (commit `4d8fc59`, 2026-05-28):
- `pom.xml` actualizado con `maven-failsafe-plugin` en el perfil `integration` (incluye `**/*IT.java`, objetivos `integration-test`+`verify`).
- `Jenkinsfile` del backend: corregido `-Pintegration-tests` (perfil fantasma) → `-Pintegration` (perfil real).
- Hallazgo colateral: los otros dos pipelines (`Jenkinsfile infra`, `.github/workflows/ci.yml`) tampoco ejecutaban IT (usaban perfil default). Su corrección queda diferida a Sprint 27 como tarea de mantenimiento.

**AC-3 — Ejecución de la matriz real y triage** (commit `d38cbe2`, 2026-05-28):
- `mvn verify -Pintegration` ejecuta el 100% de los 22 IT (antes: 0).
- Resultado verificable: **13 clases PASS (44 `@Test` verdes), 9 clases en `@Disabled` con deuda técnica registrada, 0 fallos, 0 errores. Build verde.**
- `PfmControllerIT` (caso testigo de S25): 5/5 PASS reproducible. Cierra DEBT-055.

## 5. Acciones preventivas desplegadas

**AP-1 — Guardrail GR-QA-002** (bloqueante en gate G-6):
Todo test (`*Test` o `*IT`) declarado PASS en un reporte QA debe acompañarse de evidencia ejecutable verificable: XML de failsafe/surefire, commit SHA del HEAD al ejecutar, timestamp ISO-8601, conteo `tests/failures/errors/skipped`, perfil Maven activo. Sin XML, el claim queda marcado BLOCKED, no PASS, y el gate G-6 queda bloqueado hasta resolución.

**AP-2 — SKILL del QA Tester actualizado** en tres puntos:
- Paso 2b (auditoría de tests de integración): instrucción canónica `mvn verify -Pintegration` + obligación de adjuntar `failsafe-reports/`.
- Exit Criteria New Feature: dos checkboxes nuevos exigiendo evidencia ejecutable.
- Plantilla de output: nueva sección “Evidencia ejecutable de IT” con tabla por clase `FQCN | tests | F | E | S | Resultado | XML`.

**AP-3 — Checklist operativo pre-G-6:** verificación de working tree limpio + SHA capturado + ejecución de surefire y failsafe + validación de XML por cada claim PASS.

Las tres acciones preventivas están operativas desde el próximo gate G-6 (Sprint 27).

## 6. Balance de deudas técnicas

**Cerradas durante la NC** (4 deudas):

| ID | Prioridad | Cierre |
|---|---|---|
| DEBT-055 | Crítica | `PfmControllerIT` 5/5 PASS reproducible + GR-QA-002 impide recurrencia |
| DEBT-056 | Media | Cubierta por GR-QA-002 + actualización del SKILL QA Tester |
| DEBT-061 | Crítica | Tests `main` reparados |
| DEBT-062 | Crítica | Failsafe configurado + 22/22 IT ejecutables |

**Diferidas a Sprint 27 con sprint target documentado:**

| ID | Prioridad | Razón |
|---|---|---|
| DEBT-063 | Alta | Ambigüedad regulatoria TIN/TAE en simulador de préstamos — requiere gate legal del cliente |
| DEBT-064 | Alta | Migración de 4 IT desde Testcontainers a perfil `integration-compose` (incompatibilidad versión Testcontainers con daemon Docker Desktop 29.4.1) |
| DEBT-065 | Media | Renombre de 5 tests `@WebMvcTest` mal clasificados como `*IT` a `*Test` |

Las tres diferidas son refactors estructurales que no representan riesgo de recurrencia de la NC; son mejoras de calidad de código de tests que se abordarán en planificación regular.

## 7. Lecciones aprendidas registradas

Tres lecciones formalmente registradas en el repositorio de conocimiento del equipo, candidatas a promoción al estándar SOFIA-CORE para aplicar a otros proyectos:

- **LA-026-09** — Evidencia ejecutable obligatoria para claims PASS (origen del guardrail GR-QA-002).
- **LA-026-10** — Matriz IT real con FQCN y XML como artefacto del gate G-6.
- **LA-026-11** — Alineación de perfiles CI con `pom.xml`: validación periódica de que todo perfil Maven invocado en pipelines existe realmente.

## 8. Decisión de cierre

NC-CMMI-001 queda formalmente cerrada el 28 de mayo de 2026 con base en:

1. Causa raíz identificada y documentada (configuración Maven + perfil CI fantasma + cultura sin verificación cruzada).
2. Acción correctiva ejecutada y verificada empíricamente (22/22 IT ejecutables, build verde).
3. Acción preventiva desplegada y operativa desde el próximo gate G-6 (Sprint 27).
4. Deudas residuales priorizadas y planificadas con sprint target.
5. Trazabilidad CMMI L3 íntegra; impacto producto nulo mantenido a lo largo de toda la auditoría.

## 9. Cronología y trazabilidad de commits

| Fase | Descripción | Commit | Fecha |
|---|---|---|---|
| F0 | Apertura NC + plan 6 fases | _(setup)_ | 2026-05-20 |
| F1 | Hotfix tests rotos `main` (DEBT-061) | `184e185` | 2026-05-20 |
| F2 | Auditoría retrospectiva S18–S26 (alcance 11→22) | `296e372` | 2026-05-28 |
| F3A | Failsafe-plugin + fix Jenkinsfile `-Pintegration` | `4d8fc59` | 2026-05-28 |
| F3B | Matriz IT real + triage + 9 `@Disabled` con deuda | `d38cbe2` | 2026-05-28 |
| F4 | GR-QA-002 + SKILL QA Tester + acciones correctivas/preventivas | `99779c4` | 2026-05-28 |
| F5 | Lecciones aprendidas + cierre formal NC + DEBT-055 | `7440544` | 2026-05-28 |
| F6 | Comunicación al cliente | _(este documento)_ | 2026-05-28 |

Rama de auditoría: `hotfix/qa-audit-s18-s26`. Merge a `develop` previsto tras la confirmación de recepción de esta comunicación por parte de Banco Meridian.

---

*Documento generado por el equipo SOFIA · BankPortal · 28 de mayo de 2026*
*Acta interna de cierre completa disponible en `docs/audit/QA-AUDIT-S18-S26/06-nc-closure.md`*
