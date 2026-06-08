package com.eventhub.event.security;

import com.eventhub.common.exception.ForbiddenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class InternalApiKeyValidator {
    private final String internalApiKey;

    public InternalApiKeyValidator(@Value("${eventhub.internal-api-key}") String internalApiKey) {
        this.internalApiKey = internalApiKey;
    }

    public void requireValid(String providedKey) {
        if (providedKey == null || !providedKey.equals(internalApiKey)) {
            throw new ForbiddenException("Invalid internal API key");
        }
    }
}
