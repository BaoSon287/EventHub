package com.eventhub.auth.dto;

public record CurrentUserResponse(Long id, String email, String fullName, String phone, String role) {
}
