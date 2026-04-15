package com.experis.sofia.bankportal.bizum.application.dto;
import java.util.UUID;
public record ActivateBizumRequest(String phone, UUID accountId) {}
