package com.experis.sofia.bankportal.bizum.application.dto;
import java.time.Instant;
public record ActivateBizumResponse(String phoneMasked, Instant activatedAt, String status) {}
