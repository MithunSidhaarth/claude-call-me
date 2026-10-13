> **Superseded.** The shipped promo is now the film in [`../film/`](../film/) (same script, rendered from code with the Motion-as-Code kit). This page is the brief for the earlier motionspec version.

# "Your phone rings." The claude-call-me promo

**Brief.** Product: claude-call-me, a Claude Code skill that phones you. Audience: developers who run long Claude Code tasks. The one claim: *walk away, Claude calls you when it needs you.* The one action: get it on GitHub.

**Format.** 16:9 landscape explainer, about 35 s, 30 fps, voice-led. Built from `spec.json` with [motionspec](https://github.com/MithunSidhaarth/motionspec).

**Direction: maximalist.** Neon look, lively motion, grid backdrop, bloom + halation + chromatic aberration + grain on every frame. Hard accent (signal red, `#FF2E2E`) on near-black, with inverted full-red scenes as the hits: the hook, the privacy promise, the title drop. No scene type twice in a row; every scene has a camera move; something changes at least every 1.2 s. Captions karaoke-style on the spoken word.

| # | Scene (visual verb) | On screen | Voiceover |
|---|---|---|---|
| 1 | `slam` on red | YOUR / PHONE / RINGS. | "Your phone rings." |
| 2 | `title` words, underline | INCOMING CALL → It's *Claude*. | "It's Claude. It needs one decision." |
| 3 | `strike` | ~~Babysit the terminal for hours.~~ → Walk away. Claude calls you. | "Stop babysitting the terminal. Walk away. Claude calls you." |
| 4 | `flow`, looping packets | Stuck → Calls you → You answer → Back to work | "When it's stuck, it calls you. You answer. It gets back to work." |
| 5 | `code` typewriter | a real-style call transcript | "A voice agent asks, confirms your answer, and hangs up." |
| 6 | `timeline` | Task done → You pick → Live | "When a task finishes, it calls with an update and next steps. You pick one, and it does it, live." |
| 7 | `stat` odometer | 9 AM: EVERY MORNING | "Every morning at nine: a standup call about yesterday, and what's next." |
| 8 | `note`, inverted | Your keys stay yours. | "Your keys never touch the chat." |
| 9 | `slam` | CALL / ME. | "Call me." |
| 10 | `endcard` + button | claude-call-me: Get it on GitHub | "claude call me. Free and open source." |

**Claims check.** No statistics. "9 AM" is the documented default in `install.ps1 -Standup 09:00`; "free" means MIT-licensed code (calls use the user's own Bolna credit, which the README says).

## Rebuild

```
pip install git+https://github.com/MithunSidhaarth/motionspec
cd video
motionspec voice spec.json --provider local --write    # or ElevenLabs: set ELEVENLABS_API_KEY + voice.voice_id
motionspec validate spec.json && motionspec analyze spec.json
motionspec render spec.json -o ../assets/promo.mp4 --blur 2
```
