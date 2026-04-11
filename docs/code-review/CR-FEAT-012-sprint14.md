# Code Review Report — FEAT-012-A Sprint 14

**Fecha:** 2026-03-23 | **Revisor:** SOFIA Code Reviewer Agent — Step 5
**Commit revisado:** `76c9d1a` + `afcc91d` | **CMMI:** VER SP 2.2 · VER SP 3.1

---

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Archivos revisados | 22 (14 backend + 5 frontend + 3 tests) |
| Hallazgos bloqueantes | **1** → corregido in-situ (RV-018) |
| Hallazgos mayores | **1** → corregido in-situ (RV-019) |
| Hallazgos menores | 3 (RV-020 diferido S15, RV-021 corregido, RV-022 corregido) |
| Hallazgos sugerencias | 2 (RV-023 corregido, RV-024 anotado) |
| **Veredicto final** | ✅ **APROBADO tras correcciones in-situ** |

---

## Hallazgos

### 🔴 RV-018 [BLOQUEANTE — CORREGIDO] — Repositorios package-private

**Archivo:** `profile/domain/ProfileRepositories.java`
`PasswordHistoryRepository` y `RevokedTokenRepository` sin `public` — Spring Data JPA
no detecta interfaces no públicas. Contexto fallaría al arrancar con `NoSuchBeanDefinitionException`.

**Corrección aplicada:** Separados en 3 ficheros individuales con `public`:
- `UserProfileRepository.java`
- `PasswordHistoryRepository.java`
- `RevokedTokenRepository.java`
- `ProfileRepositories.java` vaciado con comentario de migración

---

### 🟠 RV-019 [MAYOR — CORREGIDO] — Invalidación de sesiones no implementada

**Archivo:** `profile/application/ChangePasswordUseCase.java:58`
El paso 8 solo logueaba "sesiones invalidadas" sin código real. US-1203 exige
invalidar todas las sesiones excepto la actual tras cambiar la contraseña.

**Corrección aplicada:** `invalidateOtherSessions()` escribe clave Redis
`user:{userId}:password_changed` con TTL 24h. RevokedTokenFilter consulta
esta clave en cada request subsiguiente.

---

### 🟡 RV-020 [MENOR — DIFERIDO S15] — `twoFactorEnabled` hardcodeado a `false`

**Archivo:** `profile/application/GetProfileUseCase.java:30`
Simplificación MVP documentada. Leer desde BD en Sprint 15.

---

### 🟡 RV-021 [MENOR — CORREGIDO junto con RV-018]

Repositorios separados en ficheros individuales — SRP a nivel de fichero cumplido.

---

### 🟡 RV-022 [MENOR — CORREGIDO] — `@Valid` faltante en ProfileController

**Archivo:** `profile/api/ProfileController.java:37,43`
`@Valid` añadido en `updateProfile()` y `changePassword()`.

---

### 🟢 RV-023 [SUGERENCIA — CORREGIDO] — Import `tap` sin usar

`profile.service.ts`: import `tap` eliminado.

---

### 🟢 RV-024 [SUGERENCIA — PENDIENTE] — Constante dead code

`ChangePasswordUseCase.java`: `JTI_BLACKLIST_PREFIX` eliminada en la corrección de RV-019.

---

## Aspectos positivos

| Aspecto | Detalle |
|---|---|
| DEBT-022 ✅ | `exclude OAuth2ResourceServerAutoConfiguration` — solución limpia |
| DEBT-023 ✅ | `jti` UUID v4 + propagación como atributo de request |
| RV-013/014 ✅ | Catch tipado específico en generadores PDF/Excel |
| RV-015 ✅ | `@Transactional(readOnly=true)` en exportación dashboard |
| RV-016 ✅ | `takeUntilDestroyed` en **todos** los subscribe() Angular |
| RV-017 ✅ | AuthGuard decodifica `exp` con try-catch ante token malformado |
| RevokedTokenFilter ✅ | Fail-open ADR-022 documentado y configurable |
| ManageSessionsUseCase ✅ | Dual write Redis + PG con TTL correcto |
| Tests ✅ | 20 nuevos tests — cobertura regex, E.164, resolvePeriod, categorización |

---

## Criterio de salida

```
[x] 0 hallazgos BLOQUEANTES (RV-018 corregido in-situ)
[x] 0 hallazgos MAYORES pendientes (RV-019 corregido in-situ)
[x] RV-021/022/023 corregidos en misma sesión
[x] RV-020 diferido a Sprint 15 con justificación MVP
[x] RV-024 eliminado en corrección de RV-019
[x] Repositorios JPA con visibilidad public correcta
[x] Invalidación de sesiones implementada (US-1203)
```

**Veredicto: ✅ APROBADO**

_SOFIA Code Reviewer Agent — Step 5 — BankPortal Sprint 14 — FEAT-012-A — 2026-03-23_
_CMMI Level 3 — VER SP 2.2 · VER SP 3.1_
