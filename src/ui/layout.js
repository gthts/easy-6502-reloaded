// Seitenleisten: ein-/ausklappbar, in der Breite ziehbar (auch per Tastatur), Zustand wird gemerkt.
import { store } from './storage.js';
import { t } from '../i18n/index.js';

const MIN = 180;
const MAX = 720;

export function initLayout() {
  const app = document.getElementById('app');
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  const state = { lw: 440, rw: 300, lc: narrow, rc: narrow, ...store.get('layout', {}) };

  const sides = {
    left: { el: document.getElementById('panel-left'), key: 'l', cls: 'lc', arrow: ['‹', '›'] },
    right: { el: document.getElementById('panel-right'), key: 'r', cls: 'rc', arrow: ['›', '‹'] },
  };

  function apply() {
    app.style.setProperty('--lw', state.lc ? 'var(--rail)' : `${state.lw}px`);
    app.style.setProperty('--rw', state.rc ? 'var(--rail)' : `${state.rw}px`);
    app.classList.toggle('lc', state.lc);
    app.classList.toggle('rc', state.rc);
    for (const [name, s] of Object.entries(sides)) {
      const collapsed = state[s.cls];
      const btn = document.querySelector(`[data-toggle="${name}"]`);
      btn.textContent = s.arrow[collapsed ? 1 : 0];
      btn.setAttribute('aria-expanded', String(!collapsed));
      const label = t(collapsed ? 'panel.expand' : 'panel.collapse');
      btn.title = label;
      btn.setAttribute('aria-label', label);
    }
  }

  function save() {
    store.set('layout', state);
  }

  const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
  const other = { left: 'right', right: 'left' };
  function setOpen(name, open) {
    state[sides[name].cls] = !open;
    if (open && isNarrow()) state[sides[other[name]].cls] = true;
  }

  for (const name of Object.keys(sides)) {
    document.querySelector(`[data-toggle="${name}"]`).addEventListener('click', () => {
      setOpen(name, state[sides[name].cls]);
      apply();
      save();
    });
  }
  // Beim Laden darf auf schmalen Bildschirmen nicht gleich alles offen sein
  if (isNarrow() && !state.lc && !state.rc) state.rc = true;

  function setupSplitter(el, prop, collapsedKey, sign) {
    const clamp = (v) => Math.max(MIN, Math.min(MAX, v));
    el.addEventListener('pointerdown', (e) => {
      if (state[collapsedKey]) return;
      const startX = e.clientX;
      const startW = state[prop];
      el.setPointerCapture(e.pointerId);
      el.classList.add('drag');
      const move = (ev) => {
        state[prop] = clamp(startW + sign * (ev.clientX - startX));
        apply();
      };
      const up = () => {
        el.classList.remove('drag');
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        save();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
    el.addEventListener('keydown', (e) => {
      if (state[collapsedKey]) return;
      const step = e.shiftKey ? 48 : 16;
      if (e.key === 'ArrowLeft') state[prop] = clamp(state[prop] - sign * step);
      else if (e.key === 'ArrowRight') state[prop] = clamp(state[prop] + sign * step);
      else return;
      e.preventDefault();
      apply();
      save();
    });
  }
  setupSplitter(document.getElementById('split-left'), 'lw', 'lc', 1);
  setupSplitter(document.getElementById('split-right'), 'rw', 'rc', -1);

  apply();
  return {
    refresh: apply,
    open(name) {
      setOpen(name, true);
      apply();
      save();
    },
  };
}
