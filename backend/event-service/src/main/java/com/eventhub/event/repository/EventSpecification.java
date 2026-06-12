package com.eventhub.event.repository;

import com.eventhub.event.dto.EventSearchCriteria;
import com.eventhub.event.entity.Event;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class EventSpecification {
    private EventSpecification() {
    }

    public static Specification<Event> filter(EventSearchCriteria criteria) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.keyword() != null && !criteria.keyword().isBlank()) {
                String keyword = "%" + criteria.keyword().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), keyword),
                        builder.like(builder.lower(root.get("description")), keyword)
                ));
            }
            if (criteria.category() != null && !criteria.category().isBlank()) {
                predicates.add(builder.equal(builder.lower(root.get("category")), criteria.category().toLowerCase()));
            }
            if (criteria.city() != null && !criteria.city().isBlank()) {
                predicates.add(builder.equal(builder.lower(root.get("city")), criteria.city().toLowerCase()));
            }
            if (criteria.minPrice() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("price"), criteria.minPrice()));
            }
            if (criteria.maxPrice() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("price"), criteria.maxPrice()));
            }
            if (criteria.startDate() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("startTime"), criteria.startDate()));
            }
            if (criteria.endDate() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("startTime"), criteria.endDate()));
            }
            if (criteria.status() != null) {
                predicates.add(builder.equal(root.get("status"), criteria.status()));
            }
            if (criteria.endsAfter() != null) {
                predicates.add(builder.greaterThan(root.get("endTime"), criteria.endsAfter()));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
