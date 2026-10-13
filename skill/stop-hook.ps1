# Stop hook: in sessions where the call-me skill was invoked (and not turned off),
# block the stop once and tell Claude to phone the user with an update + next steps.
$in = [Console]::In.ReadToEnd() | ConvertFrom-Json
if ($in.stop_hook_active -or -not (Test-Path $in.transcript_path)) { exit 0 }

$on = -1; $off = -1; $i = 0
foreach ($line in [IO.File]::ReadLines($in.transcript_path)) {
  if ($line -match '"skill"\s*:\s*"call-me"' -or $line -match '<command-name>/?call-me</command-name>') { $on = $i }
  if ($line -match '"type"\s*:\s*"assistant"' -and $line.Contains('[call-me off]')) { $off = $i }
  $i++
}
if ($on -lt 0 -or $off -gt $on) { exit 0 }

@{
  decision = 'block'
  reason   = 'call-me is active for this session. Before stopping, follow the call-me skill''s "Session-end calls" section: phone the user with an update and next steps, then act on what they say.'
} | ConvertTo-Json -Compress
