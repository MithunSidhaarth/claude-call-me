# claude-call-me — the promo film (v3)

A 38-second, 1920×1080 / 60 fps promo for claude-call-me: *"Your phone rings. It's Claude. It needs one decision."* Every frame is a deterministic function of time, rendered from code. The live preview in the browser and the exported MP4 are identical. A 1080×1920 Reels / Shorts cut is composed from the same render.

The visual language is the engine and style of **[pdoom-video](https://github.com/mexicat/pdoom-video)** by mexicat (Giacomo Magnanini, MIT licence, see `LICENSE.pdoom-engine`), recoloured for this film: signal `#FF2E2E`, ember `#FF8270`, blood `#A8101A` and an electric-blue flip `#2F45FF`. The nine plates are new and written for this voiceover.

## Layout

- `audio/voiceover.mp3`: the voiceover (ElevenLabs, voice "Alpha", eleven_v4), padded 1.6 s so the end card holds.
- `audio/sfx/`: an ElevenLabs sound-effect library (not in the current mix).
- `data/lyrics.json`: word-level timings of the script, made by `analysis/align_vo.py`. It runs CTC forced alignment with wav2vec2-base-960h (quantized ONNX), then refines word edges against the audio's silences.
- `data/audio.json`: voice loudness envelopes and word onsets, plus a nominal beat grid, made by `analysis/audio_vo.py`.
- `analysis/music_bed.py`: the music, synthesised from scratch and timed from the script, and the final mix (`audio/mix.wav`).
- `analysis/reels.py`: the 9:16 cut with karaoke captions.
- `app/`: the renderer (TypeScript + three.js, bun + Vite).
  - `src/engine/`: the pdoom-video engine (unchanged except the audio path and palette).
  - `src/scenes/_vo.ts`, `src/scenes/_cm.ts`: shared toolkits (camera, plotter, karaoke; slams, rings, brackets, waveform, tickers).
  - `src/scenes/*.ts`: the plates, listed below.
  - `src/timeline.ts`: when each plate plays (cuts sit in the pause before each line).
  - `scripts/render.ts`: offline renderer (headless Chrome → raw frames → ffmpeg).
- `out/`: renders (git-ignored).

| Plate | Time | Script |
|---|---|---|
| `ring` | 0.0–3.9 | Your phone rings. / It's Claude. / It needs one decision. |
| `terminal` | 3.9–8.1 | Stop babysitting the terminal. / Walk away. / Claude calls you. |
| `loop` | 8.1–12.6 | When it's stuck, it calls you. / You answer. / It gets back to work. |
| `livecall` | 12.6–16.8 | A real voice agent asks, confirms your answer, and hangs up. |
| `afternoon` | 16.8–21.5 | Without it, Claude waits on you. / With it, you come back to finished work. |
| `steps` | 21.5–27.0 | When a task ends, it calls with next steps. / You pick one, and it does it, live. |
| `standup` | 27.0–30.6 | And every morning at nine, a standup call about yesterday. |
| `keys` | 30.6–32.7 | Your keys never touch the chat. |
| `callme` | 32.7–38.2 | Call me. / Claude call me. Free and open source. |

## Requirements

You need [bun](https://bun.sh), Google Chrome and ffmpeg with libx264. To re-align a new voiceover and rebuild the music you also need Python 3 with numpy, scipy and onnxruntime, and the alignment model in `analysis/models/` (git-ignored, 95 MB, from the Motion-as-Code kit).

## Preview

```sh
cd app
bunx vite
```

Open http://localhost:5173. Controls:

| Key | Action |
|---|---|
| space | play / pause |
| ← / → | seek ±1 s (±5 s with shift) |
| `,` / `.` | step one frame |
| `[` / `]` | previous / next plate |
| `l` | loop the current plate |
| `h` | hide the UI |

Add `?t=20` to the URL to start at 20 s.

## Render

```sh
cd app
bun scripts/render.ts sheet --times '0.6,2,4.5,7.5,9,12,14,17.5,21,25,29.5,33.2,36' --cols 6 --out ../out/sheet.png
bun scripts/render.ts video --fps 60 --samples 4 --shutter 0.5 --crf 15 --noaudio --out ../out/film.noaudio.mp4
```

- `--samples 4` averages four sub-frames per frame (motion blur). `--samples auto --min-samples 4 --max-samples 12` spends more where motion is fast.
- `--scale 2` renders 4K (3840×2160).
- No Chrome installed (Linux, CI)? Set `BROWSER_PATH` to a Chromium binary; WebGL then runs on SwiftShader (about 1 s per frame at `--samples 4` on 4 cores).

## Music and mix

`analysis/music_bed.py` writes the music (dark 120 BPM electronic in A minor: pad and plucked arpeggio under the hook, kick, clap, side-chained bass from "Stop babysitting", an octave-up lead from "A real voice agent", a riser into "Call me." and a held chord under the end card). Section edges are read from `data/lyrics.json`, so a new voiceover re-times the music too. The mix sets the music 5 dB under the voice, ducks it a further 6 dB while the voice speaks and normalises to −14 LUFS. Then mux the picture with the mix, and build the Reels cut:

```sh
python analysis/music_bed.py            # needs numpy + scipy
ffmpeg -i out/film.noaudio.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 19 -c:a aac -b:a 256k -shortest -movflags +faststart out/film.mp4
python analysis/reels.py out/film.mp4 audio/mix.wav out/film-reels.mp4
```

Repo exports: `assets/promo.mp4` and `assets/promo-reels.mp4` (two-pass x264 at 1.9 Mb/s, under 10 MB each) and `assets/promo.gif` (the first 9 s, 640 px, 12 fps, lightly denoised, under 4 MB).

## Swapping the voiceover

1. Replace `audio/voiceover.mp3`.
2. Edit `SCRIPT` (and `SPOKEN` for numbers and acronyms) in `analysis/align_vo.py`.
3. Re-run the alignment and the audio analysis:

```sh
python -m uv run --no-project --with onnxruntime --with numpy python analysis/align_vo.py
python -m uv run --no-project --with numpy python analysis/audio_vo.py
```

The plates find their words by content (`lineOf` and `wordOf`). If you keep the same script, every animation re-times itself to the new read. Then rebuild the music and mix (`python analysis/music_bed.py`), re-render and re-mux.
