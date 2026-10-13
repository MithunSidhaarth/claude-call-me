// LIVECALL: "A real voice agent asks, confirms your answer, and hangs up."
// The call as an instrument: an oscilloscope across the frame, the transcript typing on the left,
// three verdict stamps on the right (ASKS / CONFIRMS / HUNG UP) on their words. On "hangs up" the
// trace flatlines and the frame flips electric blue: CALL ENDED.
import { Plate, slam, brackets, mono, waveform, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam } from './_cm';
import { pt, placeRow } from './_vo';

const TR = [
  ['agent', 'Postgres or SQLite for the cache?'],
  ['you', 'SQLite. Keep it simple.'],
  ['agent', 'SQLite, confirmed. Back to work.'],
];

export default class LiveCall extends Plate {
  build() {
    this.words([
      ['a', 'A real voice agent', 'A'], ['real', 'A real voice agent', 'real'], ['voice', 'A real voice agent', 'voice'], ['agent', 'A real voice agent', 'agent'],
      ['asks', 'A real voice agent', 'asks,'], ['confirms', 'A real voice agent', 'confirms'], ['your', 'A real voice agent', 'your'], ['answer', 'A real voice agent', 'answer,'],
      ['and', 'A real voice agent', 'and'], ['hangs', 'A real voice agent', 'hangs'], ['up', 'A real voice agent', 'up.'],
    ]);
    const w = this.w, P = this.plot;
    this.kw.push(...placeRow([w.a!, w.real!, w.voice!, w.agent!], -860, -380, 96, BLACK, 'title', { ant: 0.15 }).words);
    // the scope's frame, ruled by the pen
    P.wp(pt(-860, -220), this.T0, 0.02);
    P.add([pt(-860, -220), pt(860, -220)], this.T0 + 0.02, w.voice!.start, 'plot', { pen: true, width: 1.6 });
    P.add([pt(860, 120), pt(-860, 120)], w.voice!.start, w.asks!.start, 'plot', { pen: true, width: 1.6 });
    for (let i = 0; i <= 20; i++) P.add([pt(-860 + i * 86, 120), pt(-860 + i * 86, 132 + (i % 5 ? 0 : 12))], this.T0 + i * 0.02, this.T0 + i * 0.02 + 0.03, 'axis');
    const K = this.cam;
    K.key(this.T0, 0, -120, 1.25, 0.01);
    K.key(w.voice!.start, 0, -60, 1.0, 0, ease.outExpo);
    K.key(w.confirms!.start, -40, 40, 0.98, -0.006, ease.inOutCubic);
    K.key(w.hangs!.start, 0, 40, 0.94, 0.006, ease.inOutCubic);
    K.key(w.hangs!.start + 0.2, 0, 0, 1.08, 0, ease.outExpo);
    K.key(this.T1, 0, 0, 1.12, 0, ease.linear);
  }

  blue(t: number) { return t >= this.w.hangs!.start; }
  field(t: number) { return this.blue(t) ? rgba('acid', 1) : null; }
  groupAlpha(g: string, t: number) { return g === 'title' ? 1 - prog(t, this.w.hangs!.start - 0.1, this.w.hangs!.start) : 1; }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (this.blue(t)) {
      slam(ctx, c, t, 'CALL', w.hangs!.start, 0, -40, 250, { hot: 'bone', fin: 'bone' });
      slam(ctx, c, t, 'ENDED.', w.up!.start, 0, 230, 250, { hot: 'ink', fin: 'ink' });
      const secs = 47;
      mono(ctx, c, `DURATION 00:${secs}  ·  ANSWER SAVED  ·  RESUMING TASK`, 0, 420, 22, rgba('bone', prog(t, w.up!.end, w.up!.end + 0.2)), { align: 'center', typed: prog(t, w.up!.end, w.up!.end + 0.5) });
      brackets(ctx, c, -900, -420, 1800, 920, 60, rgba('bone', 0.8));
      return;
    }
    // the scope
    const talking = this.ctx.lyrics.lines.some((l) => l.words.some((x) => t >= x.start && t <= x.end)) ? 1 : 0.35;
    waveform(ctx, c, t, -840, 840, -50, 300, talking * prog(t, w.voice!.start, w.agent!.end), rgba('signal', 1), 96, 4);
    mono(ctx, c, '● LIVE', -840, -240, 20, rgba('signal', Math.floor(t * 3) % 2 ? 1 : 0.4));
    mono(ctx, c, `00:${String(Math.floor(12 + (t - this.T0) * 9)).padStart(2, '0')}`, 840, -240, 20, rgba('bone', 0.9), { align: 'right' });
    // transcript card
    const tx = -860, ty = 190;
    setWorld(ctx, c, tx, ty);
    rrect(ctx, 0, 0, 980, 230, 14);
    ctx.fillStyle = rgba('ink2', 0.95); ctx.fill();
    ctx.strokeStyle = rgba('graphite', 1); ctx.lineWidth = 1.5 / c.z; ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const lt = [w.asks!.start - 0.25, w.confirms!.start - 0.1, w.answer!.start];
    TR.forEach(([who, text], i) => {
      const k = prog(t, lt[i]!, lt[i]! + 0.45);
      if (k <= 0) return;
      mono(ctx, c, `${who}:`, tx + 30, ty + 64 + i * 62, 24, rgba(who === 'you' ? 'signal' : 'ash', 1), { spacing: 0.02 });
      mono(ctx, c, text!, tx + 170, ty + 64 + i * 62, 26, rgba(who === 'you' ? 'signal' : 'bone', 1), { spacing: 0.02, typed: k });
    });
    // verdict stamps
    const stamps: [string, number][] = [['ASKS', w.asks!.start], ['CONFIRMS', w.confirms!.start], ['HANGS UP', w.hangs!.start]];
    stamps.forEach(([s, t0], i) => {
      if (t < t0) return;
      const y = 200 + i * 80;
      const pop = ease.outBack(clamp((t - t0) / 0.2));
      setWorld(ctx, c, 380, y, pop, -0.04);
      ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 4;
      ctx.strokeRect(0, -46, 480, 64);
      ctx.fillStyle = rgba('signal', 1);
      ctx.font = font(F.archivo(125, 900), 44);
      ctx.fillText(`✓ ${s}`, 18, 4);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  }

  post(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.03 * pulse(t, w.hangs!.start, 0.08) + 0.015 * pulse(t, w.asks!.start, 0.08) + 0.015 * pulse(t, w.confirms!.start, 0.08), flash: 0.08 * pulse(t, w.hangs!.start, 0.04) };
  }
}
