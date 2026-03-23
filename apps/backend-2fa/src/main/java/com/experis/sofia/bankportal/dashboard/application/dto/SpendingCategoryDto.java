package com.experis.sofia.bankportal.dashboard.application.dto;
import java.math.BigDecimal;
public record SpendingCategoryDto(String category, BigDecimal amount, double percentage, int count) {}
