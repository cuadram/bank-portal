# Risk Register — BankPortal

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Responsable** | SOFIA SM Agent |
| **Versión** | v1.0 |
| **Última revisión** | 2026-03-14 |
| **Próxima revisión** | Sprint 1 Review — 2026-03-27 |

---

## Escala de valoración

| Nivel | Probabilidad | Impacto |
|---|---|---|
| A (Alto) | > 60% | Afecta entrega o cumplimiento normativo |
| M (Medio) | 30–60% | Afecta velocidad o calidad |
| B (Bajo) | < 30% | Impacto menor, gestionable |

**Exposición** = Probabilidad × Impacto

| P \ I | A | M | B |
|---|---|---|---|
| A | 🔴 Alta | 🟠 Alta | 🟡 Media |
| M | 🟠 Alta | 🟡 Media | 🟢 Baja |
| B | 🟡 Media | 🟢 Baja | 🟢 Baja |

---

## Registro de riesgos

| ID | Descripción | Categoría | P | I | Exposición | Estado | Plan de respuesta | Responsable | Detectado |
|---|---|---|---|---|---|---|---|---|---|
| R-001 | Desincronización de reloj TOTP entre cliente y servidor — OTPs inválidos en producción | Técnico | M | A | 🟠 Alta | Abierto | Implementar tolerancia ±1 período (±30 s) en validación; monitorizar drift en logs | Java Dev / Tech Lead | 2026-03-14 |
| R-002 | Usuario pierde dispositivo 2FA sin códigos de recuperación — bloqueo de cuenta | Negocio | B | A | 🟡 Media | Abierto | Obligar descarga/confirmación de códigos backup durante el enrolamiento (flujo bloqueante) | Angular Dev / PO | 2026-03-14 |
| R-003 | Brute-force en endpoint `/verify` — compromiso de OTP | Técnico | M | A | 🟠 Alta | Abierto | Rate limiting (5 intentos → bloqueo 15 min) + alertas de seguridad + test de carga en QA | Java Dev / QA Lead | 2026-03-14 |
| R-004 | PO no disponible para aprobaciones — gates HITL vencen SLA | Recursos | M | M | 🟡 Media | Abierto | Escalar a PM si SLA > 24 h; definir delegado del PO en kick-off | SM / PM | 2026-03-14 |
| R-005 | Librería `java-totp` (JJWT) no compatible con versión de Spring Boot del proyecto | Técnico | B | M | 🟢 Baja | Abierto | Validar compatibilidad en US-006 (setup infra) antes de continuar; alternativa: `google-auth-java-client` | Java Dev | 2026-03-14 |
| R-006 | Diseño UI de pantallas 2FA no validado — retrabajo en frontend mid-sprint | UX/UI | M | M | 🟡 Media | Abierto | Validar wireframes con PO antes del Sprint 1; bloquear US-001 frontend hasta aprobación UI | Angular Dev / PO | 2026-03-14 |
| R-007 | Secretos TOTP mal gestionados — almacenamiento en texto plano por error | Técnico | B | A | 🟡 Media | Abierto | Checklist de code review obligatorio para verificar cifrado AES-256; test de seguridad en QA | Code Reviewer / QA | 2026-03-14 |
| R-008 | Entrega de FEAT-001 fuera del Sprint 2 — incumplimiento PCI-DSS deadline | Negocio | B | A | 🟡 Media | Abierto | Monitorizar velocidad Sprint 1; si < 80% objetivo → revisar alcance Sprint 2 con PO en Review | SM / PM | 2026-03-14 |

---

## Riesgos por acción inmediata (Exposición ALTA 🔴🟠)

| ID | Riesgo | Acción inmediata |
|---|---|---|
| R-001 | Desincronización TOTP | Incluir tolerancia en criterios de aceptación US-002 |
| R-003 | Brute-force /verify | Incluir rate limiting en criterios de aceptación US-002; caso de prueba de seguridad en QA |

---

## Historial de cambios

| Fecha | Versión | Cambio | Autor |
|---|---|---|---|
| 2026-03-14 | v1.0 | Creación inicial — riesgos identificados en análisis de FEAT-001 | SOFIA SM Agent |

---

*Generado por SOFIA SM Agent — 2026-03-14*
*Próxima revisión: Sprint 1 Review — 2026-03-27*
