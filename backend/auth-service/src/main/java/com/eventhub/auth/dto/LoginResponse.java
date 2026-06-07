package com.eventhub.auth.dto;

public record LoginResponse(String accessToken, String tokenType, AuthResponse user) {
    public LoginResponse(String accessToken, AuthResponse user) {
        this(accessToken, "Bearer", user);
    }
}
