package com.experis.sofia.bankportal.directdebit.exception;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
/** FEAT-017 Sprint 19 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class MandateNotFoundException extends RuntimeException {
    public MandateNotFoundException(String msg) { super(msg); }
}
