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
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int[]]$ExpectedStatuses
    )

    try {
        Invoke-Json -Method $Method -Url $Url -Body $Body -Headers $Headers | Out-Null
        $actual = 200
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $actual = [int]$_.Exception.Response.StatusCode
        } else {
            throw
        }
    }

    if ($ExpectedStatuses -contains $actual) {
        Write-Ok ("{0} -> {1}" -f $Name, $actual)
    } else {
        Write-Fail ("{0} expected {1}, got {2}" -f $Name, ($ExpectedStatuses -join "/"), $actual)
        throw "$Name failed"
    }

    return $actual
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

Write-Host "Security smoke tests via $baseUrl"

Get-StatusCode `
    -Name "Protected booking without token" `
    -Method "GET" `
    -Url "$baseUrl/api/bookings/me" `
    -ExpectedStatuses @(401)

Get-StatusCode `
    -Name "Protected booking with invalid token" `
    -Method "GET" `
    -Url "$baseUrl/api/bookings/me" `
    -Headers @{ Authorization = "Bearer invalid-token" } `
    -ExpectedStatuses @(401)

Get-StatusCode `
    -Name "Internal event without key" `
    -Method "GET" `
    -Url "$baseUrl/api/events/internal/1" `
    -ExpectedStatuses @(403)

Get-StatusCode `
    -Name "Internal event with wrong key" `
    -Method "GET" `
    -Url "$baseUrl/api/events/internal/1" `
    -Headers @{ "X-Internal-Api-Key" = "wrong-key" } `
    -ExpectedStatuses @(403)

Get-StatusCode `
    -Name "Internal reserve without key" `
    -Method "PATCH" `
    -Url "$baseUrl/api/events/internal/1/reserve-tickets" `
    -Body @{ quantity = 1 } `
    -ExpectedStatuses @(403)

try {
    $user = Login -Email "user@example.com"
    $organizer = Login -Email "organizer@example.com"
    $admin = Login -Email "admin@example.com"
    Write-Ok "Logged in demo user, organizer and admin"

    $stamp = Get-Date -Format "yyyyMMddHHmmss"
    $title = "Security Draft $stamp"
    $startTime = (Get-Date).AddDays(40).Date.AddHours(9).ToString("yyyy-MM-ddTHH:mm:ss")
    $endTime = (Get-Date).AddDays(40).Date.AddHours(12).ToString("yyyy-MM-ddTHH:mm:ss")
    $draftBody = @{
        title = $title
        description = "Security smoke draft"
        category = "Technology"
        location = "Security Hall"
        address = "1 Security Street"
        city = "Ha Noi"
        startTime = $startTime
        endTime = $endTime
        totalTickets = 5
        price = 100000
        imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200"
        status = "DRAFT"
    }

    Get-StatusCode `
        -Name "USER cannot create Event" `
        -Method "POST" `
        -Url "$baseUrl/api/events" `
        -Headers $user.Headers `
        -Body $draftBody `
        -ExpectedStatuses @(403)

    $draftResponse = Invoke-Json -Method "POST" -Url "$baseUrl/api/events" -Headers $organizer.Headers -Body $draftBody
    $eventId = $draftResponse.data.id
    Write-Ok "Organizer created draft #$eventId"

    Get-StatusCode `
        -Name "Public cannot view DRAFT" `
        -Method "GET" `
        -Url "$baseUrl/api/events/$eventId" `
        -ExpectedStatuses @(403, 404)

    Get-StatusCode `
        -Name "Another organizer/admin boundary uses owner check for publish" `
        -Method "PATCH" `
        -Url "$baseUrl/api/events/$eventId/publish" `
        -Headers $user.Headers `
        -ExpectedStatuses @(403)

    $completedBody = $draftBody.Clone()
    $completedBody.title = "$title Completed"
    $completedBody.status = "COMPLETED"

    Get-StatusCode `
        -Name "Client cannot create COMPLETED event" `
        -Method "POST" `
        -Url "$baseUrl/api/events" `
        -Headers $organizer.Headers `
        -Body $completedBody `
        -ExpectedStatuses @(400)

    Get-StatusCode `
        -Name "Client cannot update organizerId/availableTickets via update" `
        -Method "PUT" `
        -Url "$baseUrl/api/events/$eventId" `
        -Headers $organizer.Headers `
        -Body @{
            title = "$title Updated"
            organizerId = 999999
            availableTickets = 999999
        } `
        -ExpectedStatuses @(200)

    $afterIgnoredFields = Invoke-Json -Method "GET" -Url "$baseUrl/api/events/$eventId" -Headers $organizer.Headers
    if ($afterIgnoredFields.data.organizerId -ne $organizer.User.id -or $afterIgnoredFields.data.availableTickets -eq 999999) {
        throw "Update accepted organizerId or availableTickets"
    }
    Write-Ok "Update ignored forbidden fields"

    $publishResponse = Invoke-Json -Method "PATCH" -Url "$baseUrl/api/events/$eventId/publish" -Headers $organizer.Headers
    if ($publishResponse.data.status -ne "PUBLISHED") { throw "Owner publish failed" }
    Write-Ok "Owner can publish draft"

    $cancelResponse = Invoke-Json -Method "PATCH" -Url "$baseUrl/api/events/$eventId/cancel" -Headers $admin.Headers
    if ($cancelResponse.data.status -ne "CANCELLED") { throw "Admin cancel failed" }
    Write-Ok "ADMIN can cancel event"
} catch {
    Write-Fail "Security smoke flow - $($_.Exception.Message)"
    throw
}
