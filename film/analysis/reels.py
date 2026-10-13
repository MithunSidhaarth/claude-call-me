"""The 9:16 Reels / Shorts cut, composed from the 16:9 render with ffmpeg.

1080x1920: a blurred, darkened copy of the film fills the frame; the film sits full-width above the
middle between two signal-red rules; a header names the project; under the film the script plays as
big karaoke captions (each word turns red as it is said), timed from data/lyrics.json so the
captions carry the film with the sound off.

    python analysis/reels.py out/promo.mp4 audio/mix.wav out/promo-reels.mp4
"""
import json, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "app" / "public" / "fonts"
W, H = 1080, 1920
VID_H = 608                  # 1920x1080 scaled to 1080 wide
VID_Y = 600                  # top of the film in the frame
RED, WHITE, DIM = "&H002E2EFF", "&H00FFFFFF", "&H8CFFFFFF"  # ASS colours are &HAABBGGRR


def ts(x):
    x = max(0.0, x)
    h, m = int(x // 3600), int(x % 3600 // 60)
    return f"{h}:{m:02d}:{x % 60:05.2f}"


def ass(lines, dur):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Archivo SemiBold,92,{RED},{WHITE},&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,6,8,70,70,{VID_Y + VID_H + 110},1
Style: Kicker,IBM Plex Mono,34,{RED},{RED},&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,0,0,8,60,60,300,1
Style: Title,Archivo SemiBold,88,{WHITE},{WHITE},&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,4,8,60,60,355,1
Style: Foot,IBM Plex Mono,32,{DIM},{DIM},&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,2,60,60,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = [
        f"Dialogue: 0,{ts(0)},{ts(dur)},Kicker,,0,0,0,,CLAUDE CODE SKILL",
        f"Dialogue: 0,{ts(0)},{ts(dur)},Title,,0,0,0,,{{\\fad(250,0)}}claude-call-me",
        f"Dialogue: 0,{ts(0)},{ts(dur)},Foot,,0,0,0,,github.com/MithunSidhaarth/claude-call-me",
    ]
    for i, l in enumerate(lines):
        t0 = l["start"] - 0.08
        t1 = lines[i + 1]["start"] - 0.1 if i + 1 < len(lines) else dur
        words = [w for w in l["words"] if w["end"] > w["start"]] or l["words"]
        parts, cur = [], t0
        for j, w in enumerate(words):
            nxt = words[j + 1]["start"] if j + 1 < len(words) else w["end"]
            # \k: the word waits (secondary colour, white) until it is said, then turns primary (red)
            lead = max(0, round((w["start"] - cur) * 100))
            parts.append(f"{{\\k{lead}}}{{\\k{max(1, round((nxt - w['start']) * 100))}}}{w['w'].upper()}")
            cur = nxt
        text = " ".join(parts)
        ev.append(f"Dialogue: 1,{ts(t0)},{ts(t1)},Cap,,0,0,0,,{{\\fad(60,60)}}{text}")
    return head + "\n".join(ev) + "\n"


def main(video, audio, out):
    lines = json.loads((ROOT / "data" / "lyrics.json").read_text(encoding="utf-8"))["lines"]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video], capture_output=True, text=True, check=True).stdout)
    with tempfile.TemporaryDirectory() as d:
        d = Path(d)
        # libass picks fonts by family name; the static Archivo instance (black, wide) is named "Archivo SemiBold"
        (d / "fonts").mkdir()
        shutil.copy(FONTS / "Archivo-w1125-900.ttf", d / "fonts" / "Archivo.ttf")
        shutil.copy(FONTS / "src" / "IBMPlexMono-Medium.ttf", d / "fonts" / "IBMPlexMono.ttf")
        (d / "cap.ass").write_text(ass(lines, dur), encoding="utf-8")
        fc = (
            f"[0:v]split[a][b];"
            f"[a]scale=-2:{H},crop={W}:{H},gblur=sigma=40,lutrgb=r=val*0.3:g=val*0.3:b=val*0.3[bg];"
            f"[b]scale={W}:-2[fg];"
            f"[bg][fg]overlay=0:{VID_Y},"
            f"drawbox=x=0:y={VID_Y - 6}:w={W}:h=6:color=0xFF2E2E:t=fill,"
            f"drawbox=x=0:y={VID_Y + VID_H}:w={W}:h=6:color=0xFF2E2E:t=fill,"
            f"ass=cap.ass:fontsdir=fonts,format=yuv420p[v]"
        )
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(Path(video).resolve()), "-i", str(Path(audio).resolve()), "-filter_complex", fc,
                        "-map", "[v]", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-profile:v", "high",
                        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
                        "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", str(Path(out).resolve())], cwd=d, check=True)


if __name__ == "__main__":
    main(*sys.argv[1:4])
