# Code Review — FEAT-016 Gestión de Tarjetas
## CR-FEAT-016-Sprint18

| Campo | Valor |
|---|---|
| Documento | CR-FEAT-016-Sprint18 v1.0 |
| Revisado por | SOFIA Code Reviewer Agent |
| Fecha | 2026-03-25 |
| Commit base | 768250a |
| Resultado | ⚠️ CONDICIONADO — 1 bloqueante corregido en este CR |
| CMMI | VER SP 1.1 · VER SP 2.1 |

---

## Resumen de findings

| ID | Severidad | Área | Descripción | Estado |
|---|---|---|---|---|
| RV-F016-01 | 🔴 BLOQUEANTE | Architecture | `Card` entity expuesta directamente en Controller — viola Clean Architecture | **CORREGIDO** |
| RV-F016-02 | 🟡 MINOR | Domain | `@Setter` en `Card` permite bypass de invariantes de dominio | **CORREGIDO** |
| RV-F016-03 | 🟡 MINOR | Refactor | `maskCardId()` duplicado en 4 use-cases | **CORREGIDO** |
| RV-F016-04 | 🟡 MINOR | Security | `BCryptPasswordEncoder` inyectado por tipo concreto en vez de interfaz | **CORREGIDO** |
| RV-F016-05 | 🟡 MINOR | Reliability | `LocalDate.now()` sin timezone en scheduler — riesgo DST | **CORREGIDO** |
| RV-F016-06 | 🔵 SUGERENCIA | Clean Code | `@Transactional` innecesario en `ChangePinUseCase` (sin escritura BD) | Diferido |
| RV-F016-07 | 🔵 SUGERENCIA | SQL | SeedData `INSERT ... LIMIT 1` silencioso si `accounts` vacía | Diferido |

**Bloqueantes:** 1 (corregido en CR) · **Minors:** 4 (corregidos en CR) · **Sugerencias:** 2 (diferidas)

---

## Detalle de findings

### RV-F016-01 — BLOQUEANTE: Card entity en Controller

**Fichero:** `CardController.java` — endpoints `listCards()`, `getCard()`

**Problema:**
```java
// ANTES — expone entidad JPA directa
public ResponseEntity<List<Card>> listCards(...)
public ResponseEntity<Card> getCard(...)
```
Retornar la entidad JPA desde el controller viola Clean Architecture: expone campos internos (`dailyLimitMin/Max`, `createdAt`), genera riesgo de serialización con proxies Hibernate y acopla la API al modelo de persistencia.

**Solución:** DTOs `CardSummaryDto` y `CardDetailDto` — ver fixes aplicados.

---

### RV-F016-02 — MINOR: @Setter en Card permite bypass de invariantes

**Fichero:** `Card.java`

**Problema:** `@Setter` expone todos los campos incluyendo `status`, `dailyLimit`, etc. Cualquier clase puede mutar el estado sin pasar por `block()`, `unblock()` o `updateLimits()`, eliminando las validaciones de dominio.

**Solución:** Eliminar `@Setter`. JPA accede por field (`@Access(AccessType.FIELD)`).

---

### RV-F016-03 — MINOR: maskCardId() duplicado

**Ficheros:** `BlockCardUseCase`, `UnblockCardUseCase`, `UpdateCardLimitsUseCase`, `ChangePinUseCase`

**Problema:** El método `maskCardId(UUID)` está copiado en los 4 use-cases. Violación DRY.

**Solución:** `CardMaskingUtil.maskId(UUID)` — clase utilitaria estática.

---

### RV-F016-04 — MINOR: BCryptPasswordEncoder por tipo concreto

**Fichero:** `ChangePinUseCase.java`

**Problema:**
```java
private final BCryptPasswordEncoder passwordEncoder;
```
Spring Security recomienda inyectar `PasswordEncoder` (interfaz) para facilitar cambio de algoritmo sin modificar use-cases.

**Solución:** Cambiar a `PasswordEncoder`.

---

### RV-F016-05 — MINOR: LocalDate.now() sin timezone

**Fichero:** `ScheduledTransferJobService.java`

**Problema:** `LocalDate.now()` usa el timezone por defecto de la JVM. En transiciones DST (verano/invierno), puede ejecutarse una hora antes o después de lo esperado, causando transferencias perdidas o duplicadas en el día del cambio.

**Solución:** `LocalDate.now(ZoneId.of("Europe/Madrid"))` o zona configurable.

---

## Fixes aplicados en este CR

Los fixes de RV-F016-01..05 se aplican a continuación. El commit de CR cierra el finding bloqueante.
