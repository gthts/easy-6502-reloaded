// Dateien (Öffnen, Speichern, Ziehen und Ablegen) und Schnellspeicherplätze im Browserspeicher.
import { store } from './storage.js';
import { t, getLocale } from '../i18n/index.js';

export const SLOT_COUNT = 5;
const MAX_FILE = 1024 * 1024;

function titleOf(text) {
  for (const raw of text.split(/\r?\n/)) {
    const s = raw.replace(/^[\s;*]+/, '').trim();
    if (s) return s.length > 28 ? `${s.slice(0, 27)}…` : s;
  }
  return '…';
}

export function createFiles({ editor, slotSel, saveSlotBtn, loadSlotBtn, openBtn, fileInput, saveFileBtn, dropTarget, note }) {
  let slots = store.get('slots', []);
  if (!Array.isArray(slots)) slots = [];
  while (slots.length < SLOT_COUNT) slots.push(null);
  let fileName = store.get('fileName', 'program.asm');
  let noteTimer = null;

  function say(key, params) {
    note.textContent = t(key, params);
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { note.textContent = ''; }, 4000);
  }

  function labelSlots() {
    const keep = slotSel.value;
    slotSel.replaceChildren();
    slots.forEach((s, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      if (s) {
        const when = new Date(s.time).toLocaleString(getLocale(), { dateStyle: 'short', timeStyle: 'short' });
        o.textContent = `${i + 1}: ${titleOf(s.text)} · ${when}`;
      } else {
        o.textContent = `${i + 1}: ${t('editor.slotEmpty')}`;
      }
      slotSel.append(o);
    });
    slotSel.value = keep || '0';
  }

  saveSlotBtn.addEventListener('click', () => {
    const i = Number(slotSel.value);
    const text = editor.getValue();
    if (slots[i] && slots[i].text !== text && !window.confirm(t('editor.confirmOverwrite', { n: i + 1 }))) return;
    slots[i] = { text, time: Date.now() };
    store.set('slots', slots);
    labelSlots();
    say('editor.slotSaved', { n: i + 1 });
  });

  loadSlotBtn.addEventListener('click', () => {
    const i = Number(slotSel.value);
    if (!slots[i]) { say('editor.slotEmpty'); return; }
    editor.replaceAll(slots[i].text);
    say('editor.slotLoaded', { n: i + 1 });
  });

  function saveFile() {
    const blob = new Blob([editor.getValue()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say('editor.fileSaved', { name: fileName });
  }
  saveFileBtn.addEventListener('click', saveFile);

  async function openFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE) { say('editor.fileTooBig'); return; }
    const text = await file.text();
    editor.replaceAll(text.replace(/\r\n?/g, '\n'));
    fileName = file.name;
    store.set('fileName', fileName);
    say('editor.fileLoaded', { name: file.name });
  }
  openBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { openFile(fileInput.files[0]); fileInput.value = ''; });

  dropTarget.addEventListener('dragover', (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
    e.preventDefault();
    dropTarget.classList.add('drop');
  });
  dropTarget.addEventListener('dragleave', () => dropTarget.classList.remove('drop'));
  dropTarget.addEventListener('drop', (e) => {
    dropTarget.classList.remove('drop');
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    e.preventDefault();
    openFile(f);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && dropTarget.contains(document.activeElement)) {
      e.preventDefault();
      saveFile();
    }
  });

  labelSlots();
  return { labelSlots };
}
