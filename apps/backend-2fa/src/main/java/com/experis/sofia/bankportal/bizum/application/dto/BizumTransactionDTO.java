package com.experis.sofia.bankportal.bizum.application.dto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record BizumTransactionDTO(
    UUID id, String type, BigDecimal amount,
    String phoneMasked, String concept, String status, Instant timestamp) {}
