package com.eventhub.event.validation;

import com.eventhub.event.entity.EventStatus;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AllowedCreateEventStatusValidator implements ConstraintValidator<AllowedCreateEventStatus, EventStatus> {
    @Override
    public boolean isValid(EventStatus status, ConstraintValidatorContext context) {
        return status == null || status == EventStatus.DRAFT || status == EventStatus.PUBLISHED;
    }
}
