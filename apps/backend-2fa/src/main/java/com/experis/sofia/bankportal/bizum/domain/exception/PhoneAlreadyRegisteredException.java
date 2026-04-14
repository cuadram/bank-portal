package com.experis.sofia.bankportal.bizum.domain.exception;
public class PhoneAlreadyRegisteredException extends RuntimeException {
    public PhoneAlreadyRegisteredException() { super("El teléfono ya está vinculado a otra cuenta — RN-F022-01"); }
    public PhoneAlreadyRegisteredException(String message) { super(message); }
}
