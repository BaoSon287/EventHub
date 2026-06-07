package com.eventhub.payment.config;

import com.eventhub.payment.dto.PaymentFailedEvent;
import com.eventhub.payment.dto.PaymentSucceededEvent;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class RabbitMQConfig {
    @Bean
    TopicExchange eventHubExchange(@Value("${eventhub.rabbitmq.exchange}") String exchangeName) {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    MessageConverter jacksonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setIdClassMapping(Map.of(
                "payment.succeeded.event", PaymentSucceededEvent.class,
                "payment.failed.event", PaymentFailedEvent.class
        ));
        converter.setClassMapper(classMapper);
        return converter;
    }
}
