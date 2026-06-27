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

  $entitlement = Invoke-ATGEntitlement -Client $client
  Write-Host "entitlement_status=$($entitlement.entitlement_status)"
  Write-Host "upgrade_required=$($entitlement.upgrade.upgrade_required)"
  Write-Host "purchase_enabled=$($entitlement.upgrade.purchase_enabled)"
  Write-Host "No purchase was made. Purchase, automatic purchase, and billing are disabled."

  $readiness = Invoke-ATGCommercialReadiness -Client $client
  Write-Host "local_product_readiness_percent=$($readiness.overall.local_product_readiness_percent)"
  Write-Host "commercial_mvp_readiness_percent=$($readiness.overall.commercial_mvp_readiness_percent)"
  Write-Host "full_target_readiness_percent=$($readiness.overall.full_target_readiness_percent)"
  Write-Host "Commercial readiness is a planning snapshot only."

  $hosted = Invoke-ATGHostedReadiness -Client $client
  Write-Host "hosted_readiness_percent=$($hosted.overall.hosted_readiness_percent)"
  Write-Host "production_ready=$($hosted.production_ready)"
  Write-Host "No deployment occurred. Hosted readiness is preparation only."

  $security = Invoke-ATGSecurityReadiness -Client $client
  Write-Host "security_readiness_percent=$($security.overall.security_readiness_percent)"
  Write-Host "production_security_certified=$($security.production_security_certified)"
  Write-Host "No deployment occurred and no security certification is claimed."

  $rateLimit = Invoke-ATGRateLimitStatus -Client $client
  Write-Host "rate_limit_status=$($rateLimit.rate_limit_status)"
  Write-Host "abuse_status=$($rateLimit.abuse_signal.abuse_status)"
  Write-Host "No action was executed and no purchase was made."

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
