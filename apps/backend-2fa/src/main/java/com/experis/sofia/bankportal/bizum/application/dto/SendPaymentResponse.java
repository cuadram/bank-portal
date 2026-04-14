package com.experis.sofia.bankportal.bizum.application.dto;
import java.time.Instant;
import java.math.BigDecimal;
public record SendPaymentResponse(String ref, String status, Instant completedAt, BigDecimal amountSent) {}
