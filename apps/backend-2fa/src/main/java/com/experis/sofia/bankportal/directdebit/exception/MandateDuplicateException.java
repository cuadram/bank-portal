package com.experis.sofia.bankportal.directdebit.exception;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
/** FEAT-017 Sprint 19 */
@ResponseStatus(HttpStatus.CONFLICT)
public class MandateDuplicateException extends RuntimeException {
    public MandateDuplicateException(String msg) { super(msg); }
}
