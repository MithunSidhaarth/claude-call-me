# Session notes: where this project stands

A handoff for the next Claude Code session (or a human). Read this first, then continue from **Next steps**.

_Last updated: 2026-10-13._

## What exists

| Piece | Where | State |
|---|---|---|
| The skill | `skill/` (installed copy: `~/.claude/skills/call-me/`) | Working. Calls go through Bolna (trial: verified numbers only). |
| Session-end calls | `skill/stop-hook.ps1`, registered in `~/.claude/settings.json` | Installed and logic-tested on fake transcripts; not yet exercised in a real session. |
| Daily standup | `skill/standup.ps1` | Built, dry-run tested on fake transcripts. **Not scheduled yet**: the user must run `.\install.ps1 -Standup 09:00` (Claude's auto mode blocks creating scheduled tasks). |
| Installer | `install.ps1` | Copies the skill, prompts for the Bolna key at a hidden prompt, registers the hook, optional standup schedule. |
| Promo v1 (shipped) | `assets/promo.mp4`, `assets/promo.gif` | motionspec render with the Windows SAPI voice. In the README and the portfolio card. |
| Promo v2, motionspec | `video/` (spec, theme, `assets/incoming-call.png`, `assets/logo.png`) | Spec upgraded (phone device scene, compare scene, varied backdrops). Not rendered: superseded by the film below. |
| **Promo v3, the film** | `film/` | **In progress.** Motion-as-Code kit (three.js, pdoom-video engine, MIT, see `film/LICENSE.pdoom-engine`), red palette, nine new plates. Uses a placeholder voice. |
| Portfolio card | `W:\MITHUN 2.0\Portfolio\repo` (mithunsidhaarth.in) | "Claude Call Me" entry + 0.7 MB hover clip of promo v1. |

## The film (`film/`)

- Plates in `film/app/src/scenes/`: `ring`, `terminal`, `loop`, `livecall`, `afternoon`, `steps`, `standup`, `keys`, `callme`. Shared toolkit: `_cm.ts` (base `Plate`, slams, rings, brackets, waveform, tickers) on top of the kit's `_vo.ts`.
- `film/app/src/timeline.ts` cuts on script lines, so a new voiceover re-times everything once re-aligned.
- Script: `SCRIPT` in `film/analysis/align_vo.py` (18 lines). Same text as the ElevenLabs take.
- Palette (`film/app/src/engine/palette.ts`): signal `#FF2E2E`, ember `#FF8270`, blood `#A8101A`, acid repurposed as electric blue `#2F45FF` for full-frame flips.
- Style target: the reel the user shared (motionloved, "5.5 is ridiculous at motion"): a new look every second, kinetic type, HUD, data, colour flips.
- Last contact-sheet review fixed: flash wash-outs, loop label overlaps, ENDED width, form plate zoom/header overlap, standup/keys framing. **Re-render a sheet to confirm** before the full render.

### Tools on this machine (not in the repo)

- Portable Python 3.12 + motionspec + onnxruntime: `~/.local/claude-tools/python/python.exe`
- ffmpeg 9: `~/.local/claude-tools/ffmpeg/` (prepend to `PATH`)
- bun, Chrome: installed globally
- The alignment model is git-ignored (95 MB): copy `analysis/models/*` from `D:\Motion_as_kit.zip` into `film/analysis/models/`.

### Commands (run in `film/app`, with the ffmpeg folder on `PATH`)

```powershell
bun install
bun scripts/render.ts sheet --times '0.6,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40' --cols 6 --out ../out/sheet.png
bun scripts/render.ts video --samples auto --min-samples 4 --max-samples 12 --shutter 0.5 --crf 17 --out ../out/promo.mp4
```
Re-align after swapping `film/audio/voiceover.mp3` (from `film/`): `python analysis/align_vo.py` then `python analysis/audio_vo.py`.

## Next steps

1. **Voice + music (waiting on the user).** ElevenLabs flow: https://elevenlabs.io/app/flows/uXLl3A0zNsJGDyWLXM8a holds 3 takes of the "Alpha" voice (eleven_v4) reading the script, and 2 music beds (eleven_music_v2_5). The connector cannot export files: the user downloads their picks. Then: copy the voice to `film/audio/voiceover.mp3`, re-align, re-check the sheet.
2. **Vox-style AI inserts.** The user asked to use both kits. Plan: 2–3 short cinematic clips (phone lighting up beside a laptop at night; someone walking away from their desk) generated via the ElevenLabs connector's video models, cut in as ~1 s inserts over the film with ffmpeg (`overlay=enable='between(t,a,b)'`). Prompts follow `Vox Animations/.claude/skills/vox-animation/references/vox-prompts.md` (in `D:\Vox Animations.zip`).
3. **Mix and render.** Music bed under the voice (duck ~8 dB), then the full render. Export: 1080p for the repo (`assets/promo.mp4`, target < 10 MB), a 9 s GIF for the README (`assets/promo.gif`, < 4 MB), a muted 960 px clip for the portfolio hover (`Portfolio/repo/assets/claude/claude-call-me.mp4`).
4. **Ship.** Update `video/SCRIPT.md` → point at `film/`, push the repo, push the portfolio after the user reviews it, phone the user (call-me skill) when done.
5. **Cleanup.** Delete `W:\MITHUN 2.0\claude-call-me-film` (only stale `node_modules` left after the move into `film/`).

## Decisions so far

- Provider: Bolna (Bland needs a paid purchase before calling India). Keys only in user env vars, never in chat or files.
- Repo name stays `claude-call-me`. MIT for code; `NOTICE` keeps the name/branding/video as the author's.
- The user reviews the portfolio before it goes live, unless they say to push.
