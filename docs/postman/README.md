# EventHub Postman Guide

Import `EventHub.postman_collection.json` into Postman.

Collection variables:

- `baseUrl`: `http://localhost:8080`
- `token`: JWT access token from Login
- `userId`: current user id
- `eventId`: event id for detail, booking, publish, cancel
- `bookingId`: booking id for payment and cancel
- `paymentId`: payment id for mock success/fail

Recommended flow:

1. Register ORGANIZER
2. Login ORGANIZER and save `token`
3. Create Event and save `eventId`
4. Register USER
5. Login USER and save `token` + `userId`
6. Create Booking and save `bookingId`
7. Create Payment and save `paymentId`
8. Mock Success
9. Get User Notifications
10. Mark Notification as Read
