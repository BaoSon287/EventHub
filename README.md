# EventHub

EventHub is a Java Spring Boot microservices skeleton for creating, managing, and booking events, inspired by Eventbrite.

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
- Swagger/OpenAPI
- Lombok
- Validation

## Architecture

Frontend clients call the API Gateway on port `8080`. The gateway routes requests to services discovered through Eureka on port `8761`. Each domain service owns its own PostgreSQL database.

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

## API Gateway Routes

- `/api/auth/**` -> `auth-service`
- `/api/users/**` -> `user-service`
- `/api/events/**` -> `event-service`
- `/api/bookings/**` -> `booking-service`
- `/api/notifications/**` -> `notification-service`

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
```

Default local database credentials are `eventhub/eventhub`.

## Run With Docker Compose

Build jars first, then start the stack:

```bash
mvn clean package -DskipTests
docker compose up --build
```

PostgreSQL initializes these databases automatically from `docker/postgres/init.sql`: `auth_db`, `user_db`, `event_db`, `booking_db`, and `notification_db`.

## Swagger URLs

- Auth: http://localhost:8081/swagger-ui.html
- User: http://localhost:8082/swagger-ui.html
- Event: http://localhost:8083/swagger-ui.html
- Booking: http://localhost:8084/swagger-ui.html
- Notification: http://localhost:8085/swagger-ui.html

## Health Endpoints

- http://localhost:8081/api/auth/health
- http://localhost:8082/api/users/health
- http://localhost:8083/api/events/health
- http://localhost:8084/api/bookings/health
- http://localhost:8085/api/notifications/health

## Roadmap

- Implement production JWT signing and gateway authentication filter.
- Add refresh tokens and role-based authorization.
- Add event search, filtering, categories, and organizer workflows.
- Add payment and ticket inventory consistency.
- Add notification providers for email and SMS.
- Add frontend application and Figma-guided UI.
- Add integration tests and CI/CD pipeline.
