// RING: "Your phone rings. It's Claude. It needs one decision."
// The pen plots a phone. On "rings" a giant outlined RINGS fills the frame behind it, shockwaves
// burst, the phone shakes. On "Claude" a red flash, the camera dives into the screen (avatar C/,
// the name), and CLAUDE slams across the frame. On "one decision" it pulls back: Accept / Decline,
// a huge outlined 1 with DECISION, dimension lines and HUD readouts all over the margins.
import { Plate, slam, brackets, rings, mono, ticker, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, mixCss, type Cam } from './_cm';
import { pt, rectPts } from './_vo';

const PX = -180, PY = -380, PW = 360, PH = 760;

export default class Ring extends Plate {
  hits: number[] = [];

  build() {
    this.words([
      ['your', 'Your phone rings', 'Your'], ['phone', 'Your phone rings', 'phone'], ['rings', 'Your phone rings', 'rings.'],
      ['its', "It's Claude", "It's"], ['claude', "It's Claude", 'Claude.'],
      ['needs', 'It needs one decision', 'needs'], ['one', 'It needs one decision', 'one'], ['decision', 'It needs one decision', 'decision.'],
    ]);
    const w = this.w, P = this.plot;
    // the phone, plotted on "Your phone"
    P.wp(pt(0, 0), this.T0, Math.max(0.01, w.your!.start - this.T0 - 0.05));
    P.add(rectPts(PX, PY, PW, PH), w.your!.start, w.phone!.end, 'plot', { pen: true, ez: ease.inOutQuad, width: 2.2 });
    P.add([pt(-50, PY + 26), pt(50, PY + 26)], w.phone!.end - 0.05, w.phone!.end + 0.05, 'plot', { pen: true, width: 4 });
    // construction lines out to the frame
    P.add([pt(-1400, PY), pt(1400, PY)], w.phone!.start, w.phone!.start + 0.3, 'cons', { alpha: 0.5 });
    P.add([pt(-1400, PY + PH), pt(1400, PY + PH)], w.phone!.start + 0.05, w.phone!.start + 0.35, 'cons', { alpha: 0.5 });
    P.dimension(pt(PX - 60, PY), pt(PX - 60, PY + PH), '152.4 mm', w.phone!.start + 0.1, 'dim', 13, -1);
    const r0 = w.rings!.start;
    this.hits = [r0, r0 + 0.33, r0 + 0.66, w.claude!.start];
    // dimension + leader to the 1 on "one"
    P.add([pt(PX + PW + 40, 120), pt(560, 120)], w.one!.start - 0.05, w.one!.start + 0.15, 'signal', { pen: true, width: 2 });
    P.note('REQUIRES INPUT', 600, 330, w.decision!.start + 0.1, { size: 16, col: 'ash', spacing: 0.2 });
    P.note('blocking · only you can answer', 600, 360, w.decision!.start + 0.2, { size: 14, col: 'graphite' });
    // camera
    const K = this.cam;
    K.key(this.T0, 0, 0, 1.25, 0);
    K.key(w.your!.start + 0.4, 0, 0, 0.95, -0.01, ease.outExpo);
    K.key(r0, 0, 0, 0.92, 0, ease.linear);
    K.key(r0 + 0.12, 0, 0, 1.05, 0.02, ease.outExpo);
    K.key(w.claude!.start - 0.05, 0, 0, 1.0, -0.01, ease.inOutCubic);
    K.key(w.claude!.start + 0.25, 0, -120, 1.55, 0, ease.outExpo);
    K.key(w.needs!.start, 0, -110, 1.6, 0.01, ease.linear);
    K.key(w.one!.start + 0.15, 330, 40, 0.86, -0.012, ease.outExpo);
    K.key(this.T1, 340, 40, 0.9, -0.016, ease.linear);
  }

  field(t: number) {
    const k = pulse(t, this.w.claude!.start, 0.06);
    return k > 0.02 ? rgba('signal', Math.min(1, k * 1.4)) : null;
  }

  shake(t: number): [number, number] {
    const w = this.w;
    const on = t > w.rings!.start && t < w.its!.start;
    if (!on) return [0, 0];
    return [Math.sin(t * 95) * 7, Math.cos(t * 83) * 3];
  }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // RINGS: giant outline behind everything, with a second offset copy for depth
    if (t > w.rings!.start - 0.02) {
      const k = clamp((t - w.rings!.start) / 0.25);
      for (const [dy, a] of [[0, 1], [26, 0.35], [52, 0.15]] as const)
        slam(ctx, c, t, 'RINGS', w.rings!.start, 0, 230 + dy, 560, { outline: true, fin: 'graphite', alpha: a * (1 - 0.6 * prog(t, w.its!.start, w.claude!.start)) * k });
    }
    rings(ctx, c, t, 0, 0, this.hits, { r0: 300, r1: 1500, life: 0.85, n: 3, width: 6 });
    // CLAUDE across the frame (behind the phone)
    slam(ctx, c, t, 'CLAUDE', w.claude!.start, 0, 120, 300, { fin: 'signal', alpha: 1 - 0.9 * prog(t, w.needs!.start, w.one!.start) });
    this.drawPhone(ctx, t, c);
    this.drawDecision(ctx, t, c);
    this.drawHud(ctx, t, c);
  }

  drawPhone(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = prog(t, w.phone!.start, w.phone!.end);
    if (a <= 0) return;
    const [sx, sy] = this.shake(t);
    setWorld(ctx, c, sx, sy, 1, sx * 0.002);
    rrect(ctx, PX, PY, PW, PH, 46);
    ctx.fillStyle = rgba('ink2', 0.92 * a);
    ctx.fill();
    ctx.strokeStyle = rgba('bone', 0.9 * a);
    ctx.lineWidth = 3;
    ctx.stroke();
    // screen glow on the rings
    const ringGlow = Math.max(...this.hits.map((h) => pulse(t, h, 0.18)));
    ctx.fillStyle = rgba('signal', 0.18 * ringGlow);
    ctx.fill();
    // screen content
    ctx.textAlign = 'center';
    ctx.font = font(F.mono(500), 20);
    ctx.letterSpacing = '5px';
    ctx.fillStyle = rgba('signal', a * (0.5 + 0.5 * Math.round((Math.sin(t * 14) + 1) / 2)));
    ctx.fillText('INCOMING CALL', 0, PY + 120);
    ctx.letterSpacing = '0px';
    // avatar
    const av = ease.outBack(clamp((t - w.its!.start) / 0.35));
    if (av > 0) {
      ctx.fillStyle = rgba('signal', 1);
      ctx.beginPath(); ctx.arc(0, PY + 270, 92 * av, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba('ink', 1);
      ctx.font = font(BLACK, 92 * av);
      ctx.fillText('C/', 6, PY + 270 + 32 * av);
      ctx.fillStyle = rgba('bone', prog(t, w.claude!.start, w.claude!.start + 0.2));
      ctx.font = font(F.archivo(100, 700), 64);
      ctx.fillText('Claude', 0, PY + 450);
      ctx.fillStyle = rgba('ash', prog(t, w.needs!.start, w.needs!.start + 0.2));
      ctx.font = font(F.archivo(100, 500), 26);
      ctx.fillText('needs one decision', 0, PY + 494);
    }
    // accept / decline
    const ad = ease.outBack(clamp((t - w.decision!.start) / 0.3));
    if (ad > 0) {
      for (const [x, col, glyph] of [[-90, 'graphite', '–'], [90, '#22C55E', '✓']] as const) {
        ctx.fillStyle = rgba(col, 1);
        ctx.beginPath(); ctx.arc(x, PY + 640, 46 * ad, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = rgba('bone', 1);
        ctx.font = font(F.archivo(100, 900), 46 * ad);
        ctx.fillText(glyph, x, PY + 656);
      }
      ctx.strokeStyle = rgba('#22C55E', 0.6 * ad * (1 - ((t * 1.6) % 1)));
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(90, PY + 640, 46 + 40 * ((t * 1.6) % 1), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawDecision(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    slam(ctx, c, t, '1', w.one!.start, 800, 330, 640, { fin: 'bone' });
    slam(ctx, c, t, 'DECISION', w.decision!.start, 600, 450, 120, { align: 'left', fin: 'signal', fam: F.archivo(125, 900) });
    if (t > w.one!.start) brackets(ctx, c, 560, -200, 520, 700, 40, rgba('bone', 0.7), ease.outExpo(prog(t, w.one!.start, w.one!.start + 0.3)));
  }

  drawHud(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    const a = prog(t, w.phone!.start, w.rings!.start);
    if (a <= 0) return;
    const secs = Math.max(0, t - w.rings!.start);
    const ts = `00:00:${String(Math.floor(secs)).padStart(2, '0')}.${String(Math.floor((secs % 1) * 100)).padStart(2, '0')}`;
    mono(ctx, c, `RINGING  ${ts}`, PX, PY - 40, 18, rgba('signal', a));
    mono(ctx, c, 'LINE 01 · CLAUDE CODE', 0, PY + PH + 60, 15, rgba('ash', a), { align: 'center' });
    mono(ctx, c, 'fig. 1 — the call', -1100, -470, 15, rgba('ash', 0.8 * a));
    ticker(ctx, c, t, -1120, -380, 14, 18, 15, rgba('graphite', 0.7 * a), 2);
    ticker(ctx, c, t, 1180, -380, 14, 18, 15, rgba('graphite', 0.7 * a), 5);
    brackets(ctx, c, PX - 30, PY - 70, PW + 60, PH + 100, 28, rgba('signal', 0.8 * a));
    void mixCss;
  }

  post(t: number) {
    const w = this.w;
    const hit = Math.max(...this.hits.map((h) => pulse(t, h, 0.07)));
    return { zoom: 1 + 0.02 * hit + 0.02 * pulse(t, w.one!.start, 0.08), flash: 0.06 * pulse(t, w.rings!.start, 0.05), ca: 1.2 + 6 * hit };
  }
}
