$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$actionPath = Join-Path $PSScriptRoot "sample-public-post.json"

Push-Location $projectRoot
try {
    $json = npm run verify -- $actionPath --json --fail-on-block
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

$decision = $json | ConvertFrom-Json

if ($exitCode -eq 0 -and $decision.allowed -eq $true) {
    Write-Output "allowed: $($decision.action_type) passed the local trust gate."
    Write-Output "no action executed: this script only demonstrates preflight checking."
    exit 0
}

if ($exitCode -eq 2) {
    Write-Output "blocked: $($decision.action_type) did not pass the local trust gate."
    Write-Output "risk_level: $($decision.risk_level)"
    Write-Output "no action executed: blocked actions must not proceed."
    exit 2
}

if ($decision.ok -eq $false) {
    Write-Output "error: $($decision.error.code) - $($decision.error.message)"
}
else {
    Write-Output "error: Agent Trust Gate returned exit code $exitCode."
}

exit 1
