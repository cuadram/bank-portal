package com.experis.sofia.bankportal.dashboard.application.dto;
import java.math.BigDecimal;
public record TopMerchantDto(String issuer, BigDecimal totalAmount, int count) {}
