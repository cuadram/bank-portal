package com.experis.sofia.bankportal.profile.application.dto;

import java.time.LocalDateTime;

public record SessionInfo(String jti, String userAgent, String ipAddress, LocalDateTime createdAt, boolean current) {}
