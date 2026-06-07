package com.eventhub.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UserProfileRequest(
        Long userId,
        @NotBlank String fullName,
        @Email @NotBlank String email,
        String phone,
        String avatarUrl
) {
}
