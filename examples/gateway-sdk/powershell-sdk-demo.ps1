$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "AgentTrustGateClient.ps1")

$baseUrl = if ($env:ATG_GATEWAY_URL) { $env:ATG_GATEWAY_URL } else { "http://127.0.0.1:8787" }
$clientId = if ($env:ATG_CLIENT_ID) { $env:ATG_CLIENT_ID } else { "quickstart-demo-agent" }
$apiKey = if ($env:ATG_API_KEY) { $env:ATG_API_KEY } else { "quickstart-demo-key" }
$actionPath = Join-Path $PSScriptRoot "..\gateway-quickstart\public-post-action.json"

try {
  $client = New-AgentTrustGateClient -BaseUrl $baseUrl -ClientId $clientId -ApiKey $apiKey
  $health = Invoke-ATGHealth -Client $client
  Write-Host "health=$($health.ok) service=$($health.service)"

  $action = Get-Content -LiteralPath $actionPath -Raw | ConvertFrom-Json
  $decision = Invoke-ATGDecision -Client $client -Action $action

  Write-Host "request_id=$($decision.request_id)"
  Write-Host "client_id=$($decision.client_id)"
  Write-Host "allowed=$($decision.allowed)"
  Write-Host "risk_level=$($decision.risk_level)"
  Write-Host "human_approval_required=$($decision.human_approval_required)"
  Write-Host "policy_profile=$($decision.policy_profile)"
  if ($null -ne $decision.usage) {
    Write-Host "remaining_decisions=$($decision.usage.remaining_decisions)"
  }

  if ($decision.human_approval_required -eq $true) {
    Write-Host "gateway_decision=REQUEST HUMAN"
    Write-Host "Stopping: explicit human review is required."
  } elseif ($decision.allowed -ne $true) {
    Write-Host "gateway_decision=BLOCK"
    Write-Host "Stopping: the gateway did not allow this action."
  } else {
    Write-Host "gateway_decision=ALLOW"
    Write-Host "The caller may separately decide whether to perform the exact approved action."
  }

  Write-Host "No action was executed. This SDK demo requests a local trust decision only."
} catch {
  Write-Error "SDK demo failed: $($_.Exception.Message)"
  Write-Host "No action was executed."
  exit 1
}
