package com.experis.sofia.bankportal.savings.domain.exception;

public class ReservedExceedsTargetException extends RuntimeException {
    public ReservedExceedsTargetException() { super("La aportacion excede el importe objetivo"); }
    public ReservedExceedsTargetException(String message) { super(message); }
    public ReservedExceedsTargetException(String message, Throwable cause) { super(message, cause); }
}
