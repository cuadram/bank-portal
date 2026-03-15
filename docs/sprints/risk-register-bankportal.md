# Risk Register — BankPortal

## Metadata
- **Proyecto:** BankPortal — Banco Meridian
- **Creado:** 2026-03-14
- **Última revisión:** 2026-03-14
- **Próxima revisión:** Sprint 1 Review (2026-03-28)

---

## Registro de riesgos

| ID | Descripción | Categoría | Probabilidad | Impacto | Exposición | Estado | Plan de respuesta | Responsable |
|---|---|---|---|---|---|---|---|---|
| R-001 | Desincronización de reloj TOTP entre cliente y servidor provoca fallos de validación OTP | Técnico | M | A | A | Abierto | Implementar tolerancia ±1 período (90s) en el algoritmo de validación; documentar en LLD | Tech Lead |
| R-002 | Pérdida de dispositivo autenticador sin códigos de recuperación activos bloquea la cuenta del usuario | Negocio | B | A | M | Abierto | Forzar descarga obligatoria de 10 códigos backup durante enrolamiento; UX que bloquee el avance si no se confirma descarga | Developer Frontend |
| R-003 | Brute-force en endpoint `/2fa/verify` con OTPs generados | Técnico | M | A | A | Abierto | Rate limiting: máx 5 intentos fallidos → bloqueo de 15 min; registro en auditoría; alertas automáticas | Developer Backend |
| R-004 | PO (Seguridad TI) con disponibilidad limitada (50%) retrasa aprobaciones en gates | Recursos | M | M | M | Abierto | Acordar SLA de 24h para US y 48h para HLD; escalar al PM si se supera; establecer delegado en Banco Meridian | Scrum Master |
| R-005 | Librería `java-totp` no compatible con versión de Spring Boot del proyecto | Técnico | B | A | M | Abierto | Verificar compatibilidad en Sprint 1 Day 1 antes de desarrollar; tener alternativa (Google Authenticator lib) identificada | Developer Backend |
| R-006 | Almacenamiento de secretos TOTP sin cifrado correcto expone datos sensibles | Técnico | B | A | A | Abierto | Exigir AES-256 para secretos en BD; incluir en Definition of Done; validar en Code Review como BLOQUEANTE | Code Reviewer |
| R-007 | Cambios de requisitos de normativa PCI-DSS durante el sprint | Externo | B | A | M | Abierto | Monitorear publicaciones PCI-SSC; cualquier cambio pasa por gate de cambio de alcance mid-sprint | Product Owner |

---

## Criterios de escalado

| Exposición | Acción |
|---|---|
| ALTA | Escalar al PM inmediatamente; revisar en cada Daily |
| MEDIA | Revisar en Sprint Review; monitorear en Daily si hay señales |
| BAJA | Revisar en Sprint Review |

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-03-14 | Creación inicial con riesgos de FEAT-001 | SOFIA SM Agent |
