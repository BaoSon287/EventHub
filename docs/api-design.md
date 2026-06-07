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
- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`

## Booking Service

- `GET /api/bookings/health`
- `POST /api/bookings`
- `GET /api/bookings/user/{userId}`

## Notification Service

- `GET /api/notifications/health`
- `POST /api/notifications/email`
