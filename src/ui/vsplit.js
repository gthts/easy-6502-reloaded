// Senkrechte Trennlinien in der Mitte: ziehen verändert die Höhe des Bereichs darüber.
// Doppelklick stellt die Standardhöhe wieder her; Pfeiltasten auf/ab verändern in 16-Pixel-Schritten (Umschalt: 48).
// Die Höhen werden im Browserspeicher gemerkt.
import { store } from './storage.js';

const MIN = 120;
const MAX = 1200;

/**
 * @param {HTMLElement} container  Element, auf dem die CSS-Variablen gesetzt werden
 * @param {{ el: HTMLElement, prop: string, target: HTMLElement }[]} items
 *   el = Trennlinie, prop = Name der CSS-Variable (z. B. „--editor-h“), target = Bereich, dessen Höhe sich ändert
 */
export function initVSplits(container, items) {
  const saved = store.get('heights', {});
  const clamp = (v) => Math.max(MIN, Math.min(MAX, Math.round(v)));

  function set(prop, px) {
    container.style.setProperty(prop, `${px}px`);
  }
  function persist(prop, px) {
    const all = store.get('heights', {});
    if (px === null) delete all[prop];
    else all[prop] = px;
    store.set('heights', all);
  }

  for (const { el, prop, target } of items) {
    if (typeof saved[prop] === 'number') set(prop, clamp(saved[prop]));

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startH = target.offsetHeight;
      try { el.setPointerCapture(e.pointerId); } catch { /* Zeiger nicht mehr aktiv */ }
      el.classList.add('drag');
      let h = startH;
      const move = (ev) => {
        h = clamp(startH + (ev.clientY - startY));
        set(prop, h);
      };
      const up = () => {
        el.classList.remove('drag');
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        persist(prop, h);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });

    el.addEventListener('dblclick', () => {
      container.style.removeProperty(prop);
      persist(prop, null);
    });

    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 48 : 16;
      let h = target.offsetHeight;
      if (e.key === 'ArrowUp') h -= step;
      else if (e.key === 'ArrowDown') h += step;
      else return;
      e.preventDefault();
      h = clamp(h);
      set(prop, h);
      persist(prop, h);
    });
  }
}
