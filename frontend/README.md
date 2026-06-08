# EventHub Frontend

React + Vite frontend for the EventHub microservices backend.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:5173
```

When running through Docker Compose, the nginx build is available at:

```text
http://localhost:3000
```

## API Mode

The navbar can switch between:

- `Local Host (8080)`: calls the EventHub API Gateway at `http://localhost:8080`
- `Mock Offline`: uses LocalStorage demo data

Backend services should be running through Docker Compose or locally before using real API mode.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`
