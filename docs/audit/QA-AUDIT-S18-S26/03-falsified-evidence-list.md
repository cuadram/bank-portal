# Fase 2 · Lista de Evidencia QA No Respaldada S18-S26

**NC-CMMI-001** · `hotfix/qa-audit-s18-s26` · Generado 2026-05-28
**Definición operativa:** "evidencia no respaldada" = afirmación de estado PASS/ejecución sobre uno o más `*IT.java` en un reporte QA firmado, cuando dichos `*IT.java` son demostrablemente huérfanos del lifecycle Maven (§1 de `02-retrospective-matrix.md`) y por tanto no pudieron ejecutarse en el build de ese sprint.

**Alcance producto:** NULO. 0 defectos en producción en 27 sprints. Esto es un gap de **proceso de verificación** (VER SP3.2), no de calidad de producto. La lógica de negocio sí estaba cubierta por unit tests (`*Test.java`) que el lifecycle sí ejecuta.

---

## 1. Resumen por sprint

| Sprint | Reporte | Claim IT | Veredicto | Severidad |
|---|---|---|---|---|
| S18 | QA-FEAT-016-sprint18.md | "Cadena completa verificada con @SpringBootTest" (L372) | NO RESPALDADO — 5 ITs auth/audit/notification/account huérfanos | Media |
| S19 | QA-FEAT-017-sprint19.md | "Integration Tests 9/9 PASS · SpringContextIT 9/9" (L36, L683) | NO RESPALDADO — 4 ITs nuevos + SpringContextIT huérfanos | Alta |
| S20 | QA-FEAT-018-sprint20.md | "11 SKIPPED (WebMvcTest IT)" (L154) | HONESTO PARCIAL — registra skip, no falsifica PASS | — (limpio) |
| S21 | QA-FEAT-019-sprint21.md | "Integration Tests 9/9 PASS · TC-IT-001-G/H/I OK" (L36, L51-55) | NO RESPALDADO — reclama ITs privacy/consent ejecutados | Alta |
| S22 | QA-FEAT-020-sprint22.md | "TC-F022-021..025 (@SpringBootTest)" (L39, L357+) | NO RESPALDADO — reclama SpringContextIT huérfano | Media |
| S23 | QA-FEAT-021-sprint23.md | (sin claim IT) | LIMPIO — no afirma ejecución IT | — (limpio) |
| S24 | QA-FEAT-022-sprint24.md | "SpringContextIT TC-F022-021..025 @SpringBootTest" (L39, L357+) | NO RESPALDADO — repite claim S22 sobre IT huérfano | Media |
| S25 | QA-FEAT-023-sprint25.md | **"TC-IT-005 PASS — 5 ITs @SpringBootTest" (L60)** | **FALSIFICADO — claim numérico explícito; reproducción Fase 1: 1/5 ejecuta, 0 PASS, 1 ERROR (DEBT-055)** | **Crítica** |
| S26 | QA-Report-FEAT-024-sprint26.md | "145/145 IT PASS" (L17); reconoce "CI ejecuta ITs: GAP" (L47) | PARCIAL — cuenta ITs como unit, pero **autodocumenta el gap CI** | Baja |

**Distribución:** 6 sprints con claims no respaldados (S18,S19,S21,S22,S24,S25), de los cuales **S25 es el único FALSIFICADO con verificación empírica directa**. S26 mitiga al declarar el gap. S20 y S23 limpios.

---

## 2. Caso crítico — S25 / DEBT-055 (evidencia primaria)

`docs/quality/QA-FEAT-023-sprint25.md` línea 60 firma textualmente un PASS de 5 ITs vía `@SpringBootTest` sobre `PfmControllerIT`. Reproducción en Fase 1 (HEAD `5f6803f`):

- `PfmControllerIT` ejecuta **1 de 5** métodos declarados.
- **0 PASS · 1 ERROR estructural**: `Unable to find a @SpringBootConfiguration`.
- El test ni siquiera arranca contexto → el claim "5 ITs PASS" es materialmente imposible en ese build.

Este es el único caso donde la falsificación está respaldada por ejecución directa (no solo por inferencia del lifecycle). Sostiene la clasificación **Major** de NC-CMMI-001.

---

## 3. Naturaleza del fallo (no atribución de mala fe)

El patrón es coherente con la causa raíz (b)+(c): los agentes QA confiaron en la **presencia** del fichero `*IT.java` y su anotación `@SpringBootTest` como prueba de ejecución, sin verificar evidencia ejecutable (surefire-reports + SHA + timestamp). El lifecycle silenciosamente no los corría. No hay indicio de fabricación deliberada de números salvo en S25, donde el claim "5 ITs PASS" se emitió sobre un test estructuralmente roto.

---

## 4. Acciones derivadas

- **DEBT-062** (alcance corregido 11→22): fix estructural Maven failsafe → Fase 3.
- **GR-QA-002** (preventiva): Step 6 exige `mvn -Pit verify` + surefire-reports como evidencia adjunta antes de G-6 → Fase 4.
- **Comunicación Banco Meridian** (D3): transparencia sobre gap de proceso con impacto-producto nulo → Fase 6.
- **Reproceso de gates:** NO (decisión D2 — no reabrir gates firmados; gestionar vía NC + corrective action).
