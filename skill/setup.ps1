# claude-call-me guided setup: intro and credits, then the Bolna key, your phone number,
# the session-end hook and the daily standup, one step at a time.
#   setup.ps1                   ask about everything
#   setup.ps1 -Standup 09:00    schedule the standup without asking
#   setup.ps1 -NoHook           skip the session-end hook
# Claude launches this in its own window on first use; install.ps1 runs it after copying the skill.
param([string]$Standup, [switch]$NoHook)
$ErrorActionPreference = 'Stop'
$skill = $PSScriptRoot
function Step($n, $title) { Write-Host ''; Write-Host "  [$n/4] $title" -ForegroundColor Red }
function Has($name) { [bool][Environment]::GetEnvironmentVariable($name, 'User') }

Clear-Host
Write-Host ''
Write-Host '  claude-call-me' -ForegroundColor Red
Write-Host '  Walk away. Claude calls you.'
Write-Host ''
Write-Host '  Meet Ivy, the voice on the line. Ivy phones you when Claude needs a decision,'
Write-Host '  calls with an update when a task ends, and runs a daily standup call about'
Write-Host "  yesterday's work. You answer out loud; Claude gets back to work."
Write-Host ''
Write-Host '  Made by Mithun Sidhaarth  -  https://mithunsidhaarth.in' -ForegroundColor Yellow
Write-Host '  Source (MIT): https://github.com/MithunSidhaarth/claude-call-me'
Write-Host ''
Write-Host '  Setup takes about two minutes. Your key is typed at a hidden prompt and stored'
Write-Host '  as a user environment variable: never in a file, never in the chat.'

Step 1 'Bolna API key'
if (Has 'BOLNA_API_KEY') { Write-Host '  Already set. Skipping.' }
else {
  Write-Host '  1. Sign up or log in at https://platform.bolna.ai (signup credit covers testing).'
  Write-Host '  2. Open API Keys in the dashboard, create a key and copy it.'
  Write-Host '  Opening the dashboard in your browser...'
  Start-Process 'https://platform.bolna.ai'
  do { $k = [Net.NetworkCredential]::new('', (Read-Host '  Paste your Bolna API key (hidden)' -AsSecureString)).Password.Trim() } until ($k)
  [Environment]::SetEnvironmentVariable('BOLNA_API_KEY', $k, 'User')
  Write-Host '  Saved.' -ForegroundColor Green
}

Step 2 'Your phone number'
if (Has 'CALL_ME_PHONE') { Write-Host '  Already set. Skipping.' }
else {
  Write-Host '  Ivy calls this number. Use international format: + then country code, no spaces.'
  do { $p = (Read-Host '  Phone number (e.g. +919876543210)') -replace '[\s-]', '' } until ($p -match '^\+\d{8,15}$')
  [Environment]::SetEnvironmentVariable('CALL_ME_PHONE', $p, 'User')
  Write-Host '  Saved.' -ForegroundColor Green
  Write-Host '  On a Bolna trial account, also verify this number in the Bolna dashboard,'
  Write-Host '  or calls to it will be refused.'
}
# Forget any cached Bolna agent so the next call creates Ivy with the current greeting
[Environment]::SetEnvironmentVariable('BOLNA_AGENT_ID', $null, 'User')

Step 3 'Call when a task ends'
if ($NoHook) { Write-Host '  Skipped (-NoHook).' }
else {
  $settingsPath = "$HOME\.claude\settings.json"
  $s = if (Test-Path $settingsPath) { Copy-Item $settingsPath "$settingsPath.bak" -Force; Get-Content $settingsPath -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
  if (-not $s.hooks) { $s | Add-Member hooks ([pscustomobject]@{}) }
  if (-not $s.hooks.Stop) { $s.hooks | Add-Member Stop @() }
  $cmd = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$skill\stop-hook.ps1`""
  if (-not ($s.hooks.Stop.hooks.command -contains $cmd)) {
    $s.hooks.Stop = @($s.hooks.Stop) + [pscustomobject]@{ hooks = @([pscustomobject]@{ type = 'command'; command = $cmd; timeout = 30 }) }
    [IO.File]::WriteAllText($settingsPath, ($s | ConvertTo-Json -Depth 20))
  }
  Write-Host '  Session-end hook registered (backup: settings.json.bak). It only calls in sessions'
  Write-Host '  where you said "call me when you''re done".' -ForegroundColor Green
}

Step 4 'Daily standup call'
if (-not $Standup) {
  do { $Standup = Read-Host '  Time for the morning call, 24h HH:mm (Enter to skip)' } until (-not $Standup -or $Standup -match '^([01]?\d|2[0-3]):[0-5]\d$')
}
if ($Standup) {
  $a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$skill\standup.ps1`""
  $t = New-ScheduledTaskTrigger -Daily -At $Standup
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
  Register-ScheduledTask -TaskName 'Claude call-me standup' -Action $a -Trigger $t -Settings $set -Description "Daily phone standup about yesterday's Claude sessions (claude-call-me)" -Force | Out-Null
  Write-Host "  Standup scheduled daily at $Standup." -ForegroundColor Green
} else { Write-Host '  Skipped. Run setup.ps1 -Standup 09:00 any time to add it.' }

Write-Host ''
Write-Host '  All set. Restart Claude Code, then say: "call me when you''re done".' -ForegroundColor Green
Write-Host '  Thanks for using claude-call-me by Mithun Sidhaarth - https://mithunsidhaarth.in' -ForegroundColor Yellow
Write-Host ''
