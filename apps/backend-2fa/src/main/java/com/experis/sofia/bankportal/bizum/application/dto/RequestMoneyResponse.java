package com.experis.sofia.bankportal.bizum.application.dto;
import java.time.Instant;
import java.util.UUID;
public record RequestMoneyResponse(UUID requestId, String status, Instant expiresAt) {}
