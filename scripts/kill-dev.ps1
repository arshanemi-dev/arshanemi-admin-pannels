# Kills every "next dev" server for this repo (root app + all tools/* subapps),
# however many terminals/sessions started them. Safe to re-run if nothing is running.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$targets = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($repoRoot) }

if (-not $targets) {
    Write-Host "No dev servers running for this project." -ForegroundColor Yellow
    exit 0
}

foreach ($proc in $targets) {
    try {
        taskkill /PID $proc.ProcessId /T /F 2>$null | Out-Null
    } catch {
        # Already gone (killed as part of another process's tree) - fine.
    }
}

Start-Sleep -Milliseconds 300
$stillUp = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine.Contains($repoRoot) }

if ($stillUp) {
    Write-Host "Some processes may still be shutting down:" -ForegroundColor Yellow
    $stillUp | Select-Object ProcessId, CommandLine | Format-List
} else {
    Write-Host "All dev servers for this project stopped." -ForegroundColor Green
}
