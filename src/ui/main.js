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
import { createDisasm } from './disasm.js';
import { createMonitor } from './monitor.js';
import { createEditor } from './editor.js';
import { createFiles } from './files.js';
import { anchorFor, resolveAnchor } from '../core/breakpoints.js';

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
let assembledSource = null; // Quelltext des letzten erfolgreichen Übersetzens
let errorSource = null; // Quelltext, zu dem die Fehlerliste gehört
let errorList = [];

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
const regs = createRegisters($('regs'), machine, () => { rev++; updateStatus(); updateButtons(); });
const flow = createFlow($('flow'), machine, {
  onToggleBp: (addr) => toggleBp(addr),
  onJump: (addr) => jumpTo(addr),
  ui: { input: $('flow-target'), select: $('flow-labels'), jumpBtn: $('flow-jump'), bpBtn: $('flow-bp'), prevBtn: $('flow-prev'), nextBtn: $('flow-next'), note: $('flow-note') },
});
const disasm = createDisasm($('disasm'), {
  input: $('dis-goto'), select: $('dis-labels'), prevBtn: $('dis-prev'), nextBtn: $('dis-next'), follow: $('dis-follow'),
}, machine, (addr) => toggleBp(addr));
const monitor = createMonitor($('monitor'), {
  goto: $('mon-goto'), prev: $('mon-prev'), next: $('mon-next'),
  find: $('mon-find'), findBtn: $('mon-find-btn'), findNext: $('mon-find-next'), note: $('mon-note'),
}, machine);
const runner = new Runner(machine, () => {
  updateButtons();
  updateStatus();
  if (!runner.running) editor.reveal(addrToLine.get(machine.cpu.pc));
});
runner.speed = SPEEDS[store.get('speed', 4)] ?? 1000;
speedSel.value = String(Math.max(0, SPEEDS.indexOf(runner.speed)));
speedSel.addEventListener('change', () => { runner.speed = SPEEDS[Number(speedSel.value)]; store.set('speed', Number(speedSel.value)); });

// Schreibzugriffe: Bildschirm zeichnet nur geänderte Punkte; Zufallszahl und Tastenwert als Eingabe
let memRev = 0; // zählt Schreibzugriffe; Ansichten, die Befehle zeigen, zeichnen dann neu
machine.mem.onWrite = (addr) => { screen.mark(addr); memRev++; };
machine.mem.onRead = (addr) => (addr === 0xfe ? (Math.random() * 256) | 0 : undefined);

// ---- Quelltext ---------------------------------------------------------------

let addrToLine = new Map();

// Haltepunkte hängen an Marken (siehe core/breakpoints.js) und überstehen Änderungen am Quelltext
let anchors = store.get('breakpoints', []);
function syncBreakpoints() {
  const valid = new Set(machine.lineMap.map((l) => l.addr));
  const bps = new Set();
  anchors = anchors.filter((a) => {
    const addr = resolveAnchor(a, machine.labels, valid);
    if (addr === null) return false;
    bps.add(addr);
    return true;
  });
  machine.breakpoints = bps;
  store.set('breakpoints', anchors);
}
function toggleBp(addr) {
  const same = anchors.filter((a) => resolveAnchor(a, machine.labels) === addr);
  if (same.length) anchors = anchors.filter((a) => !same.includes(a));
  else anchors.push(anchorFor(addr, machine.labels));
  syncBreakpoints();
  rev++;
}

const editor = createEditor({
  textarea: $('source'),
  layer: $('layer'),
  gutter: $('gutter'),
  onChange: () => {
    const text = editor.getValue();
    sourceDirty = text !== assembledSource;
    lastErrors = text === errorSource ? errorList : [];
    renderMessages();
    store.set('source', editor.getValue());
  },
  onGutterClick: (line) => {
    runner.pause();
    if (sourceDirty && !assemble()) return;
    const entry = machine.lineMap.find((l) => l.line === line && l.size > 0);
    if (!entry) return;
    toggleBp(entry.addr);
  },
});
editor.setValue(store.get('source', SAMPLE));
const files = createFiles({
  editor,
  slotSel: $('slot'), saveSlotBtn: $('slot-save'), loadSlotBtn: $('slot-load'),
  openBtn: $('file-open'), fileInput: $('file-input'), saveFileBtn: $('file-save'),
  dropTarget: $('editor'), note: $('editor-note'),
});

function updateMarkers() {
  const errs = new Map(lastErrors.map((e) => [e.line, t(e.key, e.params)]));
  editor.setErrors(errs);
  if (sourceDirty) {
    editor.setBreakpoints(new Set());
    editor.setActive(0);
    return;
  }
  const bps = new Set();
  for (const a of machine.breakpoints) {
    const l = machine.lineMap.find((x) => x.addr === a && x.size > 0);
    if (l) bps.add(l.line);
  }
  editor.setBreakpoints(bps);
  editor.setActive(addrToLine.get(machine.cpu.pc) ?? 0);
}

function renderMessages() {
  const ul = $('messages');
  ul.replaceChildren();
  const add = (cls, text) => { const li = document.createElement('li'); li.className = cls; li.textContent = text; ul.append(li); return li; };
  if (lastErrors.length) {
    add('err', t('status.errors', { n: lastErrors.length }));
    for (const e of lastErrors) add('err', t('msg.line', { line: e.line, message: t(e.key, e.params) })).dataset.line = String(e.line);
  } else if (lastAssembled && !sourceDirty) {
    add('ok', t('status.assembled', { bytes: lastAssembled.bytes, addr: `$${hex4(lastAssembled.addr)}` }));
  }
}

function assemble() {
  const result = machine.assembleAndLoad(editor.getValue());
  lastErrors = result.ok ? [] : result.errors;
  errorList = lastErrors;
  errorSource = result.ok ? null : editor.getValue();
  if (result.ok) {
    lastResult = result;
    const bytes = result.segments.reduce((n, s) => n + s.bytes.length, 0);
    lastAssembled = { bytes, addr: machine.entry };
    syncBreakpoints();
    flow.refreshLabels();
    disasm.refreshLabels();
    sourceDirty = false;
    assembledSource = editor.getValue();
    addrToLine = new Map(machine.lineMap.filter((l) => l.size > 0).map((l) => [l.addr, l.line]));
    screen.redrawAll();
  }
  rev++;
  renderMessages();
  updateStatus();
  updateButtons();
  return result.ok;
}

function jumpTo(addr) {
  runner.pause();
  machine.jumpTo(addr);
  rev++;
  updateStatus();
  updateButtons();
  editor.reveal(addrToLine.get(addr));
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
  editor.reveal(addrToLine.get(machine.cpu.pc));
  updateStatus();
  updateButtons();
};
$('btn-step').addEventListener('click', stepper(() => machine.stepInto()));
$('btn-over').addEventListener('click', stepper(() => machine.stepOver()));
$('btn-out').addEventListener('click', stepper(() => machine.stepOut()));
$('btn-reset').addEventListener('click', resetProgram);

function updateButtons() {
  let key = 'run';
  if (runner.running) key = 'pause';
  else if (machine.cpu.halted) key = 'restart';
  else if (machine.instructions > 0) key = 'resume';
  const tip = { run: 'tip.start', pause: 'tip.pause', restart: 'tip.restart', resume: 'tip.resume' }[key];
  $('btn-run').textContent = t('btn.' + key);
  $('btn-run').title = t(tip);
}

$('messages').addEventListener('click', (e) => {
  const li = e.target.closest('li[data-line]');
  if (li) editor.goto(Number(li.dataset.line));
});

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
  files.labelSlots();
  flow.refreshLabels();
  disasm.refreshLabels();
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
  flow.update(rev, memRev);
  disasm.update(rev, memRev);
  updateMarkers();
  monitor.update(now);
  $('status-right').textContent = `PC $${hex4(machine.cpu.pc)}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Für Entwicklung und Prüfung in der Konsole
window.e6502 = { machine, runner, assemble };
