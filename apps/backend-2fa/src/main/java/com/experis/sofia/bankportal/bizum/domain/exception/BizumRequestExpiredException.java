package com.experis.sofia.bankportal.bizum.domain.exception;
public class BizumRequestExpiredException extends RuntimeException {
    public BizumRequestExpiredException() { super("La solicitud Bizum ha expirado — RN-F022-07"); }
    public BizumRequestExpiredException(String message) { super(message); }
}
