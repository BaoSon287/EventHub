package com.eventhub.common.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = "com.eventhub.common.exception")
public class CommonExceptionConfig {
}
