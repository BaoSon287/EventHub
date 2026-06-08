package com.eventhub.event.dto;

public record EventImageUploadResponse(
        String imageUrl,
        String fileName
) {
}
