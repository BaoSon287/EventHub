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
- `POST /api/auth/register` creates a disabled account, sends a verification email, and requires email verification before login
- `GET /api/auth/verify-email?token=...`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

Auth Service sends account verification and password reset emails through the Resend HTTPS API. Configure `RESEND_API_KEY`, `MAIL_FROM`, and `FRONTEND_URL` in deployed environments.

## User Service

- `GET /api/users/health`
- `POST /api/users`
- `GET /api/users/{id}`
- `GET /api/users/auth/{authUserId}`
- `PUT /api/users/{id}`

## Event Service

- `GET /api/events/health`
- `GET /api/events` with `keyword`, `category`, `city`, `minPrice`, `maxPrice`, `startDate`, `endDate`, `page`, `size`, `sortBy`, `sortDir`
- `GET /api/events` is public and always returns only `PUBLISHED` events with `endTime` in the future, even if a `status` query parameter is supplied.
- `GET /api/events/{id}` returns public `PUBLISHED`/`COMPLETED` details; `DRAFT` and `CANCELLED` are visible only to the owning organizer or `ADMIN`.
- `GET /api/events/internal/{eventId}` for booking-service. Requires `X-Internal-Api-Key`.
- `PATCH /api/events/internal/{eventId}/reserve-tickets` with `quantity`. Requires `X-Internal-Api-Key`.
- `PATCH /api/events/internal/{eventId}/release-tickets` with `quantity`. Requires `X-Internal-Api-Key`.
- `POST /api/events` for ORGANIZER or ADMIN
- `PUT /api/events/{id}` for ADMIN or owning organizer
- `DELETE /api/events/{id}` physically deletes only eligible `DRAFT` events
- `GET /api/events/organizer/{organizerId}` returns organizer-owned events across all statuses and accepts optional `status`
- `PATCH /api/events/{id}/publish` validates and publishes a draft
- `PATCH /api/events/{id}/cancel` marks an event as `CANCELLED`; it does not delete the event

Event statuses are `DRAFT`, `PUBLISHED`, `CANCELLED`, and `COMPLETED`. `POST /api/events` defaults to `DRAFT` when `status` is omitted; `PUBLISHED` remains accepted for compatibility and runs publish validation. `CANCELLED` and `COMPLETED` cannot be created directly.

## Booking Service

- `GET /api/bookings/health`
- `POST /api/bookings` creates a confirmed booking for the current JWT user
- `GET /api/bookings/{id}` returns booking details
- `GET /api/bookings/me` with `page`, `size`, `status`
- `GET /api/bookings/user/{userId}` with `page`, `size`, `status`
- `GET /api/bookings/event/{eventId}` with `page`, `size`, `status`
- `PATCH /api/bookings/{id}/cancel` cancels a booking and releases tickets
- `PATCH /api/bookings/{id}/pay/mock` marks mock payment as paid
- `GET /api/bookings/internal/{bookingId}` returns booking data for payment-service
- `PATCH /api/bookings/internal/{bookingId}/payment-status` updates booking payment status from payment-service

Booking Service reads `userId`, `email`, and `role` from JWT. It never accepts `ticketPrice` or `totalPrice` from the frontend. Booking creation succeeds only after Event Service reserves tickets for a `PUBLISHED` event that is still bookable.

## Payment Service

- `GET /api/payments/health`
- `POST /api/payments` creates a pending payment for the current JWT user
- `GET /api/payments/{id}`
- `GET /api/payments/code/{paymentCode}`
- `GET /api/payments/me` with `page`, `size`, `status`
- `GET /api/payments/booking/{bookingId}`
- `PATCH /api/payments/{id}/mock-success`
- `PATCH /api/payments/{id}/mock-fail`
- `PATCH /api/payments/{id}/cancel`

Payment Service reads `userId`, `email`, and `role` from JWT. It calls Booking Service internal APIs to validate bookings and update booking payment status.

## Notification Service

- `GET /api/notifications/health`
- `GET /api/notifications/user/{userId}` with `page`, `size`, `status`, `type`
- `GET /api/notifications/{id}`
- `PATCH /api/notifications/{id}/read`
- `POST /api/notifications/email`

Booking-created and booking-cancelled notifications are produced asynchronously from RabbitMQ messages published by Booking Service. Payment-success and payment-failed notifications are produced asynchronously from RabbitMQ messages published by Payment Service.
