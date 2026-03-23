package com.experis.sofia.bankportal.dashboard.application.dto;
import java.math.BigDecimal;
public record MonthlyEvolutionDto(int year, int month, BigDecimal totalIncome, BigDecimal totalExpenses, BigDecimal netBalance) {}
