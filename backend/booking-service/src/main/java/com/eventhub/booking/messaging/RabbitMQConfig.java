package com.eventhub.booking.messaging;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.DefaultClassMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
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
    Queue bookingCreatedQueue(@Value("${eventhub.rabbitmq.queues.booking-created}") String queueName) {
        return new Queue(queueName, true);
    }

    @Bean
    Queue bookingCancelledQueue(@Value("${eventhub.rabbitmq.queues.booking-cancelled}") String queueName) {
        return new Queue(queueName, true);
    }

    @Bean
    Binding bookingCreatedBinding(
            @Qualifier("bookingCreatedQueue") Queue bookingCreatedQueue,
            @Qualifier("eventHubExchange") TopicExchange eventHubExchange,
            @Value("${eventhub.rabbitmq.routing-keys.booking-created}") String routingKey
    ) {
        return BindingBuilder.bind(bookingCreatedQueue).to(eventHubExchange).with(routingKey);
    }

    @Bean
    Binding bookingCancelledBinding(
            @Qualifier("bookingCancelledQueue") Queue bookingCancelledQueue,
            @Qualifier("eventHubExchange") TopicExchange eventHubExchange,
            @Value("${eventhub.rabbitmq.routing-keys.booking-cancelled}") String routingKey
    ) {
        return BindingBuilder.bind(bookingCancelledQueue).to(eventHubExchange).with(routingKey);
    }

    @Bean
    MessageConverter jacksonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        DefaultClassMapper classMapper = new DefaultClassMapper();
        classMapper.setIdClassMapping(Map.of(
                "booking.created.event", BookingCreatedEvent.class,
                "booking.cancelled.event", BookingCancelledEvent.class
        ));
        converter.setClassMapper(classMapper);
        return converter;
    }
}
