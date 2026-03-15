package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * El usuario ya tiene 2FA activado — no puede volver a enrolarse sin desactivarlo antes.
 *
 * <p>HTTP 409 Conflict.</p>
 *
 * @since 1.0.0
 */
public class TwoFactorAlreadyEnabledException extends TwoFactorException {
    public TwoFactorAlreadyEnabledException() {
        super("El usuario ya tiene 2FA activado.");
    }
}
