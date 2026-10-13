// STEPS: "When a task ends, it calls with next steps. You pick one, and it does it, live."
// A task bar races to 100% and stamps COMPLETE; the phone rings; three option cards deal in (the
// real options from a real call). "pick one": card 02 lights up, the others dim. "live": the card
// becomes a running job: a LIVE badge, a streaming log, a progress bar, LIVE slammed big.
import { Plate, slam, brackets, mono, rings, ticker, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam } from './_cm';

const OPTS = ['Push the portfolio live', 'Re-voice the promo video', 'Nothing for now'];
const LOG = ['generating voice take 1/3', 'aligning words to frames', 'rendering 2,280 frames', 'encoding promo.mp4'];

export default class Steps extends Plate {
  build() {
    this.words([
      ['when', 'When a task ends', 'When'], ['task', 'When a task ends', 'task'], ['ends', 'When a task ends', 'ends,'], ['calls', 'When a task ends', 'calls'],
      ['next', 'When a task ends', 'next'], ['steps', 'When a task ends', 'steps.'],
      ['pick', 'You pick one', 'pick'], ['one', 'You pick one', 'one,'], ['does', 'You pick one', 'does'], ['live', 'You pick one', 'live.'],
    ]);
    const w = this.w, K = this.cam;
    K.key(this.T0, 0, -260, 1.3, 0);
    K.key(w.ends!.start + 0.2, 0, -230, 1.2, -0.01, ease.outExpo);
    K.key(w.next!.start, 0, 0, 0.95, 0, ease.inOutCubic);
    K.key(w.pick!.start, 0, 20, 0.97, 0.005, ease.linear);
    K.key(w.one!.start + 0.2, 0, 60, 1.25, 0, ease.outExpo);
    K.key(w.live!.start, 0, 60, 1.2, 0, ease.linear);
    K.key(w.live!.start + 0.2, 0, 40, 1.05, -0.015, ease.outExpo);
    K.key(this.T1, 0, 40, 1.08, -0.02, ease.linear);
  }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // task bar
    const p = ease.inOutCubic(prog(t, w.when!.start, w.ends!.start + 0.15));
    setWorld(ctx, c);
    ctx.strokeStyle = rgba('bone', 0.8); ctx.lineWidth = 2 / c.z;
    ctx.strokeRect(-700, -330, 1400, 44);
    ctx.fillStyle = rgba(p >= 1 ? 'signal' : 'bone', 1);
    ctx.fillRect(-694, -324, 1388 * p, 32);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    mono(ctx, c, `TASK · migrate users table`, -700, -350, 20, rgba('ash', 1));
    mono(ctx, c, `${Math.round(p * 100)}%`, 700, -350, 22, rgba(p >= 1 ? 'signal' : 'bone', 1), { align: 'right' });
    if (p >= 1) slam(ctx, c, t, 'COMPLETE', w.ends!.start + 0.15, 0, -380, 120, { fam: BLACK, fin: 'bone', alpha: 1 - prog(t, w.next!.start, w.next!.start + 0.2) });
    rings(ctx, c, t, 0, -308, [w.calls!.start, w.calls!.start + 0.3], { r0: 60, r1: 900, life: 0.7, n: 2, width: 5 });
    // option cards
    const sel = t >= w.one!.start;
    OPTS.forEach((o, i) => {
      const t0 = w.next!.start + i * 0.12;
      if (t < t0) return;
      const k = ease.outBack(clamp((t - t0) / 0.3));
      const x = -700 + i * 480, y = -150 + (1 - k) * 220;
      const me = i === 1;
      const dim = sel && !me ? 0.3 : 1;
      setWorld(ctx, c, x, y);
      rrect(ctx, 0, 0, 440, 300, 18);
      ctx.fillStyle = sel && me ? rgba('signal', 1) : rgba('ink2', 0.95 * dim);
      ctx.fill();
      ctx.strokeStyle = rgba(sel && me ? 'ember' : 'graphite', dim); ctx.lineWidth = 3 / c.z; ctx.stroke();
      ctx.font = font(BLACK, 120); ctx.fillStyle = rgba(sel && me ? 'ink' : 'signal', dim);
      ctx.fillText(String(i + 1).padStart(2, '0'), 28, 130);
      ctx.font = font(F.archivo(100, 700), 34); ctx.fillStyle = rgba(sel && me ? 'ink' : 'bone', dim);
      ctx.fillText(o, 28, 210, 390);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    if (sel) brackets(ctx, c, -240, -180, 460, 360, 36, rgba('bone', 1), ease.outExpo(prog(t, w.one!.start, w.one!.start + 0.3)));
    mono(ctx, c, 'NEXT STEPS · SAY A NUMBER', -700, -190, 18, rgba('ash', prog(t, w.next!.start, w.next!.start + 0.2)));
    // live job under the cards
    if (t >= w.does!.start) {
      const lk = prog(t, w.does!.start, this.T1);
      setWorld(ctx, c);
      ctx.fillStyle = rgba('ink2', 0.96); ctx.fillRect(-700, 190, 1400, 230);
      ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 2 / c.z; ctx.strokeRect(-700, 190, 1400, 230);
      ctx.fillStyle = rgba('signal', 1); ctx.fillRect(-700, 400, 1400 * lk, 20);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      LOG.forEach((l, i) => mono(ctx, c, `> ${l}`, -670, 245 + i * 40, 24, rgba(i === 3 ? 'bone' : 'ash', 1), { spacing: 0.03, typed: prog(t, w.does!.start + i * 0.25, w.does!.start + i * 0.25 + 0.3) }));
      mono(ctx, c, `● LIVE`, 670, 245, 26, rgba('signal', Math.floor(t * 4) % 2 ? 1 : 0.35), { align: 'right' });
      slam(ctx, c, t, 'LIVE.', w.live!.start, 330, 380, 230, { fam: BLACK, fin: 'signal' });
    }
    mono(ctx, c, 'fig. 5 — next steps', -860, -470, 16, rgba('ash', 0.8));
    ticker(ctx, c, t, -1200, -440, 14, 12, 15, rgba('graphite', 0.5), 21);
    ticker(ctx, c, t, 860, -440, 14, 12, 15, rgba('graphite', 0.5), 22);
  }

  post(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.02 * pulse(t, w.one!.start, 0.08) + 0.03 * pulse(t, w.live!.start, 0.08), flash: 0.05 * pulse(t, w.ends!.start + 0.15, 0.04) };
  }
}
