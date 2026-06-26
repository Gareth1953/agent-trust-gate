$ErrorActionPreference = "Stop"

$GatewayBaseUrl = if ($env:ATG_GATEWAY_URL) { $env:ATG_GATEWAY_URL } else { "http://127.0.0.1:8787" }
$ClientId = if ($env:ATG_CLIENT_ID) { $env:ATG_CLIENT_ID } else { "quickstart-demo-agent" }
$ApiKey = if ($env:ATG_API_KEY) { $env:ATG_API_KEY } else { "quickstart-demo-key" }
$ActionPath = if ($env:ATG_ACTION_PATH) {
  $env:ATG_ACTION_PATH
} else {
  Join-Path $PSScriptRoot "public-post-action.json"
}

try {
  $health = Invoke-RestMethod -Method Get -Uri "$GatewayBaseUrl/v1/health"
  Write-Host "health ok=$($health.ok) service=$($health.service) request_id=$($health.request_id)"

  $headers = @{
    "X-ATG-Client-ID" = $ClientId
    "X-ATG-API-Key" = $ApiKey
  }

  $decision = Invoke-RestMethod `
    -Method Post `
    -Uri "$GatewayBaseUrl/v1/decision" `
    -Headers $headers `
    -ContentType "application/json" `
    -InFile $ActionPath

  Write-Host "request_id=$($decision.request_id)"
  Write-Host "client_id=$($decision.client_id)"
  Write-Host "allowed=$($decision.allowed)"
  Write-Host "risk_level=$($decision.risk_level)"
  Write-Host "human_approval_required=$($decision.human_approval_required)"
  Write-Host "policy_profile=$($decision.policy_profile)"

  if ($null -ne $decision.usage) {
    Write-Host "remaining_decisions=$($decision.usage.remaining_decisions)"
  }

  if ($decision.allowed -eq $true -and $decision.human_approval_required -eq $false) {
    Write-Host "gateway_decision=ALLOW"
  } elseif ($decision.human_approval_required -eq $true) {
    Write-Host "gateway_decision=REQUEST HUMAN"
    Write-Host "Stopping: human review is required before any action."
  } else {
    Write-Host "gateway_decision=BLOCK"
    Write-Host "Stopping: the gateway did not allow this action."
  }

  Write-Host "No action was executed. This quickstart only requests a local trust decision."
} catch {
  Write-Error "Gateway quickstart failed: $($_.Exception.Message)"
  Write-Host "Start the local gateway first with: npm run verify -- --serve --port 8787"
  exit 1
}
