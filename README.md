# EventHub - Microservices Event Management Platform

EventHub is a full-stack event management and ticket booking platform inspired by Eventbrite, built with Spring Boot microservices, React, PostgreSQL, RabbitMQ, Docker, and JWT authentication.

## Tech Stack

- Java 17
- Spring Boot 3.x
- Spring Cloud Gateway
- Netflix Eureka Discovery Server
- Spring Security
- JWT-ready auth structure
- Spring Data JPA
- PostgreSQL
- Maven multi-module build
- Docker Compose
- RabbitMQ
- Swagger/OpenAPI
- Lombok
- Validation
- OpenFeign
- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Nginx

## Architecture

Frontend clients call the API Gateway on port `8080`. The gateway routes requests to services discovered through Eureka on port `8761`. Each domain service owns its own PostgreSQL database. Booking, payment, and notification workflows use RabbitMQ for asynchronous events.

```text
Frontend
  -> API Gateway
  -> Auth/User/Event/Booking/Payment/Notification Services
  -> PostgreSQL per service
  -> RabbitMQ for async events
  -> Notification Service consumes events
```

## Services

| Service | Port | Database | Purpose |
| --- | ---: | --- | --- |
| discovery-server | 8761 | - | Eureka service registry |
| api-gateway | 8080 | - | Single API entry point |
| auth-service | 8081 | auth_db | Register, login, JWT preparation |
| user-service | 8082 | user_db | User profile management |
| event-service | 8083 | event_db | Event CRUD |
| booking-service | 8084 | booking_db | Booking creation and lookup |
| notification-service | 8085 | notification_db | Notification endpoints, console email logging |
| payment-service | 8086 | payment_db | Mock payment transaction management |
| frontend dev | 5173 | - | React/Vite development server |
| frontend docker | 3000 | - | Nginx-served React build |
| rabbitmq | 5672 | - | Asynchronous event broker |
| rabbitmq-management | 15672 | - | RabbitMQ management UI |

## API Gateway Routes

- `/api/auth/**` -> `auth-service`
- `/api/users/**` -> `user-service`
- `/api/events/**` -> `event-service`
- `/api/bookings/**` -> `booking-service`
- `/api/notifications/**` -> `notification-service`
- `/api/payments/**` -> `payment-service`

## Run Locally

Start PostgreSQL first, then run the services from separate terminals:

```bash
mvn clean package
mvn -pl backend/discovery-server spring-boot:run
mvn -pl backend/api-gateway spring-boot:run
mvn -pl backend/auth-service spring-boot:run
mvn -pl backend/user-service spring-boot:run
mvn -pl backend/event-service spring-boot:run
mvn -pl backend/booking-service spring-boot:run
mvn -pl backend/notification-service spring-boot:run
mvn -pl backend/payment-service spring-boot:run
cd frontend && npm install && npm run dev
```

Default local database credentials are `eventhub/eventhub`.

## Run With Docker Compose

Build jars first, then start the stack:

```bash
mvn clean package -DskipTests
docker compose up --build
```

PostgreSQL initializes these databases automatically from `docker/postgres/init.sql`: `auth_db`, `user_db`, `event_db`, `booking_db`, `notification_db`, and `payment_db`.

Frontend is available at http://localhost:3000 when running with Docker Compose.

For frontend-only development:

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server is available at http://localhost:5173.

RabbitMQ Management UI is available at http://localhost:15672 with username `eventhub` and password `eventhub`.

## Swagger URLs

- Auth: http://localhost:8081/swagger-ui/index.html
- User: http://localhost:8082/swagger-ui/index.html
- Event: http://localhost:8083/swagger-ui/index.html
- Booking: http://localhost:8084/swagger-ui/index.html
- Notification: http://localhost:8085/swagger-ui/index.html
- Payment: http://localhost:8086/swagger-ui/index.html

## Demo Accounts

Create demo accounts through the frontend Register page or the Auth API:

- `organizer@example.com` / `Password123` with role `ORGANIZER`
- `user@example.com` / `Password123` with role `USER`
- `admin@example.com` / `Password123` with role `ADMIN`

The backend seeds 8 published demo events automatically in Event Service without duplicating them on restart.

## Authentication Flow

1. User registers through the API Gateway.
2. Auth Service stores the account in `auth_db`.
3. Auth Service calls User Service to create the matching profile in `user_db`.
4. User logs in with email and password.
5. Auth Service returns a JWT access token.
6. Frontend sends the JWT in the `Authorization` header.

Register:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "fullName": "Nguyen Van A",
    "phone": "0123456789",
    "role": "USER"
  }'
```

Login:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

Current user:

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Core Features

- User registration and login
- JWT authentication
- Role-based access for `USER`, `ORGANIZER`, and `ADMIN`
- Event creation and management
- Event search and filtering
- Ticket booking and availability updates
- Mock payment flow
- RabbitMQ notification events
- Notification list and mark-as-read
- Dockerized local environment

## Demo Flow

1. Organizer registers and logs in.
2. Organizer creates a published event.
3. User registers and logs in.
4. User explores events and books tickets.
5. User completes mock payment.
6. Booking status changes to paid.
7. Payment notification is created through RabbitMQ.
8. User opens Notifications and marks messages as read.

## Project Documentation

- Smoke test checklist: `docs/testing/smoke-test.md`
- Security test checklist: `docs/testing/security-test.md`
- Run guide: `docs/run-guide.md`
- Smoke test script: `scripts/smoke-test.ps1`
- Security smoke test script: `scripts/security-smoke-test.ps1`
- Postman guide: `docs/postman/README.md`
- Postman collection: `docs/postman/EventHub.postman_collection.json`
- CV project description: `docs/cv-description.md`
- CI workflow: `.github/workflows/ci.yml`

## Screenshots

Screenshots can be added under `docs/screenshots` after capturing the local demo flow:

- Event discovery page
- Event detail and booking page
- Mock payment page
- My bookings page
- Notifications page
- Organizer dashboard

## Health Endpoints

- http://localhost:8081/api/auth/health
- http://localhost:8082/api/users/health
- http://localhost:8083/api/events/health
- http://localhost:8084/api/bookings/health
- http://localhost:8085/api/notifications/health
- http://localhost:8086/api/payments/health

## Asynchronous Communication With RabbitMQ

Booking Service does not call Notification Service directly. After a booking is created or cancelled, Booking Service publishes an integration event to RabbitMQ:

- Exchange: `eventhub.exchange`
- Routing key: `booking.created`
- Routing key: `booking.cancelled`
- Queue: `notification.booking.created.queue`
- Queue: `notification.booking.cancelled.queue`

Notification Service consumes those messages, stores a notification in `notification_db`, and logs a mock email to the console. This reduces coupling between services: if Notification Service is temporarily down, Booking Service can still complete the booking flow and RabbitMQ can hold queued messages.

Payment Service also publishes payment events through RabbitMQ:

- Routing key: `payment.succeeded`
- Routing key: `payment.failed`
- Queue: `notification.payment.succeeded.queue`
- Queue: `notification.payment.failed.queue`

Notification Service consumes these events and creates payment success or failure notifications.

## Event Service

Public users can list and view published events. `ORGANIZER` users can create and manage their own events. `ADMIN` users can manage all events.

Endpoints:

- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`
- `GET /api/events/organizer/{organizerId}`
- `PATCH /api/events/{id}/publish`
- `PATCH /api/events/{id}/cancel`

List events:

```bash
curl -X GET "http://localhost:8080/api/events?page=0&size=10"
```

Search events:

```bash
curl -X GET "http://localhost:8080/api/events?keyword=tech&city=Ha%20Noi&sortBy=startTime&sortDir=asc"
```

Create event:

```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Tech Conference 2026",
    "description": "A conference for developers",
    "category": "Technology",
    "location": "National Convention Center",
    "address": "57 Pham Hung",
    "city": "Ha Noi",
    "startTime": "2026-08-10T09:00:00",
    "endTime": "2026-08-10T17:00:00",
    "totalTickets": 200,
    "price": 199000,
    "imageUrl": "https://example.com/event.jpg",
    "status": "PUBLISHED"
  }'
```

Publish event:

```bash
curl -X PATCH http://localhost:8080/api/events/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Cancel event:

```bash
curl -X PATCH http://localhost:8080/api/events/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Booking Service

Authenticated users can create bookings, list their own bookings, cancel bookings, and mark mock payment as paid. `ADMIN` users can view any user booking. `ORGANIZER` users can view bookings for events they own.

Endpoints:

- `GET /api/bookings/health`
- `POST /api/bookings`
- `GET /api/bookings/{id}`
- `GET /api/bookings/me`
- `GET /api/bookings/user/{userId}`
- `GET /api/bookings/event/{eventId}`
- `PATCH /api/bookings/{id}/cancel`
- `PATCH /api/bookings/{id}/pay/mock`

Booking flow:

1. User sends a booking request with `eventId` and `quantity`.
2. Booking Service reads `userId`, `email`, and `role` from JWT.
3. Booking Service calls Event Service to load internal event data.
4. Event Service checks published status and available tickets.
5. Booking Service calls Event Service to reserve tickets.
6. Event Service decreases `availableTickets` inside a transaction with a pessimistic database lock.
7. Booking Service creates the booking and returns a `bookingCode`.
8. When booking is cancelled, Booking Service calls Event Service to release tickets.

Create booking:

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": 1,
    "quantity": 2
  }'
```

View my bookings:

```bash
curl -X GET "http://localhost:8080/api/bookings/me?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Cancel booking:

```bash
curl -X PATCH http://localhost:8080/api/bookings/1/cancel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Mock payment:

```bash
curl -X PATCH http://localhost:8080/api/bookings/1/pay/mock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Check event ticket count:

```bash
curl -X GET http://localhost:8080/api/events/1
```

## Notification Service

Notification Service consumes booking events from RabbitMQ and stores user notifications. Email delivery is currently mocked by logging to the console.

Endpoints:

- `GET /api/notifications/health`
- `GET /api/notifications/user/{userId}`
- `GET /api/notifications/{id}`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/email`

Health:

```bash
curl -X GET http://localhost:8080/api/notifications/health
```

Send mock email:

```bash
curl -X POST http://localhost:8080/api/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test EventHub Notification",
    "content": "Hello from EventHub"
  }'
```

View notifications:

```bash
curl -X GET "http://localhost:8080/api/notifications/user/1?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Mark as read:

```bash
curl -X PATCH http://localhost:8080/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Payment Flow

Payment Service manages mock payment transactions separately from Booking Service.

1. User creates a booking.
2. Booking starts with `paymentStatus = UNPAID`.
3. User creates a payment transaction for that booking.
4. Payment Service stores a `PENDING` transaction in `payment_db`.
5. User calls mock success or mock fail.
6. Payment Service updates the transaction to `SUCCESS` or `FAILED`.
7. Payment Service calls Booking Service internal API to update booking `paymentStatus`.
8. Payment Service publishes `payment.succeeded` or `payment.failed` through RabbitMQ.
9. Notification Service consumes the event and creates a notification.

Endpoints:

- `GET /api/payments/health`
- `POST /api/payments`
- `GET /api/payments/{id}`
- `GET /api/payments/code/{paymentCode}`
- `GET /api/payments/me`
- `GET /api/payments/booking/{bookingId}`
- `PATCH /api/payments/{id}/mock-success`
- `PATCH /api/payments/{id}/mock-fail`
- `PATCH /api/payments/{id}/cancel`

Health:

```bash
curl -X GET http://localhost:8080/api/payments/health
```

Create payment:

```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingId": 1,
    "method": "MOCK"
  }'
```

View my payments:

```bash
curl -X GET "http://localhost:8080/api/payments/me?page=0&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Mock payment success:

```bash
curl -X PATCH http://localhost:8080/api/payments/1/mock-success \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Mock payment fail:

```bash
curl -X PATCH http://localhost:8080/api/payments/1/mock-fail \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "failureReason": "Insufficient balance"
  }'
```

## Simple Saga Pattern

Payment Service coordinates the mock payment workflow while Booking Service and Payment Service keep separate databases. Payment Service calls Booking Service through an internal API and publishes payment events to RabbitMQ. This is a simple Saga-style workflow for local development, not a complete distributed transaction implementation.

## Security Design

- JWT authentication is issued by Auth Service and includes `userId`, `email`, and `role` claims.
- Backend services parse JWT claims for role-based access control across `USER`, `ORGANIZER`, and `ADMIN`.
- API Gateway forwards the `Authorization` header and restricts CORS to `http://localhost:5173` and `http://localhost:3000` for local development.
- Internal service endpoints such as `/api/events/internal/**`, `/api/bookings/internal/**`, and user profile creation require `X-Internal-Api-Key`.
- Passwords are hashed with BCrypt and are never returned in API responses.
- Register requires a password with at least 8 characters, at least one letter, and at least one number.
- Request DTOs use Bean Validation and global exception handling avoids returning stack traces to clients.
- API Gateway adds basic security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`.
- Swagger is enabled for local development. Production should disable or protect Swagger endpoints.
- Dev secrets are shown in Docker Compose for local use only. Production must use environment variables or a secret manager.

Known security limitations:

- JWT is stored in localStorage for demo simplicity.
- Refresh token flow is not implemented yet.
- Internal API key is simple service-to-service protection, not full mTLS or OAuth2 client credentials.
- Rate limiting is not Redis-backed yet and should be added before production use.
- Swagger should be disabled or protected in production.

## Known Limitations

- Event organizer display name currently uses the JWT email claim as `organizerName`; a later phase can resolve profile names from User Service.
- Payment is mock-only; there is no real payment gateway yet.
- Payment Service does not integrate VNPay, Stripe, or any real provider yet.
- Booking cancellation refunds are represented by `PaymentStatus.REFUNDED` only.
- Event Service internal ticket endpoints are public inside the dev stack; production needs service-to-service authentication.
- Booking Service internal payment endpoints are public inside the dev stack; production needs service-to-service authentication.
- Booking and payment workflows do not have a production-grade distributed transaction or Saga implementation yet.
- The payment workflow has no Outbox Pattern or full compensation mechanism yet.
- Email delivery is mock/log-only and does not send real email yet.
- RabbitMQ retry and dead-letter queues are not configured yet.
- Integration event DTOs are duplicated between Booking Service and Notification Service; they can move to `common-lib` later.
- `POST /api/notifications/email` is public for local development.

## Roadmap

- Implement production JWT signing and gateway authentication filter.
- Add refresh tokens and role-based authorization.
- Add event search, filtering, categories, and organizer workflows.
- Add real payment service and Saga-based booking consistency.
- Add notification providers for email and SMS.
- Add frontend application and Figma-guided UI.
- Add integration tests and CI/CD pipeline.
