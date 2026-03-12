package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * Contraseña incorrecta al intentar desactivar 2FA.
 *
 * <p>HTTP 401 Unauthorized.</p>
 *
 * @since 1.0.0
 */
public class InvalidPasswordException extends TwoFactorException {
    public InvalidPasswordException() {
        super("Contraseña incorrecta.");
    }
}
