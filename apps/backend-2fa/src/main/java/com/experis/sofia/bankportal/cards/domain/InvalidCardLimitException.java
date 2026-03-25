package com.experis.sofia.bankportal.cards.domain;
public class InvalidCardLimitException extends RuntimeException {
    public InvalidCardLimitException(String msg) { super(msg); }
}
