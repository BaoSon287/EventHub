package com.eventhub.user.dto;

public record AvatarUploadResponse(
        String avatarUrl,
        String fileName
) {
}
