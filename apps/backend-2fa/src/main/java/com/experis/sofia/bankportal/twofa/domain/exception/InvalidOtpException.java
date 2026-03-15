package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * OTP o código de recuperación inválido.
 *
 * <p>HTTP 401 Unauthorized. El mensaje al cliente es deliberadamente genérico
 * para no revelar si el código expiró o fue incorrecto (OWASP A07).</p>
 *
 * @since 1.0.0
 */
public class InvalidOtpException extends TwoFactorException {
    public InvalidOtpException() {
        super("Código de verificación inválido o expirado.");
    }
}
