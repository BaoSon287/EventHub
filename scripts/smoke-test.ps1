$ErrorActionPreference = "Stop"

$baseUrl = $env:EVENTHUB_BASE_URL
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "http://localhost:8080"
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    $params = @{
        Method = $Method
        Uri = $Url
        Headers = $Headers
        UseBasicParsing = $true
        TimeoutSec = 30
    }

    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    return Invoke-RestMethod @params
}

function Get-StatusCode {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )

    try {
        Invoke-Json -Method $Method -Url $Url -Body $Body -Headers $Headers | Out-Null
        return 200
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        throw
    }
}

function Login {
    param([string]$Email)

    $response = Invoke-Json -Method "POST" -Url "$baseUrl/api/auth/login" -Body @{
        email = $Email
        password = "Password123"
    }

    return @{
        Token = $response.data.accessToken
        User = $response.data.user
        Headers = @{ Authorization = "Bearer $($response.data.accessToken)" }
    }
}

Write-Host "Health checks via $baseUrl"

$checks = @(
    @{ Name = "Eureka"; Url = "http://localhost:8761" },
    @{ Name = "Auth"; Url = "$baseUrl/api/auth/health" },
    @{ Name = "User"; Url = "$baseUrl/api/users/health" },
    @{ Name = "Event"; Url = "$baseUrl/api/events/health" },
    @{ Name = "Booking"; Url = "$baseUrl/api/bookings/health" },
    @{ Name = "Payment"; Url = "$baseUrl/api/payments/health" },
    @{ Name = "Notification"; Url = "$baseUrl/api/notifications/health" }
)

foreach ($check in $checks) {
    try {
        $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 20
        Write-Ok ("{0} {1}" -f $check.Name, $response.StatusCode)
    } catch {
        Write-Fail ("{0} - {1}" -f $check.Name, $_.Exception.Message)
    }
}

Write-Host ""
Write-Host "Event lifecycle smoke flow"

try {
    $organizer = Login -Email "organizer@example.com"
    $user = Login -Email "user@example.com"
    Write-Ok "Logged in demo organizer and user"

    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    $title = "Smoke Lifecycle $stamp"
    $startTime = (Get-Date).AddDays(30).Date.AddHours(9).ToString("yyyy-MM-ddTHH:mm:ss")
    $endTime = (Get-Date).AddDays(30).Date.AddHours(12).ToString("yyyy-MM-ddTHH:mm:ss")

    $draftResponse = Invoke-Json -Method "POST" -Url "$baseUrl/api/events" -Headers $organizer.Headers -Body @{
        title = $title
        description = "Smoke lifecycle event"
        category = "Technology"
        location = "Smoke Test Hall"
        address = "1 Smoke Street"
        city = "Ha Noi"
        startTime = $startTime
        endTime = $endTime
        totalTickets = 3
        price = 100000
        imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200"
        status = "DRAFT"
    }
    $eventId = $draftResponse.data.id
    if ($draftResponse.data.status -ne "DRAFT") { throw "Expected DRAFT, got $($draftResponse.data.status)" }
    Write-Ok "Created DRAFT event #$eventId"

    $publicBefore = Invoke-Json -Method "GET" -Url "$baseUrl/api/events?keyword=$([uri]::EscapeDataString($title))"
    if (($publicBefore.data.content | Where-Object { $_.id -eq $eventId }).Count -ne 0) {
        throw "DRAFT event appeared in public list"
    }
    Write-Ok "DRAFT event is hidden from public list"

    $publishedResponse = Invoke-Json -Method "PATCH" -Url "$baseUrl/api/events/$eventId/publish" -Headers $organizer.Headers
    if ($publishedResponse.data.status -ne "PUBLISHED") { throw "Expected PUBLISHED, got $($publishedResponse.data.status)" }
    Write-Ok "Published event"

    $publicAfterPublish = Invoke-Json -Method "GET" -Url "$baseUrl/api/events?keyword=$([uri]::EscapeDataString($title))"
    if (($publicAfterPublish.data.content | Where-Object { $_.id -eq $eventId }).Count -eq 0) {
        throw "Published event did not appear in public list"
    }
    Write-Ok "Published event appears in public list"

    $detailBeforeBooking = Invoke-Json -Method "GET" -Url "$baseUrl/api/events/$eventId"
    $availableBefore = [int]$detailBeforeBooking.data.availableTickets

    $bookingResponse = Invoke-Json -Method "POST" -Url "$baseUrl/api/bookings" -Headers $user.Headers -Body @{
        eventId = $eventId
        quantity = 1
    }
    Write-Ok "Created booking #$($bookingResponse.data.id)"

    $detailAfterBooking = Invoke-Json -Method "GET" -Url "$baseUrl/api/events/$eventId"
    $availableAfter = [int]$detailAfterBooking.data.availableTickets
    if ($availableAfter -ne ($availableBefore - 1)) {
        throw "Expected available tickets to decrease from $availableBefore to $($availableBefore - 1), got $availableAfter"
    }
    Write-Ok "Available tickets decreased"

    $cancelResponse = Invoke-Json -Method "PATCH" -Url "$baseUrl/api/events/$eventId/cancel" -Headers $organizer.Headers
    if ($cancelResponse.data.status -ne "CANCELLED") { throw "Expected CANCELLED, got $($cancelResponse.data.status)" }
    Write-Ok "Cancelled event"

    $bookingAfterCancelStatus = Get-StatusCode -Method "POST" -Url "$baseUrl/api/bookings" -Headers $user.Headers -Body @{
        eventId = $eventId
        quantity = 1
    }
    if ($bookingAfterCancelStatus -lt 400) {
        throw "Booking succeeded after event cancellation"
    }
    Write-Ok "Cancelled event rejects new booking"

    $publicAfterCancel = Invoke-Json -Method "GET" -Url "$baseUrl/api/events?keyword=$([uri]::EscapeDataString($title))"
    if (($publicAfterCancel.data.content | Where-Object { $_.id -eq $eventId }).Count -ne 0) {
        throw "Cancelled event appeared in public upcoming list"
    }
    Write-Ok "Cancelled event is hidden from public upcoming list"

    $completedPublic = Invoke-Json -Method "GET" -Url "$baseUrl/api/events?status=COMPLETED&size=5"
    if (($completedPublic.data.content | Where-Object { $_.status -eq "COMPLETED" }).Count -ne 0) {
        throw "COMPLETED event appeared in public upcoming list"
    }
    Write-Ok "COMPLETED events are hidden from public upcoming list"
} catch {
    Write-Fail "Lifecycle smoke flow - $($_.Exception.Message)"
    throw
}
