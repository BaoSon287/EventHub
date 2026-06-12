package com.eventhub.event.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = AllowedCreateEventStatusValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface AllowedCreateEventStatus {
    String message() default "Create event status must be DRAFT or PUBLISHED";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
