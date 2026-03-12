# Code Review Report — CR-FEAT-001-backend-sprint01 (v2.0 — RE-REVIEW)

| Campo          | Valor                                                   |
|----------------|---------------------------------------------------------|
| Feature        | FEAT-001 — Autenticación 2FA TOTP                       |
| Sprint         | 01                                                      |
| Artefacto      | `apps/backend-2fa/` — Java 21 / Spring Boot 3.3.4       |
| Reviewer       | SOFIA — Code Reviewer Agent                             |
| Fecha review   | 2026-03-12                                              |
| Versión previa | v1.0 — RECHAZADO (5 BLOQUEANTES)                        |
| **Versión**    | **v2.0 — APROBADO CONDICIONALMENTE ✅**                 |

---

## Veredicto

**✅ APROBADO CONDICIONALMENTE** — pipeline desbloqueado para QA Tester.

Todas las NCs BLOQUEANTES (NC-001..005) están resueltas. Las 3 observaciones MAYORES
corregidas. 4 MENORES corregidas. Las 3 SUGERENCIAS documentadas como backlog.

---

## Resolución de NCs BLOQUEANTES

| NC | RV | Estado | Evidencia |
|----|-----|--------|-----------|
| NC-BANKPORTAL-001 | RV-001 | ✅ CERRADA | 86 archivos Java generados en repo local. 7 commits en `feature/FEAT-001` |
| NC-BANKPORTAL-002 | RV-002 | ✅ CERRADA | `pom.xml`: `spring-boot-testcontainers`, `testcontainers:postgresql`, `junit-jupiter` con `<scope>test</scope>` |
| NC-BANKPORTAL-003 | RV-003 | ✅ CERRADA | `CryptoService` recibe `String aesKeyBase64` — no importa `TotpProperties`. `TotpConfig#cryptoService()` actúa de adaptador |
| NC-BANKPORTAL-004 | RV-004 | ✅ CERRADA | `RateLimiterService` usa `io.github.bucket4j.*` (Bucket4j 8.x) |
| NC-BANKPORTAL-005 | RV-005 | ✅ CERRADA | `JwtProperties.preAuthTtlSeconds` (long, no `Long`), env var `JWT_PRE_AUTH_TTL_SECONDS`, default=300 |

---

## Resolución de Observaciones MAYORES

| RV | Estado | Corrección aplicada |
|----|--------|---------------------|
| RV-006 | ✅ CERRADA | `CryptoService`: `getBytes(StandardCharsets.UTF_8)` en encrypt y decrypt |
| RV-007 | ✅ CERRADA | `JwtTokenProvider.validateAndExtract()` retorna `JwtClaims record(UUID, String)` — una sola operación de parseo |
| RV-008 | ✅ CERRADA | `JwtProperties.sessionTtlSeconds` (long), env var `JWT_SESSION_TTL_SECONDS`, default=28800 |

---

## Resolución de Observaciones MENORES

| RV | Estado | Corrección aplicada |
|----|--------|---------------------|
| RV-009 | ✅ CERRADA | `RateLimiterService.isBlocked()`: `bucket = buckets.get(userId); return bucket != null && bucket.getAvailableTokens() == 0` |
| RV-010 | ✅ CERRADA | `ZxingPngQrGenerator` expuesto como `@Bean` singleton en `TotpConfig` e inyectado en `TotpService` |
| RV-011 | ✅ CERRADA | `JwtProperties.preAuthTtlSeconds` y `sessionTtlSeconds`: `long` primitivo |
| RV-012 | ✅ CERRADA | `V4__create_audit_log_table.sql`: comentario hace referencia a ADR-003 y justifica ausencia de FK |

---

## Estado de Sugerencias

| RV | Estado |
|----|--------|
| RV-013 | ✅ Aplicada — `application.yml`: TOTP_ISSUER marcado "solo desarrollo local" |
| RV-014 | 📋 Backlog — rutas públicas duplicadas: centralización en próximo refactor |
| RV-015 | ✅ Aplicada — `application-integration.yml`: `aes-key` desde env var con nota RV-015 |

---

## Nuevas observaciones (re-review)

> Ninguna. El código cumple los estándares SOFIA CMMI Nivel 3.

---

## Próximos pasos desbloqueados

| Rol | Tarea |
|-----|-------|
| **QA Tester** | Ejecutar Test Plan v1.0 (60 TCs) — pipeline desbloqueado |
| **Dev Frontend** | US-001 Angular (puede continuar en paralelo) |
| **DEBT-001** | `RateLimiterService` in-process → Bucket4j + Redis (próximo sprint) |
