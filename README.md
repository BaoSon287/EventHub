# EventHub

EventHub is a full-stack event management and ticket booking platform built with a Spring Boot microservices backend and a React frontend. The project models a practical event marketplace: organizers publish events, users book tickets, payments are simulated through a mock payment service, and notifications are produced asynchronously through RabbitMQ.

The repository is organized as a Maven multi-module backend plus a Vite React frontend. Each backend service owns its own PostgreSQL database and communicates through the API Gateway, OpenFeign internal calls, and RabbitMQ integration events.

## Highlights

- Microservices architecture with Spring Boot 3 and Java 17.
- API Gateway entry point for frontend and external API traffic.
- Eureka Discovery Server for service registration and visibility.
- PostgreSQL database per service.
- JWT authentication with role-based access for `USER`, `ORGANIZER`, and `ADMIN`.
- Event discovery, event management, booking, mock payment, notifications, and dashboards.
- RabbitMQ-based asynchronous notifications for booking and payment events.
- React 19 frontend with Vite, TypeScript, Tailwind CSS, Recharts, and Axios.
- Docker Compose setup for local development.
- Swagger/OpenAPI UI for backend service exploration.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 17, Spring Boot 3.3, Spring Web, Spring Security, Spring Data JPA, Bean Validation |
| Microservices | Spring Cloud Gateway, Netflix Eureka, OpenFeign |
| Data | PostgreSQL, Hibernate JPA |
| Messaging | RabbitMQ |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios, Recharts |
| Tooling | Maven multi-module build, Docker Compose, Swagger/OpenAPI |
| Storage | Local upload directory in development, optional Cloudinary configuration |

## Architecture

```text
React Frontend
    |
    v
API Gateway :8080
    |
    +--> Auth Service :8081 --------> auth_db
    +--> User Service :8082 --------> user_db
    +--> Event Service :8083 -------> event_db
    +--> Booking Service :8084 -----> booking_db
    +--> Payment Service :8086 -----> payment_db
    +--> Notification Service :8085 -> notification_db

Discovery Server :8761
RabbitMQ :5672 / Management UI :15672
```

Core communication patterns:

- Frontend calls backend APIs through `api-gateway`.
- Services register with `discovery-server`.
- Booking Service calls Event Service to validate events and reserve or release tickets.
- Payment Service calls Booking Service internal APIs to validate and update payment status.
- Booking and Payment services publish RabbitMQ events.
- Notification Service consumes RabbitMQ events and creates user notifications.

## Repository Structure

```text
backend/
  api-gateway/
  auth-service/
  booking-service/
  common-lib/
  discovery-server/
  event-service/
  notification-service/
  payment-service/
  user-service/
frontend/
docker/
docs/
scripts/
uploads/
```

## Services

| Service | Port | Database | Responsibility |
| --- | ---: | --- | --- |
| `discovery-server` | 8761 | - | Eureka service registry |
| `api-gateway` | 8080 | - | API entry point, routing, CORS |
| `auth-service` | 8081 | `auth_db` | Registration, login, JWT issuing |
| `user-service` | 8082 | `user_db` | User profiles and avatars |
| `event-service` | 8083 | `event_db` | Event CRUD, event images, ticket inventory |
| `booking-service` | 8084 | `booking_db` | Booking creation, cancellation, lookup |
| `notification-service` | 8085 | `notification_db` | Notification APIs and mock email logging |
| `payment-service` | 8086 | `payment_db` | Mock payment transactions |
| `frontend` | 5173 / 3000 | - | Vite dev server / Docker Nginx build |

## Requirements

- Java 17
- Maven 3.9+
- Node.js 22+
- Docker Desktop

## Quick Start With Docker Compose

From the repository root:

```powershell
mvn clean package -DskipTests
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- RabbitMQ Management: http://localhost:15672

RabbitMQ local credentials:

```text
eventhub / eventhub
```

PostgreSQL is initialized with these service databases:

```text
auth_db
user_db
event_db
booking_db
notification_db
payment_db
```

## Local Development

Build all backend modules:

```powershell
mvn clean package
```

Run backend services from separate terminals:

```powershell
mvn -pl backend/discovery-server spring-boot:run
mvn -pl backend/api-gateway spring-boot:run
mvn -pl backend/auth-service spring-boot:run
mvn -pl backend/user-service spring-boot:run
mvn -pl backend/event-service spring-boot:run
mvn -pl backend/booking-service spring-boot:run
mvn -pl backend/notification-service spring-boot:run
mvn -pl backend/payment-service spring-boot:run
```

Run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend dev server:

```text
http://localhost:5173
```

If the API Gateway is not running at `http://localhost:8080`, set:

```powershell
$env:VITE_API_BASE_URL="http://localhost:8080"
```

## Environment Variables

Use `.env.example` as the starting point for local and deployment configuration.

Important variables:

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | JWT signing secret shared by services that validate tokens |
| `JWT_EXPIRATION_MS` | JWT access token lifetime |
| `INTERNAL_API_KEY` | Simple shared key for internal service endpoints |
| `SPRING_DATASOURCE_URL` | Service-specific PostgreSQL connection string |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL username |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `AUTH_SERVICE_URL` | API Gateway upstream URL for Auth Service |
| `USER_SERVICE_URL` | API Gateway upstream URL for User Service |
| `EVENT_SERVICE_URL` | API Gateway upstream URL for Event Service |
| `BOOKING_SERVICE_URL` | API Gateway upstream URL for Booking Service |
| `NOTIFICATION_SERVICE_URL` | API Gateway upstream URL for Notification Service |
| `PAYMENT_SERVICE_URL` | API Gateway upstream URL for Payment Service |
| `VITE_API_BASE_URL` | Frontend API Gateway base URL |
| `CLOUDINARY_URL` | Optional production image upload provider |

Do not use the development secrets from `docker-compose.yml` in production.

## Demo Accounts

Auth Service seeds demo users automatically:

| Email | Password | Role |
| --- | --- | --- |
| `user@example.com` | `Password123` | `USER` |
| `organizer@example.com` | `Password123` | `ORGANIZER` |
| `admin@example.com` | `Password123` | `ADMIN` |

Event Service also seeds demo events for local usage.

## API Overview

All API responses follow a common envelope:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Main API groups:

| Domain | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET /api/users/{id}`, `PUT /api/users/{id}`, avatar upload |
| Events | `GET /api/events`, `POST /api/events`, `PUT /api/events/{id}`, publish, cancel |
| Bookings | `POST /api/bookings`, `GET /api/bookings/me`, cancel, mock pay |
| Payments | `POST /api/payments`, lookup, mock success, mock fail, cancel |
| Notifications | list user notifications, get detail, mark as read |

Detailed API notes are available in [docs/api-design.md](docs/api-design.md).

## Common API Examples

Login:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123"
  }'
```

List events:

```bash
curl "http://localhost:8080/api/events?page=0&size=10&sortBy=startTime&sortDir=asc"
```

Create event as organizer or admin:

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

Book tickets:

```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": 1,
    "quantity": 2
  }'
```

Create a mock payment:

```bash
curl -X POST http://localhost:8080/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "bookingId": 1,
    "method": "MOCK"
  }'
```

Mark payment as successful:

```bash
curl -X PATCH http://localhost:8080/api/payments/1/mock-success \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Swagger URLs

- Auth Service: http://localhost:8081/swagger-ui/index.html
- User Service: http://localhost:8082/swagger-ui/index.html
- Event Service: http://localhost:8083/swagger-ui/index.html
- Booking Service: http://localhost:8084/swagger-ui/index.html
- Notification Service: http://localhost:8085/swagger-ui/index.html
- Payment Service: http://localhost:8086/swagger-ui/index.html

## Health Checks

- http://localhost:8081/api/auth/health
- http://localhost:8082/api/users/health
- http://localhost:8083/api/events/health
- http://localhost:8084/api/bookings/health
- http://localhost:8085/api/notifications/health
- http://localhost:8086/api/payments/health

Smoke test script:

```powershell
.\scripts\smoke-test.ps1
```

Security smoke test script:

```powershell
.\scripts\security-smoke-test.ps1
```

## Testing And Build

Backend:

```powershell
mvn test
mvn package -DskipTests
```

Frontend:

```powershell
cd frontend
npm ci
npm run lint
npm run build
```

## Core Workflows

Authentication:

1. User registers through Auth Service.
2. Auth Service creates the account in `auth_db`.
3. Auth Service calls User Service to create the profile in `user_db`.
4. Login returns a JWT containing `userId`, `email`, and `role`.
5. Frontend sends the JWT in the `Authorization` header.

Booking:

1. User selects an event and ticket quantity.
2. Booking Service loads event data from Event Service.
3. Event Service validates event status and ticket availability.
4. Event Service reserves tickets using a database transaction and pessimistic lock.
5. Booking Service creates a booking record.
6. Booking Service publishes a `booking.created` event to RabbitMQ.

Payment:

1. User creates a payment transaction for a booking.
2. Payment Service stores a `PENDING` transaction.
3. User calls mock success or mock failure.
4. Payment Service updates the transaction and Booking Service payment status.
5. Payment Service publishes a payment event to RabbitMQ.
6. Notification Service creates a user notification.

## RabbitMQ Integration Events

Exchange:

```text
eventhub.exchange
```

Routing keys:

```text
booking.created
booking.cancelled
payment.succeeded
payment.failed
```

Notification Service consumes these events and stores notifications in `notification_db`. Email delivery is currently mocked by logging message content to the console.

## Security Notes

- Passwords are hashed with BCrypt.
- JWT is used for authentication across protected APIs.
- Roles are enforced at service level for user, organizer, and admin workflows.
- Internal endpoints use `X-Internal-Api-Key`.
- DTO validation is implemented with Bean Validation.
- Global exception handling standardizes error responses.
- Swagger is enabled for local development and should be protected or disabled in production.
- Development secrets are present only for local Docker usage and must be replaced in deployed environments.

Known security limitations:

- Refresh tokens are not implemented.
- JWT is stored in browser localStorage for demo simplicity.
- Internal API key protection is not a replacement for production-grade service identity such as mTLS or OAuth2 client credentials.
- Rate limiting is not Redis-backed.

## Image Uploads

- User avatars are managed by User Service.
- Event images are managed by Event Service.
- Local uploads are stored under `uploads/`.
- Event images are exposed through the API Gateway path configured by `EVENT_IMAGE_PUBLIC_PATH`.
- Set `CLOUDINARY_URL` and related folder variables to use Cloudinary instead of local storage in production-like deployments.

## Documentation

- [Architecture](docs/architecture.md)
- [API Design](docs/api-design.md)
- [Database Design](docs/database-design.md)
- [Run Guide](docs/run-guide.md)
- [Postman Guide](docs/postman/README.md)
- [Smoke Testing](docs/testing/smoke-test.md)
- [Security Testing](docs/testing/security-test.md)
- [CI/CD Notes](docs/ci-cd.md)
- [CV Project Description](docs/cv-description.md)

Postman collection:

```text
docs/postman/EventHub.postman_collection.json
```

## Known Limitations

- Payment is mock-only and does not integrate a real payment provider.
- Email delivery is mock/log-only.
- RabbitMQ retry and dead-letter queues are not configured yet.
- The payment workflow is a simple Saga-style flow, not a complete distributed transaction implementation.
- Some frontend analytics screens can use fallback demo data when analytics endpoints are unavailable.
- Integration event DTOs are duplicated across services and can be moved into `common-lib` later.
- Production deployments should harden internal service authentication, rate limiting, observability, and secret management.

## License

This repository currently does not define a license file.
