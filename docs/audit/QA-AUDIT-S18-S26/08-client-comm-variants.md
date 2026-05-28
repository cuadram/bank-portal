# Variantes de carta ejecutiva — comunicación cliente Banco Meridian

**NC-CMMI-001 · Fase 6 · Draft** · Branch `hotfix/qa-audit-s18-s26`

Tres variantes generadas con `message_compose_v1` para elección HITL-PO antes del envío al cliente. **Ninguna enviada todavía.** Marcar la variante elegida y el timestamp de envío en `06-nc-closure.md` (sección 10 — Firmas) en el commit de cierre F6.

Adjunto común a las tres: `07-client-communication.md` (informe técnico, 9.8 KB).

---

## Variante A — Transparencia proactiva *(recomendada)*

**Subject:** BankPortal · Comunicación proactiva: auditoría QA retrospectiva S18–S26 cerrada (sin impacto en producción)

**Ángulo:** "Nosotros lo encontramos, nosotros os lo contamos". Hilo conductor: compromiso de transparencia. Tono narrativo. Ideal si la relación con Banco Meridian valora la candidez y se quiere reforzar la confianza emocional.

**Body:**

> Estimado/a [Nombre · Banco Meridian]:
>
> Os escribo para comunicaros, en línea con nuestro compromiso de transparencia y con las prácticas de gobernanza CMMI Nivel 3 del proyecto, el resultado de una auditoría interna que el equipo SOFIA ha realizado durante los últimos ocho días sobre el proyecto BankPortal.
>
> **Qué hemos detectado**
>
> El 20 de mayo, durante una revisión interna de calidad, encontramos que los reportes de QA de varios sprints anteriores (S18–S26) habían declarado como "PASS" un conjunto de tests de integración del backend sin que existiera evidencia ejecutable que respaldara esa afirmación. La causa fue una configuración estructural ausente en el ciclo de vida de construcción (Maven failsafe-plugin) combinada con un perfil de integración continua que invocaba un perfil inexistente — Maven los descartaba en silencio. El resultado neto: 22 de 22 tests de integración del backend estaban en el código fuente pero no se ejecutaban.
>
> Abrimos formalmente una No Conformidad CMMI Nivel 3 (NC-CMMI-001) y os notificamos hoy en cuanto la hemos cerrado, en el mismo día en que se ha completado la última fase de remediación.
>
> **Qué impacto ha tenido sobre el producto**
>
> **Ninguno.** Cero defectos en producción durante toda la ventana auditada, y cero defectos en los 27 sprints consecutivos del proyecto. Las pruebas unitarias, funcionales, de seguridad, de accesibilidad y de aceptación se han mantenido operativas y se han ejecutado con normalidad; el gap se limitaba a la capa de tests de integración con base de datos real. Es un gap de proceso de verificación, no de calidad de producto. Aun así, hemos decidido informaros porque entendemos que la transparencia sobre cómo trabajamos es parte del servicio.
>
> **Qué hemos hecho**
>
> Seis fases de remediación ejecutadas y trazadas commit a commit:
>
> 1. Reparación de tests rotos en `main` y registro de una ambigüedad regulatoria (TIN/TAE en el simulador de préstamos) que requerirá vuestra validación en S27.
> 2. Auditoría retrospectiva completa de S18–S26.
> 3. Configuración del plugin Maven failsafe y corrección del perfil CI fantasma. **Resultado verificable: los 22 tests de integración ahora se ejecutan, 13 clases PASS con 44 métodos verdes, 9 clases deshabilitadas con deuda técnica registrada y planificada para S27, 0 fallos, 0 errores, build verde.**
> 4. Despliegue de un guardrail bloqueante (GR-QA-002) que impide que el gate G-6 acepte claims PASS sin evidencia ejecutable adjunta (XML de tests + commit SHA + timestamp).
> 5. Registro de tres lecciones aprendidas, cierre formal de la NC y de la deuda crítica DEBT-055.
> 6. Esta comunicación.
>
> **Qué os garantiza esto a partir de ahora**
>
> La acción preventiva está operativa desde el próximo gate G-6 (Sprint 27). Ningún reporte de QA podrá declarar un test como PASS sin adjuntar la evidencia ejecutable correspondiente. El antipatrón que originó la NC queda estructuralmente bloqueado.
>
> **Adjunto**
>
> Informe técnico completo: prácticas CMMI L3 implicadas, métricas antes/después, cronología de commits, balance de deudas y plan S27 (`07-client-communication.md`). Acta interna de cierre formal disponible bajo solicitud.
>
> Quedo a vuestra disposición para una llamada o reunión presencial si queréis revisar cualquier punto en detalle, especialmente la deuda DEBT-063 (ambigüedad TIN/TAE) que requerirá vuestra decisión antes de Sprint 27.
>
> Un saludo cordial,
>
> Ángel de la Cuadra
> Product Owner · Tech Lead · BankPortal
> Experis · 28 de mayo de 2026

---

## Variante B — Resultados y garantías

**Subject:** BankPortal · Cierre de NC-CMMI-001: 22/22 tests de integración operativos, 0 defectos en producción, guardrail bloqueante desplegado

**Ángulo:** Empieza con los 3 números clave en bullets (0 defectos · 22/22 IT · GR-QA-002). Tono ejecutivo seco. Ideal para C-level que quiere ver primero el outcome.

**Body:**

> Estimado/a [Nombre · Banco Meridian]:
>
> Os informo del cierre formal hoy, 28 de mayo de 2026, de la No Conformidad CMMI Nivel 3 NC-CMMI-001, abierta el 20 de mayo tras una revisión interna de calidad sobre el proyecto BankPortal.
>
> **Tres datos que resumen el cierre**
>
> - **0 defectos en producción** durante toda la ventana auditada (Sprints 18–26) y durante los 27 sprints consecutivos del proyecto. Sin cambios.
> - **22 de 22 tests de integración del backend ahora se ejecutan**, frente a 0 antes de la remediación. Resultado verificable: 13 clases PASS con 44 métodos verdes, 9 clases deshabilitadas con deuda técnica registrada y planificada, 0 fallos, 0 errores, build verde.
> - **Guardrail bloqueante GR-QA-002 desplegado** y operativo desde el próximo gate G-6: ningún reporte QA podrá declarar un test como PASS sin adjuntar evidencia ejecutable (XML de tests + commit SHA + timestamp + conteo).
>
> **Qué pasó**
>
> Detectamos que los reportes QA de varios sprints habían declarado como PASS tests de integración del backend sin que existiera evidencia ejecutable. La causa estructural: el plugin Maven failsafe-plugin —que ejecuta los tests con sufijo `*IT.java`— no estaba configurado en el `pom.xml`, y el perfil del Jenkinsfile invocaba uno inexistente que Maven descartaba en silencio. Los tests estaban en el código fuente; no se ejecutaban. Gap de proceso de verificación, no de calidad de producto.
>
> **Qué garantiza el cierre**
>
> La acción correctiva es estructural (commits `4d8fc59` y `d38cbe2`): los 22 tests están bajo lifecycle Maven y producen XML verificable. La acción preventiva es bloqueante (commit `99779c4`): el SKILL del agente QA y el guardrail GR-QA-002 impiden que cualquier futuro reporte QA pase G-6 sin evidencia ejecutable por cada claim PASS. El antipatrón queda cerrado estructuralmente, no por confianza.
>
> **Plan Sprint 27**
>
> Tres deudas diferidas con sprint target documentado: una migración técnica de Testcontainers (DEBT-064), un renombrado de tests mal clasificados (DEBT-065), y una decisión que requiere vuestra validación: ambigüedad regulatoria TIN/TAE en el simulador de préstamos (DEBT-063). Ninguna afecta a producción.
>
> **Adjunto**
>
> Informe técnico completo con prácticas CMMI L3 implicadas (PP/QPM SP1.2, VER SP3.2, CM SP3.2), métricas detalladas, cronología de los seis commits de remediación y balance de deudas (`07-client-communication.md`).
>
> Quedo a vuestra disposición.
>
> Un saludo cordial,
>
> Ángel de la Cuadra
> Product Owner · Tech Lead · BankPortal
> Experis · 28 de mayo de 2026

---

## Variante C — Compromiso CMMI L3

**Subject:** BankPortal · NC-CMMI-001 cerrada: gobernanza CMMI Nivel 3 operativa, remediación trazable, sin impacto en producción

**Ángulo:** Estructura por prácticas CMMI con tabla. Tono formal/gobernanza. Ideal si en Banco Meridian hay un comité de calidad/auditoría con perfil regulatorio que va a leerlo.

**Body:**

> Estimado/a [Nombre · Banco Meridian]:
>
> En cumplimiento de las prácticas de gobernanza CMMI Nivel 3 acordadas para el proyecto BankPortal, os comunico el cierre formal hoy, 28 de mayo de 2026, de la No Conformidad NC-CMMI-001 (clasificación Major), abierta el 20 de mayo por iniciativa interna del equipo SOFIA.
>
> **Naturaleza de la NC**
>
> La NC afecta a tres áreas de proceso CMMI L3:
>
> - **PP/QPM SP1.2** (Collect and analyze process and product measurements): los reportes QA de seis sprints habían reportado métricas agregadas ("X ITs PASS") sin evidencia atómica por test.
> - **VER SP3.2** (Analyze verification results): los resultados de verificación se aceptaban sin validación cruzada contra los XML de Maven.
> - **CM SP3.2** (Perform configuration audits): las auditorías de configuración no detectaban el gap del lifecycle Maven (failsafe-plugin ausente) ni el perfil CI inexistente del Jenkinsfile.
>
> La causa raíz combinaba un factor estructural (configuración Maven incompleta), un factor de pipeline (perfil CI fantasma que Maven descartaba en silencio) y un factor cultural ("trust the report" sin verificación cruzada en el gate G-6).
>
> **Impacto sobre el producto**
>
> Nulo. Cero defectos en producción durante S18–S26 y durante los 27 sprints consecutivos del proyecto. Las pruebas unitarias, funcionales, de seguridad, de accesibilidad y de aceptación se mantuvieron operativas. El gap se limitaba a la capa de tests de integración con base de datos real.
>
> **Cierre de las tres áreas de proceso**
>
> | Práctica CMMI | Acción remediadora |
> |---|---|
> | PP/QPM SP1.2 | Matriz IT real por clase + XML por test obligatorio en reporte QA |
> | VER SP3.2 | Guardrail GR-QA-002 bloqueante en gate G-6 |
> | CM SP3.2 | Checklist pre-G-6 con `mvn verify -Pintegration` + commit SHA registrado |
>
> **Trazabilidad**
>
> Seis fases ejecutadas y trazadas commit a commit en la rama `hotfix/qa-audit-s18-s26` (`184e185`, `296e372`, `4d8fc59`, `d38cbe2`, `99779c4`, `7440544`). Resultado verificable post-remediación: los 22 tests de integración del backend bajo lifecycle Maven, 13 clases PASS con 44 métodos verdes, 9 clases con `@Disabled` y deuda técnica registrada con sprint target, 0 fallos, 0 errores. Cuatro deudas cerradas durante la NC, tres diferidas a Sprint 27 con sprint target documentado.
>
> **Lecciones aprendidas**
>
> Tres lecciones registradas en el repositorio de conocimiento del equipo, candidatas a promoción al estándar SOFIA-CORE para aplicar a otros proyectos del cliente y de Experis: LA-026-09 (evidencia ejecutable obligatoria), LA-026-10 (matriz IT real como artefacto G-6) y LA-026-11 (alineación CI/Maven).
>
> **Adjunto**
>
> Informe técnico completo con métricas antes/después, cronología, balance de deudas y trazabilidad CMMI L3 (`07-client-communication.md`). Acta interna de cierre formal disponible bajo solicitud.
>
> Quedo a vuestra disposición para una revisión conjunta cuando os resulte oportuno, especialmente para la decisión pendiente sobre DEBT-063 (TIN/TAE) que requerirá vuestra validación antes de Sprint 27.
>
> Un saludo cordial,
>
> Ángel de la Cuadra
> Product Owner · Tech Lead · BankPortal
> Experis · 28 de mayo de 2026

---

## Estado de envío

| Variante | Elegida | Enviada | Timestamp | Destinatarios |
|---|---|---|---|---|
| A — Transparencia proactiva | ☐ | ☐ | — | — |
| B — Resultados y garantías | ☐ | ☐ | — | — |
| C — Compromiso CMMI L3 | ☐ | ☐ | — | — |

Cuando el envío se realice, marcar la casilla "Enviada" en la variante elegida y registrar timestamp + destinatarios. Confirmar también la firma HITL-PO en `06-nc-closure.md` sección 10.

*NC-CMMI-001 Fase 6 · Variantes draft · SOFIA · BankPortal · Banco Meridian*
