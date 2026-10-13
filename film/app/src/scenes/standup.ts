// STANDUP: "And every morning at nine, a standup call about yesterday."
// A red sun rises behind a huge clock; the week deals out MON..FRI; on "nine" the clock rolls from
// 08:59 to 09:00 like an odometer and the phone rings; "about yesterday" types yesterday's digest.
import { Plate, slam, brackets, mono, rings, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam } from './_cm';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
const DIGEST = ['[api] fixed the login 500 · tests pass', '[portfolio] dark mode · footer contrast open', '[promo] video rendered · voice pending'];

export default class Standup extends Plate {
  build() {
    this.words([
      ['and', 'And every morning', 'And'], ['every', 'And every morning', 'every'], ['morning', 'And every morning', 'morning'], ['nine', 'And every morning', 'nine,'],
      ['standup', 'And every morning', 'standup'], ['call', 'And every morning', 'call'], ['about', 'And every morning', 'about'], ['yesterday', 'And every morning', 'yesterday.'],
    ]);
    const w = this.w, K = this.cam;
    K.key(this.T0, 0, 200, 0.9, 0);
    K.key(w.morning!.start, 0, 60, 1.0, 0, ease.inOutCubic);
    K.key(w.nine!.start + 0.2, 0, -40, 1.12, 0, ease.outExpo);
    K.key(w.about!.start, 0, 0, 1.0, 0.01, ease.inOutCubic);
    K.key(w.yesterday!.start + 0.3, 120, 120, 1.0, 0.012, ease.outExpo);
    K.key(this.T1, 130, 125, 1.03, 0.016, ease.linear);
  }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the sun
    const rise = ease.outCubic(prog(t, this.T0, w.nine!.start + 0.2));
    setWorld(ctx, c);
    const g = ctx.createRadialGradient(0, 520 - rise * 380, 0, 0, 520 - rise * 380, 820);
    g.addColorStop(0, rgba('signal', 0.95)); g.addColorStop(0.45, rgba('blood', 0.5)); g.addColorStop(1, rgba('ink', 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 520 - rise * 380, 820, 0, Math.PI * 2); ctx.fill();
    // horizon lines
    ctx.fillStyle = rgba('ink', 1);
    for (let i = 0; i < 9; i++) { const y = 300 + i * i * 6; ctx.fillRect(-1600, y, 3200, 4 + i * 1.6); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // the week
    DAYS.forEach((d, i) => {
      const t0 = w.every!.start + i * 0.09;
      if (t < t0) return;
      const k = ease.outBack(clamp((t - t0) / 0.25));
      const lit = t >= w.morning!.start + i * 0.12;
      setWorld(ctx, c, -560 + i * 280, -400, k);
      ctx.fillStyle = rgba(lit ? 'signal' : 'ink2', 1); ctx.fillRect(-110, -50, 220, 90);
      ctx.font = font(F.mono(700), 34); ctx.textAlign = 'center';
      ctx.fillStyle = rgba(lit ? 'ink' : 'ash', 1); ctx.fillText(`${d} 09:00`, 0, 8);
      ctx.textAlign = 'left';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
    // the clock: 08:59 → 09:00 on "nine"
    const roll = ease.outCubic(prog(t, w.nine!.start, w.nine!.start + 0.35));
    const fam = BLACK, size = 360;
    const digits: [string, string][] = [['0', '0'], ['8', '9'], [':', ':'], ['5', '0'], ['9', '0']];
    ctx.font = font(fam, 100);
    const adv = (ch: string) => (ctx.measureText(ch).width / 100) * size;
    let x = -digits.reduce((s, [, b]) => s + adv(b), 0) / 2;
    const y = 120;
    for (const [a, b] of digits) {
      const dw = adv(b);
      if (a === b) { setWorld(ctx, c, x, y, size / 100); ctx.fillStyle = rgba('bone', 1); ctx.fillText(b, 0, 0); }
      else {
        const [x0, y0] = [x - 6, y - 0.76 * size];
        setWorld(ctx, c);
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, dw + 12, 0.82 * size); ctx.clip();
        for (const [ch, off] of [[a, -roll], [b, 1 - roll]] as const) {
          setWorld(ctx, c, x, y + off * size * 0.9, size / 100);
          ctx.fillStyle = rgba(ch === b && roll > 0.5 ? 'signal' : 'bone', 1);
          ctx.fillText(ch, 0, 0);
        }
        ctx.restore();
      }
      x += dw;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    rings(ctx, c, t, 0, -20, [w.standup!.start, w.call!.start], { r0: 200, r1: 1300, life: 0.8, n: 3, width: 6 });
    slam(ctx, c, t, 'STANDUP CALL', w.standup!.start, 0, 330, 120, { fam: F.archivo(125, 900), fin: 'bone' });
    // yesterday's digest
    if (t > w.about!.start) {
      setWorld(ctx, c);
      ctx.fillStyle = rgba('ink2', 0.95); ctx.fillRect(-60, 380, 980, 210);
      ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 2 / c.z; ctx.strokeRect(-60, 380, 980, 210);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      mono(ctx, c, 'YESTERDAY · 3 SESSIONS', -30, 420, 20, rgba('signal', 1));
      DIGEST.forEach((d, i) => mono(ctx, c, d, -30, 470 + i * 42, 24, rgba('bone', 1), { spacing: 0.02, typed: prog(t, w.yesterday!.start + i * 0.2, w.yesterday!.start + i * 0.2 + 0.35) }));
    }
    brackets(ctx, c, -840, -480, 1680, 960, 50, rgba('bone', 0.5));
    mono(ctx, c, 'fig. 6 — the standup', -840, -510, 16, rgba('ash', 0.8));
    mono(ctx, c, 'install.ps1 -Standup 09:00', 840, -510, 16, rgba('ash', 0.8), { align: 'right' });
  }

  post(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.03 * pulse(t, w.nine!.start + 0.3, 0.08), flash: 0.06 * pulse(t, w.nine!.start + 0.3, 0.04), halation: 0.5 };
  }
}
