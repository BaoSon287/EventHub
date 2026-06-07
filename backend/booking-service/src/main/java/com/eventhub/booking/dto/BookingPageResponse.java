package com.eventhub.booking.dto;

import java.util.List;

public record BookingPageResponse(
        List<BookingResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
