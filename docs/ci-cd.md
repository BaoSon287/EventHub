# EventHub CI/CD Guide

## CI: GitHub Actions

EventHub uses `.github/workflows/ci.yml`.

The CI workflow runs automatically on:

- Push to `main`
- Pull request targeting `main`

It checks:

- Backend Maven build:

```bash
mvn clean package -DskipTests
```

- Frontend install, typecheck, and production build:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

View CI results in GitHub:

```text
Repository -> Actions -> CI
```

If CI fails, open the failed job and read the first red step.

## CD Option 1: Render Auto Deploy

Use this if the backend is deployed on Render.

Recommended setup:

1. Connect the GitHub repository to Render.
2. Create the required Render services for the backend/database stack.
3. Enable auto deploy from the `main` branch.
4. Add production environment variables in Render, not in GitHub.

Common backend environment variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
JWT_SECRET
INTERNAL_API_KEY
SPRING_RABBITMQ_HOST
SPRING_RABBITMQ_USERNAME
SPRING_RABBITMQ_PASSWORD
EUREKA_CLIENT_SERVICEURL_DEFAULTZONE
```

Because the frontend no longer has mock mode, the deployed frontend must point to the deployed API gateway:

```text
VITE_API_BASE_URL=https://your-api-gateway-url
```

## CD Option 2: Vercel Frontend + Render Backend

Use this when frontend and backend are deployed separately.

Vercel project settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Environment Variable:
VITE_API_BASE_URL=https://your-api-gateway-url
```

Render still hosts the backend services and databases.

## Current Recommendation

Keep GitHub Actions as the quality gate first.

Then use platform auto deploy:

- Render auto deploy for backend
- Vercel auto deploy for frontend, or Render static site if preferred

This avoids putting deployment tokens into GitHub Actions while the project is still changing quickly.
