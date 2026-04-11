# ADR-032 + ADR-033 — Architecture Decision Records
## FEAT-019: Centro de Privacidad y Perfil
**Sprint:** 21 | **Fecha:** 2026-03-31 | **Autor:** Architect Agent — SOFIA v2.3

---

# ADR-032: Estrategia de borrado lógico para derecho al olvido (GDPR Art.17)

**Estado:** ACEPTADO  
**Fecha:** 2026-03-31  
**Contexto:** SCRUM-110, RF-019-06, GDPR Art.17

## Contexto

El usuario puede solicitar la eliminación de su cuenta y datos personales (GDPR Art.17 — derecho al olvido). BankPortal necesita ejecutar este borrado de forma que:
1. Cumpla el Art.17 (supresión efectiva de datos personales)
2. Respete Art.17§3.b (excepción: retención obligatoria por cumplimiento de obligación legal — audit logs, movimientos financieros, hasta 6 años)
3. No rompa integridad referencial de la base de datos (FKs hacia `users.id`)
4. Permita verificar que el usuario ha sido efectivamente dado de baja

## Opciones evaluadas

### Opción A: Hard delete físico
- DELETE FROM users WHERE id = ?
- Cascada en todas las tablas hijas
- **Ventaja:** limpieza total
- **Desventaja:** viola Art.17§3.b (no se pueden conservar audit logs), rompe FKs en tablas que deben conservarse (export_audit_log, gdpr_requests), irreversible ante error

### Opción B: Soft delete + anonimización selectiva ✅ ELEGIDA
- Marcar `users.status = 'DELETED'`, `users.deleted_at = NOW()`
- Anonimizar campos de identificación directa: `nombre → 'USUARIO ELIMINADO'`, `apellidos → ''`, `email → SHA256(email)`, `telefono → NULL`, `direccion_* → NULL`
- Conservar intactos: `audit_log`, `gdpr_requests`, `export_audit_log`, `movimientos` (obligación legal)
- **Ventaja:** cumple Art.17 (datos personales eliminados) y Art.17§3.b (logs conservados), sin rotura de FKs, reversible ante error antes de ejecutar
- **Desventaja:** requiere proceso de anonimización explícito

### Opción C: Pseudonimización sin borrado
- Reemplazar datos con tokens pseudónimos enlazados a tabla separada
- **Desventaja:** excesiva complejidad para el alcance del proyecto

## Decisión

**Opción B — Soft delete + anonimización selectiva.**

Proceso en dos fases:
1. **Fase inmediata** (tras confirmación email): `status = SUSPENDED`, `deletion_requested_at = NOW()`
2. **Fase diferida** (job día 30 o antes): anonimización de campos PII + `status = DELETED`, `deleted_at = NOW()`

El job de anonimización ejecuta en una transacción atómica. Si falla, el estado queda en SUSPENDED y el proceso se reintenta al día siguiente.

## Consecuencias
- DeletionRequestService implementa flujo de dos fases descrito
- Job `GdprDeletionJob.java` (@Scheduled diario 02:00) procesa solicitudes en SUSPENDED con `deletion_requested_at <= NOW() - 30 days`
- El webhook a CoreBanking es fire-and-forget: si falla, se registra DEBT-040 pero el proceso de BankPortal no se bloquea (RN-F019-30)
- audit_log, gdpr_requests y export_audit_log conservan user_id como UUID no anonimizable (identificador técnico, no dato personal per se bajo Art.4§1 si no hay tabla de correspondencia)

---

# ADR-033: Generación asíncrona del data-export GDPR (Art.15/20)

**Estado:** ACEPTADO  
**Fecha:** 2026-03-31  
**Contexto:** SCRUM-109, RF-019-05, GDPR Art.15 y Art.20

## Contexto

El endpoint `POST /api/v1/privacy/data-export` debe generar un JSON con todos los datos personales del usuario (perfil, consentimientos, sesiones históricas, audit log propio). El volumen de datos puede ser significativo (meses de actividad). Se necesita decidir si la generación es síncrona o asíncrona.

## Opciones evaluadas

### Opción A: Síncrono — generar y devolver en la misma request
- El backend genera todo el JSON en la misma petición HTTP y devuelve el fichero
- **Ventaja:** simplicidad
- **Desventaja crítica:** potencial timeout HTTP (>30s) con usuarios con mucha actividad; bloquea el hilo del servidor; no escala con múltiples requests simultáneas; mala UX (spinner bloqueante)

### Opción B: Asíncrono con @Async + almacenamiento temporal ✅ ELEGIDA
- POST devuelve 202 Accepted + requestId inmediatamente
- `@Async` ejecuta la generación en el pool `gdprExportExecutor` (thread pool dedicado, max 5 threads)
- JSON almacenado en `/tmp/gdpr-exports/{userId}/{requestId}.json` con TTL 48h
- Notificación push al usuario cuando listo (reutiliza NotificationService FEAT-014)
- GET /data-export/download devuelve el fichero con token firmado (TTL 48h — RN-F019-23)
- **Ventaja:** no bloquea, escala, buena UX, cumple SLA 24h (RN-F019-20)
- **Desventaja:** requiere limpieza de ficheros temporales (job diario)

### Opción C: Colas de mensajes (Kafka/RabbitMQ)
- Overhead de infraestructura no justificado para el volumen esperado de solicitudes GDPR
- **Desventaja:** añade dependencia externa no presente en el stack actual

## Decisión

**Opción B — @Async con pool dedicado.**

Configuración del pool:
```java
@Bean("gdprExportExecutor")
public Executor gdprExportExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);
    executor.setMaxPoolSize(5);
    executor.setQueueCapacity(20);
    executor.setThreadNamePrefix("gdpr-export-");
    executor.initialize();
    return executor;
}
```

Almacenamiento temporal: ficheros en `/tmp/gdpr-exports/` con nombre `{requestId}.json.gz` (comprimido). Job `GdprExportCleanupJob` (@Scheduled diario 03:00) elimina ficheros > 48h.

Firma del enlace de descarga: token = HMAC-SHA256(requestId + userId + expiryTimestamp, secretKey). Válido 48h. Verificado en el endpoint de descarga antes de servir el fichero.

## Consecuencias
- `DataExportService` usa `@Async("gdprExportExecutor")`
- `@EnableAsync` en `BankPortalApplication`
- `GdprExportCleanupJob` implementado en mismo sprint
- Límite: un export activo por usuario simultáneamente (RN-F019-19) — verificado en `GdprRequestService.findActiveExport()`
- Si el export falla: estado → REJECTED, usuario puede reintentar

---

*Generado por SOFIA v2.3 — Step 3 Architect — Sprint 21 — 2026-03-31*
