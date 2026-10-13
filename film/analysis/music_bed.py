"""A music track for the voiceover, synthesised from scratch (no samples), then the final mix.

Dark, driving electronic at 120 BPM in A minor (Am F C G, one chord per bar):
- hook (to "Stop babysitting"): pad swell, a plucked arpeggio and the two-note phone-ring motif;
- drop: four-on-the-floor kick, clap, hats, a side-chained saw bass, the pluck in 16ths;
- lift ("A real voice agent"): an octave-up lead arp joins, the pad opens up;
- standup ("And every morning"): 16th hats and a noise riser into "Call me.";
- end card: impact, then the tonic chord rings out through the reverb.
Section edges come from data/lyrics.json, so the music re-times with the voiceover like the plates do.

The mix levels the music 5 dB under the voice, ducks it a further ~6 dB while the voice speaks (envelope follower on the voiceover), adds the voice on
top and normalises to about -14 LUFS with ffmpeg's loudnorm.

    python analysis/music_bed.py        (needs numpy and scipy)
Writes audio/music_bed.wav (the music alone) and audio/mix.wav (48 kHz stereo, voice + music).
"""
import json, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, lfilter

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

LY = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
start = lambda q: next(l["start"] for l in LY if l["text"].startswith(q))


def decode(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


VO = decode(ROOT / "audio" / "voiceover.mp3")
N = len(VO)
DUR = N / SR
t = np.arange(N) / SR

snap = lambda x: round(x / BEAT) * BEAT
T_DROP = snap(start("Stop babysitting"))
T_LIFT = snap(start("A real voice agent"))
T_STAND = snap(start("And every morning"))
T_CALL = start("Call me.")

hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)
lp = lambda x, f, o=2: sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
hp = lambda x, f, o=2: sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
bp = lambda x, a, b, o=2: sosfilt(butter(o, [a, b], "band", fs=SR, output="sos"), x)


def adsr(n, a=0.005, d=0.1, s=0.6, r=0.1):
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(d * SR), min(n, int(r * SR))
    na = min(na, n); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e


def osc_saw(f, n, det=0.0):
    ph = (np.arange(n) * f * (1 + det) / SR + rng.random()) % 1.0
    return 2 * ph - 1


class Bus:
    def __init__(self): self.x = np.zeros((N, 2))

    def add(self, sig, t0, gain=1.0, pan=0.0):
        i = int(round(t0 * SR))
        if i >= N or i + len(sig) <= 0: return
        sig = sig[: N - i]
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.x[i: i + len(sig), 0] += sig * gain * l * 1.414
        self.x[i: i + len(sig), 1] += sig * gain * r * 1.414


drums, bass, pluck, pad, fx = Bus(), Bus(), Bus(), Bus(), Bus()

# ---------------------------------------------------------------- instruments
def kick():
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 46 + 120 * np.exp(-tt * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6.5)
    click = lp(rng.standard_normal(n), 3000) * np.exp(-tt * 300) * 0.25
    return np.tanh((body + click) * 1.6) * 0.8


def clap():
    n = int(0.3 * SR); tt = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 900, 5000)
    e = np.zeros(n)
    for k, d in enumerate([0, 0.011, 0.022]):
        i = int(d * SR); e[i:] += np.exp(-(tt[: n - i]) * (120 if k < 2 else 16)) * (0.7 if k < 2 else 1)
    return x * e * 0.35


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR); tt = np.arange(n) / SR
    x = hp(rng.standard_normal(n), 8000, 4)
    return x * np.exp(-tt * (14 if open_ else 70)) * 0.25


def pluck_note(m, length=0.22, bright=1.0):
    n = int(length * SR); tt = np.arange(n) / SR
    x = osc_saw(hz(m), n, -0.004) + osc_saw(hz(m), n, 0.004) + 0.5 * np.sign(np.sin(2 * np.pi * hz(m) * tt))
    # bright attack fading to a darker body = the "pluck"
    k = np.exp(-tt * 18)
    y = lp(x, 300 + 4200 * bright, 2) * k + lp(x, 800, 2) * (1 - k)
    return y * adsr(n, 0.002, length * 0.5, 0.15, 0.04) * 0.18


def pad_chord(notes, length, a=0.6, r=1.2):
    n = int(length * SR)
    x = sum(osc_saw(hz(m), n, d) for m in notes for d in (-0.007, 0.0, 0.007)) / (3 * len(notes))
    return lp(x, 1800, 2) * adsr(n, a, 0.2, 0.9, min(r, length * 0.6))


def bass_note(m, length):
    n = int(length * SR); tt = np.arange(n) / SR
    x = 0.6 * osc_saw(hz(m), n) + 0.8 * np.sin(2 * np.pi * hz(m) * tt) + 0.5 * np.sin(2 * np.pi * hz(m - 12) * tt)
    x = lp(np.tanh(x * 1.4), 700, 2)
    return x * adsr(n, 0.004, 0.08, 0.7, 0.03) * 0.5


def ring_motif():
    n = int(0.11 * SR); tt = np.arange(n) / SR
    b = (np.sin(2 * np.pi * 1318.5 * tt) + 0.5 * np.sin(2 * np.pi * 1975.5 * tt)) * adsr(n, 0.003, 0.05, 0.4, 0.04)
    return np.concatenate([b, np.zeros(int(0.06 * SR)), b])


# ---------------------------------------------------------------- arrangement
PROG = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
ROOTS = [33, 29, 36, 31]                                          # A1 F1 C2 G1 (+12 in bass_note)
chord_at = lambda x: int(max(0.0, x) // BAR) % 4

# pads: every bar from 0, swelling in over the hook
b = 0.0
while b < T_CALL - 0.05:
    c = PROG[chord_at(b)]
    length = min(BAR, T_CALL - b) + 0.6
    g = 0.35 if b < T_DROP else (0.5 if b < T_LIFT else 0.65)
    pad.add(pad_chord(c, length, a=0.9 if b == 0 else 0.25, r=0.6), b, g)
    b += BAR
# end card: tonic chord with an added octave, long release into the reverb
hold = DUR - T_CALL
pad.add(pad_chord((45, 57, 64, 69), hold, a=0.02, r=hold * 0.8), T_CALL, 0.85)

# phone-ring motif at the top and an echo of it before the drop
fx.add(ring_motif(), 0.02, 0.18, pan=0.25)
fx.add(ring_motif(), 0.62, 0.12, pan=-0.25)

# pluck arpeggio: 8ths in the hook, 16ths from the drop
ARP = [0, 1, 2, 1, 0, 2, 1, 2]
b, k = 0.5, 0
while b < T_CALL - 0.05:
    step = BEAT / 2 if b < T_DROP else BEAT / 4
    c = PROG[chord_at(b)]
    m = c[ARP[k % len(ARP)]] + 12
    bright = 0.5 if b < T_DROP else (0.8 if b < T_LIFT else 1.0)
    pluck.add(pluck_note(m, 0.2, bright), b, 0.9 if k % 4 == 0 else 0.6, pan=0.3 * np.sin(k * 0.7))
    if T_LIFT <= b and k % 2 == 0:  # lead arp an octave up from the lift
        pluck.add(pluck_note(m + 12, 0.16, 1.0), b + BEAT / 8, 0.35, pan=-0.35 * np.sin(k * 0.5))
    b += step; k += 1

# drums + side-chain envelope
side = np.ones(N)
b = T_DROP
while b < T_CALL - 0.05:
    i = int(round((b - T_DROP) / BEAT))
    drums.add(kick(), b, 1.0)
    j = int(b * SR); m = min(N - j, int(0.3 * SR))
    side[j: j + m] = np.minimum(side[j: j + m], 1 - 0.7 * np.exp(-np.arange(m) / SR * 12))
    if i % 2 == 1: drums.add(clap(), b, 0.8, pan=0.05)
    drums.add(hat(open_=(i % 4 == 3)), b + BEAT / 2, 0.8, pan=0.2)
    if b >= T_STAND or (T_LIFT <= b and i % 2 == 0):
        drums.add(hat(), b + BEAT / 4, 0.4, pan=-0.25); drums.add(hat(), b + 3 * BEAT / 4, 0.4, pan=-0.25)
    b += BEAT
# hats ticking in the hook so it never sits still
b = BEAT
while b < T_DROP - 0.01:
    drums.add(hat(), b, 0.45, pan=0.2); b += BEAT

# bass: 8ths on the root (octave pop on the off-beat), from the drop
b, k = T_DROP, 0
while b < T_CALL - 0.05:
    r = ROOTS[chord_at(b)] + 12
    bass.add(bass_note(r + (12 if k % 4 == 3 else 0), BEAT / 2 * 0.92), b, 0.9)
    b += BEAT / 2; k += 1
# sub boom under the hook's first bar, and under "Call me."
n = int(2.6 * SR); tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * hz(33) * tt) * np.exp(-tt * 1.6)
bass.add(boom * 0.5, 0.0); bass.add(boom * 0.8, T_CALL)
drums.add(kick() * 1.2, T_CALL)

# riser into "Call me." and a reverse swell into the drop
def riser(length, top=9000):
    n = int(length * SR); tt = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n); seg = int(0.02 * SR)
    for j in range(0, n, seg):
        f = 400 + top * (j / n) ** 2
        out[j: j + seg] = bp(x[j: j + seg + 64], f * 0.7, min(f * 1.4, SR / 2 - 100), 1)[:len(out[j: j + seg])]
    return out * (tt / tt[-1]) ** 2 * 0.4
fx.add(riser(2.4), T_CALL - 2.4, 0.9)
fx.add(riser(1.0, 5000), T_DROP - 1.0, 0.6)

# ---------------------------------------------------------------- mixdown
def reverb(x, secs=2.2, wet=0.25):
    n = int(secs * SR); tt = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-tt * 3.2)[:, None]
    ir = np.stack([lp(ir[:, 0], 6000), lp(ir[:, 1], 6000)], 1)
    ir /= np.sqrt((ir ** 2).sum(0))
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return x * (1 - wet) + y * wet * 1.4

sc = side[:, None]
music = (drums.x * 0.9
         + bass.x * sc * 0.85
         + reverb(pluck.x * (0.5 + 0.5 * sc), 1.6, 0.3) * 0.9
         + reverb(pad.x * (0.6 + 0.4 * sc), 3.0, 0.4) * 0.8
         + reverb(fx.x, 2.0, 0.35))
music = hp(music.T, 28).T  # rumble
# gentle bus glue + fades
music = np.tanh(music * 1.2) / 1.2
fade = np.ones(N); fi = int(0.03 * SR); fo = int(0.8 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo)
music *= fade[:, None]
music = music / np.abs(music).max() * 0.85


def write(path, x):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(path)],
                   input=x.astype(np.float32).tobytes(), check=True)


write(ROOT / "audio" / "music_bed.wav", music)

# duck under the voice: a fast envelope follower smoothed by a slow one, ~6 dB at full voice
v = np.abs(VO)
att = lfilter([1 - np.exp(-1 / (0.008 * SR))], [1, -np.exp(-1 / (0.008 * SR))], v)
rel_a = np.exp(-1 / (0.3 * SR))
fol = lfilter([1 - rel_a], [1, -rel_a], att)  # slow release smoothing of the fast follower
fol = np.clip(fol / (np.percentile(fol, 95) + 1e-9), 0, 1)
duck = 10 ** (-6 * fol / 20)
# level the music against the voice: its RMS sits 5 dB under the voice's speech RMS (11 dB once ducked)
fr = int(0.05 * SR); k = N // fr
rv = np.sqrt((VO[: k * fr].reshape(k, fr) ** 2).mean(1))
v_rms = rv[rv > np.percentile(rv, 60)].mean()
m_rms = np.sqrt((music ** 2).mean())
music_gain = v_rms / m_rms * 10 ** (-5 / 20)
mix = music * (duck * music_gain)[:, None] + np.stack([VO, VO], 1)

tmp = ROOT / "audio" / "mix.raw.wav"
write(tmp, mix / max(1.0, np.abs(mix).max()))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", str(ROOT / "audio" / "mix.wav")], check=True)
tmp.unlink()
print(f"music {DUR:.2f}s  drop {T_DROP:.2f}  lift {T_LIFT:.2f}  standup {T_STAND:.2f}  call {T_CALL:.2f}")
