$ErrorActionPreference = "Stop"

$checks = @(
    @{ Name = "Eureka"; Url = "http://localhost:8761" },
    @{ Name = "Auth"; Url = "http://localhost:8080/api/auth/health" },
    @{ Name = "User"; Url = "http://localhost:8080/api/users/health" },
    @{ Name = "Event"; Url = "http://localhost:8080/api/events/health" },
    @{ Name = "Booking"; Url = "http://localhost:8080/api/bookings/health" },
    @{ Name = "Payment"; Url = "http://localhost:8080/api/payments/health" },
    @{ Name = "Notification"; Url = "http://localhost:8080/api/notifications/health" }
)

foreach ($check in $checks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 20
        Write-Host ("[OK] {0} {1}" -f $check.Name, $response.StatusCode) -ForegroundColor Green
    } catch {
        Write-Host ("[FAIL] {0} - {1}" -f $check.Name, $_.Exception.Message) -ForegroundColor Red
    }
}
