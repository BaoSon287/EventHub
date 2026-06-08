# EventHub Smoke Test

Use this checklist after starting the project with Docker Compose.

## Start System

```powershell
mvn clean package -DskipTests
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Eureka: http://localhost:8761
- RabbitMQ: http://localhost:15672 (`eventhub` / `eventhub`)
- API Gateway: http://localhost:8080

## Health Checks

Run:

```powershell
.\scripts\smoke-test.ps1
```

Expected services:

- Auth
- User
- Event
- Booking
- Payment
- Notification

## Manual End-to-End Flow

1. Register an organizer account.
2. Login as organizer.
3. Open Organizer Dashboard.
4. Create a published event.
5. Confirm the event appears in Organizer Dashboard and Explore Events.
6. Register a user account.
7. Login as user.
8. Open Explore Events and choose an event.
9. Book tickets.
10. Open My Tickets.
11. Pay with mock payment success.
12. Confirm booking payment status becomes paid.
13. Open Notifications.
14. Mark a notification as read.
15. Cancel an unpaid booking and confirm it becomes cancelled.
