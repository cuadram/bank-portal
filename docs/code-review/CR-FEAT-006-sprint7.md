# Code Review Report — Sprint 7 · DEBT-008 + US-403 + FEAT-006

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Sprint** | 7 · 2026-06-09 |
| **Rama** | `feature/FEAT-006-contextual-auth` |
| **Reviewer** | SOFIA Code Reviewer Agent |
| **Fecha** | 2026-06-11 |
| **Archivos revisados** | 9 Java + 3 TypeScript + 1 SQL |

---

## Veredicto

**✅ APPROVED — 3 NCs menores corregidas en el mismo ciclo**

| Severidad | Count |
|---|---|
| Mayores | 0 |
| Menores | 3 |
| Sugerencias | 2 |

> **Señal de proceso:** ACT-27 (pre-commit checklist "Organize Imports") fue definida el día 1
> del Sprint 7 para cortar exactamente este patrón. Las 3 NCs son de la misma categoría
> que las de S5 y S6: imports residuales no limpiados antes del commit. ACT-27 no fue ejecutada.
> Tercer sprint consecutivo con NCs menores de tipo import — requiere CAR formal en retro S7.

---

## NCs Menores

### RV-S7-001 — `import java.time.LocalDateTime` no usado en `AccountLockUseCase.java`

**Archivo:** `auth/application/AccountLockUseCase.java`

```java
import java.time.LocalDateTime;  // no aparece en ningún método del archivo
```

`LocalDateTime` fue importado probablemente para la lógica de ventana de 24h
(`failed_attempts_since < now() - 24h`), pero esa lógica está documentada como
comentario placeholder — no implementada aún. El import no tiene referencia en el código.

**Corrección:** eliminar el import.

---

### RV-S7-002 — `import AccountLockUseCase` no usado en `AccountAndContextController.java`

**Archivo:** `auth/api/AccountAndContextController.java`

```java
import com.experis.sofia.bankportal.auth.application.AccountLockUseCase;
// No existe ningún campo ni variable de tipo AccountLockUseCase en el controller
```

El controller solo usa `AccountUnlockUseCase` y `LoginContextUseCase` como dependencias.
`AccountLockUseCase` no tiene campo declarado ni uso en ningún método.

**Corrección:** eliminar el import.

---

### RV-S7-003 — `import java.security.MessageDigest` no usado en `LoginContextUseCase.java`

**Archivo:** `auth/application/LoginContextUseCase.java`

```java
import java.security.MessageDigest;  // no aparece en ningún método del archivo
```

`MessageDigest` sería necesario para el `sha256()` helper del token de verificación,
pero ese helper no está implementado en este archivo (la verificación completa
está marcada como TODO — se implementará al integrar el repositorio Redis).

**Corrección:** eliminar el import.

---

## Revisión detallada ✅

### DEBT-008 — SecurityDashboardUseCase paralelo

| Aspecto | Estado |
|---|---|
| 6 `CompletableFuture.supplyAsync()` lanzadas antes de `allOf()` | ✅ patrón correcto |
| Timeout de 5s con `get(QUERY_TIMEOUT_S, TimeUnit.SECONDS)` | ✅ evita bloqueos indefinidos |
| `join()` tras `allOf()` completado — sin bloqueo adicional | ✅ |
| `executor` inyectado como dependencia (no hardcodeado) — testeable | ✅ |
| `@Transactional(readOnly=true)` en el thread caller — correcto para lecturas independientes | ✅ |
| Javadoc explica por qué @Transactional no cubre threads del executor | ✅ |
| `getConfigHistory()` — límite `Math.min(days, 90)` defensivo | ✅ |
| `AuditEventSummary` incluye campo `unusualLocation` para US-604 | ✅ |
| Imports limpios | ✅ sin residuos |

### US-403 — SecurityPreferencesUseCase

| Aspecto | Estado |
|---|---|
| R-F5-003 documentado en Javadoc (`NUNCA afectan al audit_log`) | ✅ |
| `@Transactional(readOnly=true)` en `getPreferences()` | ✅ |
| Retorno de valores placeholder con comentarios explícitos | ✅ aceptable para esta fase |
| `Map.of()` en placeholder — correcto (inmutable, vacío) | ✅ |
| Imports limpios | ✅ sin residuos |

### US-601/602 — AccountLockUseCase + AccountUnlockUseCase

| Aspecto | Estado |
|---|---|
| `@Value` en campos NO final — no interfiere con `@RequiredArgsConstructor` | ✅ patrón correcto |
| `AccountLockedException` como inner class estática con `getUserId()` | ✅ |
| `AccountUnlockUseCase` — respuesta neutra en `requestUnlock()` (evita user enumeration) | ✅ |
| `generateUnlockToken()` package-private (testeable sin reflection) | ✅ |
| `sha256()` package-private — accesible en tests | ✅ |

### US-603 — LoginContextUseCase

| Aspecto | Estado |
|---|---|
| Sealed interface `ContextEvaluationResult` con `FullSession` y `ContextPending` | ✅ Java 17 sealed — exhaustivo en switch |
| `isFullSession()` / `isContextPending()` helpers de conveniencia | ✅ |
| Verificación subnet mismatch ANTES de verificar token | ✅ fail-fast, menos operaciones en caso de ataque |
| `generateConfirmToken()` — patrón idéntico a `ValidateTrustedDeviceUseCase` (consistencia) | ✅ |
| `contextCheckEnabled` feature flag para desactivación de emergencia | ✅ R-F6-002 mitigado |

### AccountAndContextController

| Aspecto | Estado |
|---|---|
| Endpoints US-602 públicos (sin `@AuthenticationPrincipal`) | ✅ |
| `/confirm-context` con `@AuthenticationPrincipal Jwt jwt` scope=context-pending | ✅ ADR-011 |
| `extractSubnet()` helper privado — consistente con `DeviceFingerprintService.extractIpSubnet()` | ⚠️ **SUG:** usar `DeviceFingerprintService` directamente (ver SUG-S7-001) |
| Placeholder `"full-session-jwt-placeholder"` documentado con TODO | ✅ |

### Flyway V8

| Aspecto | Estado |
|---|---|
| `CHECK (account_status IN ('ACTIVE', 'LOCKED'))` — constraint explícito | ✅ |
| `UNIQUE INDEX` en `lock_unlock_token WHERE IS NOT NULL` — partial index correcto | ✅ |
| `UNIQUE INDEX` en `known_subnets(user_id, subnet)` — sin duplicados por usuario | ✅ |
| `user_notification_preferences` — PK compuesta (user_id, event_type) | ✅ |
| `COMMENT ON TABLE/COLUMN` — documentación embebida en BD | ✅ |

### ACT-30 — OpenAPI v1.4.0 claims documentados

| Claim | Documentado | Tipo | Origen |
|---|---|---|---|
| `sub` | ✅ | UUID v4 | `JwtService.issueFullSession()` |
| `scope` | ✅ | enum | fullSession/contextPending/2faPending |
| `jti` | ✅ | UUID | para blacklist Redis |
| `twoFaEnabled` | ✅ | boolean | estado 2FA al momento de emisión |
| `pendingSubnet` | ✅ | string | subnet que requiere confirmación (solo context-pending) |
| `iat` / `exp` | ✅ | timestamps | TTL configurado por scope |

---

## Sugerencias (no bloqueantes)

### SUG-S7-001 — `extractSubnet()` duplica lógica de `DeviceFingerprintService`

**Archivo:** `AccountAndContextController.java`

```java
// Controller tiene su propio extractSubnet()
private String extractSubnet(String rawIp) {
    String[] parts = rawIp.split("\\.");
    return parts.length >= 2 ? parts[0] + "." + parts[1] : rawIp;
}
```

`DeviceFingerprintService.extractIpSubnet()` hace exactamente lo mismo. Inyectar el
servicio en el controller o crear un helper de utilidad para evitar la duplicación.
Riesgo: si la lógica de extracción cambia en `DeviceFingerprintService`, el controller
no se actualiza automáticamente.

### SUG-S7-002 — placeholders en `SecurityPreferencesUseCase.getPreferences()`

Los valores hardcodeados (`true`, `30`, `0`, `Map.of()`) son aceptables para la
estructura del sprint pero deben conectarse a los repositorios reales en el mismo
sprint antes de QA. Verificar en el QA Gate que `GET /api/v1/security/preferences`
retorna datos reales y no los valores fijos.

---

## ACT-27 — Análisis de efectividad

| Sprint | NCs menores | Tipo | ACT aplicada |
|---|---|---|---|
| S5 | 2 | Problemas de diseño Spring (@Async+@Transactional, Integer.MAX_VALUE) | ✅ ACT-22 corrigió causa raíz |
| S6 | 2 | Imports residuales | ACT-27 definida como respuesta |
| **S7** | **3** | **Imports residuales** | ❌ **ACT-27 NO ejecutada** |

**Conclusión:** ACT-27 fue definida pero no ejecutada. El patrón se agrava: 2 imports en S6,
3 imports en S7. La retro de S7 debe realizar una CAR formal sobre por qué el Developer
no ejecuta el checklist de pre-commit. Posibles causas raíz adicionales:
- El checklist existe solo en un documento pero no está integrado en el workflow de git
- No hay un mecanismo automático (pre-commit hook) que fuerce la verificación

**Recomendación para retro S7 — ACT-31:** Implementar un pre-commit hook con
[git hooks o Husky] que ejecute `./gradlew compileJava` + detecte imports no usados
antes de permitir el commit. Cambia "checklist manual" por "enforcement automático".

---

## Correcciones requeridas antes de QA

### RV-S7-001: eliminar `import java.time.LocalDateTime` en `AccountLockUseCase`
### RV-S7-002: eliminar `import AccountLockUseCase` en `AccountAndContextController`
### RV-S7-003: eliminar `import java.security.MessageDigest` en `LoginContextUseCase`

---

*SOFIA Code Reviewer Agent · BankPortal · Sprint 7 · 2026-06-11*
