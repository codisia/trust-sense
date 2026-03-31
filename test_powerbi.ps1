# Power BI REST API Quick Test
Write-Host "Testing Power BI Endpoints..." -ForegroundColor Cyan

Write-Host "`n[1] Testing Summary Endpoint..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest 'http://localhost:8000/api/powerbi/summary' -UseBasicParsing -TimeoutSec 3
    $json = $r.Content | ConvertFrom-Json
    Write-Host "✓ Working! Total analyses: $($json.total_analyses)" -ForegroundColor Green
} catch {  
    Write-Host "✗ Failed - Backend not running?" -ForegroundColor Red
}

Write-Host "`n[2] Testing Data Endpoint..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest 'http://localhost:8000/api/powerbi/data' -UseBasicParsing -TimeoutSec 3
    $json = $r.Content | ConvertFrom-Json
    Write-Host "✓ Working! Total records: $($json.total_records)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed - Backend not running?" -ForegroundColor Red
}

Write-Host "`nDone!" -ForegroundColor Cyan
