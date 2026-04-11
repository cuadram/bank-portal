# HOTFIX REPORT — BankPortal v1.19.0
## Post-deploy · 27 Mar 2026 · FEAT-017 SEPA DD

---

## Resumen

Tras el despliegue de v1.19.0, se detectaron 4 bugs en entorno STG durante la sesión
de pruebas funcionales. Todos corregidos en la misma jornada. Smoke test: **17/17 PASS**.

---

## Bugs detectados y corregidos

### BUG-POST-S19-001 — ConflictingBeanDefinitionException: ibanValidator
- **Severidad:** BLOQUEANTE (backend no arrancaba)
- **Causa:** `directdebit.validator.IbanValidator` sin nombre de bean explícito, colisionaba
  con `beneficiary.domain.IbanValidator` ya registrado con el mismo nombre por defecto.
- **Fix:** `@Component("sepaIbanValidator")` en `directdebit/validator/IbanValidator.java`
- **Archivo:** `apps/backend-2fa/.../directdebit/validator/IbanValidator.java`

### BUG-POST-S19-002 — HTTP 403 en lugar de 401 para requests sin JWT
- **Severidad:** ALTA (comportamiento de seguridad incorrecto)
- **Causa:** Spring Security 6 sin `AuthenticationEntryPoint` configurado devuelve 403
  por defecto cuando no hay autenticación.
- **Fix:** Añadido `exceptionHandling` con `sendError(SC_UNAUTHORIZED)` en `SecurityConfig.java`
- **Archivo:** `apps/backend-2fa/.../twofa/infrastructure/config/SecurityConfig.java`

### BUG-POST-S19-003 — HTTP 500 en DirectDebitController (AuthenticationPrincipal)
- **Severidad:** ALTA (endpoints FEAT-017 inoperativos)
- **Causa:** `@AuthenticationPrincipal(expression = "userId")` incompatible con el patrón
  DEBT-022 — el principal es `String` (username), el userId viaja en `request.getAttribute`.
- **Fix:** Migración a `HttpServletRequest.getAttribute("authenticatedUserId")` en todos
  los métodos de `DirectDebitController`.
- **Archivo:** `apps/backend-2fa/.../directdebit/controller/DirectDebitController.java`

### BUG-POST-S19-004 — Flyway V20 FAILED: incompatibilidad PostgreSQL ENUM → VARCHAR
- **Severidad:** BLOQUEANTE (backend no arrancaba con V20)
- **Causa:** `ALTER COLUMN ... TYPE VARCHAR USING ::TEXT` falla con columnas que tienen
  constraints de FK o índices dependientes del tipo ENUM en PostgreSQL 16.
- **Fix:** Approach por columna temporal: ADD COLUMN new + UPDATE + DROP old + RENAME.
  Adicionalmente, limpiar registro fallido de Flyway: `DELETE FROM flyway_schema_history WHERE version='20'`.
- **Archivo:** `apps/backend-2fa/src/main/resources/db/migration/V20__fix_mandate_enum_varchar.sql`

---

## Cambios de código

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `directdebit/validator/IbanValidator.java` | Fix | Bean renombrado a `sepaIbanValidator` |
| `twofa/infrastructure/config/SecurityConfig.java` | Fix | AuthenticationEntryPoint → 401 |
| `directdebit/controller/DirectDebitController.java` | Fix | HttpServletRequest pattern DEBT-022 |
| `db/migration/V20__fix_mandate_enum_varchar.sql` | New | ENUM→VARCHAR migration fix |
| `infra/compose/smoke-test-v1.19.sh` | New | Smoke test actualizado v1.19.0 |

---

## Resultado final

| Check | Resultado |
|-------|-----------|
| Actuator /health | ✅ UP |
| Flyway schema | ✅ v20 aplicado |
| Seguridad sin JWT | ✅ 4/4 → 401 |
| Autenticación | ✅ JWT obtenido |
| FEAT-017 mandates GET | ✅ 200 |
| FEAT-017 mandate POST válido | ✅ 201 |
| FEAT-017 mandate POST IBAN inválido | ✅ 422 |
| FEAT-017 mandates GET ?status=ACTIVE | ✅ 200 |
| Regresión dashboard | ✅ 200 |
| Regresión accounts | ✅ 200 |
| Regresión cards | ✅ 200 |
| Regresión bills | ✅ 200 |
| Regresión transfers/limits | ✅ 200 |
| **TOTAL** | **17/17 PASS** |

---

## Lecciones aprendidas

- **LA-019-04:** Verificar compatibilidad Hibernate `@Enumerated(STRING)` vs PostgreSQL
  custom ENUM types antes de crear migraciones. En STG usar siempre `VARCHAR` con CHECK constraints.
- **LA-019-05:** El patrón DEBT-022 (`HttpServletRequest.getAttribute`) debe aplicarse
  en TODOS los controllers nuevos generados por SOFIA. Añadir verificación automática
  en Gate 4 (Code Review).

---

*Generado por SOFIA v2.2 · XFORGE · Experis · 2026-03-27*
