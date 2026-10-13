// AFTERNOON: "Without it, Claude waits on you. With it, you come back to finished work."
// The paper plate: FORM CM-1, a time sheet for your afternoon. WITHOUT IT: a clock spins while the
// rows fill with "waiting on you", a WAITING stamp. WITH IT: one short call, then FINISHED, and a DONE
// stamp slams. A document camera reads left, then right.
import { Plate, slam, mono, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, W, H, type Cam } from './_cm';
import { pt } from './_vo';

const L = [
  ['14:00', 'asks: drop legacy column?'],
  ['15:00', 'waiting on you'],
  ['16:00', 'waiting on you'],
  ['17:00', 'still waiting'],
];
const R = [
  ['14:00', 'phone rings · 1 min'],
  ['14:01', 'answered: yes, drop it'],
  ['14:02', 'Claude back at work'],
  ['16:00', 'finished: 4 migrations'],
];

export default class Afternoon extends Plate {
  build() {
    this.words([
      ['without', 'Without it', 'Without'], ['waits', 'Without it', 'waits'], ['on', 'Without it', 'on'], ['you', 'Without it', 'you.'],
      ['with', 'With it', 'With'], ['come', 'With it', 'come'], ['back', 'With it', 'back'], ['finished', 'With it', 'finished'], ['work', 'With it', 'work.'],
    ]);
    this.plot.paper = true;
    this.gridInk = 0;
    const w = this.w, P = this.plot;
    // column rules and the divider, inked by the pen
    P.wp(pt(0, -330), this.T0, 0.02);
    P.add([pt(0, -330), pt(0, 420)], this.T0 + 0.02, w.without!.start + 0.1, 'ink', { pen: true, width: 2 });
    for (let i = 0; i < 5; i++) {
      P.add([pt(-860, -150 + i * 100), pt(-40, -150 + i * 100)], this.T0 + 0.05 * i, this.T0 + 0.05 * i + 0.2, 'cons', { alpha: 0.5 });
      P.add([pt(40, -150 + i * 100), pt(860, -150 + i * 100)], w.with!.start + 0.04 * i, w.with!.start + 0.04 * i + 0.2, 'cons', { alpha: 0.5 });
    }
    const K = this.cam;
    K.key(this.T0, -200, -40, 1.05, -0.02);
    K.key(w.waits!.start, -300, 20, 1.12, -0.015, ease.inOutCubic);
    K.key(w.with!.start - 0.05, -280, 30, 1.1, -0.01, ease.linear);
    K.key(w.with!.start + 0.35, 300, 30, 1.12, 0.012, ease.outExpo);
    K.key(w.finished!.start, 280, 30, 1.1, 0.012, ease.linear);
    K.key(w.finished!.start + 0.25, 0, 20, 0.95, 0, ease.outExpo);
    K.key(this.T1, 0, 20, 0.98, 0.006, ease.linear);
  }

  field() { return rgba('bone', 1); }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the form's header bar
    setWorld(ctx, c);
    ctx.fillStyle = rgba('ink', 1);
    ctx.fillRect(-900, -480, 1800, 110);
    ctx.font = font(BLACK, 76); ctx.fillStyle = rgba('bone', 1);
    ctx.fillText('FORM CM-1', -870, -398);
    ctx.font = font(F.mono(500), 20); ctx.fillStyle = rgba('ash', 1);
    ctx.fillText('YOUR AFTERNOON · TIME SHEET', -230, -430);
    ctx.fillText('FILED BY: CLAUDE CODE', -230, -400);
    ctx.textAlign = 'right'; ctx.fillStyle = rgba('signal', 1);
    ctx.fillText('fig. 4 — the afternoon', 870, -415);
    ctx.textAlign = 'left';
    // paper grain: a faint printed grid
    ctx.strokeStyle = rgba('graphite', 0.08); ctx.lineWidth = 1 / c.z;
    ctx.beginPath();
    for (let x = -900; x <= 900; x += 30) { ctx.moveTo(x, -370); ctx.lineTo(x, 470); }
    for (let y = -370; y <= 470; y += 30) { ctx.moveTo(-900, y); ctx.lineTo(900, y); }
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    slam(ctx, c, t, 'WITHOUT IT', w.without!.start, -860, -210, 86, { align: 'left', fam: F.archivo(125, 900), hot: 'blood', fin: 'ink' });
    slam(ctx, c, t, 'WITH IT', w.with!.start, 40, -210, 86, { align: 'left', fam: F.archivo(125, 900), hot: 'blood', fin: 'blood' });
    // rows, typewritten
    const lt = [w.without!.end, w.waits!.start, w.on!.start, w.you!.start];
    L.forEach(([h, s], i) => {
      const k = prog(t, lt[i]!, lt[i]! + 0.3);
      if (k <= 0) return;
      mono(ctx, c, h!, -840, -88 + i * 100, 28, rgba('graphite', 1), { spacing: 0.05 });
      mono(ctx, c, s!, -660, -88 + i * 100, 30, rgba(i ? 'blood' : 'ink', 1), { spacing: 0.02, typed: k });
    });
    const rt = [w.with!.end, w.come!.start, w.back!.start, w.finished!.start];
    R.forEach(([h, s], i) => {
      const k = prog(t, rt[i]!, rt[i]! + 0.3);
      if (k <= 0) return;
      mono(ctx, c, h!, 60, -88 + i * 100, 28, rgba('graphite', 1), { spacing: 0.05 });
      mono(ctx, c, s!, 240, -88 + i * 100, 30, rgba('ink', 1), { spacing: 0.02, typed: k });
    });
    // the clock on the left, spinning through the wait
    this.clock(ctx, c, t, -120, 380, 70, prog(t, w.waits!.start, w.with!.start) * 3.2);
    // stamps
    this.stamp(ctx, c, t, 'WAITING', w.you!.start, -420, 210, -0.12, 'blood');
    this.stamp(ctx, c, t, 'DONE', w.work!.start, 470, 230, 0.1, 'signal');
  }

  clock(ctx: CanvasRenderingContext2D, c: Cam, t: number, x: number, y: number, r: number, turns: number) {
    setWorld(ctx, c, x, y);
    ctx.strokeStyle = rgba('ink', 0.9); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); ctx.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94); ctx.stroke(); }
    const hand = (a: number, l: number, wd: number, col: string) => { ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a - Math.PI / 2) * l, Math.sin(a - Math.PI / 2) * l); ctx.stroke(); };
    hand(turns * Math.PI * 2 * 12, r * 0.8, 3, 'blood');
    hand(turns * Math.PI * 2 + Math.PI * 4 / 3, r * 0.55, 6, 'ink');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  stamp(ctx: CanvasRenderingContext2D, c: Cam, t: number, text: string, t0: number, x: number, y: number, rot: number, col: string) {
    if (t < t0) return;
    const age = t - t0;
    const sc = 1 + 0.6 * (1 - ease.outExpo(clamp(age / 0.16)));
    setWorld(ctx, c, x, y, sc, rot);
    ctx.font = font(BLACK, 130);
    const wd = ctx.measureText(text).width;
    ctx.globalAlpha = 0.88;
    ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 10;
    ctx.strokeRect(-wd / 2 - 34, -120, wd + 68, 150);
    ctx.fillStyle = rgba(col, 1); ctx.textAlign = 'center';
    ctx.fillText(text, 0, 2);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    void W; void H;
  }

  post(t: number) {
    const w = this.w;
    return { vignette: 0.25, grain: 0.05, bloom: 0.3, zoom: 1 + 0.03 * pulse(t, w.work!.start, 0.07) + 0.02 * pulse(t, w.you!.start, 0.07) };
  }
}
