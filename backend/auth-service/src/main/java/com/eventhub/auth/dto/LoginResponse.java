package com.eventhub.auth.dto;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        AuthResponse user
) {}