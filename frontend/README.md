# EventHub Frontend

React + Vite frontend for the EventHub event-booking platform. The app can run against the real API Gateway or the built-in mock database for fast demo flows.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Axios
- Lucide React
- Recharts

## Run Locally

Create `.env` when you want to point the frontend at a specific backend:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Install dependencies and start Vite:

```bash
npm install
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

Build for production:

```bash
npm run build
```

When running through Docker Compose, the nginx build is available at:

```text
http://localhost:3000
```

## API Mode

The navbar can switch between:

- `Local Host (8080)`: calls the EventHub API Gateway from `VITE_API_BASE_URL` or `http://localhost:8080`
- `Mock Offline`: uses LocalStorage demo data

Backend services should be running through Docker Compose or locally before using real API mode.

## Folder Structure

```text
src/
  api/          Axios client, mock database, feature API adapters
  components/   Shared UI, navigation, cards, states, dialog, toast
  pages/        Route-level screens
  utils/        Error and formatting helpers
```

## Routes

- `/` Home and featured events
- `/events` Explore events with search/category filters
- `/events/:id` Event detail and ticket booking
- `/login`, `/register` Auth screens
- `/my-bookings` Ticket list and cancel flow
- `/payments/:bookingId` Mock payment flow
- `/notifications` Notification inbox
- `/profile` User profile and avatar selection
- `/organizer/dashboard` Organizer event dashboard
- `/organizer/events/create` Create event form
- `/admin` Admin mock user management

## UI Features

- Toast notifications for auth, booking, payment, notification, and dashboard actions
- Confirm dialog for destructive actions instead of browser `confirm`
- Skeleton loaders for event grids, detail pages, ticket lists, and tables
- Empty and error states for list/detail failures
- Responsive navbar with role-aware mobile menu
- Status badges for booking, payment, event, notification, and role states
- Analytics dashboards with Recharts for organizer and admin views
- Event image upload with preview, validation, remove/change actions, and URL paste fallback

## Analytics Dashboard

- Organizer dashboard shows event performance, ticket availability, bookings, revenue charts, and top performing events.
- Admin dashboard shows platform-level metrics such as users, events, bookings, payments, notifications, and revenue.
- Charts are implemented with Recharts.
- Some analytics may use demo fallback data when backend analytics APIs are unavailable.

## Image Upload

- Users can upload avatars from the Profile page or choose bundled avatar presets.
- Organizers can upload event images from Create Event or paste an image URL manually.
- Event image upload calls `POST /api/events/images/upload` with `multipart/form-data`.
- Supported formats: JPG, PNG, WEBP.
- Max size: 5MB.
- Local development stores event images under `uploads/events` and serves them through `/api/events/uploads/events/{fileName}`.
- In production this can be replaced with Cloudinary, S3, or another object storage/CDN setup.

## Demo Flow

1. Switch to `Mock Offline` when backend services are not running.
2. Login with a seeded account from the login helper buttons.
3. Explore events, book a ticket, then complete mock payment.
4. Open My Tickets to view QR ticket and cancel pending bookings.
5. Use organizer/admin accounts to view dashboards and create demo events.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
