package com.eventhub.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateUserProfileRequest(
        @NotBlank String fullName,
        String phone,
        String avatarUrl,
        String bio
) {
}
