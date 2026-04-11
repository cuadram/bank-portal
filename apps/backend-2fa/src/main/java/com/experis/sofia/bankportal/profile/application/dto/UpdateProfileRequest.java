package com.experis.sofia.bankportal.profile.application.dto;

/**
 * DTO de actualización de perfil.
 * RN-F019-01: el email no puede modificarse mediante este endpoint — campo email
 * se acepta en la deserialización pero se rechaza con 400 si está presente.
 */
public record UpdateProfileRequest(String phone, AddressDto address, String email) {}
