# Usage: call.ps1 -Task "<agent instructions incl. the question>" [-TimeoutSec 540]
# Phones CALL_ME_PHONE via Bolna, polls until the call ends, prints status + transcript as JSON.
# First run creates a reusable Bolna agent and caches its id in the BOLNA_AGENT_ID user env var.
param(
  [Parameter(Mandatory)][string]$Task,
  [int]$TimeoutSec = 540
)
$ErrorActionPreference = 'Stop'
$key   = [Environment]::GetEnvironmentVariable('BOLNA_API_KEY','User')
$phone = [Environment]::GetEnvironmentVariable('CALL_ME_PHONE','User')
if (-not $key -or -not $phone) { throw 'BOLNA_API_KEY or CALL_ME_PHONE user env var missing' }
$h = @{ Authorization = "Bearer $key" }
$api = 'https://api.bolna.ai'

$agentId = [Environment]::GetEnvironmentVariable('BOLNA_AGENT_ID','User')
if (-not $agentId) {
  $agent = @{
    agent_config = @{
      agent_name = 'call-me'
      agent_welcome_message = "Hey, it's your agent's assistant. Got a sec for a quick question?"
      tasks = @(@{
        task_type = 'conversation'
        toolchain = @{ execution = 'sequential'; pipelines = @(,@('transcriber','llm','synthesizer')) }
        tools_config = @{
          llm_agent = @{ agent_type = 'simple_llm_agent'; agent_flow_type = 'streaming'
            llm_config = @{ provider = 'openai'; model = 'gpt-4.1-mini'; max_tokens = 120; temperature = 0.3 } }
          transcriber = @{ provider = 'deepgram'; model = 'nova-3'; language = 'en'; stream = $true; encoding = 'linear16'; sampling_rate = 16000; endpointing = 250 }
          synthesizer = @{ provider = 'deepgram'; provider_config = @{ voice = 'Andromeda'; voice_id = 'andromeda-en'; model = 'aura-2' }; stream = $true; audio_format = 'wav' }
          input  = @{ provider = 'plivo'; format = 'wav' }
          output = @{ provider = 'plivo'; format = 'wav' }
        }
        task_config = @{ call_terminate = 480; hangup_after_silence = 15 }
      })
    }
    agent_prompts = @{ task_1 = @{ system_prompt = '{task}' } }
  }
  $agentId = (Invoke-RestMethod -Method Post -Uri "$api/v2/agent" -Headers $h -ContentType 'application/json' -Body ($agent | ConvertTo-Json -Depth 12)).agent_id
  [Environment]::SetEnvironmentVariable('BOLNA_AGENT_ID', $agentId, 'User')
  Write-Host "created agent $agentId"
}

$body = @{ agent_id = $agentId; recipient_phone_number = $phone; user_data = @{ task = $Task }; bypass_call_guardrails = $true }
$id = (Invoke-RestMethod -Method Post -Uri "$api/call" -Headers $h -ContentType 'application/json' -Body ($body | ConvertTo-Json -Depth 5)).execution_id
Write-Host "execution_id $id"

$final = 'completed','balance-low','busy','no-answer','canceled','failed','stopped','error'
$deadline = (Get-Date).AddSeconds($TimeoutSec)
do {
  Start-Sleep 5
  $c = Invoke-RestMethod -Uri "$api/executions/$id" -Headers $h
  Write-Host "$(Get-Date -f HH:mm:ss) status=$($c.status)"
} until ($final -contains $c.status -or (Get-Date) -gt $deadline)

[pscustomobject]@{
  execution_id = $id
  status       = $c.status
  voicemail    = $c.answered_by_voice_mail
  error        = $c.error_message
  transcript   = $c.transcript
} | ConvertTo-Json
