// Shared toolkit for the claude-call-me plates: a base plate (grid + plotter + 2D layer + pen),
// word lookup, slams, HUD brackets, ring shockwaves, waveforms and mono readouts.
import type * as THREE from 'three';
import { Scene, type Frame, type PostOverrides } from '../engine/scene';
import { Layer2D, W, H } from '../engine/gl';
import { LineBatch } from '../engine/lines';
import { rgba } from '../engine/palette';
import { F, font, layout } from '../engine/type';
import { type Line, type Word } from '../engine/lyrics';
import { clamp, ease, hash, noise1, prog, pulse, TAU } from '../engine/util';
import { Plot, Cam2D, gridPass, setGrid, drawPen, w2s, setWorld, mixCss, lineOf, wordOf, type Cam, type KWord, drawKaraoke } from './_vo';

export const ARCH = (wd: number, wt: number) => F.archivo(wd, wt);
export const BLACK = ARCH(125, 900);
export { W, H };

/** Base plate: graph paper, plotter strokes, a 2D layer, the pen spark. Subclasses fill build() and draw(). */
export abstract class Plate extends Scene {
  plot = new Plot();
  cam = new Cam2D();
  grid = gridPass(24, 96);
  lines = new LineBatch(40000);
  fx = new LineBatch(20000);
  ui = new Layer2D();
  kw: KWord[] = [];
  w: Record<string, Word> = {};
  T0 = 0; T1 = 0;
  gridInk = 0.8;

  /** Words by key: [key, line query, word, nth]. */
  words(spec: [string, string, string, number?][]) {
    const ly = this.ctx.lyrics;
    for (const [k, lq, wq, n] of spec) this.w[k] = wordOf(lineOf(ly, lq), wq, n ?? 0);
  }
  line(q: string): Line { return lineOf(this.ctx.lyrics, q); }

  override init() {
    this.T0 = this.ctx.start; this.T1 = this.ctx.end;
    this.build();
    this.plot.alpha = (g, t) => this.groupAlpha(g, t);
  }
  abstract build(): void;
  groupAlpha(_g: string, _t: number) { return 1; }
  /** Background colour fill on the 2D layer before everything (e.g. a red flip). Return null for the grid. */
  field(_t: number): string | null { return null; }
  abstract draw(ctx: CanvasRenderingContext2D, t: number, c: Cam): void;
  post(_t: number): PostOverrides { return {}; }

  override render(f: Frame, out: THREE.WebGLRenderTarget): PostOverrides {
    const { renderer, comp } = this.ctx;
    const t = f.t, c = this.cam.at(t);
    const pen = this.plot.penAt(t);
    const ps = pen ? w2s(c, pen.x, pen.y) : null;
    setGrid(this.grid, c, { reveal: [0, 0, 1e5], ink: this.gridInk, pen: ps ? [ps[0], ps[1], 1] : [0, 0, 0] });
    this.grid.render(renderer, out);
    const U = this.ui; U.clear();
    const ctx = U.ctx;
    const fld = this.field(t);
    if (fld) { ctx.fillStyle = fld; ctx.fillRect(0, 0, W, H); }
    const L = this.lines; L.clear();
    this.plot.draw(t, c, L);
    this.draw(ctx, t, c);
    this.plot.drawNotes(t, c, ctx);
    drawKaraoke(ctx, c, t, this.kw, { alpha: (g, tt) => this.groupAlpha(g, tt) });
    comp.draw(renderer, U.upload(), out);
    L.render(renderer, out);
    const X = this.fx; X.clear();
    drawPen(X, t, (tt) => { const q = this.plot.penAt(tt); return q ? w2s(c, q.x, q.y) : null; }, { intensity: 1, rate: 50 });
    X.render(renderer, out);
    return { bloom: 0.75, bloomThreshold: 0.82, vignette: 0.4, grain: 0.06, ca: 1.2, ...this.post(t) };
  }
}

/** A word that slams in at `word.start`: overshoot scale, ember→signal hot flash, cools to `fin`. */
export function slam(ctx: CanvasRenderingContext2D, c: Cam, t: number, text: string, t0: number, x: number, y: number, size: number,
  o: { fam?: string; fin?: string; hot?: string; align?: 'left' | 'center'; cool?: number; outline?: boolean; alpha?: number } = {}) {
  if (t < t0) return;
  const fam = o.fam ?? BLACK;
  const age = t - t0;
  const sc = 1 + 0.22 * (1 - ease.outExpo(clamp(age / 0.22)));
  const hot = Math.pow(0.5, age / 0.07);
  const cool = clamp(age / (o.cool ?? 0.45));
  const lay = layout(text, fam, 100);
  const wpx = (lay.width / 100) * size;
  const lx = o.align === 'left' ? x : x - wpx / 2;
  const cx = lx + wpx / 2, cy = y - 0.36 * size;
  setWorld(ctx, c, cx + (lx - cx) * sc, cy + (y - cy) * sc, (size / 100) * sc);
  ctx.font = font(fam, 100);
  ctx.textAlign = 'left';
  ctx.globalAlpha = o.alpha ?? 1;
  const col = hot > 0.1 ? mixCss('ember', o.hot ?? 'signal', 1 - hot) : mixCss(o.hot ?? 'signal', o.fin ?? 'bone', cool);
  if (o.outline) { ctx.lineWidth = 2.2 * 100 / (size * c.z); ctx.strokeStyle = col; ctx.strokeText(text, 0, 0); }
  else { ctx.fillStyle = col; ctx.fillText(text, 0, 0); }
  ctx.globalAlpha = 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Corner brackets around a world rect (HUD framing). */
export function brackets(ctx: CanvasRenderingContext2D, c: Cam, x: number, y: number, w: number, h: number, len: number, col: string, k = 1) {
  setWorld(ctx, c);
  ctx.strokeStyle = col;
  ctx.lineWidth = 2 / c.z;
  const l = len * k;
  ctx.beginPath();
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]] as const) {
    ctx.moveTo(px + sx * l, py); ctx.lineTo(px, py); ctx.lineTo(px, py + sy * l);
  }
  ctx.stroke();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Shockwave rings from (x, y) world, one burst per time in `hits`. */
export function rings(ctx: CanvasRenderingContext2D, c: Cam, t: number, x: number, y: number, hits: number[], o: { r0?: number; r1?: number; life?: number; col?: string; n?: number; width?: number } = {}) {
  setWorld(ctx, c);
  for (const h of hits) {
    for (let k = 0; k < (o.n ?? 3); k++) {
      const age = t - h - k * 0.09;
      const life = o.life ?? 0.9;
      if (age < 0 || age > life) continue;
      const u = age / life;
      const r = (o.r0 ?? 120) + ((o.r1 ?? 900) - (o.r0 ?? 120)) * ease.outCubic(u);
      ctx.strokeStyle = rgba(o.col ?? 'signal', (1 - u) * (1 - u) * (k === 0 ? 1 : 0.55));
      ctx.lineWidth = (o.width ?? 4) * (1 - u * 0.7) / c.z * c.z;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Spaced mono readout at a world point. */
export function mono(ctx: CanvasRenderingContext2D, c: Cam, text: string, x: number, y: number, size: number, col: string, o: { align?: CanvasTextAlign; spacing?: number; weight?: number; typed?: number } = {}) {
  setWorld(ctx, c, x, y, size / 100);
  ctx.font = font(F.mono(o.weight ?? 500), 100);
  ctx.letterSpacing = `${(o.spacing ?? 0.18) * 100}px`;
  ctx.textAlign = o.align ?? 'left';
  ctx.fillStyle = col;
  const s = o.typed === undefined ? text : text.slice(0, Math.ceil(text.length * clamp(o.typed)));
  ctx.fillText(s, 0, 0);
  ctx.letterSpacing = '0px'; ctx.textAlign = 'left';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A live-looking audio waveform (bars) between x0..x1 at y, energy 0..1. */
export function waveform(ctx: CanvasRenderingContext2D, c: Cam, t: number, x0: number, x1: number, y: number, hgt: number, energy: number, col: string, n = 64, seed = 3) {
  setWorld(ctx, c);
  ctx.fillStyle = col;
  const bw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const env = Math.sin((i / (n - 1)) * Math.PI);
    const v = (0.15 + 0.85 * Math.abs(noise1(t * 9 + i * 0.37, seed))) * env * energy;
    const h = Math.max(2, hgt * v);
    ctx.fillRect(x0 + i * bw + bw * 0.2, y - h / 2, bw * 0.6, h);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** A rounded rect path in world space (call after setWorld). */
export function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Rows of scrolling mono hex/log noise (the busy margins). */
export function ticker(ctx: CanvasRenderingContext2D, c: Cam, t: number, x: number, y: number, rows: number, cols: number, size: number, col: string, seed = 1) {
  setWorld(ctx, c, x, y, size / 100);
  ctx.font = font(F.mono(400), 100);
  ctx.fillStyle = col;
  const step = Math.floor(t * 12);
  const glyphs = '0123456789ABCDEF.:/-_';
  for (let r = 0; r < rows; r++) {
    let s = '';
    for (let k = 0; k < cols; k++) s += glyphs[Math.floor(hash(r, k + step, seed) * glyphs.length)]!;
    ctx.fillText(s, 0, r * 130);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export { pulse, prog, ease, clamp, setWorld, mixCss, rgba, font, F, layout, w2s };
export type { Cam, Word, Line };
