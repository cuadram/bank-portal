# Code Review Report — DEBT-008 + US-403 + US-601 + US-604 — Sprint 7

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 7 · 2026-06-09 |
| **Stack** | Java 17 Spring Boot 3.x + Angular 17 |
| **Archivos revisados** | 11 |
| **Rama** | `feature/FEAT-006-sprint7` |
| **Autor** | SOFIA Code Reviewer Agent |

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 0 | 0 | 0 | 0 |
| Contrato OpenAPI | 0 | 0 | 1 | 0 |
| Seguridad | 0 | 1 | 0 | 0 |
| Calidad de Código | 0 | 0 | 1 | 2 |
| Tests | 0 | 0 | 1 | 0 |
| Documentación | 0 | 0 | 1 | 0 |
| Convenciones Git | 0 | 0 | 0 | 0 |
| **TOTAL** | **0** | **1** | **4** | **2** |

## Veredicto: ⚠️ APROBADO CON CONDICIONES — RE-REVIEW

---

## Hallazgos

### 🟠 RV-S7-001 — Email bloqueo sin try-catch (user enumeration risk)
- **Nivel:** Seguridad · OWASP A01
- **Archivo:** `OtpVerificationUseCase.java`
- **Corrección requerida:**
```java
try {
    notificationService.sendAccountLockedEmail(user.getEmail());
} catch (Exception e) {
    log.error("Failed to send lock email for userId={} — will retry async", userId, e);
}
throw new AccountLockedException();
```

### 🟡 RV-S7-002 — OpenAPI sin /security/config-history
- Añadir path + schema ConfigHistoryPage al openapi-2fa.yaml

### 🟡 RV-S7-003 — notifPrefs spread shallow
- Documentar por qué spread es seguro (Record<string, boolean> — valores primitivos)

### 🟡 RV-S7-004 — Test attemptsRemaining desde intento 7 no confirmado
- Añadir test explícito de aviso progresivo desde intento 7

### 🟡 RV-S7-005 — Javadoc ausente en getConfigHistory() controller
- Añadir /** */ con @param y @return

### 🟢 RV-S7-S01 — TIMEOUT_SECONDS como @Value configurable
### 🟢 RV-S7-S02 — isDirty con JSON.stringify — considerar key-by-key

---

## Métricas

| Métrica | Valor | Estado |
|---|---|---|
| Cobertura SecurityDashboardUseCase | 94% | ✅ |
| Cobertura SecurityPreferencesComponent | 91% | ✅ |
| Complejidad ciclomática máxima | 4 | ✅ |
| NCs generadas | 0 | ✅ |

---

*SOFIA Code Reviewer · BankPortal · Sprint 7 · 2026-06-09*
*⚠️ RE-REVIEW requerido tras corrección RV-S7-001*
