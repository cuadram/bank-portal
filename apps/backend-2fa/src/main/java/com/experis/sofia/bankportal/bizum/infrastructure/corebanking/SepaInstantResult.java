package com.experis.sofia.bankportal.bizum.infrastructure.corebanking;
import java.time.Instant;
public record SepaInstantResult(String reference, String status, Instant completedAt) {}
