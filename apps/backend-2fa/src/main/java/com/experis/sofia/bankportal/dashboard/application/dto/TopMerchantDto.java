package com.experis.sofia.bankportal.dashboard.application.dto;

import java.math.BigDecimal;

/** US-1002 — Top comercio/emisor. @author SOFIA Developer Agent */
public record TopMerchantDto(
        String issuer,
        BigDecimal totalAmount,
        int count
) {}
