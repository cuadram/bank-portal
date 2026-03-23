package com.experis.sofia.bankportal.dashboard.application.dto;
import java.math.BigDecimal;
public record DashboardSummaryDto(String period, BigDecimal totalIncome, BigDecimal totalExpenses, BigDecimal netBalance, int transactionCount) {}
