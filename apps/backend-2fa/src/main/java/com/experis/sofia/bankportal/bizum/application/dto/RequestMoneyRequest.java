package com.experis.sofia.bankportal.bizum.application.dto;
import java.math.BigDecimal;
public record RequestMoneyRequest(String recipientPhone, BigDecimal amount, String concept) {}
