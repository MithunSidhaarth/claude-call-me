"""A music bed for the voiceover, synthesised from scratch (no samples), then the final mix.

Dark, minimal electronic at 120 BPM in A minor: a sub drone and ticking hats under the hook, a
four-on-the-floor pulse with a side-chained saw bass from "Stop babysitting", a lifted chord pad from
"A real voice agent", a riser into "Call me." and a held chord under the end card. Section edges come
from data/lyrics.json, so the bed re-times with the voiceover like the plates do.

The mix ducks the bed ~8 dB under the voice (envelope follower on the voiceover), adds the voice on
top and normalises to about -14 LUFS with ffmpeg's loudnorm.

    python analysis/music_bed.py
Writes audio/music_bed.wav (the bed alone) and audio/mix.wav (48 kHz stereo, voice + bed).
"""
import json, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BPM = 120.0
BEAT = 60.0 / BPM
rng = np.random.default_rng(7)

LY = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
start = lambda q: next(l["start"] for l in LY if l["text"].startswith(q))


def decode(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


VO = decode(ROOT / "audio" / "voiceover.mp3")
DUR = len(VO) / SR
N = len(VO)
t = np.arange(N) / SR

# section edges, snapped to the nearest beat so the groove stays on grid
snap = lambda x: round(x / BEAT) * BEAT
T_DROP = snap(start("Stop babysitting")) - 0.0
T_LIFT = snap(start("A real voice agent"))
T_STAND = snap(start("And every morning"))
T_CALL = start("Call me.")
T_END = DUR


def hz(note):  # MIDI note -> Hz
    return 440.0 * 2 ** ((note - 69) / 12)


def env_ar(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def place(buf, x, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += gain * x


def onepole_lp(x, fc):
    """One-pole low-pass; fc may be an array (per-sample cutoff)."""
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def saw(f, n, detune=0.0):
    ph = np.cumsum(np.full(n, f * (1 + detune)) / SR)
    return 2 * (ph % 1.0) - 1


# --------------------------------------------------------------- voices
def kick():
    n = int(0.42 * SR); tt = np.arange(n) / SR
    f = 42 + 110 * np.exp(-tt * 38)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7.5) * 0.95


def hat(open_=False):
    n = int((0.16 if open_ else 0.045) * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n)
    x = x - onepole_lp(x, 7000)  # crude high-pass
    return x * np.exp(-tt * (22 if open_ else 90)) * 0.22


def clap():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n); x = x - onepole_lp(x, 1200)
    e = np.exp(-tt * 18) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * tt) > 0) * (tt < 0.03))
    return x * e * 0.3


def ring_blip(f=1320):  # the phone motif: two short sine chirps
    n = int(0.09 * SR); tt = np.arange(n) / SR
    b = np.sin(2 * np.pi * f * tt) * env_ar(n, 0.004, 0.05)
    return np.concatenate([b, np.zeros(int(0.05 * SR)), b * 0.8])


# --------------------------------------------------------------- arrangement
bed = np.zeros(N)
side = np.ones(N)  # side-chain gain driven by the kick

# A-minor progression, one chord per bar (2 s): Am, F, C, G
PROG = [(57, 60, 64), (53, 57, 60), (48, 55, 60), (55, 59, 62)]
ROOTS = [45, 41, 48, 43]  # bass roots (A2 F2 C3 G2)
bar = lambda x: int(x // (4 * BEAT)) % 4

# sub drone under the hook
drone_end = T_DROP
n = int(drone_end * SR)
dr = np.sin(2 * np.pi * hz(33) * t[:n]) * 0.32 + np.sin(2 * np.pi * hz(45) * t[:n]) * 0.08
bed[:n] += dr * env_ar(n, 0.8, 0.25)
# phone-ring motif at the very top, echoing the "Your phone rings."
for k, t0 in enumerate([0.02, 0.62]):
    place(bed, ring_blip(), t0, 0.16 - 0.05 * k)
# ticking hats in the hook
b = 0.0
while b < T_DROP - 0.01:
    place(bed, hat(), b + BEAT / 2, 0.55)
    b += BEAT

# groove: kick on every beat, clap on 2 & 4, hats on the off-beats; thins out after the lift
b = T_DROP
while b < T_CALL - 0.05:
    beat_i = int(round((b - T_DROP) / BEAT))
    in_lift = T_LIFT <= b < T_STAND
    if not (in_lift and beat_i % 2 == 1):
        place(bed, kick(), b)
        i0 = int(b * SR); m = min(N - i0, int(0.32 * SR))
        if m > 0: side[i0: i0 + m] = np.minimum(side[i0: i0 + m], 1 - 0.75 * np.exp(-np.arange(m) / SR * 11))
    if beat_i % 2 == 1 and not in_lift:
        place(bed, clap(), b, 0.8)
    place(bed, hat(open_=(beat_i % 4 == 3)), b + BEAT / 2, 0.7)
    if b >= T_STAND:
        place(bed, hat(), b + BEAT / 4, 0.35); place(bed, hat(), b + 3 * BEAT / 4, 0.35)
    b += BEAT

# saw bass, 8th notes on the root, side-chained
bass = np.zeros(N)
b = T_DROP
while b < T_CALL - 0.05:
    r = ROOTS[bar(b - T_DROP)]
    n = int(BEAT / 2 * SR * 0.9)
    x = saw(hz(r), n) * 0.6 + saw(hz(r), n, 0.004) * 0.4 + np.sin(2 * np.pi * hz(r - 12) * np.arange(n) / SR) * 0.6
    place(bass, x * env_ar(n, 0.003, 0.05), b, 0.22)
    b += BEAT / 2
lo = int(T_DROP * SR)
cut = 380 + 900 * np.clip((t - T_DROP) / max(1e-3, T_CALL - T_DROP), 0, 1) ** 2
bass[lo:] = onepole_lp(bass[lo:], cut[lo:])

# chord pad from the lift to the end: detuned saws, slow filter, held chord on the end card
pad = np.zeros(N)
b = T_LIFT
while b < T_END:
    holding = b >= T_CALL
    ch = PROG[0] if holding else PROG[bar(b - T_DROP)]
    length = (T_END - b) if holding else 4 * BEAT
    n = int(length * SR)
    x = sum(saw(hz(nt), n, d) for nt in ch for d in (-0.006, 0.006)) / 6
    place(pad, x * env_ar(n, 0.35 if not holding else 0.02, 0.4 if not holding else min(1.6, length * 0.8)), b, 0.14)
    if holding: break
    b += 4 * BEAT
lo = int(T_LIFT * SR)
pad[lo:] = onepole_lp(pad[lo:], 900 + 600 * np.sin(2 * np.pi * 0.12 * t[lo:]) ** 2)

# riser into "Call me.", then one impact
rs, re_ = T_CALL - 2.2, T_CALL
n = int((re_ - rs) * SR); tt = np.arange(n) / SR
nz = rng.standard_normal(n); nz = onepole_lp(nz, 600 + 7000 * (tt / tt[-1]) ** 2)
place(bed, nz * (tt / tt[-1]) ** 2.2 * 0.35, rs)
imp = kick() * 1.2
n = int(1.8 * SR); tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * hz(33) * tt) * np.exp(-tt * 2.2) * 0.5
place(bed, imp, T_CALL); place(bed, boom, T_CALL)

bed += (bass + pad) * side
bed *= env_ar(N, 0.05, 0.9)

# --------------------------------------------------------------- stereo + write
def stereo(x, width=0.0):
    d = int(0.011 * SR)
    l = x.copy(); r = x.copy()
    if width: r[d:] = (1 - width) * x[d:] + width * x[:-d]
    return np.stack([l, r], 1)

bed_st = stereo(bed, 0.35)
peak = np.abs(bed_st).max()
bed_st = bed_st / peak * 0.7


def write(path, x):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(path)],
                   input=x.astype(np.float32).tobytes(), check=True)


write(ROOT / "audio" / "music_bed.wav", bed_st)

# duck under the voice: envelope follower (fast attack, slow release), ~8 dB at full voice
v = np.abs(VO)
fol = np.empty(N); s = 0.0
att, rel = np.exp(-1 / (0.01 * SR)), np.exp(-1 / (0.25 * SR))
for i in range(N):
    a = att if v[i] > s else rel
    s = a * s + (1 - a) * v[i]
    fol[i] = s
fol = np.clip(fol / (np.percentile(fol, 95) + 1e-9), 0, 1)
duck = 10 ** (-8 * fol / 20)
music_gain = 10 ** (-9 / 20)  # bed sits well below the voice even between words
mix = bed_st * (duck * music_gain)[:, None] + np.stack([VO, VO], 1)

tmp = ROOT / "audio" / "mix.raw.wav"
write(tmp, mix / max(1.0, np.abs(mix).max()))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", str(ROOT / "audio" / "mix.wav")], check=True)
tmp.unlink()
print(f"bed {DUR:.2f}s  drop {T_DROP:.2f}  lift {T_LIFT:.2f}  standup {T_STAND:.2f}  call {T_CALL:.2f}")
