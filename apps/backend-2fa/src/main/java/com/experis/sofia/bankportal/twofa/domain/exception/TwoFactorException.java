package com.experis.sofia.bankportal.twofa.domain.exception;

/**
 * Excepción raíz del dominio 2FA — BankPortal.
 *
 * <p>Todas las excepciones de negocio de este bounded context extienden esta
 * clase. El GlobalExceptionHandler la mapea a respuestas HTTP apropiadas
 * sin exponer detalles internos al cliente (OWASP A05).</p>
 *
 * @since 1.0.0
 */
public abstract class TwoFactorException extends RuntimeException {

    protected TwoFactorException(String message) {
        super(message);
    }

    protected TwoFactorException(String message, Throwable cause) {
        super(message, cause);
    }
}
