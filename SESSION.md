# Session notes: where this project stands

A handoff for the next Claude Code session (or a human). Read this first, then continue from **Next steps**.

_Last updated: 2026-10-13 (v3 film shipped)._

## What exists

| Piece | Where | State |
|---|---|---|
| The skill | `skill/` (installed copy: `~/.claude/skills/call-me/`) | Working. Calls go through Bolna (trial: verified numbers only). |
| Session-end calls | `skill/stop-hook.ps1`, registered in `~/.claude/settings.json` | Installed and logic-tested on fake transcripts; not yet exercised in a real session. |
| Daily standup | `skill/standup.ps1` | Built, dry-run tested on fake transcripts. **Not scheduled yet**: the user must run `.\install.ps1 -Standup 09:00` (Claude's auto mode blocks creating scheduled tasks). |
| Installer | `install.ps1` | Copies the skill, prompts for the Bolna key at a hidden prompt, registers the hook, optional standup schedule. |
| Promo v1 | (replaced) | motionspec render with the Windows SAPI voice. Still the portfolio card's hover clip until that is updated. |
| Promo v2, motionspec | `video/` (spec, theme, `assets/incoming-call.png`, `assets/logo.png`) | Spec upgraded (phone device scene, compare scene, varied backdrops). Not rendered: superseded by the film below. |
| **Promo v3, the film (shipped)** | `film/` → `assets/promo.mp4`, `assets/promo-reels.mp4`, `assets/promo.gif` | Motion-as-Code kit (three.js, pdoom-video engine, MIT, see `film/LICENSE.pdoom-engine`), red palette, nine plates. ElevenLabs "Alpha" voice, synthesised music (`film/analysis/music_bed.py`), 9:16 Reels cut (`film/analysis/reels.py`). In the README. |
| Portfolio card | `W:\MITHUN 2.0\Portfolio\repo` (mithunsidhaarth.in) | "Claude Call Me" entry + 0.7 MB hover clip of promo v1. |

## The film (`film/`)

- Plates in `film/app/src/scenes/`: `ring`, `terminal`, `loop`, `livecall`, `afternoon`, `steps`, `standup`, `keys`, `callme`. Shared toolkit: `_cm.ts` (base `Plate`, slams, rings, brackets, waveform, tickers) on top of the kit's `_vo.ts`.
- `film/app/src/timeline.ts` cuts on script lines, so a new voiceover re-times everything once re-aligned.
- Script: `SCRIPT` in `film/analysis/align_vo.py` (18 lines). Same text as the ElevenLabs take (flow https://elevenlabs.io/app/flows/IcYOpcPXczggYgFaKRIy, take B used).
- ElevenLabs takes CAN be downloaded: the run status returns a signed `content_url` (valid 2 h). The restricted connector has no music generation, hence the synthesised music.
- Palette (`film/app/src/engine/palette.ts`): signal `#FF2E2E`, ember `#FF8270`, blood `#A8101A`, acid repurposed as electric blue `#2F45FF` for full-frame flips.
- Style target: the reel the user shared (motionloved, "5.5 is ridiculous at motion"): a new look every second, kinetic type, HUD, data, colour flips.
- Rendered 2026-10-13 at 1080p60, `--samples 4`, on Linux Chromium (`BROWSER_PATH`, SwiftShader, ~1 s/frame). Masters were delivered in the project files (`v3-film/`).

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

1. **Portfolio.** The muted 960 px hover clip is made (project files: `v3-film/portfolio-hover-claude-call-me.mp4`); copy it to `Portfolio/repo/assets/claude/claude-call-me.mp4`; push the portfolio after the user reviews it.
2. **Vox-style AI inserts (optional).** 2–3 short cinematic clips cut in as ~1 s inserts. Needs a video generator: the restricted ElevenLabs connector has none (the full connector at https://api.elevenlabs.io/v1/mcp does).
3. **Music (optional).** Swap the synthesised track for an ElevenLabs music bed if the full connector is added; `music_bed.py`'s mix stage can take any bed.
4. **Cleanup.** Delete `W:\MITHUN 2.0\claude-call-me-film` (only stale `node_modules` left after the move into `film/`).

## Decisions so far

- Provider: Bolna (Bland needs a paid purchase before calling India). Keys only in user env vars, never in chat or files.
- Repo name stays `claude-call-me`. MIT for code; `NOTICE` keeps the name/branding/video as the author's.
- The user reviews the portfolio before it goes live, unless they say to push.
- Credits read "Mithun Sidhaarth".
