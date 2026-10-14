# claude-call-me installer (Windows PowerShell 5.1+)
#   .\install.ps1                  skill + session-end hook
#   .\install.ps1 -Standup 09:00   also schedule the daily standup call
#   .\install.ps1 -NoHook          skill only, no session-end calls
param([string]$Standup, [switch]$NoHook)
$ErrorActionPreference = 'Stop'
$skill = "$HOME\.claude\skills\call-me"

# 1. Skill files
New-Item -ItemType Directory -Force $skill | Out-Null
Copy-Item "$PSScriptRoot\skill\*" $skill -Force
Write-Host "Skill installed to $skill"

# 2. Secrets and phone, stored as user environment variables (never in files)
if (-not [Environment]::GetEnvironmentVariable('BOLNA_API_KEY','User')) {
  $k = Read-Host 'Bolna API key (input hidden)' -AsSecureString
  [Environment]::SetEnvironmentVariable('BOLNA_API_KEY', [Net.NetworkCredential]::new('', $k).Password, 'User')
}
if (-not [Environment]::GetEnvironmentVariable('CALL_ME_PHONE','User')) {
  $p = Read-Host 'Your phone number in E.164 format (e.g. +919876543210)'
  if ($p -notmatch '^\+\d{8,15}$') { throw "Not an E.164 number: $p" }
  [Environment]::SetEnvironmentVariable('CALL_ME_PHONE', $p, 'User')
}

# Forget any cached Bolna agent so the next call creates Juno with the current greeting
[Environment]::SetEnvironmentVariable('BOLNA_AGENT_ID', $null, 'User')

# 3. Session-end hook in ~/.claude/settings.json (backup kept as settings.json.bak)
if (-not $NoHook) {
  $settingsPath = "$HOME\.claude\settings.json"
  $s = if (Test-Path $settingsPath) { Copy-Item $settingsPath "$settingsPath.bak" -Force; Get-Content $settingsPath -Raw | ConvertFrom-Json } else { [pscustomobject]@{} }
  if (-not $s.hooks) { $s | Add-Member hooks ([pscustomobject]@{}) }
  if (-not $s.hooks.Stop) { $s.hooks | Add-Member Stop @() }
  $cmd = "powershell -NoProfile -ExecutionPolicy Bypass -File `"$skill\stop-hook.ps1`""
  if (-not ($s.hooks.Stop.hooks.command -contains $cmd)) {
    $s.hooks.Stop = @($s.hooks.Stop) + [pscustomobject]@{ hooks = @([pscustomobject]@{ type = 'command'; command = $cmd; timeout = 30 }) }
    [IO.File]::WriteAllText($settingsPath, ($s | ConvertTo-Json -Depth 20))
  }
  Write-Host 'Session-end hook registered'
}

# 4. Daily standup call via Task Scheduler
if ($Standup) {
  $a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$skill\standup.ps1`""
  $t = New-ScheduledTaskTrigger -Daily -At $Standup
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
  Register-ScheduledTask -TaskName 'Claude call-me standup' -Action $a -Trigger $t -Settings $set -Description "Daily phone standup about yesterday's Claude sessions (claude-call-me)" -Force | Out-Null
  Write-Host "Standup call scheduled daily at $Standup (next: $((Get-ScheduledTaskInfo 'Claude call-me standup').NextRunTime))"
}

Write-Host 'Done. Verify your number in the Bolna dashboard if you are on a trial account, then tell Claude "call me".'
