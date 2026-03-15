package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * Cuenta bloqueada por exceder el límite de intentos OTP fallidos (ADR-002).
 *
 * <p>HTTP 429 Too Many Requests. Incluye minutos de bloqueo restantes
 * para que el frontend pueda mostrar un countdown al usuario.</p>
 *
 * @since 1.0.0
 */
public class AccountBlockedException extends TwoFactorException {

    private final long blockMinutes;

    public AccountBlockedException(long blockMinutes) {
        super("Cuenta bloqueada temporalmente. Intente en " + blockMinutes + " minutos.");
        this.blockMinutes = blockMinutes;
    }

    /**
     * Duración del bloqueo configurada (no el tiempo restante).
     *
     * @return minutos de bloqueo según configuración ADR-002
     */
    public long getBlockMinutes() {
        return blockMinutes;
    }
}
