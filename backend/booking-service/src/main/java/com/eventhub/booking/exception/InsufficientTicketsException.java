package com.eventhub.booking.exception;

public class InsufficientTicketsException extends BookingException {
    public InsufficientTicketsException(String message) {
        super(message);
    }
}