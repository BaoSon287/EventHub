package com.eventhub.auth.dto;

public record CreateUserProfileRequest(Long authUserId, String email, String fullName, String phone) {
}
