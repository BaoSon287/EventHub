# API Design

All service responses follow this format:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

## Auth Service

- `GET /api/auth/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## User Service

- `GET /api/users/health`
- `POST /api/users`
- `GET /api/users/{id}`
- `GET /api/users/auth/{authUserId}`
- `PUT /api/users/{id}`

## Event Service

- `GET /api/events/health`
- `GET /api/events` with `keyword`, `category`, `city`, `minPrice`, `maxPrice`, `startDate`, `endDate`, `status`, `page`, `size`, `sortBy`, `sortDir`
- `GET /api/events/{id}`
- `GET /api/events/internal/{eventId}` for booking-service
- `PATCH /api/events/internal/{eventId}/reserve-tickets` with `quantity`
- `PATCH /api/events/internal/{eventId}/release-tickets` with `quantity`
- `POST /api/events` for ORGANIZER or ADMIN
- `PUT /api/events/{id}` for ADMIN or owning organizer
- `DELETE /api/events/{id}` soft-cancels the event
- `GET /api/events/organizer/{organizerId}`
- `PATCH /api/events/{id}/publish`
- `PATCH /api/events/{id}/cancel`

## Booking Service

- `GET /api/bookings/health`
- `POST /api/bookings` creates a confirmed booking for the current JWT user
- `GET /api/bookings/{id}` returns booking details
- `GET /api/bookings/me` with `page`, `size`, `status`
- `GET /api/bookings/user/{userId}` with `page`, `size`, `status`
- `GET /api/bookings/event/{eventId}` with `page`, `size`, `status`
- `PATCH /api/bookings/{id}/cancel` cancels a booking and releases tickets
- `PATCH /api/bookings/{id}/pay/mock` marks mock payment as paid

Booking Service reads `userId`, `email`, and `role` from JWT. It never accepts `ticketPrice` or `totalPrice` from the frontend.

## Notification Service

- `GET /api/notifications/health`
- `GET /api/notifications/user/{userId}` with `page`, `size`, `status`, `type`
- `GET /api/notifications/{id}`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/email`

Booking-created and booking-cancelled notifications are produced asynchronously from RabbitMQ messages published by Booking Service.
