# SRS — Sprint 27 · Saneamiento + Deudas — BankPortal / Banco Meridian

## Metadata
- Cliente: Banco Meridian · PO/TL/SM/QA (HITL único): Angel de la Cuadra
- Sprint: 27 · Feature: S27-saneamiento+deudas (sin FEAT nueva)
- SOFIA: v2.8 · Pipeline 15 steps · Documento generado en Step 2 (Requirements Analyst)
- Capacity comprometida: 23 SP (8 items) · Gate de cierre: HITL PO (G-2)
- Origen de inputs: addendum G-1 aprobado (2026-05-29) en `docs/backlog/SPRINT-027-plan.md`
- CMMI L3 — proceso RD (Requirements Development)

## 1. Propósito y contexto
Este SRS formaliza, como **requisitos verificables con criterios de aceptación**, el
trabajo de saneamiento comprometido para el Sprint 27. Al no existir feature funcional
nueva, NO se generan User Stories INVEST: cada item de deuda técnica o BUG-PO se
documenta como requisito trazable a su evidencia de verificación, alineado con los
Exit Criteria del plan de sprint y con **GR-QA-002** (evidencia ejecutable obligatoria
en G-6).

El sprint estabiliza la suite de integración y la configuración multi-perfil tras el
cierre de NC-CMMI-001, salda deuda funcional priorizada y deja el pipeline listo para
feature en S28.

## 2. Alcance

### 2.1 En alcance (23 SP — 8 items, todos COMPROMETIDOS)
| REQ | Item | Jira | DEBT/BUG | SP | Prio |
|---|---|---|---|---|---|
| REQ-S27-01 | Cierre formal IT lifecycle (verificación) | SCRUM-175 | DEBT-062 | 1 | Crítica |
| REQ-S27-02 | Migrar 4 IT Testcontainers → integration-compose | SCRUM-176 | DEBT-064 | 5 | Alta |
| REQ-S27-03 | Renombrar 5 *IT → *Test (slices @WebMvcTest) | SCRUM-177 | DEBT-065 | 2 | Media |
| REQ-S27-04 | GR-CONFIG-001: merge YAML profiles + validador + bloqueo G-4b | SCRUM-178 | DEBT-054 | 3 | Media |
| REQ-S27-05 | Paginación AutoContributionScheduler (LLD §11) | SCRUM-179 | DEBT-053 | 2 | Media |
| REQ-S27-06 | Mensaje excepción savings sin importes (CWE-209) | SCRUM-180 | DEBT-059 | 1 | Baja |
| REQ-S27-07 | BUG-PO menores 023-035 — PFM visual (umbrella, 13) | SCRUM-181 | BUG-PO 023-035 | 3 | Menor |
| REQ-S27-08 | BUG-PO mayores 012-022 — PFM visual (umbrella, 11) | SCRUM-182 | BUG-PO 012-022 | 6 | Mayor |

### 2.2 Fuera de alcance
| Item | Motivo |
|---|---|
| DEBT-063 (TIN/TAE) | Gate legal Banco Meridian sin resolver → sin DR-S27-001 |
| DEBT-060 (Spring Boot 3.3.6+) | Requiere sprint dedicado de upgrade de framework |
| BUG-PO críticos 001-009 | Ya corregidos en S25/S26 |
| Housekeeping 9 ramas S2-S14 | No incluido en G-1; micro-tarea aparte pendiente de OK PO |

### 2.3 Notas de reconciliación (transparencia CMMI L3)
- Universo BUG-PO real = 35 (001-035; no existe 036). Set diferido = **24** (012-035): 11 mayores + 13 menores.
- DEBT-062 entra como **verificación + cierre formal con evidencia**, NO re-fix (causa raíz ya corregida al cerrar NC-CMMI-001).

## 3. Requisitos no funcionales — baseline + delta S27
Sin RNF de negocio nuevos. El saneamiento refuerza RNF de **proceso/calidad** y **seguridad** ya en baseline:
| RNF | Categoría | Criterio reforzado en S27 | Item ligado |
|---|---|---|---|
| RNF-PROC-001 (GR-QA-002) | Calidad/Proceso | Todo *Test/*IT que declare PASS aporta evidencia ejecutable (XML + SHA + timestamp + counts + perfil Maven) | REQ-S27-01/02/03 |
| RNF-CFG-001 (GR-CONFIG-001) | Configuración | Merge profundo de perfiles YAML validado y bloqueante en G-4b | REQ-S27-04 |
| RNF-004/005 (Seguridad) | Seguridad | No fuga de datos sensibles en mensajes de excepción (CWE-209) | REQ-S27-06 |

## 4. Requisitos verificables

### REQ-S27-01 — DEBT-062 · Cierre formal IT lifecycle (verificación)
**Jira** SCRUM-175 · **SP** 1 · **Prio** Crítica · **Tipo** Tech Debt (verificación)
Verificar que los 22 tests de integración (`*IT.java`) son recolectados y ejecutados por
`mvn -Pintegration verify` (failsafe) y producir acta de cierre con evidencia.
```gherkin
Escenario: Recolección y ejecución completa de la suite IT
  Dado el perfil Maven "integration" con maven-failsafe-plugin configurado (**/*IT.java)
  Cuando se ejecuta "mvn -Pintegration verify" desde apps/backend-2fa
  Entonces los 22 ficheros *IT son recolectados por failsafe
  Y el build termina VERDE (0 fail / 0 error)
  Y se generan los TEST-{FQCN}.xml correspondientes
Escenario: Acta de cierre con evidencia
  Dado un build VERDE de la suite IT
  Cuando se redacta el acta de cierre de DEBT-062
  Entonces incluye conteo (IT recolectados/PASS/@Disabled), SHA, timestamp y perfil Maven
```
**DoD** GR-QA-002 satisfecho · acta con evidencia · `session.json.open_debts` DEBT-062 reconciliado OPEN→CLOSED.

### REQ-S27-02 — DEBT-064 · Migrar 4 IT Testcontainers → integration-compose
**Jira** SCRUM-176 · **SP** 5 · **Prio** Alta · **Tipo** Tech Debt
Migrar los 4 IT que usan Testcontainers 1.20.1 (incompatibles con Docker daemon 29.4.1,
Status 400) al perfil `integration-compose` con fixtures SQL.
```gherkin
Escenario: IT ejecutables sin Testcontainers
  Dado el perfil "integration-compose" con servicios vía docker-compose (-f infra/compose/docker-compose.yml)
  Y fixtures SQL de datos de prueba
  Cuando se ejecutan los 4 IT migrados
  Entonces arrancan sin invocar la API de Testcontainers
  Y pasan en VERDE generando su TEST-{FQCN}.xml
Escenario: Timebox de riesgo R-S27-01
  Dado el timebox de 5 SP
  Cuando la migración excede el timebox
  Entonces se aplica fallback (upgrade Testcontainers) y el remanente se mueve a S28
```
**DoD** 4/4 IT VERDE con XML · sin dependencia del daemon · documentado el perfil.

> **✅ CIERRE DEBT-064 (Step 4, 2026-06-01):** **26/26 tests VERDE, 0 fail/0 err, BUILD SUCCESS.**
> SpringContextIT 9/9 · LoginControllerIT 5/5 · DashboardJpaAdapterIT 8/8 · AccountRepositoryAdapterIT 4/4.
> - Migrados a `@SpringBootTest(classes=BackendTwoFactorApplication.class)` + perfil Spring `integration-compose` (sin Testcontainers).
> - Infra reproducible: BD/rol dedicados `bankportal_it` (`it-db/it-db-setup.sql`) + `redis-it` sin auth :6381 (`infra/compose/docker-compose.it.yml`).
> - **Deuda latente resuelta:** el contexto completo exigía 11 placeholders sin default (VAPID, bank.products/savings.auto, notification.email, hmac…) que el `application.yml` de test ocultaba → cubiertos en `application-integration-compose.yml`.
> - **2 bugs de test corregidos con evidencia (no asunción):** `testAccountId` apuntaba a UUID de usuario, no de cuenta → `acc…0001`; credencial login `Angel@123`→`angel123` (verificado bcrypt contra hash del seed V30).
> - **Aislamiento del seed V30:** `@BeforeEach` borra transactions del usuario de test (dashboard agrega por usuario).
> - Evidencia GR-QA-002: TEST-{FQCN}.xml en `target/failsafe-reports` · perfil `integration-compose` · ts 2026-06-01T10:49Z.

### REQ-S27-03 — DEBT-065 · Renombrar 5 *IT → *Test (slices @WebMvcTest)
**Jira** SCRUM-177 · **SP** 2 · **Prio** Media · **Tipo** Tech Debt
Los 5 ficheros `@WebMvcTest` están mal nombrados `*IT` (scope failsafe) cuando son slices
unitarios que deben correr en surefire.
```gherkin
Escenario: Slices reclasificados a surefire
  Dado 5 slices @WebMvcTest nombrados *IT
  Cuando se renombran a *Test
  Entonces son recolectados por surefire (no failsafe)
  Y "mvn test" los recolecta en scope surefire (actualmente @Disabled/skipped: ver DEBT-066)
  Y "mvn -Pintegration verify" deja de recolectarlos como IT
```
**DoD** 5/5 renombrados · en scope surefire (no failsafe) · permanecen @Disabled documentado con ref DEBT-066 (config de slice @WebMvcTest reutilizable pendiente, candidato S28) · GR-QA-002. Nota: el rename NO basta para ejecutarlos — la app @SpringBootApplication esta en .twofa (paquete hermano) y el slice no encuentra @SpringBootConfiguration.

### REQ-S27-04 — DEBT-054 · GR-CONFIG-001: merge YAML profiles + validador + bloqueo G-4b
**Jira** SCRUM-178 · **SP** 3 · **Prio** Media · **Tipo** Tech Debt
Establecer merge profundo de perfiles `application-*.yml` (vía `application-shared.yml`
import), un validador `validate-yaml-profiles.js`, e integrarlo como bloqueo en G-4b.
```gherkin
Escenario: Merge profundo consistente de perfiles
  Dado application-shared.yml importado por los perfiles de entorno
  Cuando se arranca cualquier perfil (local/staging/...)
  Entonces las claves compartidas se resuelven sin duplicación ni divergencia
Escenario: Validador bloqueante en G-4b
  Dado validate-yaml-profiles.js integrado en el gate G-4b
  Cuando un perfil presenta claves huérfanas o conflictos
  Entonces el validador falla y G-4b queda BLOQUEADO
```
**DoD** validador en verde sobre los perfiles actuales · integrado como bloqueo G-4b · GR-CONFIG-001 documentada.

### REQ-S27-05 — DEBT-053 · Paginación AutoContributionScheduler (LLD §11)
**Jira** SCRUM-179 · **SP** 2 · **Prio** Media · **Tipo** Tech Debt
El scheduler procesa contribuciones sin paginación; introducir paginación según LLD §11.
```gherkin
Escenario: Procesado paginado de contribuciones
  Dado un volumen de contribuciones mayor que el tamaño de página configurado
  Cuando AutoContributionScheduler ejecuta su ciclo
  Entonces procesa por páginas (sin cargar el conjunto completo en memoria)
  Y el comportamiento funcional permanece equivalente al actual
```
**DoD** paginación conforme a LLD §11 · test que cubre umbral de página · sin regresión funcional.

### REQ-S27-06 — DEBT-059 · Mensaje de excepción savings sin importes (CWE-209)
**Jira** SCRUM-180 · **SP** 1 · **Prio** Baja · **Tipo** Tech Debt (seguridad)
Las excepciones del dominio savings exponen importes; eliminar datos sensibles del mensaje
(CWE-209: Information Exposure Through an Error Message).
```gherkin
Escenario: Excepción sin fuga de importes
  Dado un fallo de operación en el dominio savings
  Cuando se construye el mensaje de excepción
  Entonces no contiene importes ni datos financieros sensibles
  Y el detalle queda únicamente en logs de servidor con el nivel adecuado
```
**DoD** mensaje saneado · test que verifica ausencia de importes · alineado RNF-004/005.

> **✅ CIERRE DEBT-059 (Step 4, 2026-06-01):** mensaje saneado.
> - `UpdateGoalUseCase` (único punto de fuga, grep confirmado): eliminada la concatenación de `newTarget` + `reservedAmount` en `ReservedExceedsTargetException`. Ahora usa el **constructor sin args** (mensaje genérico _"La aportacion excede el importe objetivo"_) + **`log.debug`** (`@Slf4j`) con el detalle solo en servidor — patrón ya usado en el módulo (`ContributeManualUseCase`).
> - **Fuga confirmada y cerrada:** `SavingsExceptionHandler:70` mapea `getMessage()` a la respuesta HTTP 422 → los importes llegaban al cliente; ahora recibe solo el mensaje genérico.
> - Tests: `UpdateGoalUseCaseTest` 7/7 · `SavingsGoalTest` 4/4 (assertan `isInstanceOf`, no texto → no rotos). CVSS 3.5 LOW mitigado.
> - **Pendiente DoD (test de ausencia de importes):** los tests actuales no asertan explícitamente que el mensaje carezca de importes. Se añadirá el assert en **Step 6 (QA)** sobre `e.getMessage()` (no contiene dígitos de importe), donde se genera la evidencia G-6.

### REQ-S27-07 — BUG-PO menores 023-035 · PFM visual (umbrella, 13)
**Jira** SCRUM-181 · **SP** 3 · **Prio** Menor · **Tipo** Bug Fix (umbrella)
Lote de 13 BUG-PO visuales menores del módulo PFM, verificados a nivel umbrella por
componente contra el prototipo aprobado PROTO-FEAT-023.
```gherkin
Escenario: Conformidad visual de cada bug del lote
  Dado un BUG-PO menor del rango 023-035
  Cuando se corrige el componente PFM afectado
  Entonces el componente coincide con PROTO-FEAT-023 (verificación visual PO)
  Y no introduce regresión en componentes colindantes
```
Detalle de ids: 023, 024, 025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035.
**DoD** 13/13 verificados visualmente por PO vs PROTO-FEAT-023 · sin regresión PFM.

### REQ-S27-08 — BUG-PO mayores 012-022 · PFM visual (umbrella, 11)
**Jira** SCRUM-182 · **SP** 6 · **Prio** Mayor · **Tipo** Bug Fix (umbrella)
Lote de 11 BUG-PO visuales mayores del módulo PFM, mismo criterio de verificación.
```gherkin
Escenario: Conformidad visual de cada bug del lote
  Dado un BUG-PO mayor del rango 012-022
  Cuando se corrige el componente PFM afectado
  Entonces el componente coincide con PROTO-FEAT-023 (verificación visual PO)
  Y no introduce regresión en componentes colindantes
```
Detalle de ids: 012, 013, 014, 015, 016, 017, 018, 019, 020, 021, 022.
**DoD** 11/11 verificados visualmente por PO vs PROTO-FEAT-023 · sin regresión PFM.

## 5. RTM parcial (Requirements Traceability Matrix)
| REQ | DEBT/BUG | Jira | Artefacto de verificación | Gate de evidencia |
|---|---|---|---|---|
| REQ-S27-01 | DEBT-062 | SCRUM-175 | TEST-*IT.xml (22) + acta cierre DEBT-062 | G-6 (GR-QA-002) |
| REQ-S27-02 | DEBT-064 | SCRUM-176 | 4× TEST-{FQCN}.xml perfil integration-compose | G-6 (GR-QA-002) |
| REQ-S27-03 | DEBT-065 | SCRUM-177 | 5× TEST-{FQCN}.xml en surefire | G-6 (GR-QA-002) |
| REQ-S27-04 | DEBT-054 | SCRUM-178 | validate-yaml-profiles.js verde + hook G-4b | G-4b (bloqueante) |
| REQ-S27-05 | DEBT-053 | SCRUM-179 | test paginación scheduler | G-6 |
| REQ-S27-06 | DEBT-059 | SCRUM-180 | test ausencia importes en excepción | G-6 |
| REQ-S27-07 | BUG-PO 023-035 | SCRUM-181 | verificación visual PO vs PROTO-FEAT-023 (13) | G-5 / G-8 (PO) |
| REQ-S27-08 | BUG-PO 012-022 | SCRUM-182 | verificación visual PO vs PROTO-FEAT-023 (11) | G-5 / G-8 (PO) |

## 6. Dependencias y riesgos heredados (del plan G-1)
- **R-S27-01** (REQ-S27-02): migración Testcontainers puede exceder 5 SP → timebox + fallback a S28.
- **R-S27-03**: alcance 23 SP > pro-rata histórico; monitorizar desviación.
- **R-S27-04**: primer enforcement de GR-QA-002 en G-6 — REQ-01/02/03 deben dejar los IT en estado evidenciable antes del gate.
- REQ-S27-03 depende de REQ-S27-01 (reclasificación afecta al conteo de la suite IT verificada).

## 7. Definition of Done — Sprint 27
- IT recolectados por `mvn -Pintegration verify` con XML por test (GR-QA-002).
- `validate-yaml-profiles.js` en verde e integrado como bloqueo G-4b.
- Acta de cierre DEBT-062 con evidencia (conteo + SHA + timestamp + perfil).
- BUG-PO (24) verificados visualmente por PO vs PROTO-FEAT-023.
- Dashboard global regenerado en cada gate (GR-011). 0 ficheros borrados (GR-GIT-001).

## 8. Reconciliación pendiente para fases posteriores
- `session.json.open_debts`: DEBT-062 figura OPEN; debe validarse a CLOSED tras la evidencia de REQ-S27-01 (no se modifica en Step 2).
- Balance de deuda objetivo fin de S27 (si todo cierra): pendiente recálculo en Step 8/9.

## 9. Handoff
Destino: **Architect (Step 3)**. Entrada para arquitectura/diseño: los 8 REQ con sus
criterios de aceptación y la RTM parcial. No se crean issues nuevos en Jira (SCRUM-175..182
ya existen); este SRS los traza y enriquece.

---
✅ PERSISTIDO
- docs/requirements/SRS-S27-saneamiento-sprint27.md (SRS Step 2, Sprint 27)
