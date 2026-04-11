package com.experis.sofia.bankportal.profile.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProfileResponse(
        UUID userId,
        String fullName,
        String email,
        String phone,
        AddressDto address,
        boolean twoFactorEnabled,
        LocalDateTime memberSince
) {}
