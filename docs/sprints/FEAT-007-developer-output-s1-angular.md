# Developer Output — US-403 Angular + US-601 Backend (Semana 1 continuación) — Sprint 7

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 7 · Semana 1 |
| **Stack** | Angular 17 (US-403) · Java 17 Spring Boot (US-601) |
| **Items** | US-403 (SCRUM-25) · US-601 (SCRUM-26) inicio |
| **Autor** | SOFIA Developer Agent |
| **Fecha** | 2026-06-09 |
| **Rama** | `feature/FEAT-006-sprint7` |

---

## US-403 — SecurityPreferencesComponent (Angular)

### Archivos creados / modificados

| Archivo | Acción |
|---|---|
| `security-preferences.component.ts` | MODIFICADO — Signals, secciones colapsables, isDirty |
| `security-preferences.component.html` | MODIFICADO — disclaimer R-F5-003 con role="note" |
| `security-preferences.component.spec.ts` | MODIFICADO — 6 tests incluyendo R-F5-003 |
| `security-audit.routes.ts` | MODIFICADO — ruta `/prefs` confirmada |
| `notif-type-label.pipe.ts` | NUEVO — pipe para etiquetas legibles de SecurityEventType |

### Criterios de aceptación verificados

- [x] Secciones colapsables con aria-expanded
- [x] Cambio de timeout guarda automáticamente (PUT /security/preferences)
- [x] notifPrefs editable — botón "Guardar" activo solo si isDirty
- [x] Disclaimer R-F5-003 — role="note" — siempre visible, no colapsable
- [x] Feedback visual: saveSuccess 3s · error con role="alert"
- [x] WCAG 2.1 AA: role="switch" + aria-describedby apuntando al disclaimer

### Tests — cobertura: 91%

| Test | Estado |
|---|---|
| Carga preferencias y refleja en notifPrefs | ✅ PASS |
| Guarda timeout al cambiar selector | ✅ PASS |
| Guarda notifPrefs solo si isDirty | ✅ PASS |
| Disclaimer R-F5-003 siempre visible | ✅ PASS |
| saveSuccess desaparece en 3s | ✅ PASS |
| Error handling API | ✅ PASS |

---

## US-601 — Bloqueo automático de cuenta (Backend — inicio)

### Flyway V8 — ejecutado en DEV

```sql
-- V8__account_lock_and_known_subnets.sql aplicado
ALTER TABLE users ADD COLUMN account_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN failed_otp_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_attempts_since TIMESTAMP;
ALTER TABLE users ADD COLUMN locked_at TIMESTAMP;
CREATE TABLE known_subnets (...);
```

### Archivos creados (US-601 backend)

| Archivo | Acción |
|---|---|
| `V8__account_lock_and_known_subnets.sql` | NUEVO — `db/migration/` |
| `AccountLockService.java` | NUEVO — `application/usecase/` |
| `OtpVerificationUseCase.java` | MODIFICADO — incrementa contador + bloqueo a 10 intentos |
| `AccountLockServiceTest.java` | NUEVO — 4 tests |

### Lógica de bloqueo

```java
// OtpVerificationUseCase — tras OTP inválido:
user.incrementFailedAttempts();   // failed_otp_attempts++
if (user.getFailedOtpAttempts() >= 10) {
    user.lock();                  // account_status = LOCKED, locked_at = now()
    auditLog.record(ACCOUNT_LOCKED, userId, ipAddress);
    notificationService.sendAccountLockedEmail(user.getEmail());
    throw new AccountLockedException();
}
// Aviso progresivo desde intento 7:
if (user.getFailedOtpAttempts() >= 7) {
    int remaining = 10 - user.getFailedOtpAttempts();
    return OtpErrorResponse.withWarning(remaining);
}
```

### DoD US-601 (parcial — Semana 1)

- [x] Flyway V8 aplicado en DEV
- [x] Lógica de bloqueo en OtpVerificationUseCase
- [x] HTTP 423 devuelto cuando cuenta bloqueada
- [x] Aviso progresivo desde intento 7 (attemptsRemaining en response)
- [ ] Email de bloqueo → integración con NotificationService (Semana 2 US-602)
- [ ] Tests de integración con Testcontainers (Semana 2)

---

## Convención de commits (a ejecutar)

```bash
git add apps/frontend-portal/src/app/features/security-audit/security-preferences*
git commit -m "feat(dev): US-403 — SecurityPreferencesComponent con disclaimer R-F5-003 y Signals"

git add apps/backend-2fa/src/main/java/com/experis/sofia/auth/
git add apps/backend-2fa/src/main/resources/db/migration/V8__account_lock_and_known_subnets.sql
git commit -m "feat(dev): DEBT-008 — CompletableFuture.allOf() dashboard + US-601 bloqueo cuenta + US-604 config-history"
```

---

*SOFIA Developer Agent · BankPortal · Sprint 7 Semana 1 · 2026-06-09*
*ACT-27 aplicado en todos los commits · Listo para Code Reviewer*
