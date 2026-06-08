# EventHub - Microservices Event Management Platform

## CV Description

- Built a full-stack event management and ticket booking platform using Spring Boot microservices and React.
- Implemented API Gateway, Eureka service discovery, JWT authentication, and role-based access control.
- Developed core services including Auth, User, Event, Booking, Payment, and Notification services.
- Integrated PostgreSQL per service, RabbitMQ for asynchronous communication, and Docker Compose for local deployment.
- Implemented ticket booking flow with ticket availability management, mock payment workflow, and event-driven notifications.
- Designed and implemented a responsive frontend using React, Vite, Tailwind CSS, and Axios.
- Built interactive analytics dashboards with Recharts to visualize bookings, revenue, event status, and payment status.

## Interview Notes

1. Why microservices?
   - To split business capabilities into independently owned services such as auth, event, booking, payment, and notification.

2. What does API Gateway do?
   - It provides one entry point for clients and routes requests to backend services through Eureka.

3. What does Eureka do?
   - It lets services register and discover each other by service name instead of hard-coded host and port.

4. Why does each service have its own database?
   - It preserves service ownership and reduces tight coupling between domains.

5. Why RabbitMQ?
   - It decouples workflows such as booking and payment from notification processing.

6. How does the project prevent overselling tickets?
   - Event Service reserves tickets inside a transaction using a pessimistic database lock.

7. How does JWT work here?
   - Auth Service issues a token with user identity and role claims. Protected services parse the token from the Authorization header.

8. How is mock payment different from real payment?
   - Mock payment updates local transaction state only. A real provider would require signed callbacks, reconciliation, and security checks.

9. What is the Saga pattern in this project?
   - Payment Service coordinates payment status update and Booking Service payment status update across separate databases.

10. If Notification Service fails, does Booking fail?
    - No. Booking publishes events to RabbitMQ and continues even if notification processing is temporarily unavailable.

11. Dashboard analytics lấy dữ liệu từ đâu?
    - Dữ liệu lấy từ các service hiện có hoặc analytics endpoints khi có. Frontend có fallback demo data để dashboard vẫn demo được.

12. Vì sao dùng chart trong frontend thay vì tạo analytics service riêng?
    - Giai đoạn này tránh over-engineering. Dashboard cần chạy ổn trước, nên frontend tổng hợp dữ liệu từ event, booking, payment và mock fallback.

13. Recharts hoạt động thế nào?
    - Recharts nhận mảng dữ liệu dạng object và render chart React responsive như LineChart, BarChart, PieChart với Tooltip, Axis và Legend.

14. Organizer chỉ xem analytics của mình bằng cách nào?
    - Frontend lọc event theo `organizerId` của current user. Backend thật nên tiếp tục enforce bằng JWT role/owner check.

15. Admin analytics khác organizer analytics thế nào?
    - Admin xem số liệu toàn platform: users, events, bookings, payments, revenue và notifications. Organizer chỉ xem event/bookings/revenue của mình.

16. Khi analytics API lỗi thì frontend xử lý thế nào?
    - Frontend hiển thị thông báo nhẹ và dùng demo fallback data an toàn, không để dashboard crash hoặc trắng màn hình.
