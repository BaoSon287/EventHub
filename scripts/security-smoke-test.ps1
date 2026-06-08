$ErrorActionPreference = "Stop"

$baseUrl = $env:EVENTHUB_BASE_URL
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "http://localhost:8080"
}

function Test-Status {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers,
        [int]$ExpectedStatus
    )

    try {
        $response = Invoke-WebRequest -Method $Method -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 20
        $actual = [int]$response.StatusCode
    } catch {
        $actual = [int]$_.Exception.Response.StatusCode
    }

    if ($actual -eq $ExpectedStatus) {
        Write-Host ("[OK] {0} -> {1}" -f $Name, $actual) -ForegroundColor Green
    } else {
        Write-Host ("[FAIL] {0} expected {1}, got {2}" -f $Name, $ExpectedStatus, $actual) -ForegroundColor Red
    }
}

Test-Status `
    -Name "Protected booking without token" `
    -Method "GET" `
    -Url "$baseUrl/api/bookings/me" `
    -Headers @{} `
    -ExpectedStatus 401

Test-Status `
    -Name "Protected booking with invalid token" `
    -Method "GET" `
    -Url "$baseUrl/api/bookings/me" `
    -Headers @{ Authorization = "Bearer invalid-token" } `
    -ExpectedStatus 401

Test-Status `
    -Name "Internal event without key" `
    -Method "GET" `
    -Url "$baseUrl/api/events/internal/1" `
    -Headers @{} `
    -ExpectedStatus 403

Test-Status `
    -Name "Internal event with wrong key" `
    -Method "GET" `
    -Url "$baseUrl/api/events/internal/1" `
    -Headers @{ "X-Internal-Api-Key" = "wrong-key" } `
    -ExpectedStatus 403

Test-Status `
    -Name "Event health" `
    -Method "GET" `
    -Url "$baseUrl/api/events/health" `
    -Headers @{} `
    -ExpectedStatus 200
