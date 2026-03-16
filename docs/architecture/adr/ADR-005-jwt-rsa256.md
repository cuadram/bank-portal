# ADR-005 — Migración JWT de HS256 a RSA-256 (DEBT-002)

## Metadata
| Campo | Valor |
|---|---|
| **Feature** | FEAT-001 Sprint 2 — DEBT-002 |
| **Fecha** | 2026-03-30 |
| **Estado** | Aceptado |
| **Supersede** | ADR-003 (modelo JWT en dos fases — se mantiene, solo cambia el algoritmo) |

## Contexto

El JwtService de Sprint 1 usaba HMAC-SHA256 (HS256) con un secret compartido
(`JWT_FULL_SECRET`). Este enfoque tiene una limitación: cualquier servicio que
necesite verificar el JWT debe conocer el secret, lo que aumenta la superficie de
exposición si el número de servicios crece (por ejemplo, si se añade un API Gateway
o un servicio de auditoría independiente que valide tokens).

Adicionalmente, el keypair RSA permite verificar tokens sin acceso al material de
firma, facilitando la rotación de claves y la delegación de verificación.

## Decisión

**Migrar a RS256 (RSA-SHA256) con keypair RSA-2048.**
La clave privada firma los tokens (solo `backend-2fa`).
La clave pública verifica los tokens (cualquier servicio que necesite validar).

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **RS256 con RSA-2048 (elegida)** | Clave pública distribuible · rotación independiente · estándar JWKS | Keypair a gestionar · ligero overhead de generación |
| HS256 (Sprint 1) | Simple · rápido | Secret compartido · rotación afecta a todos los consumidores |
| ES256 (ECDSA) | Claves más cortas · más rápido que RSA | Menor soporte en librerías Java legacy · complejidad de implementación |

## Consecuencias

**Positivas:**
- La clave pública puede publicarse como JWKS endpoint para consumidores externos
- Rotación de clave privada sin afectar a servicios que solo verifican
- Preparación para federación de identidad futura

**Trade-offs:**
- Se añaden dos variables de entorno (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`)
- El keypair debe generarse y distribuirse antes del deploy (DevOps pre-requisito)
- Ligero incremento en latencia de firma (~1-2 ms) — dentro de RNF-D04

**Impacto en servicios existentes:**
- El módulo JWT existente que emite JWT parciales (`scope=2fa-pending`) no cambia
- Solo `backend-2fa` emite JWT completos — no hay otros consumidores aún

## Procedimiento de generación de keypair

```bash
# Generar clave privada RSA-2048
openssl genrsa -out jwt-private.pem 2048

# Extraer clave pública
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Convertir a base64 para variables de entorno
cat jwt-private.pem | base64 -w 0 > jwt-private.b64
cat jwt-public.pem  | base64 -w 0 > jwt-public.b64

# Registrar en Jenkins Credentials y K8s Secret — NUNCA commitear el .pem
```

---

*SOFIA Architect Agent — 2026-03-30 · Aprobado por Tech Lead*
