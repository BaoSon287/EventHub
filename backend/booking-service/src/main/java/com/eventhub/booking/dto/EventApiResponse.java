package com.eventhub.booking.dto;

public record EventApiResponse<T>(
        boolean success,
        String message,
        T data
) {
}
