package com.experis.sofia.bankportal.bizum.domain.exception;
public class BizumRequestNotFoundException extends RuntimeException {
    public BizumRequestNotFoundException() { super("Solicitud Bizum no encontrada"); }
    public BizumRequestNotFoundException(String message) { super(message); }
}
