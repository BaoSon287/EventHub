package com.eventhub.notification.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MockEmailRequest(
        @Email @NotBlank String to,
        @NotBlank String subject,
        @NotBlank String content
) {
}
