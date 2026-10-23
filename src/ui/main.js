import { Machine } from '../core/machine.js';
import { loadInto } from '../core/assembler.js';
import { hex4 } from '../core/disassembler.js';
import { setLocale, availableLocales, t } from '../i18n/index.js';
import { store } from './storage.js';
import { applyTranslations } from './dom-i18n.js';
import { initLayout } from './layout.js';
import { createScreen } from './screen.js';
import { Runner, SPEEDS } from './runner.js';
import { createRegisters } from './registers.js';
import { createFlow } from './flow.js';
import { createMonitor } from './monitor.js';

const $ = (id) => document.getElementById(id);

const SAMPLE = `; Fills the first rows of the screen with colours.
; Füllt die ersten Bildschirmzeilen mit Farben.
  ldx #0
loop:
  txa
  sta $0200,x
  sta $0300,x
  inx
  bne loop
  brk
`;

const LANG_NAMES = { en: 'English', de: 'Deutsch' };

// ---- Zustand --------------------------------------------------------------

const machine = new Machine();
let rev = 0; // zählt Änderungen, die Ansichten neu zeichnen müssen (Übersetzen, Haltepunkte, Zurücksetzen)
let lastResult = null; // letztes erfolgreiches Übersetzungsergebnis
let sourceDirty = true;
let lastErrors = [];
let lastAssembled = null;

// ---- Sprache und Darstellung ------------------------------------------------------

function pickLocale() {
  const saved = store.get('locale', null);
  if (saved && availableLocales().includes(saved)) return saved;
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return availableLocales().includes(lang) ? lang : 'en';
}

const langSel = $('lang');
for (const code of availableLocales()) {
  const o = document.createElement('option');
  o.value = code;
  o.textContent = LANG_NAMES[code] ?? code;
  langSel.append(o);
}
const speedSel = $('speed');
SPEEDS.forEach((s, i) => {
  const o = document.createElement('option');
  o.value = String(i);
  speedSel.append(o);
});

function labelSpeeds() {
  SPEEDS.forEach((s, i) => {
    speedSel.options[i].textContent = s === Infinity ? t('speed.max') : `${s.toLocaleString(document.documentElement.lang)}/s`;
  });
}

const themeSel = $('theme');
function applyTheme(v) {
  if (v === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', v);
}
themeSel.value = store.get('theme', 'auto');
applyTheme(themeSel.value);
themeSel.addEventListener('change', () => { store.set('theme', themeSel.value); applyTheme(themeSel.value); });

// ---- Bausteine -------------------------------------------------------------

const layout = initLayout();
const screen = createScreen($('screen'), $('screen-wrap'), machine.mem);
const regs = createRegisters($('regs'), machine);
const flow = createFlow($('flow'), machine, (addr) => { machine.toggleBreakpoint(addr); rev++; });
const monitor = createMonitor($('monitor'), $('mon-goto'), $('mon-prev'), $('mon-next'), machine);
const runner = new Runner(machine, () => { updateButtons(); updateStatus(); });
runner.speed = SPEEDS[store.get('speed', 4)] ?? 1000;
speedSel.value = String(Math.max(0, SPEEDS.indexOf(runner.speed)));
speedSel.addEventListener('change', () => { runner.speed = SPEEDS[Number(speedSel.value)]; store.set('speed', Number(speedSel.value)); });

// Schreibzugriffe: Bildschirm zeichnet nur geänderte Punkte; Zufallszahl und Tastenwert als Eingabe
machine.mem.onWrite = (addr) => screen.mark(addr);
machine.mem.onRead = (addr) => (addr === 0xfe ? (Math.random() * 256) | 0 : undefined);

// ---- Quelltext ---------------------------------------------------------------

const source = $('source');
source.value = store.get('source', SAMPLE);
source.addEventListener('input', () => { sourceDirty = true; store.set('source', source.value); });
source.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
    e.preventDefault();
    const { selectionStart: s, selectionEnd: en } = source;
    source.setRangeText('  ', s, en, 'end');
    source.dispatchEvent(new Event('input'));
  }
});

function renderMessages() {
  const ul = $('messages');
  ul.replaceChildren();
  const add = (cls, text) => { const li = document.createElement('li'); li.className = cls; li.textContent = text; ul.append(li); };
  if (lastErrors.length) {
    add('err', t('status.errors', { n: lastErrors.length }));
    for (const e of lastErrors) add('err', t('msg.line', { line: e.line, message: t(e.key, e.params) }));
  } else if (lastAssembled) {
    add('ok', t('status.assembled', { bytes: lastAssembled.bytes, addr: `$${hex4(lastAssembled.addr)}` }));
  }
}

function assemble() {
  const result = machine.assembleAndLoad(source.value);
  lastErrors = result.ok ? [] : result.errors;
  if (result.ok) {
    lastResult = result;
    const bytes = result.segments.reduce((n, s) => n + s.bytes.length, 0);
    lastAssembled = { bytes, addr: machine.entry };
    sourceDirty = false;
    screen.redrawAll();
  }
  rev++;
  renderMessages();
  updateStatus();
  updateButtons();
  return result.ok;
}

function ensureAssembled() {
  return !sourceDirty || assemble();
}

function resetProgram() {
  runner.pause();
  if (!lastResult) { assemble(); return; }
  machine.mem.clear();
  loadInto(machine.mem, lastResult);
  machine.reset();
  screen.redrawAll();
  rev++;
  updateStatus();
  updateButtons();
}

// ---- Bedienung ----------------------------------------------------------------

$('btn-assemble').addEventListener('click', () => { runner.pause(); assemble(); });
$('btn-run').addEventListener('click', () => {
  if (runner.running) { runner.pause(); return; }
  if (!ensureAssembled()) return;
  if (machine.cpu.halted) resetProgram();
  runner.start();
});
const stepper = (fn) => () => {
  runner.pause();
  if (!ensureAssembled()) return;
  if (machine.cpu.halted) return;
  fn();
  rev++;
  updateStatus();
  updateButtons();
};
$('btn-step').addEventListener('click', stepper(() => machine.stepInto()));
$('btn-over').addEventListener('click', stepper(() => machine.stepOver()));
$('btn-out').addEventListener('click', stepper(() => machine.stepOut()));
$('btn-reset').addEventListener('click', resetProgram);

function updateButtons() {
  $('btn-run').textContent = runner.running ? t('btn.pause') : t('btn.run');
}

function updateStatus() {
  let key = 'status.idle';
  if (runner.running) key = 'status.running';
  else if (machine.stopReason === 'brk') key = 'status.brk';
  else if (machine.stopReason === 'illegal') key = 'status.illegal';
  else if (machine.stopReason === 'breakpoint') key = 'status.breakpoint';
  else if (machine.instructions > 0) key = 'status.paused';
  $('status').textContent = t(key);
}

// ---- Sprache umschalten ------------------------------------------------------

function retranslate() {
  document.documentElement.lang = langSel.value;
  applyTranslations(document);
  labelSpeeds();
  layout.refresh();
  regs.retranslate();
  renderMessages();
  updateButtons();
  updateStatus();
}
const initial = pickLocale();
setLocale(initial);
langSel.value = initial;
langSel.addEventListener('change', () => { setLocale(langSel.value); store.set('locale', langSel.value); retranslate(); });
retranslate();

// ---- Zeichenschleife: unabhängig vom Zeitgeber der Maschine -------------------------

function frame(now) {
  screen.draw();
  regs.update();
  flow.update(rev);
  monitor.update(now);
  $('status-right').textContent = `PC $${hex4(machine.cpu.pc)}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Für Entwicklung und Prüfung in der Konsole
window.e6502 = { machine, runner, assemble };
