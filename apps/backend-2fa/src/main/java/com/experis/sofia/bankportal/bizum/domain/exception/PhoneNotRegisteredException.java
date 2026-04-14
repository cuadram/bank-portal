package com.experis.sofia.bankportal.bizum.domain.exception;
public class PhoneNotRegisteredException extends RuntimeException {
    public PhoneNotRegisteredException() { super("El teléfono no está registrado en Bizum"); }
    public PhoneNotRegisteredException(String message) { super(message); }
}
