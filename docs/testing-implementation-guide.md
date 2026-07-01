# Testing Implementation Guide - Phase 5

## Overview

EventHub có foundation tests tốt trong booking, auth, và event services. Phase 5 tập trung vào:
1. User service tests (P0)
2. Payment service tests (P0)
3. Integration tests cho critical flows
4. Security tests
5. Coverage improvements

## Test Environment Setup ✅

Đã hoàn thành:
- ✅ `application-test.yml` cho booking-service (H2 + PostgreSQL mode)
- ✅ `application-test.yml` cho auth-service
- ✅ `application-test.yml` cho event-service
- ✅ `application-test.yml` cho user-service
- ✅ `application-test.yml` cho payment-service

## Current Test Status

### Booking Service (✅ Good)
- 3 test files
- 28+ test methods
- Coverage: ~70%
- Tests: BookingServiceTest, TicketResaleServiceTest, TicketOwnershipServiceTest

### Auth Service (✅ Good)
- 1 test file
- 14+ test methods
- Coverage: ~60%
- Tests: AuthServiceTest

### Event Service (✅ Good)
- 7 test files
- 40+ test methods
- Coverage: ~75%
- Tests: Event lifecycle, concurrency, security, mapper, repository

### User Service (⚠️ Needs Work)
- 0 test files → 1 test file created
- New: UserProfileServiceTest (8 test methods)
- Coverage: 0% → target 80%

### Payment Service (❌ Missing)
- 0 test files
- Coverage: 0%
- Priority: Critical

## Implementation Steps

### Step 1: User Service Tests (DONE)
Đã tạo `UserProfileServiceTest.java` với các test cases:
- ✅ getByAuthUserId - success
- ✅ getByAuthUserId - not found
- ✅ create - success
- ✅ create - duplicate authUserId
- ✅ create - duplicate email
- ✅ update - success
- ✅ update - not found
- ✅ upsertCurrentUser - creates new
- ✅ upsertCurrentUser - updates existing

### Step 2: Payment Service Tests (TODO)

Cần tạo test files:

```
backend/payment-service/src/test/java/com/eventhub/payment/
├── service/
│   └── PaymentServiceTest.java
├── repository/
│   └── PaymentTransactionRepositoryTest.java
└── controller/
    └── PaymentControllerSecurityTest.java
```

**Test Cases - PaymentService:**

1. **createPaymentTransaction**
   - Creates payment with PENDING status
   - Generates unique paymentCode
   - Links to booking

2. **markAsSuccess**
   - Updates status to PAID
   - Sets paidAt timestamp
   - Triggers booking service callback

3. **markAsFailed**
   - Updates status to FAILED
   - Sets failedAt timestamp
   - Stores failure reason

4. **getByBookingId**
   - Returns payment for booking
   - Throws if not found

5. **getByUserId**
   - Returns payment history
   - Paginated

**Test Cases - PaymentControllerSecurity:**

1. **Unauthenticated access** → 401
2. **User access to own payment** → 200
3. **User access to others payment** → 403
4. **Admin access** → 200

### Step 3: Integration Tests (TODO)

Tạo end-to-end flow tests:

```
backend/booking-service/src/test/java/com/eventhub/booking/integration/
└── TicketLifecycleIntegrationTest.java
```

**Scenario 1: Complete Purchase Flow**
```java
@Test
void completePurchaseFlow() {
    // 1. Register user
    // 2. Login → get token
    // 3. Create event (organizer)
    // 4. Publish event
    // 5. Book tickets
    // 6. Make payment
    // 7. Verify ticket asset created
    // 8. View ticket
}
```

**Scenario 2: Resale Flow**
```java
@Test
void resaleFlow() {
    // 1. User A buys ticket
    // 2. User A lists ticket for resale
    // 3. User B browses marketplace
    // 4. User B purchases ticket
    // 5. Verify ownership transferred
    // 6. Verify QR changed
    // 7. Verify listing marked SOLD
}
```

### Step 4: Security Tests (TODO)

Tạo security test files cho mỗi service:

**Booking Service Security Tests:**
```java
@Test
void userCannotAccessOthersBooking() // 403
void userCannotCancelOthersBooking() // 403
void unauthenticatedCannotBook() // 401
```

**Event Service Security Tests:**
```java
@Test
void nonOwnerCannotPublishEvent() // 403
void nonOwnerCannotCancelEvent() // 403
void userCannotCreateEvent() // 403
```

**User Service Security Tests:**
```java
@Test
void userCannotAccessOthersProfile() // 403
void userCannotUpdateOthersProfile() // 403
```

### Step 5: Repository Tests (TODO)

Test database queries với Testcontainers hoặc H2:

```java
@Test
void findByOwnerIdAndStatusReturnsCorrectTickets()
void findActiveListingsReturnsOnlyActive()
void findBookingHistoryReturnsPaginatedResults()
```

### Step 6: Error Case Tests (TODO)

Test error scenarios:

```java
@Test
void bookingExpiredEventReturnsError()
void bookingInsufficientTicketsReturnsError()
void resaleSoldTicketReturnsError()
void paymentAlreadyPaidBookingReturnsError()
```

## Test Coverage Targets

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| booking-service | 70% | 85% | High |
| auth-service | 60% | 80% | High |
| event-service | 75% | 85% | High |
| user-service | 0% | 80% | Critical |
| payment-service | 0% | 80% | Critical |
| **Overall** | ~60% | **80%** | - |

## Test Commands

```bash
# Run all tests
mvn test

# Run specific service
cd backend/booking-service && mvn test
cd backend/auth-service && mvn test
cd backend/user-service && mvn test

# Run specific test
mvn test -Dtest=UserProfileServiceTest

# Generate coverage report
mvn jacoco:report

# View coverage
open backend/user-service/target/site/jacoco/index.html
```

## CI/CD Integration

### GitHub Actions (TODO)

Tạo `.github/workflows/test.yml`:

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - run: mvn test
      - run: mvn jacoco:report
```

## Frontend Tests (TODO - Phase 6+)

```bash
cd frontend
npm test
npm run test:coverage
```

Component tests cần thiết:
- LoginForm
- TicketCard
- MarketplaceCard
- SellTicketModal

## Next Steps

1. ✅ Create testing audit report
2. ✅ Setup test profiles (H2)
3. ✅ Create user service tests
4. **TODO**: Create payment service tests
5. **TODO**: Create integration tests
6. **TODO**: Create security tests
7. **TODO**: Setup CI/CD
8. **TODO**: Generate coverage reports
9. **TODO**: Add frontend tests
10. **TODO**: Performance tests

## Success Metrics

- Coverage: ≥80% business logic
- All P0 tests passing
- CI/CD green on all branches
- No security test failures
- Integration tests covering main flows

## Files Created So Far

### Documentation
- `docs/testing-audit-report.md`
- `docs/testing-implementation-guide.md` (this file)

### Test Profiles
- `backend/booking-service/src/test/resources/application-test.yml`
- `backend/auth-service/src/test/resources/application-test.yml`
- `backend/event-service/src/test/resources/application-test.yml`
- `backend/user-service/src/test/resources/application-test.yml`
- `backend/payment-service/src/test/resources/application-test.yml`

### Test Files
- `backend/user-service/src/test/java/com/eventhub/user/service/UserProfileServiceTest.java` (8 tests)

## Recommendation

Phase 5 provides a solid testing foundation. Continue with:
1. Payment service tests (1-2 days)
2. Integration tests (2-3 days)
3. Security tests expansion (1 day)
4. CI/CD setup (1 day)

Total remaining effort: ~5-7 days for production-ready test suite.