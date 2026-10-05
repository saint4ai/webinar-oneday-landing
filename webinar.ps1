# Показ презентации на Windows — прод на http://localhost:3001 (то же, что webinar.sh на маке).
# Всегда собирает начисто, около минуты. Запуск из корня репозитория:
#   powershell -ExecutionPolicy Bypass -File .\webinar.ps1
# Остановить: Ctrl+C
Set-Location $PSScriptRoot
$Port = 3001

# 1) Освободить порт
Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# 2) Зависимости по package-lock.json, если их нет
if (-not (Test-Path "node_modules\.bin\next.cmd")) {
  npm ci --no-audit --no-fund --loglevel=error
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

# 3) Чистая прод-сборка; WEBINAR_LOCAL=1 — иначе картинки и видео отдают 404
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
$env:WEBINAR_LOCAL = "1"
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "  Vibe Production:  http://localhost:$Port/montage"
Write-Host "  Остановить:       Ctrl + C"
Write-Host ""
npx next start -p $Port
