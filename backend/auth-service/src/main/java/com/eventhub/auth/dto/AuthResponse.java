package com.eventhub.auth.dto;

public record AuthResponse(Long id, String email, String fullName, String role) {
}
