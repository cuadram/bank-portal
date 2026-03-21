# ADR-016 — Patrón saga local para atomicidad de transferencias

## Metadata

| Campo | Valor |
|---|---|
| ADR | ADR-016 |
| Feature | FEAT-008 |
| Proyecto | BankPortal — Banco Meridian |
| Fecha | 2026-03-20 |
| Estado | Propuesto |
| Autor | SOFIA Architect Agent |

---

## Contexto

Una transferencia bancaria involucra múltiples pasos que deben ser atómicos:
validación de saldo, ejecución en core bancario, persistencia local del movimiento
e incremento del contador Redis. Si algún paso falla a mitad, el estado del sistema
puede quedar inconsistente (saldo debitado sin movimiento registrado, o Redis
incrementado sin transferencia completada).

En Sprint 10, el core bancario es un mock en el mismo proceso, lo que simplifica
la atomicidad. Sin embargo, el diseño debe ser correcto desde el inicio para que
el swap a un core real en Sprint 11 no requiera cambios arquitecturales.

---

## Decisión

Se implementa una **saga local de transacción única** (`@Transactional`) para
Sprint 10 (core mock en mismo proceso), con el diseño preparado para evolucionar
a saga con compensación en Sprint 11 cuando el core sea un servicio externo real.

---

## Opciones consideradas

| Opción | Pros | Contras |
|---|---|---|
| **Saga local @Transactional** (elegida) | Simple · adecuado para mock Sprint 10 · bajo riesgo de inconsistencia en proceso único | No escala a servicios externos sin refactor |
| Saga distribuida con compensación | Correcta para microservicios reales · resiliente a fallos externos | Sobreingeniería en Sprint 10 con mock · complejidad innecesaria |
| Two-Phase Commit (2PC) | Atomicidad garantizada entre servicios | Acoplamiento fuerte · no compatible con REST APIs de terceros |
| Outbox Pattern + eventos | Eventual consistency robusta · desacoplado | Requiere infraestructura de mensajería · Sprint 11+ |

---

## Implementación Sprint 10 (saga local)

```java
@Transactional
public TransferResponseDto execute(OwnTransferCommand cmd) {
    // 1. Validar límites (Redis — fuera de @Transactional del core)
    limitService.validate(cmd.userId(), cmd.amount());

    // 2. Validar saldo (mock retorna datos simulados)
    BigDecimal balance = corePort.getAvailableBalance(cmd.sourceAccountId());
    if (balance.compareTo(cmd.amount()) < 0) {
        throw new InsufficientFundsException();
    }

    // 3. Verificar OTP
    twoFactorService.verifyCurrentOtp(cmd.userId(), cmd.otpCode());
    auditLog.log("TRANSFER_OTP_VERIFIED", cmd.userId(), ...);

    // 4. Ejecutar en core (mock: operacion en memoria)
    TransferResult result = corePort.executeOwnTransfer(cmd);

    // 5. Persistir en BD local (dentro del @Transactional)
    Transfer transfer = Transfer.completed(cmd, result);
    transferRepo.save(transfer);

    // 6. Incrementar contador Redis (best-effort — fuera del rollback)
    try {
        redisAdapter.incrementDaily(cmd.userId(), cmd.amount());
    } catch (Exception e) {
        log.error("Redis unavailable for limit counter — transfer persisted: {}", transfer.getId());
        // No hacer rollback: la transferencia ya se ejecutó
    }

    auditLog.log("TRANSFER_COMPLETED", cmd.userId(), transfer.getId().toString());
    return TransferResponseDto.from(transfer, result);
}
```

## Evolución Sprint 11 (saga con compensación)

En Sprint 11, cuando el core sea un servicio externo REST, el paso 4 será
una llamada HTTP síncrona. El patrón evolucionará a:

```
try {
    result = corePort.executeOwnTransfer(cmd);  // llamada HTTP externa
    transfer = transferRepo.save(Transfer.completed(cmd, result));
} catch (CoreException e) {
    transferRepo.save(Transfer.failed(cmd, e.getReason()));
    throw new TransferFailedException(e);
}
```

No se requiere infraestructura de mensajería — la compensación es simple
porque el core devuelve el estado de la operación sincrónicamente.

---

## Consecuencias

**Positivas:**
- Implementación simple y correcta para Sprint 10 (mock en proceso)
- Diseño preparado para Sprint 11 sin cambio de interfaz (`BankCoreTransferPort` sellada)
- audit_log siempre consistente con el estado de la transferencia

**Trade-offs:**
- La atomicidad entre BD y Redis no es perfecta: Redis puede incrementar aunque
  la transacción de BD haga rollback por un error tardío. Impacto: contadores
  ligeramente superiores a los reales. Mitigación: fallback a BD en caso de duda.
- En Sprint 11, si el core falla después de debitar al cliente, se necesita
  lógica de compensación en el adaptador (fuera del alcance Sprint 10).

---

*ADR-016 — SOFIA Architect Agent — BankPortal Sprint 10 — 2026-03-20*
