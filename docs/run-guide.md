# EventHub Run Guide

## Yêu cầu cho MacBook Pro M1

- Java 17
- Maven
- Node.js 22
- Docker Desktop for Mac
- Terminal zsh (mặc định trên macOS)
- PowerShell 7 nếu muốn chạy script smoke test (tùy chọn)

> Trên Mac M1, không cần dùng WSL. Docker Desktop chạy trực tiếp trên macOS và nên dùng bản mới nhất.

## Chạy toàn bộ hệ thống bằng Docker Compose

Từ thư mục gốc của project:

```bash
cd /Users/your-name/Documents/GitHub/EventHub
mvn clean package -DskipTests
docker compose up --build
```

Mở các địa chỉ sau sau khi container khởi động:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka: http://localhost:8761
- RabbitMQ UI: http://localhost:15672

Thông tin đăng nhập RabbitMQ:

```text
eventhub / eventhub
```

Sau lần build đầu tiên, nếu không cần rebuild image thì dùng lệnh nhanh hơn:

```bash
docker compose up
```

## Chạy frontend riêng lẻ

Dùng khi backend đã chạy sẵn bằng Docker Compose hoặc local:

```bash
cd /Users/your-name/Documents/GitHub/EventHub/frontend
npm install
npm run dev
```

Mở:

```text
http://localhost:5173
```

Frontend sẽ gọi API thật. Nếu API Gateway không chạy trên http://localhost:8080, hãy đặt biến môi trường sau trước khi chạy:

```bash
export VITE_API_BASE_URL=http://localhost:8080
```

## Smoke test

Sau khi stack Docker đã chạy:

```bash
cd /Users/your-name/Documents/GitHub/EventHub
pwsh -File ./scripts/smoke-test.ps1
```

Nếu chưa cài PowerShell 7 trên Mac:

```bash
brew install --cask powershell
```

Kết quả mong đợi: Eureka và các health endpoint backend trả về `OK`.

## Lưu ý riêng cho Mac M1

- Nếu Docker báo lỗi về kiến trúc hoặc image không chạy được, thử rebuild theo ARM64:

```bash
docker compose build --platform linux/arm64
```

- Nếu container cũ bị lỗi, thường nên xóa stack cũ trước khi chạy lại:

```bash
docker compose down
```

## Các lệnh hữu ích

Dừng container:

```bash
docker compose down
```

Xem container đang chạy:

```bash
docker compose ps
```

Xem log:

```bash
docker compose logs -f
```

Kiểm tra frontend local:

```bash
cd /Users/your-name/Documents/GitHub/EventHub/frontend
npm run lint
npm run build
```

Build backend local:

```bash
cd /Users/your-name/Documents/GitHub/EventHub
mvn clean package -DskipTests
```

## CI/CD

GitHub Actions sẽ chạy kiểm tra backend và frontend khi push hoặc tạo pull request vào nhánh `main`.

Xem thêm:

```text
docs/ci-cd.md
```
