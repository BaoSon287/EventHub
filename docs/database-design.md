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
- `fullName`
- `phone`
- `role`
- `enabled`
- `createdAt`
- `updatedAt`

## UserProfile

- `id`
- `authUserId`
- `fullName`
- `email`
- `phone`
- `avatarUrl`
- `bio`
- `createdAt`
- `updatedAt`

## Event

- `id`
- `title`
- `description`
- `category`
- `location`
- `address`
- `city`
- `startTime`
- `endTime`
- `totalTickets`
- `availableTickets`
- `price`
- `imageUrl`
- `organizerId`
- `organizerName`
- `status`
- `createdAt`
- `updatedAt`

## Booking

- `id`
- `bookingCode`
- `userId`
- `eventId`
- `eventTitle`
- `quantity`
- `ticketPrice`
- `totalPrice`
- `status`
- `paymentStatus`
- `createdAt`
- `updatedAt`
- `cancelledAt`

## Logical Relationships

- A registered auth user can own one user profile.
- A user can organize many events through `Event.organizerId`.
- A user can make many bookings through `Booking.userId`.
- An event can have many bookings through `Booking.eventId`.
- Cross-service relationships are stored as IDs, not foreign keys, because each service owns its database.
