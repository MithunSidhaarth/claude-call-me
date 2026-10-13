// KEYS: "Your keys never touch the chat."
// Left: the vault, environment variables whose values scramble and then mask. Right: a chat window;
// a key-shaped message tries to fly in and is struck out: BLOCKED. NEVER slams between them.
import { Plate, slam, brackets, mono, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, type Cam } from './_cm';
import { hash } from '../engine/util';

const VARS = ['BOLNA_API_KEY', 'CALL_ME_PHONE', 'ELEVENLABS_API_KEY'];

export default class Keys extends Plate {
  build() {
    this.words([['your', 'Your keys never', 'Your'], ['keys', 'Your keys never', 'keys'], ['never', 'Your keys never', 'never'], ['touch', 'Your keys never', 'touch'], ['chat', 'Your keys never', 'chat.']]);
    const w = this.w, K = this.cam;
    K.key(this.T0, -300, 0, 1.15, -0.02);
    K.key(w.never!.start + 0.15, 0, 0, 0.95, 0, ease.outExpo);
    K.key(w.chat!.start + 0.2, 120, 40, 1.0, 0.02, ease.outExpo);
    K.key(this.T1, 130, 40, 1.03, 0.025, ease.linear);
  }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    // the vault
    setWorld(ctx, c);
    rrect(ctx, -900, -260, 760, 420, 16);
    ctx.fillStyle = rgba('ink2', 0.96); ctx.fill();
    ctx.strokeStyle = rgba('bone', 0.6); ctx.lineWidth = 2 / c.z; ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    mono(ctx, c, 'ENV · USER SCOPE', -870, -210, 20, rgba('signal', 1));
    const glyphs = 'ABCDEF0123456789abcdef';
    VARS.forEach((v, i) => {
      const lock = prog(t, w.keys!.start + i * 0.1, w.keys!.start + i * 0.1 + 0.35);
      let val = '';
      for (let k = 0; k < 18; k++) val += k / 18 < lock ? '•' : glyphs[Math.floor(hash(i, k, Math.floor(t * 30)) * glyphs.length)]!;
      mono(ctx, c, v, -870, -130 + i * 100, 24, rgba('ash', 1), { spacing: 0.04 });
      mono(ctx, c, val, -870, -90 + i * 100, 30, rgba(lock >= 1 ? 'bone' : 'signal', 1), { spacing: 0.06 });
    });
    // the chat
    setWorld(ctx, c);
    rrect(ctx, 140, -260, 760, 420, 16);
    ctx.fillStyle = rgba('ink2', 0.96); ctx.fill();
    ctx.strokeStyle = rgba('bone', 0.6); ctx.lineWidth = 2 / c.z; ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    mono(ctx, c, 'CHAT', 170, -210, 20, rgba('ash', 1));
    // the key flies toward the chat and gets struck
    const fly = ease.inOutCubic(prog(t, w.never!.start, w.touch!.start + 0.1));
    if (fly > 0) {
      const x = -300 + fly * 640;
      setWorld(ctx, c, x, -40);
      rrect(ctx, 0, -40, 330, 80, 40);
      ctx.fillStyle = rgba('signal', 1); ctx.fill();
      ctx.font = font(F.mono(600), 30); ctx.fillStyle = rgba('ink', 1);
      ctx.fillText('sk_live_••••', 30, 12);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    if (t > w.touch!.start + 0.1) {
      const k = ease.outExpo(prog(t, w.touch!.start + 0.1, w.touch!.start + 0.3));
      setWorld(ctx, c);
      ctx.strokeStyle = rgba('signal', 1); ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(300, -140); ctx.lineTo(300 + 440 * k, -140 + 200 * k); ctx.moveTo(740, -140); ctx.lineTo(740 - 440 * k, -140 + 200 * k); ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      slam(ctx, c, t, 'BLOCKED', w.chat!.start, 520, 120, 110, { fam: BLACK, fin: 'signal' });
    }
    slam(ctx, c, t, 'NEVER', w.never!.start, 0, 430, 300, { fam: BLACK, fin: 'bone', alpha: 1 - 0.7 * prog(t, w.chat!.start, w.chat!.end) });
    brackets(ctx, c, -940, -320, 1880, 540, 40, rgba('bone', 0.4));
    mono(ctx, c, 'fig. 7 — keys stay yours', -940, -350, 16, rgba('ash', 0.8));
  }

  post(t: number) {
    const w = this.w;
    return { zoom: 1 + 0.03 * pulse(t, w.never!.start, 0.07) + 0.02 * pulse(t, w.chat!.start, 0.07), ca: 1.5 + 6 * pulse(t, w.touch!.start + 0.1, 0.06) };
  }
}
