# EventHub - Codebase Audit Report

**Ngày audit:** 2025-07-01  
**Version:** 0.0.1-SNAPSHOT  
**Tech Stack:** Spring Boot 3.3, Java 17, React 19, PostgreSQL, RabbitMQ  
**Auditor:** Tech Lead Review

---

## 1. CURRENT ARCHITECTURE

### 1.1 High-Level Architecture

```
┌─────────────────┐
│  React Frontend │  :5173 (dev) / :3000 (prod)
│   (Vite + TS)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │ :8080  (Spring Cloud Gateway)
│  (Routing/CORS) │
└────────┬────────┘
         │
    ┌────┴────┬────────┬────────┬────────┬────────┬────────┐
    ▼         ▼        ▼        ▼        ▼        ▼
┌──────┐  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Auth │  │ User │ │Event │ │Book- │ │Notif│ │Paym- │
│ :8081│  │:8082 │ │:8083 │ │ing:  │ │:8085│ │ent:  │
│      │  │      │ │      │ │8084  │ │     │ │8086  │
└──┬───┘  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
   │         │        │        │        │        │
   ▼         ▼        ▼        ▼        ▼        ▼
┌──────────────────────────────────────────────────────┐
│           PostgreSQL (6 databases)                    │
│  auth_db | user_db | event_db | booking_db           │
│  notification_db | payment_db                        │
└──────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  RabbitMQ        │ :5672 / :15672 (Management)
│  (Event Bus)     │
└─────────────────┘

┌─────────────────┐
│Discovery Server │ :8761 (Eureka)
└─────────────────┘
```

### 1.2 Services Breakdown

| Service | Responsibility | Technologies |
|---------|---------------|-------------|
| **API Gateway** | Routing, CORS, Authentication passthrough | Spring Cloud Gateway |
| **Auth Service** | Registration, login, JWT issuance, email verification | Spring Security, JWT, SendGrid |
| **User Service** | User profiles, avatar management | Spring Data JPA, Local/Cloudinary storage |
| **Event Service** | Event CRUD, ticket inventory, image upload | Spring Data JPA, Specification API |
| **Booking Service** | Booking creation/cancellation, ticket assets, resale marketplace | Spring Data JPA, RabbitMQ, QR generation |
| **Payment Service** | Mock payment transactions | Spring Data JPA, RabbitMQ |
| **Notification Service** | Notification APIs, async event consumption | Spring Data JPA, RabbitMQ |
| **Discovery Server** | Service registry | Netflix Eureka |

### 1.3 Communication Patterns

**External (Frontend → Backend):**
- All requests go through API Gateway (`:8080`)
- JWT in `Authorization: Bearer` header
- RESTful JSON APIs

**Internal (Service-to-Service):**
- REST via OpenFeign clients
- Internal API Key: `X-Internal-Api-Key` header
- RabbitMQ for async events (booking.created, payment.succeeded, etc.)

---

## 2. BACKEND ARCHITECTURE REVIEW

### 2.1 Layer Structure

```
src/main/java/com/eventhub/{service}/
├── config/
│   ├── SecurityConfig.java
│   ├── InternalFeignConfig.java
│   └── [Custom configs]
├── controller/
│   ├── [Public/Protected endpoints]
│   └── InternalController.java (if needed)
├── dto/
│   ├── Request DTOs
│   ├── Response DTOs
│   └── Internal DTOs
├── entity/
│   └── [JPA Entities]
├── enums/
│   └── [Enumerations]
├── exception/
│   ├── [Custom exceptions]
│   └── [Exception handlers]
├── mapper/
│   └── [MapStruct mappers]
├── repository/
│   ├── [JPA Repositories]
│   └── [Specifications]
├── security/
│   ├── JwtAuthenticationFilter
│   ├── JwtService
│   └── CustomUserPrincipal
├── service/
│   └── [Business logic]
├── messaging/
│   ├── [Event publishers]
│   └── RabbitMQConfig
└── [Application].java
```

### 2.2 Controller Analysis

| Service | Controller | Responsibility | Issues |
|---------|-----------|----------------|--------|
| **Auth** | AuthController | Registration, login, forgot/reset password | ✅ Clean separation |
| **User** | UserProfileController | Profile CRUD, avatar upload | ✅ Clean separation |
| **Event** | EventController, InternalEventController | Public/internal APIs separated | ✅ Good |
| **Booking** | BookingController, TicketAssetController, TicketResaleController, InternalBookingController | Multiple controllers | ⚠️ Could consolidate related endpoints |
| **Payment** | PaymentController | Payment CRUD, mock actions | ✅ Clean |
| **Notification** | NotificationController | Notification APIs | ✅ Clean |

**Assessment:**
- ✅ All controllers handle only HTTP concerns
- ✅ Request validation via `@Valid` on DTOs
- ✅ Proper HTTP status codes and exception mapping
- ⚠️ Booking Service has 4 controllers - consider merging TicketAssetController and TicketResaleController

### 2.3 Service Analysis

| Service | Service Class | Size (LOC) | Responsibility | Issues |
|---------|--------------|------------|---------------|--------|
| **Auth** | AuthService | ~200 | Auth logic, email sending | ⚠️ Mixed concerns (auth + email) |
| **User** | UserProfileService | ~80 | Profile management | ✅ Clean |
| **Event** | EventService | ~400 | Event CRUD, inventory, lifecycle | ⚠️ Large - lifecycle + inventory + search mixed |
| **Booking** | BookingService | ~400 | Booking + ticket assets + resale | ⚠️ Large - multiple domains |
| **Payment** | PaymentService | ~100 | Payment transactions | ✅ Clean |
| **Notification** | NotificationService | ~60 | Notifications | ✅ Clean |

**Issues Found:**

| Module | Current Design | Problem | Suggestion |
|--------|---------------|---------|------------|
| EventService | Single service for event CRUD, inventory, lifecycle | Single Responsibility Principle violation | Split into `EventManagementService` and `EventInventoryService` |
| BookingService | Handles booking, ticket assets, resale | Multiple domains in one place | Split into `BookingService`, `TicketAssetService`, `TicketResaleService` |
| AuthService | Sends emails directly | Tight coupling with SendGrid | Use event-driven email via RabbitMQ |
| EmailService | Concrete implementation | No interface abstraction | Define `EmailService` interface with `MockEmailService` and `SendGridEmailService` |

### 2.4 Repository Analysis

**Pattern:** Spring Data JPA with Specifications (Event Service)

| Service | Repository | Query Complexity | Issues |
|---------|-----------|-----------------|--------|
| **Event** | EventRepository | Simple + Specification | ✅ Good |
| **Booking** | BookingRepository, TicketAssetRepository, TicketResaleListingRepository, TicketTransferHistoryRepository | Simple CRUD + pagination | ✅ Good |
| **Payment** | PaymentTransactionRepository | Simple CRUD | ✅ Good |

**Assessment:**
- ✅ No complex JPQL queries found
- ✅ Specifications used for dynamic search (EventService)
- ✅ Pagination implemented via `Pageable`
- ⚠️ Booking Service missing pagination on some endpoints (check controller)

### 2.5 Entity Analysis

**Auth Service:**
```sql
auth_user (id, email, password_hash, role, email_verified, created_at, updated_at)
email_verification_token (id, token, user_id, expires_at, created_at)
password_reset_token (id, token, user_id, expires_at, used, created_at)
```

**User Service:**
```sql
user_profile (id, user_id, full_name, phone, bio, avatar_url, created_at, updated_at)
```

**Event Service:**
```sql
event (id, organizer_id, title, description, category, location, address, city,
       start_time, end_time, total_tickets, available_tickets, price, image, status,
       created_at, updated_at)
```

**Booking Service:**
```sql
booking (id, user_id, event_id, booking_code, quantity, ticket_price, total_price,
         status, payment_status, ticket_code, created_at, updated_at, cancelled_at)

ticket_asset (id, user_id, booking_id, event_id, ticket_code, qr_code, qr_nonce,
              purchase_price, status, original_owner_id, created_at, updated_at)

ticket_resale_listing (id, ticket_asset_id, seller_id, price, status, created_at, 
                       updated_at, sold_at)

ticket_transfer_history (id, ticket_asset_id, from_user_id, to_user_id, 
                         action, price, created_at)
```

**Payment Service:**
```sql
payment_transaction (id, booking_id, user_id, amount, method, status, 
                     transaction_code, created_at, updated_at)
```

**Notification Service:**
```sql
notification (id, user_id, type, title, message, status, created_at)
```

**Issues Found:**
- ⚠️ `ticket_asset` stores `user_id` but also `original_owner_id` - redundant, use transfer_history only
- ✅ Foreign keys properly defined
- ✅ Cascade behavior appropriate (soft deletes where needed)
- ⚠️ No explicit indexes defined in entities (rely on JPA defaults)

---

## 3. DATABASE AUDIT

### 3.1 Database Diagram

```
auth_db
├── auth_user (PK: id)
│   ├── email_verification_token (FK: user_id)
│   └── password_reset_token (FK: user_id)

user_db
└── user_profile (PK: id, FK: user_id references auth_user)

event_db
└── event (PK: id, FK: organizer_id references auth_user)

booking_db
├── booking (PK: id, FK: user_id, event_id)
│   └── ticket_asset (FK: booking_id, event_id, user_id)
│       ├── ticket_resale_listing (FK: ticket_asset_id, seller_id)
│       └── ticket_transfer_history (FK: ticket_asset_id, from_user_id, to_user_id)

payment_db
├── payment_transaction (PK: id, FK: booking_id, user_id)

notification_db
└── notification (PK: id, FK: user_id)
```

### 3.2 Index Analysis

**Missing Indexes:**
| Table | Column | Impact | Recommendation |
|-------|--------|--------|----------------|
| booking | user_id, created_at | Frequent queries by user | Add composite index |
| booking | event_id, status | Event owner queries | Add composite index |
| ticket_asset | user_id, status | Wallet queries | Add composite index |
| ticket_resale_listing | status, created_at | Marketplace browsing | Add composite index |
| notification | user_id, created_at | Notification list | Add composite index |
| payment_transaction | booking_id | Payment lookup | Add index (unique may exist) |

**Assessment:**
- ⚠️ No explicit index definitions found in entities
- ⚠️ Relies on Hibernate default indexes (PK only)
- ⚠️ May cause slow queries on large datasets

### 3.3 Data Integrity Issues

| Issue | Severity | Description | Fix |
|-------|----------|-------------|-----|
| Missing foreign key constraints | Medium | Cross-service PKs not enforced | Use application-level validation or Saga pattern |
| Soft delete not implemented | Low | Hard deletes on booking, event | Consider `@SQLDelete` for audit trail |
| Duplicate ticket_code possible | Low | No unique constraint | Add unique constraint on `ticket_code` |

### 3.4 Migration Strategy

**Current:** Hibernate `ddl-auto=update` + manual SQL scripts

**Assessment:**
- ✅ Manual migrations in `scripts/database/`
- ⚠️ `ddl-auto=update` unsafe for production
- ✅ PostgreSQL specific init scripts

**Recommendation:**
- Switch to Flyway or Liquibase for production
- Remove `ddl-auto=update` or set to `validate`

---

## 4. SECURITY REVIEW

### 4.1 Authentication & Authorization

| Aspect | Current State | Issues | Severity |
|--------|--------------|--------|----------|
| **JWT Implementation** | Custom JwtService with HMAC-SHA256 | ⚠️ No refresh token mechanism | Medium |
| **Token Storage** | localStorage | ⚠️ Vulnerable to XSS | High |
| **Token Expiration** | 24h (configurable) | ✅ Reasonable | - |
| **Password Hashing** | BCrypt | ✅ Secure | - |
| **Email Verification** | Required before login | ✅ Good | - |
| **Password Reset** | Token-based with expiration | ✅ Good implementation | - |

**Critical Issues:**
1. **No refresh token** → Users must re-login after 24h
2. **localStorage for JWT** → XSS vulnerability
3. **JWT_SECRET in docker-compose** → Hardcoded secrets

### 4.2 Authorization Matrix

| Role | Permissions |
|------|-------------|
| **USER** | Create bookings, view own tickets, resale marketplace, profile management |
| **ORGANIZER** | All user permissions + create/manage events, view event bookings |
| **ADMIN** | All permissions + admin dashboard, user management |

**Issues Found:**

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing role validation on some endpoints | High | Check if all endpoints enforce roles |
| Internal API key in plaintext | Medium | `eventhub-internal-secret-change-me` |
| No rate limiting | Medium | Susceptible to brute force |
| CORS configuration | Low | Check if properly restricted in production |

### 4.3 API Security

| Aspect | Current State | Issues |
|--------|--------------|--------|
| **Input Validation** | Bean Validation on DTOs | ✅ Good |
| **SQL Injection** | Using JPA | ✅ Protected |
| **XSS Protection** | None in backend | ⚠️ Rely on frontend |
| **CSRF Protection** | Disabled for JWT | ✅ Acceptable |
| **CORS** | Configured per service | ⚠️ Check production settings |
| **Sensitive Data Exposure** | QR code contains nonce only | ✅ Good |

**Security Issues Table:**

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| JWT in localStorage | High | Use httpOnly cookies |
| No refresh token | Medium | Implement refresh token flow |
| Internal API key hardcoded | Medium | Use Kubernetes secrets or vault |
| No rate limiting | Medium | Add Redis-based rate limiter |
| Swagger exposed in production | Low | Disable or protect with auth |
| RabbitMQ default credentials | Medium | Change in production |

### 4.4 Data Protection

| Data Type | Protection | Issues |
|-----------|-----------|--------|
| Passwords | BCrypt (10 rounds) | ✅ Secure |
| JWT Secret | Base64 encoded | ⚠️ Should be stronger random |
| Email tokens | UUID + expiration | ✅ Good |
| QR codes | Nonce + asset ID | ✅ No PII exposed |

---

## 5. PERFORMANCE REVIEW

### 5.1 Backend Performance

| Area | Current State | Issues | Recommendation |
|------|--------------|--------|----------------|
| **Database Queries** | JPA generated | ⚠️ Potential N+1 in EventService | Enable query logging, use JOIN FETCH |
| **Pagination** | Implemented on list endpoints | ✅ Good | - |
| **Caching** | None | ⚠️ Repeated reads of events | Add Redis cache for event details |
| **Connection Pooling** | HikariCP (default) | ✅ Good | Monitor pool usage |
| **API Response Size** | Full entities | ⚠️ Over-fetching | Use projection/DTOs |
| **Concurrency** | Pessimistic lock on events | ✅ Good for inventory | Monitor for deadlocks |

**Performance Issues Table:**

| Issue | Severity | Impact | Fix |
|-------|----------|--------|-----|
| No caching layer | Medium | Repeated DB queries | Add Redis for hot data |
| N+1 queries possible | Medium | Slow event listing | Use JOIN FETCH or batch fetching |
| No connection pool monitoring | Low | Undetected pool exhaustion | Add Micrometer metrics |
| No query optimization | Medium | Slow response on large datasets | Add indexes, optimize JPQL |

### 5.2 Frontend Performance

| Area | Current State | Issues |
|-------|--------------|--------|
| **Bundle Size** | Unknown | ⚠️ Need to analyze with `npm run build` |
| **Image Optimization** | Standard img tags | ⚠️ No lazy loading, responsive images |
| **API Calls** | Direct calls | ⚠️ No request deduplication |
| **State Management** | useState/useEffect | ✅ Simple enough for current scale |
| **Loading States** | Implemented | ✅ Good UX |

### 5.3 Infrastructure Performance

| Component | Current State | Recommendations |
|-----------|--------------|-----------------|
| **Docker** | Multi-stage builds | ✅ Good |
| **PostgreSQL** | Single instance, 6 DBs | ✅ Fine for dev, consider read replicas for prod |
| **RabbitMQ** | Default config | ⚠️ Add durable queues, dead-letter exchange |
| **JVM Memory** | Default | ⚠️ Tune for production (Xmx, Xms) |

---

## 6. CODE QUALITY REVIEW

### 6.1 Naming Conventions

| Convention | Status | Comments |
|-----------|--------|----------|
| Package naming | ✅ | `com.eventhub.{service}.{layer}` |
| Class naming | ✅ | PascalCase, descriptive |
| Method naming | ✅ | camelCase, verbs for actions |
| Variable naming | ✅ | camelCase, meaningful names |
| Constant naming | ✅ | UPPER_SNAKE_CASE |

### 6.2 Folder Organization

**Backend:** ✅ Standard Spring Boot structure  
**Frontend:** ✅ Feature-based organization

| Layer | Organization | Issues |
|-------|-------------|--------|
| Backend Controllers | By service | ✅ Good |
| Backend Services | By service | ⚠️ Large service classes (1000+ LOC) |
| Frontend Pages | By feature | ✅ Good |
| Frontend Components | Shared + feature | ✅ Good |

### 6.3 Exception Handling

**Global Exception Handler:** `GlobalExceptionHandler` in common-lib

| Exception Type | Handled | HTTP Status |
|--------------|---------|-------------|
| BadRequestException | ✅ | 400 |
| ResourceNotFoundException | ✅ | 404 |
| ForbiddenException | ✅ | 403 |
| UnauthorizedException | ✅ | 401 |
| MethodArgumentNotValidException | ✅ | 400 |
| FeignException | ✅ | Mapped in service |

**Issues:**
- ✅ Consistent error response format (`ApiResponse`)
- ⚠️ No custom exceptions for business rules (e.g., `InsufficientTicketsException`)

### 6.4 Logging

| Aspect | Current State | Issues |
|--------|--------------|--------|
| Framework | SLF4J + Logback | ✅ Standard |
| Log Levels | Mixed INFO/DEBUG | ⚠️ Too verbose in some places |
| Structured Logging | None | ⚠️ No JSON format for ELK |
| Correlation ID | None | ⚠️ Can't trace requests across services |

### 6.5 Configuration Management

| Config Type | Current State | Issues |
|-------------|--------------|--------|
| Application properties | application.yml per service | ✅ Good |
| Environment variables | Supported | ✅ Good |
| Secrets | Hardcoded in docker-compose | ❌ Critical for production |
| Config server | Not used | ⚠️ Should use Spring Cloud Config |

### 6.6 Code Smells

| Smell | Location | Severity | Recommendation |
|-------|----------|----------|----------------|
| Large service class | EventService (400 LOC) | Medium | Split responsibilities |
| Magic numbers | Quantity validation | Low | Use constants |
| Duplicate DTOs | BookingService DTOs | Medium | Consolidate |
| Repeated security code | Each service has JWT filter | Low | Extract to common-lib |

---

## 7. TESTING REVIEW

### 7.1 Test Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|-----------|------------------|-----------|
| Auth Service | ✅ (AuthServiceTest) | ❌ | ❌ |
| Event Service | ✅ (Multiple) | ❌ | ❌ |
| Booking Service | ✅ (BookingServiceTest, TicketOwnershipServiceTest, TicketResaleServiceTest) | ❌ | ❌ |
| Payment Service | ❌ | ❌ | ❌ |
| Notification Service | ❌ | ❌ | ❌ |
| Frontend | ❌ | ❌ | ❌ |

**Coverage Assessment:**
- Backend unit tests: ~30% estimated coverage
- Integration tests: 0%
- E2E tests: 0%
- Frontend tests: 0%

### 7.2 Critical Gaps

| Flow | Test Status | Priority |
|------|-----------|----------|
| User registration + email verification | ❌ | High |
| Event creation + publishing | Partial | Medium |
| Booking flow (create → pay → ticket) | Partial | High |
| Ticket resale (list → buy → transfer) | Partial | High |
| Payment mock flow | ❌ | Medium |
| Notification consumption | ❌ | Medium |

### 7.3 Test Infrastructure

| Tool | Status |
|------|--------|
| JUnit 5 | ✅ Configured |
| Mockito | ✅ Used |
| Testcontainers | ❌ Not used |
| Spring Boot Test | ⚠️ Partial |
| Frontend testing | ❌ Not configured |

---

## 8. DEPLOYMENT REVIEW

### 8.1 Docker Configuration

**File:** `docker-compose.yml`

| Aspect | Status | Issues |
|--------|--------|--------|
| Multi-stage builds | ✅ | Efficient image sizes |
| Health checks | ✅ | PostgreSQL has healthcheck |
| Volume management | ✅ | Postgres data persisted |
| Resource limits | ❌ | Not defined - risk of OOM |
| Environment variables | ✅ (but insecure) | Secrets hardcoded |
| Build context | ⚠️ Backend builds from root | Slow rebuilds |

### 8.2 CI/CD

**File:** `.github/workflows` (not found in listing)

| Aspect | Status | Issues |
|-------|--------|--------|
| GitHub Actions | ❓ | Need to check if exists |
| Automated tests | ❓ | - |
| Docker image push | ❓ | - |
| Deployment pipeline | ❓ | - |

### 8.3 Production Readiness

| Requirement | Current State | Gap |
|-------------|--------------|-----|
| Secrets management | Hardcoded | Use Vault/AWS Secrets |
| Monitoring | None | Add Prometheus + Grafana |
| Logging aggregation | None | Add ELK/Loki |
| Health checks | Basic | Add detailed health endpoints |
| Backup strategy | None | PostgreSQL backup automation |
| SSL/TLS | Not configured | Add HTTPS in production |
| Rate limiting | None | Add to API Gateway |
| Circuit breaker | Not configured | Add Resilience4j |

---

## 9. TECHNICAL DEBT LIST

### 9.1 P0 - Critical (Fix Immediately)

| ID | Issue | Impact | Effort |
|----|-------|--------|--------|
| P0-1 | JWT stored in localStorage | XSS vulnerability → account takeover | High |
| P0-2 | Hardcoded secrets in docker-compose | Credential exposure | Low |
| P0-3 | No refresh token mechanism | Poor UX, forced re-login | Medium |
| P0-4 | No rate limiting | DDoS, brute force attacks | High |

### 9.2 P1 - High Priority (Fix in Phase 2)

| ID | Issue | Impact | Effort |
|----|-------|--------|--------|
| P1-1 | Large service classes (SRP violation) | Maintainability, testing difficulty | High |
| P1-2 | Missing database indexes | Slow queries at scale | Low |
| P1-3 | No integration tests | Regression risk | High |
| P1-4 | RabbitMQ no dead-letter queue | Message loss on failure | Medium |
| P1-5 | No structured logging | Hard to debug production issues | Medium |
| P1-6 | Missing correlation IDs | Can't trace distributed requests | Medium |
| P1-7 | Swagger exposed in production | Information disclosure | Low |

### 9.3 P2 - Improvement (Next Sprint)

| ID | Issue | Impact | Effort |
|----|-------|--------|--------|
| P2-1 | No Redis caching layer | Higher DB load | Medium |
| P2-2 | N+1 query risk | Slow event listing | Medium |
| P2-3 | Duplicate DTOs across services | Code duplication | Low |
| P2-4 | No API versioning | Breaking changes risk | Medium |
| P2-5 | No request deduplication | Unnecessary API calls | Low |
| P2-6 | Frontend lacks tests | Regression risk | High |

### 9.4 P3 - Nice to Have (Future)

| ID | Issue | Impact | Effort |
|----|-------|--------|--------|
| P3-1 | No GraphQL API | Over/under-fetching | High |
| P3-2 | No container resource limits | Unstable deployments | Low |
| P3-3 | No distributed tracing | Hard to debug microservices | High |
| P3-4 | No feature flags | Risky deployments | Medium |
| P3-5 | Hardcoded email templates | Maintenance burden | Low |

---

## 10. PRIORITY ROADMAP

### Phase 2A: Security Hardening (1-2 sprints)
1. Implement httpOnly cookies for JWT
2. Add refresh token flow
3. Move secrets to environment variables / vault
4. Add rate limiting at API Gateway
5. Disable Swagger in production
6. Add CORS restrictions

### Phase 2B: Reliability & Observability (2-3 sprints)
1. Add Redis caching for events
2. Implement database indexes
3. Add structured logging with correlation IDs
4. Configure RabbitMQ dead-letter queues
5. Add integration tests for critical flows
6. Set up monitoring (Prometheus + Grafana)

### Phase 2C: Architecture Refactoring (3-4 sprints)
1. Split large service classes
2. Extract email to async event
3. Add API versioning
4. Implement Circuit Breaker (Resilience4j)
5. Add E2E tests with Cypress/Playwright
6. Migrate to Flyway for DB migrations

### Phase 2D: Performance Optimization (2 sprints)
1. N+1 query fixes
2. Connection pool tuning
3. Frontend code splitting
4. Image optimization (lazy loading, WebP)
5. CDN for static assets
6. Database query optimization

---

## 11. BUSINESS FLOW ANALYSIS

### 11.1 Authentication Flow

```
Register
  ├─> Validate input
  ├─> Create auth_user (BCrypt password)
  ├─> Generate email verification token
  ├─> Send verification email (SendGrid)
  └─> Create user_profile (async)

Email Verification
  ├─> Verify token
  └─> Set email_verified = true

Login
  ├─> Authenticate (email + password)
  ├─> Check email_verified
  ├─> Generate JWT (userId, email, role)
  └─> Return JWT + user info

API Request
  ├─> JwtAuthenticationFilter validates JWT
  ├─> Load CustomUserPrincipal
  └─> Set SecurityContext
```

**Issues:**
- ⚠️ Profile creation failure doesn't fail registration (eventual consistency)
- ⚠️ No refresh token (mentioned above)
- ✅ Email verification enforced
- ✅ BCrypt password hashing

### 11.2 Event Flow

```
Create Event (Organizer)
  ├─> Validate request
  ├─> Set organizerId from JWT
  ├─> Set default status = DRAFT
  └─> Save to event_db

Publish Event
  ├─> Validate event is DRAFT
  ├─> Run validatePublishable() checks:
  │   ├─> Title, description, category not blank
  │   ├─> Location, address, city not blank
  │   ├─> startTime < endTime
  │   ├─> startTime > now (future)
  │   ├─> totalTickets > 0
  │   ├─> availableTickets valid (0 to total)
  │   └─> price >= 0
  └─> Update status = PUBLISHED

Browse Events (Public)
  ├─> Filter only PUBLISHED status
  ├─> Filter endTime > now
  └─> Paginated results

Book Tickets
  ├─> Validate event is PUBLISHED
  ├─> Validate event not started/ended
  ├─> Check availableTickets >= quantity
  ├─> Reserve tickets (pessimistic lock)
  ├─> Create booking
  └─> Publish booking.created event
```

**Issues:**
- ✅ Proper status transitions enforced
- ✅ Inventory management with pessimistic locks
- ⚠️ No draft event preview for non-owners
- ⚠️ No event categorization/filtering in search

### 11.3 Ticket Flow

```
Purchase Complete
  ├─> Payment marked as PAID
  ├─> Create TicketAsset:
  │   ├─> user_id = buyer
  │   ├─> booking_id = booking
  │   ├─> Generate unique ticket_code
  │   ├─> Generate QR code (contains nonce, asset_id, ticket_code)
  │   └─> Set status = OWNED
  └─> Notify user

View Ticket
  ├─> Load TicketAsset by ID
  ├─> Verify ownership (user_id from JWT)
  └─> Return ticket + QR

List for Resale
  ├─> Verify ticket status = OWNED
  ├─> Verify event not started/ended
  ├─> Create TicketResaleListing
  ├─> Update TicketAsset status = LISTED_FOR_SALE
  └─> Record transfer history

Buy Resale Ticket
  ├─> Verify listing ACTIVE
  ├─> Verify buyer != seller
  ├─> Transaction:
  │   ├─> Lock listing (pessimistic)
  │   ├─> Lock ticket_asset (pessimistic)
  │   ├─> Update listing status = SOLD
  │   ├─> Update ticket_asset:
  │   │   ├─> owner_id = buyer
  │   │   ├─> Generate new QR code
  │   │   └─> status = OWNED
  │   └─> Record transfer history (PURCHASED)
  └─> Notify buyer and seller
```

**Issues:**
- ✅ Transaction safety with pessimistic locks
- ✅ QR regeneration on transfer
- ⚠️ No resale price validation (min/max)
- ⚠️ No anti-scalping measures
- ⚠️ No timeout on listings

### 11.4 Payment Flow

```
Create Payment
  ├─> Validate booking exists
  ├─> Create PaymentTransaction (status = PENDING)
  └─> Return payment info

Mock Success/Failure
  ├─> Update payment status
  └─> Update booking payment_status

Payment Succeeded Event
  ├─> PaymentService publishes to RabbitMQ
  ├─> BookingService consumes:
  │   ├─> Update booking payment_status = PAID
  │   └─> Create TicketAsset
  └─> NotificationService consumes:
      └─> Create notification
```

**Issues:**
- ✅ Async event-driven flow
- ✅ Idempotent payment status transitions
- ⚠️ No refund mechanism
- ⚠️ No payment reconciliation
- ⚠️ Mock only, no real provider integration

---

## 12. FRONTEND ARCHITECTURE

### 12.1 Tech Stack
- **Framework:** React 19
- **Build:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Charts:** Recharts
- **State:** useState/useEffect (no Redux)

### 12.2 Folder Structure
```
frontend/src/
├── api/               # Axios clients per domain
├── components/
│   ├── ui/           # Reusable UI primitives
│   ├── analytics/    # Chart components
│   └── tickets/      # Ticket-specific components
├── pages/            # Route-level pages
├── types/            # TypeScript interfaces
├── utils/            # Helpers
└── data/             # Static data
```

### 12.3 Routing

| Route | Protection | Access |
|-------|-----------|--------|
| `/` | Public | All |
| `/events` | Public | All |
| `/events/:id` | Public | All |
| `/login` | Public | All |
| `/register` | Public | All |
| `/my-tickets` | Protected | USER+ |
| `/tickets/:id` | Protected | USER+ |
| `/marketplace` | Protected | USER+ |
| `/organizer/dashboard` | Protected (organizer, admin) | Organizer+ |
| `/admin` | Protected (admin) | Admin only |

**Issues:**
- ✅ Route protection implemented
- ⚠️ No route guards for feature-level access (e.g., resale)

### 12.4 API Integration

| API Client | Base URL | Features |
|-----------|----------|---------|
| authApi | /api/auth | Login, register, forgot password |
| eventApi | /api/events | Event CRUD |
| bookingApi | /api/bookings | Booking operations |
| paymentApi | /api/payments | Payment mock |
| ticketService | /api/tickets | Ticket assets + resale |
| userApi | /api/users | Profile management |

**Issues:**
- ⚠️ No request interceptors for auth token refresh
- ⚠️ Error handling scattered across components
- ⚠️ No API request caching

---

## 13. INFRASTRUCTURE REVIEW

### 13.1 Docker Configuration

**docker-compose.yml:**
```yaml
Services: 11 containers
  - PostgreSQL (postgres:16-alpine)
  - RabbitMQ (3-management)
  - Discovery Server
  - API Gateway
  - Auth Service
  - User Service
  - Event Service
  - Booking Service
  - Notification Service
  - Payment Service
  - Frontend (Nginx)
```

**Issues:**
- ⚠️ No resource limits (CPU/Memory)
- ⚠️ Health checks only for PostgreSQL
- ⚠️ Frontend dependency on API Gateway (not just discovery)
- ⚠️ No restart policies defined

### 13.2 Database Configuration

| DB | Service | Schema | Version |
|----|---------|--------|---------|
| auth_db | Auth | auth | PostgreSQL 16 |
| user_db | User | user | PostgreSQL 16 |
| event_db | Event | event | PostgreSQL 16 |
| booking_db | Booking | booking | PostgreSQL 16 |
| notification_db | Notification | notification | PostgreSQL 16 |
| payment_db | Payment | payment | PostgreSQL 16 |

**Issues:**
- ✅ Separate DBs per service (data isolation)
- ⚠️ No connection pooling configuration visible
- ⚠️ No backup/restore scripts

### 13.3 CI/CD (Not Found)

**Required for production:**
- GitHub Actions / GitLab CI
- Automated testing pipeline
- Docker image registry (ECR, GCR, Docker Hub)
- Deployment automation (Kubernetes, ECS, etc.)

---

## 14. SUMMARY & RECOMMENDATIONS

### 14.1 System Health Score

| Category | Score (1-10) | Notes |
|----------|--------------|-------|
| Architecture | 7 | Microservices well-separated but some SRP violations |
| Security | 5 | Good auth but localStorage JWT, hardcoded secrets |
| Performance | 6 | Basic optimization, no caching, potential N+1 |
| Code Quality | 7 | Clean structure but large service classes |
| Testing | 3 | Unit tests exist but coverage low, no E2E |
| Deployment | 5 | Docker works but hardcoded secrets, no CI/CD |
| Documentation | 8 | README comprehensive, code commented |
| Database | 6 | Good schema but missing indexes |

**Overall Score: 5.6/10** - Good foundation, needs production hardening

### 14.2 Next Steps Priority

1. **Security (2 weeks)** - JWT cookies, secrets management, rate limiting
2. **Testing (2 weeks)** - Integration tests, E2E setup, increase coverage to 70%
3. **Architecture (3 weeks)** - Split services, extract common code
4. **Observability (1 week)** - Logging, monitoring, correlation IDs
5. **Performance (1 week)** - Caching, indexes, query optimization

---

## APPENDIX

### A. Useful Commands

```bash
# Build backend
mvn clean package -DskipTests

# Run tests
mvn test

# Frontend dev
cd frontend && npm install && npm run dev

# Docker compose
docker compose up --build
docker compose down

# Database migrations
psql -f scripts/database/20260701_ticket_assets.sql
psql -f scripts/database/20260702_ticket_resale_marketplace.sql

# Smoke test
./scripts/smoke-test.ps1

# Security test
./scripts/security-smoke-test.ps1
```

### B. Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| user@example.com | Password123 | USER |
| organizer@example.com | Password123 | ORGANIZER |
| admin@example.com | Password123 | ADMIN |

### C. Swagger URLs

- Auth: http://localhost:8081/swagger-ui/index.html
- User: http://localhost:8082/swagger-ui/index.html
- Event: http://localhost:8083/swagger-ui/index.html
- Booking: http://localhost:8084/swagger-ui/index.html
- Notification: http://localhost:8085/swagger-ui/index.html
- Payment: http://localhost:8086/swagger-ui/index.html

---

**End of Audit Report**