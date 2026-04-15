package com.experis.sofia.bankportal.bizum.application.dto;
import java.math.BigDecimal;
public record SendPaymentRequest(String recipientPhone, BigDecimal amount, String concept, String otp) {}
