package com.experis.sofia.bankportal.profile.application.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {}
