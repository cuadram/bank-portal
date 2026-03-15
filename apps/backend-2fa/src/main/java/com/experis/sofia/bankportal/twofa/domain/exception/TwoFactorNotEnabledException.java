package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * Operación requiere 2FA activo, pero el usuario no lo tiene configurado.
 *
 * <p>HTTP 422 Unprocessable Entity.</p>
 *
 * @since 1.0.0
 */
public class TwoFactorNotEnabledException extends TwoFactorException {
    public TwoFactorNotEnabledException() {
        super("El usuario no tiene 2FA activado.");
    }
}
