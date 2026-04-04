package com.experis.sofia.bankportal.directdebit.exception;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;
/** FEAT-017 Sprint 19 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class InvalidIbanException extends RuntimeException {
    public InvalidIbanException(String msg) { super(msg); }
}
