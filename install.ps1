# claude-call-me installer (Windows PowerShell 5.1+)
#   .\install.ps1                  copy the skill, then run the guided setup
#   .\install.ps1 -Standup 09:00   also schedule the daily standup call without asking
#   .\install.ps1 -NoHook          skip the session-end hook
param([string]$Standup, [switch]$NoHook)
$ErrorActionPreference = 'Stop'
$skill = "$HOME\.claude\skills\call-me"

New-Item -ItemType Directory -Force $skill | Out-Null
Copy-Item "$PSScriptRoot\skill\*" $skill -Force

# Intro, credits, Bolna key, phone, hook and standup: see skill/setup.ps1
& "$skill\setup.ps1" @PSBoundParameters
