# Sprint Planning — Sprint 1 — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | Sprint 1 |
| **Período** | 2026-03-16 → 2026-03-27 |
| **SM** | SOFIA SM Agent |
| **Estado** | DRAFT — 🔒 Pendiente aprobación Product Owner |

---

## Sprint Goal

> **"Tener la infraestructura TOTP operativa y los flujos core de 2FA (activar y verificar OTP) funcionando end-to-end en el portal bancario, con cobertura de pruebas unitarias y de integración."**

Este sprint goal satisface los requisitos de mayor prioridad de FEAT-001 (Must Have) y
establece la base técnica sobre la que se construyen los flujos restantes en el Sprint 2.

---

## Capacidad del equipo

| Parámetro | Valor |
|---|---|
| Días laborables | 10 |
| Horas/día | 8 |
| Personas | 3 (1 Java Dev, 1 Angular Dev, 1 QA) |
| Capacidad bruta | 240 h |
| Ceremonias | -12 h |
| Buffer impedimentos (10%) | -24 h |
| Capacidad neta | 204 h |
| Factor conservador (70% — primer sprint) | ~143 h |
| **Capacidad comprometida** | **24 SP** |

---

## Backlog del Sprint 1

| ID | Título | SP | Prioridad | Asignado a | Estado inicial |
|---|---|---|---|---|---|
| US-006 | Setup de infraestructura TOTP | 3 | Must Have | Java Dev | READY |
| US-001 | Activar 2FA con TOTP (enrolamiento) | 8 | Must Have | Java Dev + Angular Dev | READY |
| US-002 | Verificar OTP en flujo de login | 8 | Must Have | Java Dev + Angular Dev | READY |
| US-003 | Generar y gestionar códigos de recuperación | 5 | Must Have | Java Dev + Angular Dev | READY |
| **Total** | | **24 SP** | | | |

---

## Orden de ejecución y dependencias

```
US-006 (Setup TOTP)
  └─► US-001 (Enrolamiento)
        └─► US-002 (Verificación OTP)
              └─► US-003 (Códigos recuperación)
```

US-006 es bloqueante — debe completarse antes de que US-001 inicie desarrollo.

---

## Definición de bloqueantes por US

### US-006 — Setup infraestructura TOTP
- Validar compatibilidad librería `java-totp` con Spring Boot del proyecto (ver R-005)
- Configurar dependencia en `pom.xml`
- Crear clase `TotpService` con métodos: `generateSecret()`, `generateQRUrl()`, `verifyCode()`
- Test unitario de TotpService

### US-001 — Activar 2FA con enrolamiento
**Backend:**
- `POST /api/2fa/enroll` — genera secreto TOTP, devuelve QR URI
- `POST /api/2fa/activate` — confirma con primer OTP válido, guarda secreto cifrado AES-256
- Secreto almacenado cifrado en campo `users.totp_secret`

**Frontend:**
- Pantalla de configuración de seguridad en perfil
- Visualización de QR con instrucciones
- Input de código OTP de confirmación
- Estado 2FA visible (activo/inactivo)

### US-002 — Verificar OTP en login
**Backend:**
- `POST /api/2fa/verify` — valida OTP con tolerancia ±1 período
- Rate limiting: 5 intentos → bloqueo 15 min (R-003)
- Integración con flujo JWT existente

**Frontend:**
- Paso adicional en flujo de login cuando 2FA está activo
- Pantalla de ingreso de código OTP
- Enlace "Usar código de recuperación"

### US-003 — Códigos de recuperación
**Backend:**
- `POST /api/2fa/recovery-codes/generate` — genera 10 códigos one-time (hash almacenado)
- `POST /api/2fa/verify-recovery` — valida y consume un código de recuperación

**Frontend:**
- Modal de descarga de códigos backup (obligatorio durante enrolamiento — R-002)
- Opción de regenerar códigos desde perfil

---

## Criterios de Done (Definition of Done)

Para que una US sea DONE:
- [ ] Código implementado y revisado (Code Reviewer aprueba — sin NCs BLOQUEANTES)
- [ ] Tests unitarios con cobertura ≥ 80% del módulo
- [ ] Tests de integración ejecutados y en verde
- [ ] Issue en Jira movido a QA (o DONE si QA acepta)
- [ ] Sin secretos en texto plano (verificado en code review)
- [ ] PR mergeado a rama `feature/FEAT-001-2fa`

---

## Estado inicial del tablero Jira (Sprint 1)

```
| BACKLOG | READY              | IN PROGRESS | CODE REVIEW | QA | WAITING APPROVAL | DONE |
|---------|--------------------| ------------|-------------|----|-----------------  ------|
|  —      | US-006             |     —       |      —      | —  |        —         |  —   |
|         | US-001             |             |             |    |                  |      |
|         | US-002             |             |             |    |                  |      |
|         | US-003             |             |             |    |                  |      |
```

WIP actual: 0/3 (IN PROGRESS) — dentro del límite.

---

## Ceremonias planificadas

| Ceremonia | Fecha | Duración | Participantes |
|---|---|---|---|
| Sprint Planning | 2026-03-16 | 2 h | Equipo completo + PO |
| Daily Standup | Diario | 15 min | Equipo |
| Sprint Review | 2026-03-27 | 1 h | Equipo + PO + Cliente |
| Retrospectiva | 2026-03-27 | 1 h | Equipo |

---

## Gates HITL previstos en Sprint 1

| Gate | Artefacto | Aprobador | SLA |
|---|---|---|---|
| 🔒 Aprobación Sprint Planning | Este documento | Product Owner | 24 h |
| 🔒 Aprobación User Stories | SRS con Gherkin (Requirements Analyst) | Product Owner | 24 h |
| 🔒 Aprobación HLD/LLD | Documentos de arquitectura (Architect) | Tech Lead | 48 h |
| 🔒 Code Review | Reporte de revisión (Code Reviewer) | Developer asignado | 24 h/NC |
| 🔒 QA Acceptance | Test report (QA) | QA Lead + PO | 24 h |

---

## Riesgos activos relevantes para Sprint 1

| ID | Riesgo | Acción en Sprint 1 |
|---|---|---|
| R-001 | Desincronización TOTP | Implementar tolerancia ±1 período en US-002 |
| R-003 | Brute-force /verify | Rate limiting en US-002 backend |
| R-005 | Compatibilidad librería java-totp | Validar en US-006 — bloqueante |
| R-006 | Diseño UI no validado | PO valida wireframes antes de iniciar US-001 frontend |

---

*Generado por SOFIA SM Agent — 2026-03-14*
*🔒 GATE: aprobación Product Owner requerida antes de iniciar Sprint 1*
