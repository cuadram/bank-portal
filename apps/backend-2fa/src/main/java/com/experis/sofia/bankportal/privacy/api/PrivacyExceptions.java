package com.experis.sofia.bankportal.privacy.api;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/** LA-TEST-003: toda excepción de dominio DEBE tener @ResponseStatus. */
public final class PrivacyExceptions {

    private PrivacyExceptions() {}

    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public static class ConsentNotToggleableException extends RuntimeException {
        public ConsentNotToggleableException() {
            super("CONSENT_NOT_TOGGLEABLE");
        }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class ExportAlreadyActiveException extends RuntimeException {
        public ExportAlreadyActiveException() {
            super("EXPORT_ALREADY_ACTIVE");
        }
    }

    @ResponseStatus(HttpStatus.CONFLICT)
    public static class DeletionAlreadyRequestedException extends RuntimeException {
        public DeletionAlreadyRequestedException() {
            super("DELETION_ALREADY_REQUESTED");
        }
    }

    @ResponseStatus(HttpStatus.GONE)
    public static class DeletionTokenExpiredException extends RuntimeException {
        public DeletionTokenExpiredException() {
            super("DELETION_TOKEN_EXPIRED");
        }
    }

    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public static class InvalidOtpException extends RuntimeException {
        public InvalidOtpException() {
            super("INVALID_OTP");
        }
    }
}
