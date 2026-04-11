package com.experis.sofia.bankportal.cards.domain;
public class InvalidPinException extends RuntimeException {
    public InvalidPinException(String msg) { super(msg); }
}
