package com.eventhub.event.dto;

import com.eventhub.event.entity.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EventSearchCriteria(
        String keyword,
        String category,
        String city,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        LocalDateTime startDate,
        LocalDateTime endDate,
        EventStatus status
) {
}
