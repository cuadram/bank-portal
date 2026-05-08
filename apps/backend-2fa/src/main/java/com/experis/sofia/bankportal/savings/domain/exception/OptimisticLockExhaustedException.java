package com.experis.sofia.bankportal.savings.domain.exception;

/**
 * Conflicto de concurrencia tras agotar el numero maximo de retries del
 * optimistic locking JPA en operaciones que mutan SavingsGoal.
 *
 * <p>BUG-S26-Q-008 (Sprint 26 FEAT-024): contribuciones manuales concurrentes
 * sobre el mismo goal compiten por incrementar reservedAmount. El use case
 * reintenta hasta 3 veces; si todos los intentos chocan, propaga esta excepcion
 * que el ExceptionHandler mapea a HTTP 409 CONFLICT.</p>
 */
public class OptimisticLockExhaustedException extends RuntimeException {
    public OptimisticLockExhaustedException() {
        super("Conflicto de concurrencia: la operacion no pudo completarse tras varios intentos. Reintenta la solicitud.");
    }
    public OptimisticLockExhaustedException(String message, Throwable cause) {
        super(message, cause);
    }
}
