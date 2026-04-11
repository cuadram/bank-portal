# Release Notes — BankPortal v1.10.0
## Sprint 10 — FEAT-008 Transferencias Bancarias

**Versión:** v1.10.0
**Fecha:** 2026-03-20
**Sprint:** 10
**Jira:** SCRUM-31

---

## Resumen

BankPortal v1.10.0 introduce la funcionalidad de **Transferencias Bancarias**,
completando la épica de Operaciones Bancarias. Los usuarios pueden ahora
mover dinero entre sus propias cuentas y a beneficiarios guardados con
confirmación 2FA obligatoria (PSD2 SCA). Adicionalmente se migra el sistema
de autenticación JWT de HS256 a RS256 y se consolida la suite de tests de
integración con PostgreSQL real via Testcontainers.

---

## Nuevas funcionalidades

### US-801 — Transferencia entre cuentas propias
- `POST /api/v1/transfers/own` — transfiere entre cuentas del mismo titular
- Validación de saldo previo a solicitar OTP
- OTP de confirmación obligatorio (PSD2 SCA)
- Actualización en tiempo real de saldos vía SSE

### US-802 — Transferencia a beneficiario guardado
- `POST /api/v1/transfers/beneficiary` — transfiere a terceros registrados
- Confirmación adicional en primera transferencia a nuevo beneficiario (anti-fraude)
- IBAN del beneficiario nunca expuesto en logs ni respuestas

### US-803 — Gestión de beneficiarios
- `GET/POST /api/v1/beneficiaries` — listar y crear beneficiarios
- `PUT /api/v1/beneficiaries/{id}` — editar alias (sin OTP)
- `DELETE /api/v1/beneficiaries/{id}` — eliminación lógica (soft delete)
- Validación IBAN según ISO 13616 (módulo 97)
- Alta de beneficiario requiere OTP (PSD2 SCA)

### US-804 — Límites de transferencia
- `GET /api/v1/transfers/limits` — consulta de límites vigentes
- Límites por defecto: 2.000€/operación · 3.000€/día · 10.000€/mes
- Contador diario en Redis con TTL medianoche UTC
- Degradación graceful si Redis no disponible

---

## Deuda técnica resuelta

### DEBT-014 — Migración JWT HS256 → RS256
- Algoritmo cambiado de HMAC-SHA256 a RSA-SHA256 con keypair RSA-2048
- Tokens HS256 anteriores rechazados con HTTP 401 `TOKEN_ALGORITHM_REJECTED`
- Nuevas credenciales Jenkins: `bankportal-jwt-private-key-pem` / `bankportal-jwt-public-key-pem`
- **Impacto en STG:** `docker-compose down -v` requerido antes del deploy

### DEBT-013 — Tests de integración con Testcontainers
- Suite de integración con PostgreSQL real (perfil Maven `integration`)
- Flyway V1→V11 verificada en cada ejecución de integración
- Tests unitarios H2 sin cambios (retrocompatibilidad total)
- Jenkinsfile: nuevo stage "Backend — Integration Tests"

---

## Modelo de datos

### Flyway V11 — Nuevas tablas
- `beneficiaries` — catálogo de beneficiarios con soft delete
- `transfers` — registro de transferencias con constraint XOR cuenta/beneficiario
- `transfer_limits` — límites configurables por usuario (defaults en la migración)

---

## ⚠️ Notas de despliegue

### CRÍTICO — DEBT-014 JWT RS256
```bash
# 1. Generar keypair RSA-2048 para STG/PROD
openssl genrsa -out private.pem 2048
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in private.pem -out private-pkcs8.pem
openssl rsa -in private.pem -pubout -out public.pem
export JWT_PRIVATE_KEY_PEM=$(base64 -i private-pkcs8.pem | tr -d '\n')
export JWT_PUBLIC_KEY_PEM=$(base64 -i public.pem | tr -d '\n')
rm -f private.pem private-pkcs8.pem public.pem

# 2. Registrar en Jenkins antes del deploy
#    Credential IDs: bankportal-jwt-private-key-pem / bankportal-jwt-public-key-pem

# 3. STG: limpiar volúmenes (invalida tokens HS256 activos)
cd infra/compose && docker-compose down -v

# 4. Deploy con las nuevas claves
IMAGE_TAG=v1.10.0 docker-compose up -d --build
```

### Rollback
Si el deploy falla, volver a v1.9.0:
```bash
IMAGE_TAG=v1.9.0-rc docker-compose up -d
# NOTA: v1.9.0 usaba HS256 — los tokens de v1.10.0 no son compatibles
# Los usuarios deberán hacer login de nuevo tras el rollback
```

---

## Seguridad

- PSD2 Art. 74 + 97 cumplidos: OTP obligatorio en toda transferencia y alta de beneficiario
- PCI-DSS 4.0 Req. 10.2: audit trail completo (TRANSFER_INITIATED / OTP_VERIFIED / COMPLETED)
- IBAN nunca expuesto en logs — solo últimos 4 dígitos
- Importes en DECIMAL(15,2) — nunca float

---

## Métricas del sprint

| Métrica | Valor |
|---|---|
| Story Points entregados | 24/24 |
| Tests unitarios | 23 nuevos (total acumulado: ~95) |
| Defectos en producción | 0 |
| Cobertura unitaria FEAT-008 | ~88% |
| Escenarios Gherkin cubiertos | 27/27 (100%) |

---

*BankPortal v1.10.0 — SOFIA DevOps Agent — Sprint 10 — 2026-03-20*
