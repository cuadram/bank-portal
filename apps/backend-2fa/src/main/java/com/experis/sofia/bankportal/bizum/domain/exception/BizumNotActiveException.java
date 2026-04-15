package com.experis.sofia.bankportal.bizum.domain.exception;
public class BizumNotActiveException extends RuntimeException {
    public BizumNotActiveException() { super("Bizum no está activo para este usuario"); }
    public BizumNotActiveException(String message) { super(message); }
}
