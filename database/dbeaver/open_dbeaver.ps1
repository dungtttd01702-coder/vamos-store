$dbeaverPath = "$env:LOCALAPPDATA\DBeaver\dbeaver.exe"
if (-not (Test-Path $dbeaverPath)) {
    $dbeaverPath = "C:\Program Files\DBeaver\dbeaver.exe"
}

if (Test-Path $dbeaverPath) {
    Write-Host "Khoi dong DBeaver: $dbeaverPath" -ForegroundColor Green
    Start-Process $dbeaverPath
} else {
    Write-Host "Goi DBeaver qua path he thong..." -ForegroundColor Yellow
    Start-Process dbeaver
}
