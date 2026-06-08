package com.eventhub.event.config;

import com.eventhub.event.service.EventImageStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private final EventImageStorageService imageStorageService;

    public WebMvcConfig(EventImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = imageStorageService.getUploadDir().toUri().toString();
        registry.addResourceHandler("/api/events/uploads/events/**")
                .addResourceLocations(location);
    }
}
