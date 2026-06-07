package com.eventhub.payment.dto;

public record BookingApiResponse<T>(
        boolean success,
        String message,
        T data
) {
}
