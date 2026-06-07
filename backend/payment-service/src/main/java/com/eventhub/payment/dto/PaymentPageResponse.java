package com.eventhub.payment.dto;

import java.util.List;

public record PaymentPageResponse(
        List<PaymentResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
}
