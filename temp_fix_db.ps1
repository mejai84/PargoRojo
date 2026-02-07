$projectUrl = "https://ryxqoapzxvsxqdsy4zw.supabase.co"
$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHFvYXB4enZzc3hxZHN5Znp3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyODUxNCwiZXhwIjoyMDg0NTA0NTE0fQ.ExuFNR-UAIScGvNIrb2Iy8hhnq7nuzboMcSVeq_ROpk"

# Leer los scripts SQL
$script1 = Get-Content "d:\Jaime\Antigravity\PargoRojo\supabase_migrations\FINAL_INFRASTRUCTURE_FIX.sql" -Raw
$script2 = Get-Content "d:\Jaime\Antigravity\PargoRojo\supabase_migrations\FINAL_RECOVERY_WORKS.sql" -Raw
$script3 = Get-Content "d:\Jaime\Antigravity\PargoRojo\supabase_migrations\SURGICAL_RECONSTRUCTION_FINAL.sql" -Raw

Write-Host "=== EJECUTANDO SCRIPT 1: FINAL_INFRASTRUCTURE_FIX ===" -ForegroundColor Cyan

$headers = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
    "Content-Type" = "application/json"
}

$body1 = @{
    query = $script1
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$projectUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body1
    Write-Host "✅ Script 1 ejecutado exitosamente" -ForegroundColor Green
    $response1 | ConvertTo-Json
} catch {
    Write-Host "❌ Error en Script 1: $_" -ForegroundColor Red
}

Write-Host "`n=== EJECUTANDO SCRIPT 2: FINAL_RECOVERY_WORKS ===" -ForegroundColor Cyan

$body2 = @{
    query = $script2
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$projectUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body2
    Write-Host "✅ Script 2 ejecutado exitosamente" -ForegroundColor Green
    $response2 | ConvertTo-Json
} catch {
    Write-Host "❌ Error en Script 2: $_" -ForegroundColor Red
}

Write-Host "`n=== EJECUTANDO SCRIPT 3: SURGICAL_RECONSTRUCTION_FINAL ===" -ForegroundColor Cyan

$body3 = @{
    query = $script3
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$projectUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body3
    Write-Host "✅ Script 3 ejecutado exitosamente" -ForegroundColor Green
    $response3 | ConvertTo-Json
} catch {
    Write-Host "❌ Error en Script 3: $_" -ForegroundColor Red
}

Write-Host "`n=== REPARACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "Intenta hacer login nuevamente en: https://pargo-rojo.vercel.app/login" -ForegroundColor Yellow
