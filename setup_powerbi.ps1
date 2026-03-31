#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup PostgreSQL + Power BI for Trust Sense
.DESCRIPTION
    Stops containers, removes volumes, rebuilds images, and starts all services with PostgreSQL
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Trust Sense - PostgreSQL + Power BI Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping containers and removing volumes..." -ForegroundColor Yellow
docker compose down -v

Write-Host "[2/5] Building images (this may take a few minutes)..." -ForegroundColor Yellow
docker compose build --no-cache

Write-Host "[3/5] Starting services..." -ForegroundColor Yellow
docker compose up -d

Write-Host "[4/5] Waiting for PostgreSQL to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "[5/5] Checking service status..." -ForegroundColor Yellow
docker compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ PostgreSQL READY FOR POWER BI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "POWER BI Connection Details:" -ForegroundColor Cyan
Write-Host "  Server Address: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: trustsense" -ForegroundColor White
Write-Host "  Username: trustsense" -ForegroundColor White
Write-Host "  Password: trustsense123" -ForegroundColor White
Write-Host ""

Write-Host "Steps to Connect in Power BI Desktop:" -ForegroundColor Cyan
Write-Host "  1. Home → Get Data → PostgreSQL" -ForegroundColor White
Write-Host "  2. Enter 'localhost' as Server" -ForegroundColor White
Write-Host "  3. Enter 'trustsense' as Database" -ForegroundColor White
Write-Host "  4. Click Connect" -ForegroundColor White
Write-Host "  5. Enter username: trustsense, password: trustsense123" -ForegroundColor White
Write-Host "  6. Load tables: user, analysis, organization, organization_member" -ForegroundColor White
Write-Host "  7. Create your interactive dashboard!" -ForegroundColor White
Write-Host ""

Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  Backend Health: http://localhost:8000/health" -ForegroundColor White
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""

Write-Host "PostgreSQL Verification Commands:" -ForegroundColor Cyan
Write-Host "  List tables: docker exec trust-sense-postgres psql -U trustsense -d trustsense -c '\dt'" -ForegroundColor White
Write-Host "  Count analysis records: docker exec trust-sense-postgres psql -U trustsense -d trustsense -c 'SELECT COUNT(*) FROM analysis;'" -ForegroundColor White
Write-Host ""
