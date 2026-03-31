#!/usr/bin/env pwsh
# Power BI REST API Connection Verification Script (PowerShell)
# This script tests if the backend endpoints are working correctly

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " Power BI REST API Endpoint Verification" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Test 1: Check if backend is running
Write-Host "[1/3] Checking if backend is running on http://localhost:8000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/summary' -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Backend is RUNNING!" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend is NOT running. Please start it:" -ForegroundColor Red
    Write-Host "  cd backend" -ForegroundColor Yellow
    Write-Host "  python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Yellow
    Write-Host "`nOr if using Docker:" -ForegroundColor Yellow
    Write-Host "  docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test /api/powerbi/summary endpoint
Write-Host "`n[2/3] Testing /api/powerbi/summary endpoint..." -ForegroundColor Yellow
try {
    $summaryResponse = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/summary' -UseBasicParsing
    $summaryJson = $summaryResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Summary endpoint is WORKING!" -ForegroundColor Green
    Write-Host "`nSummary Data:" -ForegroundColor Cyan
    Write-Host "  Total Analyses: $($summaryJson.total_analyses)"
    Write-Host "  Average Trust Score: $($summaryJson.avg_trust_score)%"
    Write-Host "  High Risk Items: $($summaryJson.high_risk_count)"
    Write-Host "  Risk Distribution:" -ForegroundColor Cyan
    $summaryJson.risk_distribution | ConvertTo-Json | Write-Host
} catch {
    Write-Host "✗ Summary endpoint failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Test /api/powerbi/data endpoint
Write-Host "`n[3/3] Testing /api/powerbi/data endpoint..." -ForegroundColor Yellow
try {
    $dataResponse = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/data' -UseBasicParsing
    $dataJson = $dataResponse.Content | ConvertFrom-Json
    
    Write-Host "✓ Data endpoint is WORKING!" -ForegroundColor Green
    Write-Host "`nData Statistics:" -ForegroundColor Cyan
    Write-Host "  Total Records in Database: $($dataJson.total_records)"
    Write-Host "  Status: $($dataJson.status)"
    
    if ($dataJson.data.Count -gt 0) {
        Write-Host "  First Record:" -ForegroundColor Cyan
        $dataJson.data[0] | ConvertTo-Json | Write-Host
    } else {
        Write-Host "  (No records yet - create analysis to populate database)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Data endpoint failed: $_" -ForegroundColor Red
    exit 1
}

# All tests passed
Write-Host "`n============================================" -ForegroundColor Green
Write-Host " All Tests Passed! ✓" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`nSUCCESS: Both Power BI endpoints are responding correctly!" -ForegroundColor Green

Write-Host "`n📊 Next Steps to Connect Power BI Desktop:" -ForegroundColor Cyan
Write-Host "  1. Open Power BI Desktop" -ForegroundColor White
Write-Host "  2. Click Home → Get Data → Web" -ForegroundColor White
Write-Host "  3. Paste URL: http://localhost:8000/api/powerbi/summary" -ForegroundColor White
Write-Host "  4. Click OK" -ForegroundColor White
Write-Host "  5. When prompted, select 'Anonymous' and click Load" -ForegroundColor White
Write-Host "  6. Power BI will load the dashboard data" -ForegroundColor White

Write-Host "`n📚 For detailed setup guide, see:" -ForegroundColor Cyan
Write-Host "  POWERBI_REST_API_GUIDE.md" -ForegroundColor White

Write-Host "`n⚡ Pro Tips:" -ForegroundColor Cyan
Write-Host "  • /api/powerbi/summary: Use for KPI dashboard cards" -ForegroundColor Gray
Write-Host "  • /api/powerbi/data: Use for detailed analysis and raw data table" -ForegroundColor Gray
Write-Host "  • Both endpoints refresh automatically from PostgreSQL database" -ForegroundColor Gray
Write-Host "  • No authentication required (public endpoints)" -ForegroundColor Gray
Write-Host ""
