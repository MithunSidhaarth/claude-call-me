// LOOP: "When it's stuck, it calls you. You answer. It gets back to work."
// A dial. The pen plots a loop of four stations (STUCK, CALLS YOU, YOU ANSWER, BACK TO WORK), one
// arc per phrase; each station slams in on its word and the centre status flips with it. Then a
// packet runs the loop for good.
import { Plate, slam, brackets, mono, ticker, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam, type Word } from './_cm';
import { pt, arc } from './_vo';

const R = 340;
const ANG = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

export default class Loop extends Plate {
  st: { label: string; word: Word; status: string; col: string }[] = [];

  build() {
    this.words([
      ['when', "When it's stuck", 'When'], ['stuck', "When it's stuck", 'stuck,'], ['calls', "When it's stuck", 'calls'],
      ['answer', 'You answer', 'answer.'], ['you2', 'You answer', 'You'],
      ['gets', 'It gets back to work', 'gets'], ['back', 'It gets back to work', 'back'], ['work', 'It gets back to work', 'work.'],
    ]);
    const w = this.w, P = this.plot;
    this.st = [
      { label: 'STUCK', word: w.stuck!, status: 'BLOCKED', col: 'signal' },
      { label: 'CALLS YOU', word: w.calls!, status: 'RINGING', col: 'signal' },
      { label: 'YOU ANSWER', word: w.you2!, status: 'ANSWERED', col: 'bone' },
      { label: 'BACK TO WORK', word: w.back!, status: 'WORKING', col: 'bone' },
    ];
    // dial ticks
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, r1 = R + 40, r2 = R + (i % 6 === 0 ? 70 : 52);
      const ti = this.T0 + 0.02 * i * 0.25;
      P.add([pt(Math.cos(a) * r1, Math.sin(a) * r1), pt(Math.cos(a) * r2, Math.sin(a) * r2)], ti, ti + 0.05, 'axis', { alpha: 0.7 });
    }
    // arcs between stations, drawn by the pen as each phrase lands
    P.wp(pt(Math.cos(ANG[0]!) * R, Math.sin(ANG[0]!) * R), w.stuck!.start, 0.02);
    for (let i = 0; i < 4; i++) {
      const a0 = ANG[i]!, a1 = ANG[i]! + Math.PI / 2;
      const t0 = this.st[i]!.word.end, t1 = i < 3 ? this.st[i + 1]!.word.start : w.work!.end;
      P.add(arc(0, 0, R, a0 + 0.12, a1 - 0.12, 48), t0, Math.max(t0 + 0.2, t1), 'signal', { pen: true, ez: ease.inOutQuad, width: 3 });
    }
    const K = this.cam;
    K.key(this.T0, 0, 0, 1.3, -0.04);
    K.key(w.stuck!.start + 0.2, -60, -90, 1.15, -0.02, ease.outExpo);
    K.key(w.calls!.start + 0.2, 80, -20, 1.12, 0.015, ease.inOutCubic);
    K.key(w.you2!.start + 0.2, 40, 80, 1.1, 0.02, ease.inOutCubic);
    K.key(w.back!.start + 0.2, -60, 0, 1.0, 0, ease.inOutCubic);
    K.key(this.T1, 0, 0, 0.92, 0.03, ease.linear);
  }

  stage(t: number) { let k = -1; this.st.forEach((s, i) => { if (t >= s.word.start) k = i; }); return k; }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w, k = this.stage(t);
    // the loop's ghost circle
    setWorld(ctx, c);
    ctx.strokeStyle = rgba('graphite', 0.6 * prog(t, this.T0, this.T0 + 0.3));
    ctx.lineWidth = 1.5 / c.z;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // stations
    this.st.forEach((s, i) => {
      if (t < s.word.start - 0.05) return;
      const a = ANG[i]!, x = Math.cos(a) * R, y = Math.sin(a) * R;
      const pop = ease.outBack(clamp((t - s.word.start) / 0.25));
      setWorld(ctx, c, x, y, pop);
      ctx.fillStyle = rgba(i === k ? s.col : 'ink2', 1);
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(s.col, 1); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = rgba(i === k ? 'ink' : s.col, 1);
      ctx.font = font(F.mono(700), 26); ctx.textAlign = 'center';
      ctx.fillText(String(i + 1).padStart(2, '0'), 0, 9);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const LP = [[0, -R - 60], [R + 330, 26], [0, R + 120], [-R - 360, 26]][i]!;
      slam(ctx, c, t, s.label, s.word.start, LP[0]!, LP[1]!, 66, { fam: F.archivo(125, 900), fin: s.col === 'signal' ? 'signal' : 'bone' });
    });
    // centre status
    if (k >= 0) {
      const s = this.st[k]!;
      slam(ctx, c, t, s.status, s.word.start, 0, 26, 76, { fam: BLACK, fin: s.col, cool: 0.2 });
      mono(ctx, c, `STATE ${k + 1}/4`, 0, -70, 18, rgba('ash', 0.9), { align: 'center' });
    }
    // the packet: after the loop closes it runs around forever
    if (t > w.work!.end) {
      const u = (t - w.work!.end) * 1.4;
      for (let j = 0; j < 8; j++) {
        const a = ANG[0]! + (u - j * 0.02) * Math.PI * 2;
        setWorld(ctx, c, Math.cos(a) * R, Math.sin(a) * R);
        ctx.fillStyle = rgba('ember', 1 - j / 8);
        ctx.beginPath(); ctx.arc(0, 0, 14 - j, 0, Math.PI * 2); ctx.fill();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
    }
    brackets(ctx, c, -560, -560, 1120, 1120, 46, rgba('bone', 0.5));
    mono(ctx, c, 'fig. 3 — the loop', -560, -590, 16, rgba('ash', 0.8));
    mono(ctx, c, 'stuck → call → answer → work', 560, -590, 16, rgba('ash', 0.8), { align: 'right' });
    ticker(ctx, c, t, -1180, -460, 16, 14, 15, rgba('graphite', 0.55), 8);
    ticker(ctx, c, t, 800, -460, 16, 14, 15, rgba('graphite', 0.55), 9);
  }

  post(t: number) {
    const hit = Math.max(...this.st.map((s) => pulse(t, s.word.start, 0.08)));
    return { zoom: 1 + 0.025 * hit, ca: 1.2 + 5 * hit };
  }
}
