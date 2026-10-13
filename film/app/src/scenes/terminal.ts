// TERMINAL: "Stop babysitting the terminal. Walk away. Claude calls you."
// A terminal waits on "Proceed? (y/n)" while a waiting counter races through the afternoon.
// "Stop": STOP slams, the pen strikes the terminal out. "Walk away": the camera pulls far back,
// the terminal becomes one of a wall of terminals all waiting on you, WALK AWAY over them.
// "Claude calls you": the frame flips signal red, black shockwaves, CLAUDE CALLS YOU.
import { Plate, slam, brackets, rings, mono, rrect, BLACK, prog, pulse, ease, clamp, setWorld, rgba, font, F, W, H, type Cam } from './_cm';
import { pt, placeRow } from './_vo';

const TX = -620, TY = -300, TW = 1240, TH = 600;
const LOG = [
  '$ claude "migrate the users table"',
  '  reading schema.sql ........................ ok',
  '  planning 4 migrations ..................... ok',
  '  writing 0007_users_split.sql .............. ok',
  '  dry run on staging ........................ ok',
  '',
  '? Drop the legacy column `users.name`? (y/n)',
];

export default class Terminal extends Plate {
  build() {
    this.words([
      ['stop', 'Stop babysitting', 'Stop'], ['babysitting', 'Stop babysitting', 'babysitting'], ['the', 'Stop babysitting', 'the'], ['terminal', 'Stop babysitting', 'terminal.'],
      ['walk', 'Walk away', 'Walk'], ['away', 'Walk away', 'away.'],
      ['claude', 'Claude calls you', 'Claude'], ['calls', 'Claude calls you', 'calls'], ['you', 'Claude calls you', 'you.'],
    ]);
    const w = this.w, P = this.plot;
    this.kw.push(...placeRow([w.stop!, w.babysitting!, w.the!, w.terminal!], TX, TY - 70, 64, F.archivo(100, 800), 'top', { ant: 0.15 }).words);
    // the strike: a wobbling diagonal through the terminal
    const pts = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push(pt(TX - 60 + u * (TW + 120), TY + TH * 0.85 - u * TH * 0.7 + 8 * Math.sin(u * 11))); }
    P.wp(pt(TX - 60, TY + TH * 0.85), w.stop!.start - 0.02, 0.02);
    P.add(pts, w.stop!.start, w.babysitting!.end, 'signal', { pen: true, ez: ease.inOutQuad, width: 14, group: 'strike' });
    const K = this.cam;
    K.key(this.T0, 0, 0, 1.18, 0.01);
    K.key(w.stop!.start + 0.1, 0, -20, 1.05, -0.01, ease.outExpo);
    K.key(w.walk!.start - 0.05, 0, -10, 1.0, 0, ease.linear);
    K.key(w.away!.end + 0.1, 0, 200, 0.16, 0.04, ease.inOutExpo);
    K.key(w.claude!.start, 0, 200, 0.15, 0.05, ease.linear);
    K.key(w.claude!.start + 0.01, 0, 0, 1, 0, ease.linear);
    K.key(this.T1, 0, 0, 1.08, -0.01, ease.linear);
  }

  groupAlpha(g: string, t: number) {
    const w = this.w;
    if (g === 'top' || g === 'strike') return 1 - prog(t, w.walk!.start, w.walk!.start + 0.3);
    return 1;
  }

  red(t: number) { return t >= this.w.claude!.start - 0.02; }
  field(t: number) { return this.red(t) ? rgba('signal', 1) : null; }

  draw(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    if (this.red(t)) { this.drawCall(ctx, t, c); return; }
    const wall = prog(t, w.walk!.start, w.away!.end);
    if (wall > 0) this.drawWall(ctx, t, c, wall);
    this.drawTerm(ctx, t, c, 0, 0, 1, true);
    slam(ctx, c, t, 'STOP', w.stop!.start, 0, 160, 420, { fin: 'signal', alpha: 1 - prog(t, w.babysitting!.start, w.terminal!.start) * 0.85 });
    if (t > w.walk!.start) {
      slam(ctx, c, t, 'WALK', w.walk!.start, -2600, 1700, 2600, { align: 'left', fin: 'bone' });
      slam(ctx, c, t, 'AWAY.', w.away!.start, -2600, 3900, 2600, { align: 'left', fin: 'signal' });
    }
  }

  /** One terminal at world offset (ox, oy), scale s. */
  drawTerm(ctx: CanvasRenderingContext2D, t: number, c: Cam, ox: number, oy: number, s: number, main: boolean, seed = 0) {
    setWorld(ctx, c, ox, oy, s);
    rrect(ctx, TX, TY, TW, TH, 18);
    ctx.fillStyle = rgba('ink2', 0.96);
    ctx.fill();
    ctx.strokeStyle = rgba(main ? 'bone' : 'graphite', main ? 0.7 : 0.8);
    ctx.lineWidth = 2 / (c.z * s);
    ctx.stroke();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba(['signal', 'ash', 'graphite'][i]!, 0.9); ctx.beginPath(); ctx.arc(TX + 34 + i * 30, TY + 30, 9, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = font(F.mono(500), 22);
    ctx.fillStyle = rgba('ash', 0.8);
    ctx.textAlign = 'center';
    ctx.fillText(main ? 'claude — ~/api' : `claude — ~/repo-${seed}`, 0, TY + 38);
    ctx.textAlign = 'left';
    ctx.font = font(F.mono(400), 30);
    LOG.forEach((ln, i) => {
      ctx.fillStyle = i === LOG.length - 1 ? rgba('bone', 1) : rgba(i === 0 ? 'bone' : 'ash', 0.85);
      ctx.fillText(ln, TX + 40, TY + 110 + i * 54);
    });
    // the blinking caret on the question
    if (Math.floor((t + seed * 0.13) * 2.4) % 2 === 0) { ctx.fillStyle = rgba('signal', 1); ctx.fillRect(TX + 40 + 30 * 0.6 * 47, TY + 110 + 6 * 54 - 26, 18, 32); }
    // the waiting counter: the afternoon racing by
    const mins = 3 + Math.max(0, t - this.T0) * 31 + seed * 17;
    const hh = Math.floor(mins / 60), mm = Math.floor(mins % 60), ss = Math.floor((mins * 60) % 60);
    ctx.font = font(F.mono(600), 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = rgba('signal', 1);
    ctx.fillText(`WAITING FOR YOU  ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, TX + TW - 34, TY + 40);
    ctx.textAlign = 'left';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  drawWall(ctx: CanvasRenderingContext2D, t: number, c: Cam, k: number) {
    for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) {
      if (i === 0 && j === 0) continue;
      const d = Math.hypot(i, j);
      const a = clamp(k * 3 - d * 0.35);
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      this.drawTerm(ctx, t, c, i * 1420, j * 760, 1, false, (i + 5) * 9 + j + 4);
    }
    ctx.globalAlpha = 1;
  }

  drawCall(ctx: CanvasRenderingContext2D, t: number, c: Cam) {
    const w = this.w;
    rings(ctx, c, t, 0, 0, [w.claude!.start, w.calls!.start, w.you!.start], { r0: 80, r1: 1300, life: 0.8, col: 'ink', width: 10 });
    slam(ctx, c, t, 'CLAUDE', w.claude!.start, 0, -110, 300, { hot: 'ink', fin: 'ink' });
    slam(ctx, c, t, 'CALLS', w.calls!.start, -40, 200, 300, { hot: 'bone', fin: 'bone', align: 'center' });
    slam(ctx, c, t, 'YOU.', w.you!.start, 0, 470, 300, { hot: 'ink', fin: 'ink' });
    brackets(ctx, c, -900, -470, 1800, 1000, 60, rgba('ink', 0.8));
    mono(ctx, c, 'fig. 2 — walk away', -880, -500, 18, rgba('ink', 0.8));
    mono(ctx, c, 'CALL-ME · ACTIVE', 880, -500, 18, rgba('ink', 0.8), { align: 'right' });
    void H; void W;
  }

  post(t: number) {
    const w = this.w;
    return {
      zoom: 1 + 0.03 * pulse(t, w.stop!.start, 0.08) + 0.03 * pulse(t, w.claude!.start, 0.08) + 0.02 * pulse(t, w.you!.start, 0.08),
      flash: 0.08 * pulse(t, w.claude!.start, 0.04),
      ca: 1.5 + 8 * pulse(t, w.stop!.start, 0.06),
    };
  }
}
