# Event Lifecycle Audit

Ngay khảo sát: 2026-06-12.

Phạm vi: chỉ đọc code liên quan đến vòng đời Event, ticket inventory, Booking Service, frontend sử dụng Event, và cơ chế schema database. Tài liệu này không thay đổi nghiệp vụ.

## Cấu trúc Event Service

Event Service nằm tại `backend/event-service`.

Các thành phần chính:

- Entity: `src/main/java/com/eventhub/event/entity/Event.java`
- Enum trạng thái: `src/main/java/com/eventhub/event/entity/EventStatus.java`
- DTO tạo event: `src/main/java/com/eventhub/event/dto/CreateEventRequest.java`
- DTO cập nhật event: `src/main/java/com/eventhub/event/dto/UpdateEventRequest.java`
- DTO response public: `src/main/java/com/eventhub/event/dto/EventResponse.java`
- DTO response internal cho Booking Service: `src/main/java/com/eventhub/event/dto/InternalEventResponse.java`
- DTO số lượng vé: `src/main/java/com/eventhub/event/dto/TicketQuantityRequest.java`
- Controller public/organizer/admin: `src/main/java/com/eventhub/event/controller/EventController.java`
- Controller nội bộ: `src/main/java/com/eventhub/event/controller/InternalEventController.java`
- Service nghiệp vụ: `src/main/java/com/eventhub/event/service/EventService.java`
- Repository: `src/main/java/com/eventhub/event/repository/EventRepository.java`
- Specification filter: `src/main/java/com/eventhub/event/repository/EventSpecification.java`
- Mapper: `src/main/java/com/eventhub/event/mapper/EventMapper.java`
- Security config: `src/main/java/com/eventhub/event/config/SecurityConfig.java`
- Internal API key validator: `src/main/java/com/eventhub/event/security/InternalApiKeyValidator.java`
- Upload ảnh event: `src/main/java/com/eventhub/event/service/EventImageStorageService.java`
- Static resource mapping cho ảnh event: `src/main/java/com/eventhub/event/config/WebMvcConfig.java`
- Seeder demo data: `src/main/java/com/eventhub/event/config/EventDataSeeder.java` và `src/main/java/com/eventhub/event/config/SampleDataConfig.java`
- Config OpenAPI/Swagger: không có class riêng; dùng dependency `springdoc-openapi-starter-webmvc-ui` và `springdoc.swagger-ui.path` trong `application.yml`.
- Global exception handler: dùng chung từ `backend/common-lib/src/main/java/com/eventhub/common/exception/GlobalExceptionHandler.java`
- Test liên quan Event: không có thư mục `backend/event-service/src/test` trong trạng thái hiện tại.

Không thấy `EventServiceImpl`; project đang dùng trực tiếp class `EventService`.

## Trạng thái Event hiện tại

Event hiện có field:

```java
@Enumerated(EnumType.STRING)
private EventStatus status;
```

Kết luận:

- Có field `status`.
- Enum được lưu dạng `STRING`, không phải ordinal.
- Entity chưa khai báo `@Column(nullable = false)` cho `status`.
- Không có default value ở database do schema đang do Hibernate `ddl-auto: update` tạo/cập nhật.
- `@PrePersist` đặt mặc định `DRAFT` nếu `status == null`.

Các giá trị `EventStatus` hiện có:

- `DRAFT`
- `PUBLISHED`
- `CANCELLED`
- `COMPLETED`

Luồng tạo Event:

- `CreateEventRequest` có field `EventStatus status`, tức client có thể gửi status.
- `EventMapper.toEntity()` set status bằng `request.status() == null ? DRAFT : request.status()`.
- Vì vậy event mới mặc định là `DRAFT` nếu client không gửi status, nhưng client có thể tạo thẳng `PUBLISHED`, `CANCELLED`, hoặc `COMPLETED`.
- `EventService.create()` gọi `validatePublishable(event)`. Hàm này chỉ kiểm tra dữ liệu bắt buộc khi status là `PUBLISHED`; nếu tạo `DRAFT`, dữ liệu vẫn bị ràng buộc bởi annotation DTO như `@NotBlank`, `@NotNull`.

Luồng update Event:

- `UpdateEventRequest` có field `EventStatus status`.
- `EventMapper.update()` đổi status nếu request status khác null.
- Vì vậy client có thể đổi trạng thái thông qua `PUT /api/events/{id}`, không bắt buộc đi qua endpoint publish/cancel.
- `EventService.update()` gọi `validatePublishable(event)` sau khi map.

Event kết thúc:

- Có enum `COMPLETED`, nhưng không thấy code tự động chuyển event sang `COMPLETED`.
- Không có scheduler.
- Không thấy logic public search hoặc reserve ticket dựa vào `endTime` để xác định event đã kết thúc.
- Hiện trạng event kết thúc chủ yếu là dữ liệu thủ công qua `status=COMPLETED`; `endTime` chỉ dùng validate `startTime < endTime` và filter range.

## API Event hiện tại

`EventController` expose các endpoint:

- `GET /api/events/health`
- `GET /api/events`
- `GET /api/events/{id}`
- `POST /api/events`
- `POST /api/events/images/upload`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`
- `GET /api/events/organizer/{organizerId}`
- `PATCH /api/events/{id}/publish`
- `PATCH /api/events/{id}/cancel`

Publish:

- Endpoint: `PATCH /api/events/{id}/publish`
- Method service: `EventService.publish()`
- Logic hiện tại:
  - Load event.
  - Kiểm tra owner hoặc admin.
  - Set status `PUBLISHED`.
  - Gọi `validatePublishable(event)`.
  - Save.
- Chưa chặn publish từ `CANCELLED` hoặc `COMPLETED`.
- Chưa chặn publish event đã qua `endTime`.

Cancel:

- Endpoint: `PATCH /api/events/{id}/cancel`
- Method service: `EventService.cancelAndReturn()`
- Logic hiện tại:
  - Load event.
  - Kiểm tra owner hoặc admin.
  - Set status `CANCELLED`.
  - Save.
- Không xóa vật lý.
- Không kiểm tra event đã có booking hay chưa.
- Không tác động ticket inventory hoặc booking hiện có.

Delete:

- Endpoint: `DELETE /api/events/{id}`
- Operation summary ghi "Soft delete event by switching it to CANCELLED".
- Method service: `EventService.cancel()`.
- Đây là soft cancel, không phải physical delete.

Public list:

- Endpoint: `GET /api/events`.
- Nếu request không gửi `status`, `EventService.search()` tự set criteria status thành `PUBLISHED`.
- Nếu request có gửi `status`, service dùng nguyên status đó.
- Vì vậy public endpoint có thể trả `DRAFT`, `CANCELLED`, hoặc `COMPLETED` nếu client gọi `GET /api/events?status=DRAFT`, `status=CANCELLED`, hoặc `status=COMPLETED`.
- Public list không lọc `endTime > now`.
- Event `PUBLISHED` đã kết thúc vẫn xuất hiện nếu chưa bị đổi status.

Public detail:

- `GET /api/events/{id}` permit all trong `SecurityConfig`.
- Không kiểm tra status hoặc endTime.
- Public có thể xem event DRAFT/CANCELLED/COMPLETED nếu biết id.

Organizer list:

- `GET /api/events/organizer/{organizerId}` yêu cầu authenticated.
- Owner organizer chỉ xem chính mình; admin xem được người khác.
- Có thể filter theo `status`.

## Ticket inventory hiện tại

Field inventory trong `Event`:

- `totalTickets`
- `availableTickets`

Không có field:

- `reservedTickets`
- `soldTickets`
- `capacity` riêng biệt

Khởi tạo inventory:

- `EventMapper.toEntity()` set `availableTickets = totalTickets`.
- `Event.onCreate()` cũng set `availableTickets = totalTickets` nếu `availableTickets == null`.

Reserve ticket:

- Endpoint internal: `PATCH /api/events/internal/{eventId}/reserve-tickets`
- Controller: `InternalEventController.reserveTickets()`
- Service: `EventService.reserveTickets()`
- Có `@Transactional`.
- Load event bằng `getEventForUpdate()`.
- Repository dùng:

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select e from Event e where e.id = :id")
Optional<Event> findByIdForUpdate(@Param("id") Long id);
```

- Có dùng pessimistic lock.
- Kiểm tra status: chỉ cho reserve nếu `status == PUBLISHED`.
- Kiểm tra số vé: `availableTickets < quantity` thì lỗi.
- Trừ `availableTickets` và save.

Release ticket:

- Endpoint internal: `PATCH /api/events/internal/{eventId}/release-tickets`
- Controller: `InternalEventController.releaseTickets()`
- Service: `EventService.releaseTickets()`
- Có `@Transactional`.
- Load event bằng pessimistic lock.
- Cộng lại `availableTickets`.
- Chặn nếu `availableTickets + quantity > totalTickets`.
- Không kiểm tra status event.

Các thiếu sót inventory:

- Reserve không kiểm tra `startTime` hoặc `endTime`.
- Reserve không chặn event đã kết thúc nếu status vẫn là `PUBLISHED`.
- Reserve không kiểm tra `availableTickets` null; hiện DTO tạo/update có validation nhưng dữ liệu cũ có thể null.
- Cancel event không ảnh hưởng trực tiếp đến `availableTickets` hoặc booking đã tạo.
- Không có cơ chế giữ vé tạm thời; booking tạo là confirmed ngay sau reserve.

## Giao tiếp Event Service và Booking Service

Booking Service nằm tại `backend/booking-service`.

Các file liên quan:

- Entity: `src/main/java/com/eventhub/booking/entity/Booking.java`
- Booking status enum: `src/main/java/com/eventhub/booking/enums/BookingStatus.java`
- Controller public: `src/main/java/com/eventhub/booking/controller/BookingController.java`
- Controller internal payment: `src/main/java/com/eventhub/booking/controller/InternalBookingController.java`
- Service: `src/main/java/com/eventhub/booking/service/BookingService.java`
- Feign client gọi Event Service: `src/main/java/com/eventhub/booking/client/EventServiceClient.java`
- Feign interceptor gắn internal key: `src/main/java/com/eventhub/booking/config/InternalFeignConfig.java`
- DTO event nhận từ Event Service: `src/main/java/com/eventhub/booking/dto/InternalEventResponse.java`
- DTO envelope từ Event Service: `src/main/java/com/eventhub/booking/dto/EventApiResponse.java`

Booking entity:

- Table: `bookings`
- Status field: `@Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)`
- BookingStatus gồm `PENDING`, `CONFIRMED`, `CANCELLED`, `EXPIRED`.
- `@PrePersist` mặc định `CONFIRMED`.
- PaymentStatus mặc định `UNPAID`.

Luồng tạo booking:

1. `BookingController.POST /api/bookings`.
2. `BookingService.create()`.
3. Gọi `fetchEvent(eventId)` qua Feign `GET /api/events/internal/{eventId}`.
4. `validateBookable()` kiểm tra:
   - `event.status()` phải bằng string `"PUBLISHED"`.
   - `availableTickets >= quantity`.
5. Gọi `reserveTickets()` qua Feign `PATCH /api/events/internal/{eventId}/reserve-tickets`.
6. Save Booking với status `CONFIRMED`, paymentStatus `UNPAID`.
7. Publish RabbitMQ event `booking.created`.

Luồng hủy booking:

1. `PATCH /api/bookings/{id}/cancel`.
2. Kiểm tra owner hoặc admin.
3. Nếu booking đã `CANCELLED` thì lỗi.
4. Gọi Event Service release ticket.
5. Set booking status `CANCELLED`, set `cancelledAt`.
6. Nếu paymentStatus `PAID`, đổi thành `REFUNDED`.
7. Save và publish RabbitMQ event `booking.cancelled`.

Xử lý lỗi Event Service:

- `fetchEvent()` bắt `FeignException.NotFound` và ném `ResourceNotFoundException("Event not found")`.
- Các `FeignException` khác được map thành `BadRequestException` với `contentUTF8()`, hoặc message, hoặc fallback `"Event service request failed with status X"`.
- Không thấy retry/circuit breaker.

Test Booking:

- Không có thư mục `backend/booking-service/src/test` trong trạng thái hiện tại.

## Cách bảo vệ internal API

Event Service:

- `SecurityConfig` permit all `/api/events/internal/**` ở tầng Spring Security.
- Bảo vệ thực tế nằm trong controller bằng `InternalApiKeyValidator.requireValid(internalApiKey)`.
- Header yêu cầu: `X-Internal-Api-Key`.
- Nếu thiếu hoặc sai key, ném `ForbiddenException("Invalid internal API key")`.

Booking Service:

- `InternalFeignConfig` tạo `RequestInterceptor` tự động thêm header `X-Internal-Api-Key` cho Feign calls.
- Booking internal endpoints cũng permit all trong Spring Security và tự validate bằng `InternalApiKeyValidator`.

Điểm cần lưu ý:

- Internal endpoints không authenticated bằng JWT, chỉ dựa vào shared internal API key.
- Security smoke test hiện có kiểm tra internal API không key và có key.

## Frontend liên quan

Các file chính:

- Type Event: `frontend/src/types/domain.ts`
- Event API client: `frontend/src/api/eventApi.ts`
- Axios client: `frontend/src/api/axiosClient.ts`
- Envelope unwrap: `frontend/src/api/apiUtils.ts`
- Event list page: `frontend/src/pages/EventListPage.tsx`
- Event detail page: `frontend/src/pages/EventDetailPage.tsx`
- Create event page: `frontend/src/pages/CreateEventPage.tsx`
- Organizer dashboard: `frontend/src/pages/OrganizerDashboardPage.tsx`
- Event card: `frontend/src/components/EventCard.tsx`
- Status badge: `frontend/src/components/StatusBadge.tsx`
- Booking API client: `frontend/src/api/bookingApi.ts`

Frontend Event type:

```ts
status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
```

Backend status mapping trong `eventApi.ts`:

- `CANCELLED` -> `cancelled`
- `COMPLETED` -> `completed`
- Mọi status khác, gồm `DRAFT` và `PUBLISHED`, -> `upcoming`

Payload gửi lên backend trong `toBackendEventPayload()`:

- `cancelled` -> `CANCELLED`
- `completed` -> `COMPLETED`
- Các status còn lại -> `PUBLISHED`

Tác động:

- Trang tạo event hiện có state `status = 'upcoming'`, nên gửi backend status `PUBLISHED`.
- Frontend không tạo draft theo mặc định.
- Frontend không phân biệt `DRAFT` và `PUBLISHED` khi nhận dữ liệu; `DRAFT` cũng hiển thị như `upcoming`.
- `StatusBadge` có style cho `draft` và `published`, nhưng mapper không trả các chuỗi này cho Event.

Trang danh sách Event:

- `EventListPage` gọi `eventApi.getAll()` với `keyword` và `category`.
- Không gửi `status`.
- Dựa vào backend để mặc định lọc `PUBLISHED`.

Trang chi tiết Event:

- `EventDetailPage` gọi `eventApi.getById(id)`.
- Tính `availableTickets = capacity - booked`.
- Chỉ disable nút booking khi hết vé.
- Không kiểm tra `event.status` là `cancelled` hoặc `completed`.
- Không kiểm tra ngày kết thúc.
- Nếu backend từ chối booking, lỗi hiển thị qua toast.

Trang tạo Event:

- `CreateEventPage` gọi `eventApi.create()`.
- Label UI ghi "Phát hành sự kiện".
- Không có mode save draft.
- Không gọi endpoint publish riêng.

Organizer dashboard:

- Load event bằng `eventApi.getByOrganizer(user.id)` hoặc admin dùng `eventApi.getAll()`.
- Hủy event thông qua `eventApi.delete(id)`, tức gọi `DELETE /api/events/{id}`.
- Không có nút hoặc client method gọi `PATCH /api/events/{id}/publish`.
- Không có client method gọi `PATCH /api/events/{id}/cancel`.

Common API envelope:

- `apiUtils.unwrap()` nhận response dạng `{ success, message, data }` và trả `data`.
- `axiosClient` gắn JWT từ localStorage vào `Authorization`.
- Error interceptor đọc `error.response.data.message`.

## Database schema và migration mechanism

Cơ chế schema thực tế:

- Không thấy Flyway dependency.
- Không thấy Liquibase dependency.
- Không thấy `schema.sql` hoặc migration versioned SQL cho Event.
- Các service dùng Hibernate:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update
```

- Docker init SQL tại `docker/postgres/init.sql` chỉ tạo database:
  - `auth_db`
  - `user_db`
  - `event_db`
  - `booking_db`
  - `notification_db`
  - `payment_db`

Event schema từ entity hiện tại:

- Table: `events`
- Cột status do field `status` tạo.
- Vì entity dùng `@Enumerated(EnumType.STRING)`, Hibernate lưu dạng string.
- Không có default database-level cho status.
- Không có nullable constraint rõ ràng ở annotation field status.
- Không thấy index riêng cho `status`, `startTime`, `organizerId`, hoặc public search.
- Dữ liệu seed set status `PUBLISHED`.

Khả năng tương thích dữ liệu cũ:

- `@PrePersist` chỉ áp dụng khi insert mới qua JPA, không backfill row cũ.
- Nếu database cũ có event chưa có status hoặc status null, code public search theo `status = PUBLISHED` sẽ không hiển thị các row đó.
- Nếu thêm constraint `NOT NULL` trong tương lai cần backfill dữ liệu trước.

## Những lỗi hoặc điểm chưa nhất quán

1. Public list có thể bị lộ trạng thái không public:
   - `GET /api/events` mặc định lọc `PUBLISHED`, nhưng nếu client truyền `status`, service chấp nhận mọi status.

2. Event đã kết thúc vẫn có thể public/book nếu status vẫn là `PUBLISHED`:
   - Không lọc `endTime > now` ở public list.
   - Không kiểm tra endTime khi reserve.
   - Không có scheduler chuyển sang `COMPLETED`.

3. `COMPLETED` tồn tại trong enum nhưng chưa có lifecycle thực tế:
   - Không có scheduler.
   - Không có service method mark completed.
   - Không có rule chặn update/publish/cancel theo completed ngoài việc reserve chỉ chấp nhận PUBLISHED.

4. Tạo event không thực sự mặc định draft theo luồng frontend:
   - Backend default là DRAFT nếu không gửi status.
   - Nhưng `CreateEventRequest` cho phép status và frontend đang gửi `PUBLISHED`.

5. Client có thể đổi status bằng update:
   - `UpdateEventRequest.status` và `EventMapper.update()` cho phép đổi trạng thái qua `PUT /api/events/{id}`.

6. Publish chưa đủ rule:
   - Có validate thiếu title/time/ticket khi status PUBLISHED.
   - Chưa validate description/category/location/city/price/availableTickets/organizerId.
   - Chưa chặn publish event cancelled/completed/đã hết hạn.
   - Service set status PUBLISHED trước rồi validate.

7. Cancel event không xử lý booking liên quan:
   - Không xóa vật lý là đúng hướng soft-cancel.
   - Nhưng chưa kiểm tra hoặc ghi nhận event đã có booking.
   - Không thông báo/hủy booking/refund; có thể là scope sau.

8. Frontend status model lệch backend:
   - Backend dùng `DRAFT/PUBLISHED/CANCELLED/COMPLETED`.
   - Frontend dùng `upcoming/ongoing/completed/cancelled`.
   - `DRAFT` và `PUBLISHED` đều map thành `upcoming`.
   - `StatusBadge` đã có `draft/published`, nhưng không được dùng cho event mapping.

9. Frontend booking button chưa dựa vào status/endTime:
   - Chỉ disable khi hết vé.
   - Event cancelled/completed có thể vẫn hiện nút booking nếu detail API trả về.

10. Internal API security đang tách ở controller:
    - Spring Security permit all internal endpoints.
    - Controller validate key thủ công. Hoạt động được, nhưng dễ bỏ sót nếu thêm endpoint internal mới.

11. Không có unit/integration test hiện tại cho Event lifecycle và Booking reserve/release.

12. Seeder bị trùng vai trò:
    - `SampleDataConfig` seed khi repository count = 0.
    - `EventDataSeeder` luôn thử seed 8 event nếu title chưa tồn tại.
    - Cả hai tạo event PUBLISHED.

## Danh sách file dự kiến phải sửa trong các bước sau

Backend Event Service:

- `backend/event-service/src/main/java/com/eventhub/event/entity/Event.java`
- `backend/event-service/src/main/java/com/eventhub/event/entity/EventStatus.java` nếu cần bổ sung behavior/helper, không cần tạo enum mới.
- `backend/event-service/src/main/java/com/eventhub/event/dto/CreateEventRequest.java`
- `backend/event-service/src/main/java/com/eventhub/event/dto/UpdateEventRequest.java`
- `backend/event-service/src/main/java/com/eventhub/event/dto/EventResponse.java` nếu cần field derived như bookable/publicVisible.
- `backend/event-service/src/main/java/com/eventhub/event/dto/InternalEventResponse.java`
- `backend/event-service/src/main/java/com/eventhub/event/controller/EventController.java`
- `backend/event-service/src/main/java/com/eventhub/event/controller/InternalEventController.java`
- `backend/event-service/src/main/java/com/eventhub/event/service/EventService.java`
- `backend/event-service/src/main/java/com/eventhub/event/repository/EventRepository.java`
- `backend/event-service/src/main/java/com/eventhub/event/repository/EventSpecification.java`
- `backend/event-service/src/main/java/com/eventhub/event/mapper/EventMapper.java`
- `backend/event-service/src/main/java/com/eventhub/event/config/EventDataSeeder.java`
- `backend/event-service/src/main/java/com/eventhub/event/config/SampleDataConfig.java`
- Event lifecycle tests dưới `backend/event-service/src/test/java/...`

Backend Booking Service:

- `backend/booking-service/src/main/java/com/eventhub/booking/service/BookingService.java`
- `backend/booking-service/src/main/java/com/eventhub/booking/client/EventServiceClient.java` nếu internal DTO thay đổi.
- `backend/booking-service/src/main/java/com/eventhub/booking/dto/InternalEventResponse.java`
- Booking tests dưới `backend/booking-service/src/test/java/...`

Frontend:

- `frontend/src/types/domain.ts`
- `frontend/src/api/eventApi.ts`
- `frontend/src/pages/EventListPage.tsx`
- `frontend/src/pages/EventDetailPage.tsx`
- `frontend/src/pages/CreateEventPage.tsx`
- `frontend/src/pages/OrganizerDashboardPage.tsx`
- `frontend/src/components/EventCard.tsx`
- `frontend/src/components/StatusBadge.tsx`
- `frontend/src/utils/analyticsUtils.ts`

Database/docs:

- Nếu vẫn chưa dùng Flyway/Liquibase: tạo SQL riêng để backfill status/null/default/index theo hướng dẫn vận hành.
- Nếu sau này thêm migration tool thì phải làm thành prompt riêng, không tự thêm trong lifecycle prompt.
- `docs/api-design.md`
- `docs/database-design.md`
- `docs/postman/EventHub.postman_collection.json`
- `README.md`

## Khác biệt giữa code thực tế và README hiện tại

README hiện tại đang được chỉnh lại trong working tree, chưa commit. So với code thực tế:

- README nói organizer publish events, nhưng code cho phép tạo event trực tiếp với status từ request; frontend đang tạo `PUBLISHED` chứ không gọi publish endpoint.
- README có API overview "publish, cancel" nhưng ví dụ create event vẫn gửi `"status": "PUBLISHED"`.
- README mô tả Event Service validate event status and ticket availability; đúng với reserve status PUBLISHED và availableTickets, nhưng chưa nói rõ không kiểm tra endTime.
- README nói mỗi service owns database và dùng PostgreSQL riêng; đúng.
- README không nêu rõ public `GET /api/events` có thể bị filter status khác PUBLISHED nếu query param `status` được truyền.
- README không nêu rõ không có Flyway/Liquibase và schema đang dựa vào Hibernate `ddl-auto: update`.
