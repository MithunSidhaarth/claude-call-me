// The edit: which plate plays when. Every cut sits in the pause before a line, anchored to the
// aligned script (data/lyrics.json), so swapping the voiceover re-times the whole film.
import type { TimelineEntry } from './engine/engine';
import type { SceneClass } from './engine/scene';
import type { Lyrics } from './engine/lyrics';
import type { AudioData } from './engine/audio';

const modules = import.meta.glob<{ default: SceneClass }>('./scenes/*.ts');
const scene = (name: string) => () => {
  const m = modules[`./scenes/${name}.ts`];
  return m ? m() : Promise.reject(new Error(`scene module not found: scenes/${name}.ts`));
};

export function makeTimeline(ly: Lyrics, au: AudioData): TimelineEntry[] {
  const cut = (q: string, nth = 0) => {
    const l = ly.get(q, nth);
    const prev = ly.lines[l.i - 1];
    const gap = prev ? l.start - prev.end : 1;
    return l.start - Math.min(0.18, Math.max(0.04, gap * 0.45));
  };
  const plates: [string, string | null][] = [
    ['ring', null],
    ['terminal', 'Stop babysitting'],
    ['loop', "When it's stuck"],
    ['livecall', 'A real voice agent'],
    ['afternoon', 'Without it'],
    ['steps', 'When a task ends'],
    ['standup', 'And every morning'],
    ['keys', 'Your keys never'],
    ['callme', 'Call me.'],
  ];
  // plates not written yet are skipped, so the film stays playable while it is built
  const have = new Set(Object.keys(modules).map((k) => k.slice('./scenes/'.length, -3)));
  const live = plates.filter(([id]) => have.has(id));
  const starts = live.map(([, q]) => (q ? cut(q) : 0));
  return live.map(([id], i) => ({ id, load: scene(id), start: starts[i]!, end: starts[i + 1] ?? au.duration }));
}
