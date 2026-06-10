# EventHub Run Guide

## Requirements

- Java 17
- Maven
- Node.js 22
- Docker Desktop with WSL 2 backend

## Run With Docker Compose

From the project root:

```powershell
cd D:\EventHub
mvn clean package -DskipTests
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- RabbitMQ UI: http://localhost:15672

RabbitMQ login:

```text
eventhub / eventhub
```

After the first successful build, use this faster command when source images do not need rebuilding:

```powershell
docker compose up
```

## Run Frontend Only

Use this when backend services are already running locally or through Docker Compose:

```powershell
cd D:\EventHub\frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend uses the real API only. Set `VITE_API_BASE_URL` if the API Gateway is not running on `http://localhost:8080`.

## Smoke Test

After the Docker stack is running:

```powershell
cd D:\EventHub
.\scripts\smoke-test.ps1
```

Expected result: Eureka and all backend health endpoints return `OK`.

## Restart Docker After WSL Shutdown

If Docker was reset with:

```powershell
wsl --shutdown
```

Then:

1. Open Docker Desktop.
2. Wait until Docker shows `Engine running`.
3. Run:

```powershell
cd D:\EventHub
docker compose up
```

Use `docker compose up --build` only when you need to rebuild images.

## Useful Commands

Stop containers:

```powershell
docker compose down
```

View running services:

```powershell
docker compose ps
```

Follow logs:

```powershell
docker compose logs -f
```

Rebuild frontend checks locally:

```powershell
cd D:\EventHub\frontend
npm run lint
npm run build
```

Build backend locally:

```powershell
cd D:\EventHub
mvn clean package -DskipTests
```

## CI/CD

GitHub Actions runs backend and frontend checks on push or pull request to `main`.

See:

```text
docs/ci-cd.md
```
