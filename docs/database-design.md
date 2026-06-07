# Database Design

Each service has its own PostgreSQL database to keep ownership boundaries clear.

## Databases

- `auth_db`
- `user_db`
- `event_db`
- `booking_db`
- `notification_db`

## Main Entities

## AuthUser

- `id`
- `email`
- `password`
- `role`
- `createdAt`

## UserProfile

- `id`
- `userId`
- `fullName`
- `email`
- `phone`
- `avatarUrl`
- `createdAt`
- `updatedAt`

## Event

- `id`
- `title`
- `description`
- `location`
- `startTime`
- `endTime`
- `totalTickets`
- `availableTickets`
- `price`
- `organizerId`
- `status`
- `createdAt`
- `updatedAt`

## Booking

- `id`
- `userId`
- `eventId`
- `quantity`
- `totalPrice`
- `status`
- `createdAt`

## Logical Relationships

- A registered auth user can own one user profile.
- A user can organize many events through `Event.organizerId`.
- A user can make many bookings through `Booking.userId`.
- An event can have many bookings through `Booking.eventId`.
- Cross-service relationships are stored as IDs, not foreign keys, because each service owns its database.
