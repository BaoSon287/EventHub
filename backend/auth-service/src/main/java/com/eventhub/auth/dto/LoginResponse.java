package com.eventhub.auth.dto;

import com.eventhub.auth.entity.UserRole;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        AuthResponse user
) {}