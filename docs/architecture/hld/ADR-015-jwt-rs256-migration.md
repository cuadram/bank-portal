# ADR-015 — Migración JWT de HS256 a RS256

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-015 |
| Feature | FEAT-008 / DEBT-014 |
| Proyecto | BankPortal — Banco Meridian |
| Fecha | 2026-03-20 |
| Estado | Propuesto |
| Supersede | ADR-001 v1.0 (parcialmente — actualiza la sección de algoritmo) |
| Autor | SOFIA Architect Agent |

---

## Contexto

ADR-001 (Sprint 1) definió el uso de JWT para autenticación, indicando RS256
como algoritmo objetivo pero permitiendo HS256 en fase inicial por simplicidad.
Con 9 sprints completados y la plataforma estabilizada, es el momento de
completar la migración para cumplir los requisitos de seguridad originales
y habilitar la verificación stateless en futuros microservicios sin compartir
secretos.

**Problema actual:** HS256 (HMAC-SHA256) requiere que todo servicio que verifique
tokens conozca el secreto compartido. Si BankPortal escala a múltiples servicios,
distribuir ese secreto es un riesgo de seguridad. RS256 permite que los servicios
verifiquen tokens con la clave pública sin necesidad del secreto privado.

**Contexto adicional:** `JwtTokenProvider` y `PreAuthTokenProvider` usan
`Keys.hmacShaKeyFor()` que genera claves HMAC. `JwtProperties` expone `secret`
y `preAuthSecret` como strings planos. La migración a RS256 requiere cambios
en ambas clases y en la configuración de STG.

---

## Decisión

**Se migra a RS256 (RSA-SHA256) con keypair RSA-2048** para la firma y verificación
de todos los JWT emitidos por BankPortal (full-session y pre-auth).

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **RS256 — RSA-2048** (elegida) | Estándar de industria · clave pública distribuible sin riesgo · compatible con JWKS endpoint futuro · cumple ADR-001 original | Mayor complejidad de configuración · keypair a gestionar |
| ES256 — ECDSA P-256 | Claves más cortas · más moderno | Menos soporte en librerías legacy · complejidad similar |
| HS256 — mantener actual | Sin cambios · ya funciona | Secreto compartido: riesgo al escalar · no cumple ADR-001 · bloqueante para microservicios |
| HS512 — HMAC más fuerte | Sin cambio de patrón · más seguro que HS256 | Sigue siendo secreto compartido · deuda técnica pendiente |

---

## Consecuencias

**Positivas:**
- Cumplimiento de ADR-001 original — deuda técnica DEBT-014 resuelta
- Verificación stateless: futuros microservicios verifican con clave pública sin secreto
- JWKS endpoint habilitado en el futuro sin cambios de algoritmo
- PCI-DSS 4.0: algoritmos asimétricos recomendados para tokens de sesión bancaria

**Trade-offs:**
- Configuración más compleja: openssl para generar keypair + Base64 PEM en variables de entorno
- Tokens HS256 existentes quedan invalidados → `docker-compose down -v` en STG requerido
- STG requiere regenerar sesiones tras el despliegue

**Riesgos y mitigaciones:**
- R1: Error en generación o carga del keypair → mitigación: validación en arranque + logs claros
- R2: Clave privada expuesta → mitigación: nunca en repositorio; solo en variables de entorno
- R3: Tokens anteriores rechazados → esperado y documentado; HTTP 401 + redirect a login

**Impacto en servicios existentes:**
- `JwtTokenProvider`: cambio de HMAC a RSA keypair
- `PreAuthTokenProvider`: mismo cambio
- `JwtProperties`: nuevas propiedades `private-key-pem` y `public-key-pem`
- `application-staging.yml`: nuevas variables JWT_PRIVATE_KEY_PEM y JWT_PUBLIC_KEY_PEM
- Todos los tokens activos en STG: invalidados por cambio de algoritmo

---

## Protocolo de migración en STG

```bash
# 1. Generar keypair RSA-2048
openssl genrsa -out stg-private.pem 2048
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt \
    -in stg-private.pem -out stg-private-pkcs8.pem
openssl rsa -in stg-private.pem -pubout -out stg-public.pem

# 2. Exportar a variables de entorno (NO commitear)
export JWT_PRIVATE_KEY_PEM=$(base64 -i stg-private-pkcs8.pem | tr -d '\n')
export JWT_PUBLIC_KEY_PEM=$(base64 -i stg-public.pem | tr -d '\n')

# 3. Limpiar volúmenes STG (invalida tokens HS256 existentes)
cd infra/compose
docker-compose down -v

# 4. Relanzar con RS256
IMAGE_TAG=v1.10.0-rc docker-compose up -d --build
```

---

*ADR-015 — SOFIA Architect Agent — BankPortal Sprint 10 — 2026-03-20*
