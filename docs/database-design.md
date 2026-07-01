# Database Design

Each service has its own PostgreSQL database to keep ownership boundaries clear.

## Databases

- `auth_db`
- `user_db`
- `event_db`
- `booking_db`
- `notification_db`
- `payment_db`

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
- `status` as string enum: `DRAFT`, `PUBLISHED`, `CANCELLED`, `COMPLETED`
- `createdAt`
- `updatedAt`

Event Service currently uses Hibernate `ddl-auto=update`. The event status upgrade SQL for existing databases is kept in `scripts/database/20260612_event_status_upgrade.sql`; it backfills null/legacy status values, preserves existing events, sets a `DRAFT` default for new rows, and adds lifecycle-oriented indexes where needed.

## Booking

- `id`
- `bookingCode`
- `ticketCode`
- `userId`
- `eventId`
- `eventTitle`
- `eventImageUrl`
- `eventStartTime`
- `eventEndTime`
- `eventLocation`
- `eventAddress`
- `eventCity`
- `quantity`
- `ticketPrice`
- `totalPrice`
- `status`
- `paymentStatus`
- `createdAt`
- `updatedAt`
- `cancelledAt`

## TicketAsset

- `id`
- `ticketId`
- `eventId`
- `ownerId`
- `originalBuyerId`
- `ticketCode`
- `qrCode`
- `status` as string enum: `OWNED`, `LISTED_FOR_SALE`, `SOLD`, `TRANSFERRED`, `USED`, `CANCELLED`
- `purchasePrice`
- `eventName`
- `createdAt`
- `updatedAt`

Ticket assets live in `booking_db.ticket_assets` and are created by Booking Service after payment success. The migration for existing databases is kept in `scripts/database/20260701_ticket_assets.sql`.

## TicketResaleListing

- `id`
- `ticketAssetId`
- `sellerId`
- `price`
- `status` as string enum: `ACTIVE`, `SOLD`, `CANCELLED`
- `createdAt`
- `updatedAt`

Only one `ACTIVE` listing is allowed for a ticket asset. The migration uses a partial unique index on `ticket_asset_id` where `status = 'ACTIVE'`.

## TicketTransferHistory

- `id`
- `ticketAssetId`
- `fromUserId`
- `toUserId`
- `action` as string enum: `LISTED`, `PURCHASED`, `TRANSFERRED`, `CANCELLED`
- `oldQrCode`
- `newQrCode`
- `createdAt`

Resale tables live in `booking_db` and are created by `scripts/database/20260702_ticket_resale_marketplace.sql`.

## Notification

- `id`
- `userId`
- `recipientEmail`
- `title`
- `content`
- `type`
- `status`
- `sourceService`
- `sourceEvent`
- `referenceId`
- `createdAt`
- `sentAt`
- `readAt`

## PaymentTransaction

- `id`
- `paymentCode`
- `bookingId`
- `bookingCode`
- `userId`
- `amount`
- `method`
- `status`
- `provider`
- `providerTransactionId`
- `failureReason`
- `createdAt`
- `updatedAt`
- `paidAt`
- `failedAt`

## Logical Relationships

- A registered auth user can own one user profile.
- A user can organize many events through `Event.organizerId`.
- A user can make many bookings through `Booking.userId`.
- A user can own many ticket assets through `TicketAsset.ownerId`.
- An event can have many bookings through `Booking.eventId`; this is a cross-service ID reference, not a database foreign key.
- An event can have many ticket assets through `TicketAsset.eventId`; this is also a cross-service ID reference.
- A ticket asset can have many resale listings over time, but only one `ACTIVE` listing.
- A ticket asset can have many transfer history rows for listing, purchase, transfer, and cancellation events.
- A user can have many notifications through `Notification.userId`.
- A user can have many payment transactions through `PaymentTransaction.userId`.
- A booking can have payment transactions through `PaymentTransaction.bookingId`, while Booking Service remains the owner of booking data.
- Cross-service relationships are stored as IDs, not foreign keys, because each service owns its database.
- Ticket inventory is owned by Event Service through `totalTickets` and `availableTickets`. Booking Service never joins or writes the Event database directly.
