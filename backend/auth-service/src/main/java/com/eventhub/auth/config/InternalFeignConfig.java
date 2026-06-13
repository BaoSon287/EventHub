package com.eventhub.auth.config;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

public class InternalFeignConfig {
    @Bean
    public RequestInterceptor internalApiKeyRequestInterceptor(@Value("${eventhub.internal-api-key}") String internalApiKey) {
        return template -> template.header("X-Internal-Api-Key", internalApiKey);
    }
}
