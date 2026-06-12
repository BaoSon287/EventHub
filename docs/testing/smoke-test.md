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

The script also runs an event lifecycle smoke flow when the local API is available:

1. Login as demo organizer and demo user.
2. Create a `DRAFT` event.
3. Confirm the draft is hidden from public `GET /api/events`.
4. Publish the event.
5. Confirm the event appears in public upcoming events.
6. Create a booking as demo user.
7. Confirm available tickets decrease.
8. Cancel the event.
9. Confirm new bookings are rejected.
10. Confirm cancelled and completed events are hidden from public upcoming events.

Run security checks:

```powershell
.\scripts\security-smoke-test.ps1
```

The security script checks protected endpoints, internal API key rejection, user create denial, draft visibility, invalid status creation, forbidden update fields, owner publish, and admin cancel.

## Manual End-to-End Flow

1. Register an organizer account.
2. Login as organizer.
3. Open Organizer Dashboard.
4. Create a draft event.
5. Confirm the draft appears in Organizer Dashboard but not Explore Events.
6. Publish the event.
7. Confirm the event appears in Explore Events.
8. Register a user account.
9. Login as user.
10. Open Explore Events and choose the published event.
11. Book tickets.
12. Open My Tickets.
13. Pay with mock payment success.
14. Confirm booking payment status becomes paid.
15. Login as organizer and cancel the event.
16. Confirm the event no longer appears in Explore Events and cannot receive new bookings.
17. Open Notifications.
18. Mark a notification as read.
19. Cancel an unpaid booking and confirm it becomes cancelled.
