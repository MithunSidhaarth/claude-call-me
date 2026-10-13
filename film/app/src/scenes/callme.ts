// CALLME: "Call me. Claude call me. Free and open source."
// "Call me.": the frame is signal red, CALL / ME. stacked in black, black shockwaves.
// Then the end card on black: the C/ mark, claude-call-me, the URL, FREE and OPEN SOURCE tags on
// their words, a pulsing GitHub button.
import { Plate, slam, brackets, mono, rings, ticker, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam } from './_cm';

export default class CallMe extends Plate {
  build() {
    this.words([
      ['call', 'Call me.', 'Call'], ['me', 'Call me.', 'me.'],
      ['claude', 'Claude call me', 'Claude'], ['call2', 'Claude call me', 'call'], ['me2', 'Claude call me', 'me.'],
      ['free', 'Claude call me', 'Free'], ['open', 'Claude call me', 'open'], ['source', 'Claude call me', 'source.'],
    ]);
    const w = this.w, K = this.cam;
    K.key(this.T0, 0, 0, 1.0, 0);
    K.key(w.me!.start + 0.2, 0, 0, 1.12, 0.02, ease.outExpo);
    K.key(w.claude!.start - 0.02, 0, 0, 1.14, 0.02, ease.linear);
    K.key(w.claude!.start, 0, 0, 1.25, 0, ease.linear);
    K.key(w.claude!.start + 0.5, 0, 0, 1.0, 0, ease.outExpo);
    K.key(this.T1, 0, 0, 0.96, 0, ease.linear);
  }

  red(t: number) { return t < this.w.claude!.start - 0.05; }
  field(t: number) { return this.red(t) ? rgba('signal', 1) : null; }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (this.red(t)) {
      rings(ctx, c, t, 0, 0, [w.call!.start, w.me!.start], { r0: 100, r1: 1400, life: 0.8, col: 'ink', width: 12 });
      slam(ctx, c, t, 'CALL', w.call!.start, 0, -20, 420, { hot: 'ink', fin: 'ink' });
      slam(ctx, c, t, 'ME.', w.me!.start, 0, 380, 420, { hot: 'bone', fin: 'bone' });
      return;
    }
    // the mark
    const k = ease.outBack(clamp((t - w.claude!.start + 0.12) / 0.35));
    setWorld(ctx, c, 0, -230, k);
    rrect(ctx, -90, -90, 180, 180, 40);
    ctx.fillStyle = rgba('signal', 1); ctx.fill();
    ctx.font = font(BLACK, 100); ctx.textAlign = 'center'; ctx.fillStyle = rgba('ink', 1);
    ctx.fillText('C/', 6, 36);
    ctx.textAlign = 'left';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    rings(ctx, c, t, 0, -230, [w.claude!.start], { r0: 100, r1: 900, life: 0.9, n: 3, width: 5 });
    slam(ctx, c, t, 'claude-call-me', w.call2!.start, 0, 40, 150, { fam: F.archivo(100, 900), fin: 'bone' });
    mono(ctx, c, 'github.com/MithunSidhaarth/claude-call-me', 0, 120, 26, rgba('signal', 1), { align: 'center', typed: prog(t, w.me2!.start, w.free!.start) });
    // tags
    const tag = (text: string, t0: number, x: number, col: string) => {
      if (t < t0) return;
      const s = ease.outBack(clamp((t - t0) / 0.22));
      setWorld(ctx, c, x, 230, s);
      ctx.font = font(F.archivo(125, 900), 56);
      const wd = ctx.measureText(text).width;
      rrect(ctx, -wd / 2 - 30, -56, wd + 60, 84, 42);
      ctx.fillStyle = rgba(col, 1); ctx.fill();
      ctx.fillStyle = rgba(col === 'bone' ? 'ink' : 'bone', 1); ctx.textAlign = 'center';
      ctx.fillText(text, 0, 6);
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    tag('FREE', w.free!.start, -330, 'bone');
    tag('OPEN SOURCE', w.open!.start, 170, 'signal');
    // the button
    if (t > w.source!.end) {
      const p = 1 + 0.04 * Math.sin((t - w.source!.end) * 9);
      setWorld(ctx, c, 0, 380, p * ease.outBack(prog(t, w.source!.end, w.source!.end + 0.3)));
      rrect(ctx, -260, -46, 520, 92, 46);
      ctx.strokeStyle = rgba('bone', 1); ctx.lineWidth = 3; ctx.stroke();
      ctx.font = font(F.archivo(100, 800), 40); ctx.fillStyle = rgba('bone', 1); ctx.textAlign = 'center';
      ctx.fillText('Get it on GitHub  →', 0, 14);
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    brackets(ctx, c, -900, -470, 1800, 940, 60, rgba('bone', 0.5));
    mono(ctx, c, 'MIT · WINDOWS · CLAUDE CODE SKILL', -900, -500, 16, rgba('ash', 0.9));
    mono(ctx, c, 'fig. 8 — call me', 900, -500, 16, rgba('ash', 0.9), { align: 'right' });
    ticker(ctx, c, t, -1220, -420, 14, 12, 15, rgba('graphite', 0.5), 31);
    ticker(ctx, c, t, 960, -420, 14, 12, 15, rgba('graphite', 0.5), 32);
  }

  post(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.035 * pulse(t, w.call!.start, 0.08) + 0.035 * pulse(t, w.me!.start, 0.08) + 0.02 * pulse(t, w.claude!.start, 0.08), flash: 0.06 * pulse(t, w.claude!.start, 0.04) };
  }
}
