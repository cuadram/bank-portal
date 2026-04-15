package com.experis.sofia.bankportal.bizum.domain.exception;
public class BizumLimitExceededException extends RuntimeException {
    public BizumLimitExceededException() { super("Límite operativo Bizum superado — RN-F022-04/05"); }
    public BizumLimitExceededException(String message) { super(message); }
}
