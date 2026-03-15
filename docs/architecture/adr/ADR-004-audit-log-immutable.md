# ADR-004 — Inmutabilidad del audit_log a nivel DDL

## Metadata

| Campo      | Valor                                              |
|------------|----------------------------------------------------|
| Feature    | FEAT-001                                           |
| Fecha      | 2026-03-12                                         |
| Estado     | Aceptado                                           |
| Supersede  | —                                                  |

## Contexto

RR-008 y RNF-D06 exigen que los registros de auditoría 2FA sean inmutables (PCI-DSS req. 10.7) y se retengan mínimo 12 meses. La inmutabilidad debe garantizarse no solo a nivel de aplicación (donde un bug o ataque podría evitarla) sino a nivel de base de datos. Se necesita decidir el mecanismo de enforcement.

## Decisión

Implementar inmutabilidad mediante **restricción DDL de base de datos**: revocar los privilegios `UPDATE`, `DELETE` y `TRUNCATE` sobre la tabla `audit_log` al rol de aplicación `bankportal_app`. Solo el rol DBA (`bankportal_dba`) puede operar sobre esos registros (para archivado programado). La inserción sigue siendo posible para el rol de aplicación.

```sql
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM bankportal_app;
GRANT INSERT, SELECT ON audit_log TO bankportal_app;
```

## Opciones consideradas

| Opción                               | Pros                                                                       | Contras                                                                 |
|--------------------------------------|----------------------------------------------------------------------------|-------------------------------------------------------------------------|
| **Restricción DDL (elegida)**        | Enforcement a nivel de motor DB — no bypasseable desde la aplicación · Simple · Sin dependencias extra | Requiere gestión correcta de roles en PostgreSQL; si se usa rol superuser en la app, la restricción no aplica |
| Soft-delete + flag `immutable=true`  | Fácil de implementar                                                       | Bypasseable desde la aplicación — no cumple PCI-DSS req. 10.7           |
| Tabla append-only via trigger        | Enforcement en DB con lógica personalizable                                | Triggers pueden desactivarse por DBA — menor garantía que revocación de privilegios |
| Blockchain / ledger DB               | Inmutabilidad criptográfica total                                          | Overhead masivo · No disponible en PostgreSQL estándar · Fuera de alcance del proyecto |

## Consecuencias

- **Positivas:** cumplimiento técnico demostrable de PCI-DSS req. 10.7 ante auditoría; la restricción es transparente para el código de aplicación (solo inserta).
- **Trade-offs:** el archivado y purga de registros históricos (>12 meses) debe ejecutarse por el DBA con el rol privilegiado, no desde la aplicación. Requiere procedimiento operacional documentado.
- **Riesgos:** si el equipo DevOps configura la aplicación con rol `bankportal_dba` (superuser), la restricción no tiene efecto. Mitigado: el LLD define explícitamente la variable de entorno `DB_USERNAME=bankportal_app`; el checklist DoD incluye verificación del rol en el ambiente de staging.
- **Impacto en servicios existentes:** ninguno. La tabla `audit_log` es nueva y exclusiva del módulo 2FA.
