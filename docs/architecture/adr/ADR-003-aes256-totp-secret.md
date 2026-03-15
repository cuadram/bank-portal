# ADR-003 — AES-256 para secretos TOTP en reposo

## Metadata

| Campo      | Valor                                              |
|------------|----------------------------------------------------|
| Feature    | FEAT-001                                           |
| Fecha      | 2026-03-12                                         |
| Estado     | Aceptado                                           |
| Supersede  | —                                                  |

## Contexto

El secreto TOTP debe almacenarse en base de datos para validar futuros OTP. A diferencia de contraseñas (donde basta un hash unidireccional), el secreto TOTP **debe poder recuperarse** en texto plano en tiempo de validación para ejecutar el algoritmo HMAC-SHA1 de RFC 6238. Por tanto no se puede hashear; se requiere cifrado reversible. RR-005 y RNF-D01 mandatan AES-256.

## Decisión

Cifrar el secreto TOTP con **AES-256-CBC** antes de persistir en la columna `totp_secret_enc`. La clave de cifrado se inyecta vía variable de entorno `TOTP_AES_KEY` (32 bytes codificados en Base64). El IV se genera aleatoriamente por cada cifrado y se almacena prefijado al texto cifrado (`IV:ciphertext` en Base64).

## Opciones consideradas

| Opción                     | Pros                                                    | Contras                                                                  |
|----------------------------|---------------------------------------------------------|--------------------------------------------------------------------------|
| **AES-256-CBC (elegida)**  | Estándar FIPS 140-2 · Soportado nativamente en JCA · IV aleatorio por registro evita ataques de diccionario | Requiere gestión segura de la clave; si la clave se compromete, todos los secretos se exponen |
| AES-256-GCM                | Autenticado (AEAD) — detecta tampering | Más complejo de implementar en JCA sin librería adicional; la autenticidad ya está garantizada por la integridad del sistema |
| Vault Transit Encryption   | Clave nunca sale de Vault · Rotación automática        | Dependencia de HashiCorp Vault no disponible en este entorno del cliente  |

## Consecuencias

- **Positivas:** cumplimiento directo de RR-005 y RNF-D01; implementación estándar en Java JCA sin dependencias adicionales.
- **Trade-offs:** la gestión de la clave AES es crítica — si se pierde, los secretos TOTP son irrecuperables (usuarios deben re-enrolarse). Documentar procedimiento de rotación de clave.
- **Riesgos:** exposición de `TOTP_AES_KEY` en logs o código fuente. Mitigado: la variable se lee exclusivamente desde el entorno de ejecución; el checklist DoD exige verificación en SonarQube de ausencia de secretos en código.
- **Impacto en servicios existentes:** ninguno. La columna `totp_secret_enc` es nueva y exclusiva de `backend-2fa`.
