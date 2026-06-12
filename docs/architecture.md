# EventHub Architecture

EventHub uses a microservices architecture with one service per major business capability.

## Request Flow

1. The frontend sends API requests to `api-gateway` on port `8080`.
2. The gateway matches the request path and forwards it to the correct backend service.
3. Services are discovered through Eureka, so the gateway uses logical service names such as `auth-service`.
4. Each service owns its data and connects to its own PostgreSQL database.

## Booking Flow

1. The frontend sends booking requests to `api-gateway`.
2. The gateway forwards `/api/bookings/**` to `booking-service`.
3. Booking Service reads the current user from JWT.
4. Booking Service calls Event Service internal APIs through OpenFeign with `X-Internal-Api-Key`.
5. Event Service verifies the event is `PUBLISHED`, has not started or ended, is not `CANCELLED`/`COMPLETED`, and has enough tickets.
6. Event Service owns event ticket counts and reserves or releases tickets.
7. Booking Service stores booking records in `booking_db` only after reservation succeeds.

Event Service prevents overselling by reserving tickets inside a transaction with a pessimistic database lock. Booking Service owns the booking order state; Event Service owns the ticket inventory state.

## Event Lifecycle

Event Service uses these lifecycle statuses:

```text
DRAFT
PUBLISHED
CANCELLED
COMPLETED
```

Public event discovery returns only upcoming `PUBLISHED` events. Organizers can view their own events across all statuses. A scheduler periodically marks expired `PUBLISHED` events as `COMPLETED`, and reserve logic also treats expired events as completed before checking ticket availability.

## Notification Flow

Booking Service publishes integration events instead of calling Notification Service directly:

```text
Booking Service
  -> publish booking.created / booking.cancelled
  -> RabbitMQ exchange: eventhub.exchange
  -> notification.booking.created.queue / notification.booking.cancelled.queue
  -> Notification Service
  -> notification_db
```

Notification Service consumes the events, stores notification records, and logs mock email output. This asynchronous flow keeps booking operations available even when notification processing is temporarily unavailable.

## Payment Flow

Payment Service owns payment transaction records and coordinates a simple payment Saga:

```text
Frontend
  -> API Gateway
  -> Payment Service
  -> Booking Service internal API
  -> RabbitMQ exchange: eventhub.exchange
  -> notification.payment.succeeded.queue / notification.payment.failed.queue
  -> Notification Service
```

Payment Service stores transactions in `payment_db`. Booking Service remains the owner of booking state and exposes internal dev endpoints for payment status updates. Payment Service publishes payment events after mock success or failure so Notification Service can create user notifications.

## Eureka

`discovery-server` runs Eureka on port `8761`. Backend services register themselves with Eureka at startup. The gateway then resolves service names through Eureka instead of hard-coded host and port targets.

## Services

| Service | Port | Role |
| --- | ---: | --- |
| discovery-server | 8761 | Service registry |
| api-gateway | 8080 | API entry point, CORS, route dispatch |
| auth-service | 8081 | Register, login, JWT-ready structure |
| user-service | 8082 | User profile data |
| event-service | 8083 | Event lifecycle and ticket counts |
| booking-service | 8084 | Booking creation and user booking lookup |
| notification-service | 8085 | Notification endpoints and email logging |
| payment-service | 8086 | Mock payment transactions and payment events |

## Shared Code

`common-lib` contains the shared API response format, resource-not-found exception, and validation exception handling.

## Known Architecture Limitations

- Event and Booking internal endpoints require `X-Internal-Api-Key`; production should still add stronger service identity such as mTLS or OAuth2 client credentials.
- Booking and ticket reservation are not wrapped in a distributed transaction yet.
- Payment workflow is a simple Saga and does not have a full Outbox Pattern or compensation workflow yet.
- Notification is still mock/log level for booking confirmations.
- RabbitMQ retry and dead-letter queues are not configured yet.
- Integration event DTOs are currently duplicated between services.
