# EventHub Security Test Checklist

Run these checks after the backend stack is running.

## Authentication

1. Call a protected endpoint without a token and expect `401`.
2. Call a protected endpoint with an invalid token and expect `401`.
3. Login with the wrong password and expect `401` with a generic `Invalid email or password` message.
4. Register with a weak password and expect `400`.

## Role-Based Access

1. `USER` cannot create an event and should receive `403`.
2. `ORGANIZER` can create an event.
3. `ORGANIZER` cannot update or cancel another organizer's event and should receive `403`.
4. `USER` cannot view another user's booking and should receive `403`.
5. `USER` cannot pay another user's booking and should receive `403`.
6. `ADMIN` can access event, booking, payment, and notification resources.

## Internal API Protection

1. Call `/api/events/internal/{id}` without `X-Internal-Api-Key` and expect `403`.
2. Call `/api/events/internal/{id}` with a wrong `X-Internal-Api-Key` and expect `403`.
3. Call `/api/bookings/internal/{id}` without `X-Internal-Api-Key` and expect `403`.
4. Call `/api/bookings/internal/{id}` with a wrong `X-Internal-Api-Key` and expect `403`.
5. Confirm Booking Service can still reserve/release event tickets through Feign.
6. Confirm Payment Service can still update booking payment status through Feign.

## CORS And Gateway

1. Frontend dev origin `http://localhost:5173` works.
2. Frontend Docker origin `http://localhost:3000` works.
3. Unknown origins are not listed in gateway CORS config.
4. Authorization headers pass through the gateway to backend services.

## Swagger

1. Swagger UI remains available in local dev.
2. Use a Bearer token in Swagger when testing protected endpoints.
3. Production should disable or protect Swagger.

## Known Security Limitations

- JWT is stored in localStorage for demo simplicity.
- Refresh token flow is not implemented yet.
- Internal API key is simple service-to-service protection, not mTLS or OAuth2 client credentials.
- Rate limiting is documented as a future Redis-backed gateway improvement.
