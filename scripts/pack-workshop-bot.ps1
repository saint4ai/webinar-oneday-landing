# Сборка архива для scripts/deploy-workshop-bot.sh.
# Токен бота берётся из переменной окружения TG_WORKSHOP_BOT_TOKEN и в репозиторий не попадает.
# Запуск из корня репозитория: powershell -File scripts/pack-workshop-bot.ps1 -Out <путь.tgz>
param([Parameter(Mandatory = $true)][string]$Out)
$ErrorActionPreference = "Stop"
if (-not $env:TG_WORKSHOP_BOT_TOKEN) { throw "нет TG_WORKSHOP_BOT_TOKEN в окружении" }

$root = (Resolve-Path "$PSScriptRoot\..").Path
$stage = Join-Path ([IO.Path]::GetTempPath()) ("wsbot-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force "$stage\landing\assets\tg", "$stage\form", "$stage\static" | Out-Null

$utf8 = New-Object Text.UTF8Encoding $false
# wa.html: постоянная ссылка для кнопки шаблона WABA, переадресует в сообщество текущего набора.
foreach ($f in "efir.js", "index.html", "thank-you.html", "wa.html") { Copy-Item "$root\workshop-montazh\$f" "$stage\landing\$f" }
Copy-Item "$root\workshop-montazh\assets\tg\*" "$stage\landing\assets\tg\" -Recurse
Copy-Item "$root\form-api\dist\server.js" "$stage\form\server.js"
Copy-Item "$root\form-api\dist\tg-setup.js" "$stage\form\tg-setup.js"
Copy-Item "$root\form-api\tg-series.json" "$stage\form\tg-series.json"
Copy-Item "$root\form-api\wa-series.json" "$stage\form\wa-series.json"
Copy-Item "$root\form-api\admin-app.html" "$stage\form\admin-app.html"
Copy-Item "$root\workshop-static-redirect\thank-you.html" "$stage\static\thank-you.html"
$ver = (git -C $root rev-parse --short HEAD) + " " + (Get-Date -Format "yyyy-MM-dd HH:mm")
[IO.File]::WriteAllText("$stage\form\VERSION", "$ver`n", $utf8)
[IO.File]::WriteAllText("$stage\secrets.env", "TG_WORKSHOP_BOT_TOKEN=$($env:TG_WORKSHOP_BOT_TOKEN)`n", $utf8)

tar -czf $Out -C $stage landing form static secrets.env
Remove-Item -Recurse -Force $stage
"архив: $Out, $([int]((Get-Item $Out).Length / 1KB)) КБ, версия $ver"
