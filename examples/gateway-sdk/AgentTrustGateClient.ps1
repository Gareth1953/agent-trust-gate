# Safety: these local wrapper functions request trust decisions and evidence only. They never execute actions.

function New-AgentTrustGateClient {
  [CmdletBinding()]
  param(
    [string]$BaseUrl = "http://127.0.0.1:8787",
    [string]$ClientId,
    [string]$ApiKey
  )

  $uri = [System.Uri]$BaseUrl
  if ($uri.Host -notin @("127.0.0.1", "localhost", "::1")) {
    throw "Agent Trust Gate SDK starter clients support localhost URLs only."
  }

  $client = [pscustomobject]@{
    BaseUrl = $BaseUrl.TrimEnd("/")
    ClientId = $ClientId
    ApiKey = $ApiKey
  }
  $displayProperties = New-Object System.Management.Automation.PSPropertySet(
    "DefaultDisplayPropertySet",
    [string[]]@("BaseUrl", "ClientId")
  )
  $client | Add-Member MemberSet PSStandardMembers ([System.Management.Automation.PSMemberInfo[]]@($displayProperties))
  $client
}

function Invoke-ATGHealth {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/health"
}

function Invoke-ATGDecision {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]$Client,
    [Parameter(Mandatory)]$Action,
    [string]$PolicyProfile
  )

  $body = if ([string]::IsNullOrWhiteSpace($PolicyProfile)) {
    $Action
  } else {
    @{ policy_profile = $PolicyProfile; action = $Action }
  }
  Invoke-ATGRequest -Client $Client -Method Post -Path "/v1/decision" -Body $body
}

function Invoke-ATGApprovalPack {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]$Client,
    [Parameter(Mandatory)]$Action,
    [string]$PolicyProfile,
    [switch]$SaveApprovalPack
  )

  $body = @{ action = $Action; save_approval_pack = $SaveApprovalPack.IsPresent }
  if (-not [string]::IsNullOrWhiteSpace($PolicyProfile)) {
    $body.policy_profile = $PolicyProfile
  }
  Invoke-ATGRequest -Client $Client -Method Post -Path "/v1/approval-pack" -Body $body
}

function Invoke-ATGEvidenceBundle {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]$Client,
    [Parameter(Mandatory)][string]$ReviewRecordPath,
    [switch]$SaveEvidenceBundle
  )

  $body = @{
    review_record_path = $ReviewRecordPath
    save_evidence_bundle = $SaveEvidenceBundle.IsPresent
  }
  Invoke-ATGRequest -Client $Client -Method Post -Path "/v1/evidence-bundle" -Body $body
}

function Invoke-ATGOpenApi {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/openapi.json"
}

function Invoke-ATGEntitlement {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/entitlement"
}

function Invoke-ATGCommercialReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/commercial-readiness"
}

function Invoke-ATGHostedReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/hosted-readiness"
}

function Invoke-ATGSecurityReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/security-readiness"
}

function Invoke-ATGRateLimitStatus {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/rate-limit-status"
}

function Invoke-ATGMonitoringHealth {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/monitoring-health"
}

function Invoke-ATGIncidentResponseReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/incident-response-readiness"
}

function Invoke-ATGCustomerTenantReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/customer-tenant-readiness"
}

function Invoke-ATGBillingPaymentReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)]$Client)
  Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/billing-payment-readiness"
}
function Invoke-ATGMachinePurchasePolicyReadiness { param([Parameter(Mandatory)]$Client) Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/machine-purchase-policy-readiness" }
function Invoke-ATGLaunchReadiness { param([Parameter(Mandatory)]$Client) Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/launch-readiness" }
function Invoke-ATGGlobalMarketingReadiness { param([Parameter(Mandatory)]$Client) Invoke-ATGRequest -Client $Client -Method Get -Path "/v1/global-marketing-readiness" }

function Invoke-ATGRequest {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]$Client,
    [Parameter(Mandatory)][ValidateSet("Get", "Post")][string]$Method,
    [Parameter(Mandatory)][string]$Path,
    $Body
  )

  $headers = @{ Accept = "application/json" }
  if (-not [string]::IsNullOrWhiteSpace($Client.ClientId)) {
    $headers["X-ATG-Client-ID"] = $Client.ClientId
  }
  if (-not [string]::IsNullOrWhiteSpace($Client.ApiKey)) {
    $headers["X-ATG-API-Key"] = $Client.ApiKey
  }

  $parameters = @{
    Method = $Method
    Uri = "$($Client.BaseUrl)$Path"
    Headers = $headers
    ErrorAction = "Stop"
  }
  if ($null -ne $Body) {
    $parameters.ContentType = "application/json"
    $parameters.Body = $Body | ConvertTo-Json -Depth 20
  }

  try {
    Invoke-RestMethod @parameters
  } catch {
    $message = $_.Exception.Message
    $code = "GATEWAY_REQUEST_FAILED"
    if ($null -ne $_.ErrorDetails -and -not [string]::IsNullOrWhiteSpace($_.ErrorDetails.Message)) {
      try {
        $gatewayError = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($gatewayError.error.code) { $code = $gatewayError.error.code }
        if ($gatewayError.error.message) { $message = $gatewayError.error.message }
      } catch {
        # Preserve the original HTTP error when the response is not JSON.
      }
    }
    throw "Agent Trust Gate request failed [$code]: $message"
  }
}
