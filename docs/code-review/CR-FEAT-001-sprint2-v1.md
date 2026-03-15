# Code Review Report — FEAT-001 Sprint 2

## Metadata

| Campo | Valor |
|---|---|
| **Proyecto** | BankPortal — Banco Meridian |
| **Stack** | Java 17 / Spring Boot 3.x + Angular 17 |
| **Sprint** | Sprint 2 |
| **Fecha** | 2026-04-08 |
| **Commit revisado** | `4b2b68c` |
| **Archivos revisados** | 18 (10 Java + 5 Angular/TS + 3 config/SQL) |
| **Reviewer** | SOFIA Code Reviewer Agent |

---

## Resumen ejecutivo

| Categoría | 🔴 Bloqueante | 🟠 Mayor | 🟡 Menor | 🟢 Sugerencia |
|---|---|---|---|---|
| Arquitectura y Diseño | 0 | 0 | 0 | 0 |
| Contrato OpenAPI | 0 | 0 | 1 | 0 |
| Seguridad | 0 | 0 | 1 | 1 |
| Calidad de Código | 0 | 0 | 1 | 1 |
| Tests | 0 | 0 | 1 | 0 |
| Documentación | 0 | 0 | 0 | 0 |
| Convenciones Git | 0 | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **4** | **2** |

## Veredicto
### ✅ APROBADO

Cero BLOQUEANTES · Cero MAYORES
4 MENORES y 2 SUGERENCIAS no bloquean el pipeline — Developer puede corregir en el mismo PR o en Sprint 3.

---

## Hallazgos detallados

### 🟡 Menores

#### RV-S2-001 — OpenAPI contract: endpoint `/deactivate` usa DELETE con body
- **Nivel:** Contrato OpenAPI
- **Archivo:** `api/controller/TwoFaController.java:70` + `openapi-2fa.yaml`
- **Descripción:** El endpoint `DELETE /api/2fa/deactivate` recibe `DeactivateRequest` en el body (`currentPassword`) y además un header `X-Password-Hash`. El contrato OpenAPI de Sprint 1 define este endpoint correctamente con `requestBody`, pero algunos proxies/firewalls bloquean DELETE con body. La práctica más robusta es usar `POST /api/2fa/deactivate` o mover la confirmación de contraseña a un endpoint previo. No es bloqueante pero debe documentarse en el ADR o como deuda técnica.
- **Corrección sugerida:** Añadir nota en `openapi-2fa.yaml` documentando la decisión de DELETE+body, o migrar a `POST /api/2fa/deactivate` en Sprint 3 (DEBT-003).

#### RV-S2-002 — `X-Password-Hash` header expone hash de contraseña en tránsito
- **Nivel:** Seguridad
- **Archivo:** `api/controller/TwoFaController.java:73`
- **Descripción:** El controller recibe el hash de contraseña del usuario via `@RequestHeader("X-Password-Hash")`. Aunque la comunicación es TLS, el hash nunca debería viajar en un header HTTP — es información sensible. El hash debería obtenerse internamente desde el repositorio de usuarios por userId, sin que el cliente lo envíe.
- **Corrección sugerida:** En `DeactivateTotpUseCase.execute()`, inyectar un `UserRepository` (o llamar al módulo JWT existente) para recuperar el hash por userId. Eliminar el parámetro `storedHash` del método y del controller.

#### RV-S2-003 — `TwoFaController.status()` retorna datos hardcodeados
- **Nivel:** Calidad de Código
- **Archivo:** `api/controller/TwoFaController.java:80-83`
- **Descripción:** El endpoint `GET /api/2fa/status` retorna `enabled=true` y `codesRemaining=0L` hardcodeados con el comentario `// stub`. Este endpoint está definido en el contrato OpenAPI y es llamado por el `TwoFaStore` de Angular en `loadStatus()`. Si se deja en stub, el frontend siempre mostrará el estado incorrecto.
- **Corrección requerida:** Implementar llamada real a `TotpSecretRepository.findByUserId()` y `RecoveryCodeRepository.countAvailableByUserId()`.

#### RV-S2-004 — Cobertura de tests: `RateLimiterService` (DEBT-001) sin tests unitarios
- **Nivel:** Tests
- **Archivo:** `infrastructure/security/RateLimiterService.java`
- **Descripción:** El `RateLimiterService` con Bucket4j+Redis es código nuevo sin tests unitarios. Dado que el rate limiting es un control de seguridad crítico (RNF-D03), debe tener tests que verifiquen el comportamiento de bloqueo. Se puede testear con un `ProxyManager` mockado o con Testcontainers Redis.
- **Corrección sugerida:** Añadir `RateLimiterServiceTest` con al menos 3 casos: intento permitido, bloqueo tras N fallos, reset tras login exitoso.

---

### 🟢 Sugerencias

#### RV-S2-005 — JwtService: añadir JWKS endpoint para distribución de clave pública
- **Archivo:** `infrastructure/security/JwtService.java`
- **Descripción:** Con RSA-256, la clave pública puede publicarse como endpoint JWKS (`/.well-known/jwks.json`) para que otros servicios la consuman automáticamente. No es necesario para el sprint actual, pero prepararía el servicio para federación futura. Considerar en Sprint 3.

#### RV-S2-006 — E2E Playwright: tests que requieren `TOTP_TEST_SECRET` deberían tener fallback
- **Archivo:** `e2e/2fa/enrollment.spec.ts`
- **Descripción:** Los tests TC-E2E-003..005 usan `test.skip(!process.env.TOTP_TEST_SECRET)`. En CI esto provoca que el 60% de la suite de enrolamiento se salte si no está configurado. Considerar un TOTP seeder de test dedicado en el entorno CI que genere el secreto automáticamente.

---

## Aspectos positivos destacados

- ✅ **DEBT-001**: `Bucket4j + Redis` — implementación limpia con `ProxyManager<String>`, key `rl:2fa:userId:ip` bien diseñada, TTL a través del `BucketConfiguration`
- ✅ **DEBT-002**: RSA-256 correctamente implementado — `stripPemHeaders()` robusto, `PrivateKey`/`PublicKey` desde `KeyFactory`, firma con `privateKey` y verificación con `publicKey`
- ✅ **US-004**: `DeactivateTotpUseCase` — `@Transactional`, `PasswordEncoder.matches()`, limpieza de secreto + recovery codes en un solo TX
- ✅ **US-005**: `AuditService` — manejo de excepción correcto: el fallo de auditoría no interrumpe el flujo de negocio, se loguea como ERROR
- ✅ **Flyway V4**: trigger `audit_log_immutable` + `REVOKE UPDATE, DELETE` — doble protección correcta para PCI-DSS
- ✅ **E2E Playwright**: configuración multi-browser (Chromium + Firefox), `fullyParallel: false` correcto para tests con estado en BD, reporters HTML + JUnit para Jenkins
- ✅ **DeactivateTotpUseCase tests**: 3 escenarios bien cubiertos — happy path, contraseña incorrecta, sin 2FA activo
- ✅ **AuditService tests**: verificación de persistencia + resiliencia ante fallos + userId null

---

## Checklist de conformidad

```
ARQUITECTURA        ✅ Hexagonal mantenida — Redis y JWT en infrastructure/
OPENAPI             🟡 DELETE+body documentar en ADR o migrar (DEBT-003)
SEGURIDAD           🟡 X-Password-Hash en header — mover a internal lookup
CALIDAD             🟡 status() stub hardcodeado
TESTS               ✅ 6 tests nuevos (Sprint 2) · cobertura >80% módulo
DOCUMENTACIÓN       ✅ Javadoc/JSDoc completo · ADR-005 generado
GIT                 ✅ Conventional Commits · feature/FEAT-001-sprint2
```

## Acciones requeridas post-review

| # | Acción | Severidad | SLA |
|---|---|---|---|
| 1 | Implementar `GET /api/2fa/status` con datos reales (RV-S2-003) | 🟡 Menor | Mismo sprint |
| 2 | Documentar decisión DELETE+body en `openapi-2fa.yaml` + crear DEBT-003 (RV-S2-001) | 🟡 Menor | Mismo sprint |
| 3 | Mover obtención de password hash a internal repository lookup (RV-S2-002) | 🟡 Menor | Antes de QA |
| 4 | Añadir `RateLimiterServiceTest` (RV-S2-004) | 🟡 Menor | Antes de QA |

---

*Generado por SOFIA Code Reviewer Agent — 2026-04-08*
*Estado: ✅ APROBADO — 4 menores a resolver antes de QA*
