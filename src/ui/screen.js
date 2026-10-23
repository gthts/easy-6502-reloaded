// Bildschirm 32×32, 16 Farben, Speicherbereich $0200–$05FF. Eingabe: Tastencode in $FF, Zufallszahl in $FE.

export const PALETTE = [
  '#000000', '#ffffff', '#880000', '#aaffee', '#cc44cc', '#00cc55', '#0000aa', '#eeee77',
  '#dd8855', '#664400', '#ff7777', '#333333', '#777777', '#aaff66', '#0088ff', '#bbbbbb',
];

const BASE = 0x200;
const SIZE = 32 * 32;

const KEYS = { ArrowUp: 0x77, ArrowLeft: 0x61, ArrowDown: 0x73, ArrowRight: 0x64 };

export function createScreen(canvas, wrap, memory) {
  const ctx = canvas.getContext('2d');
  const dirty = new Uint8Array(SIZE);
  let any = true;
  let all = true;

  function mark(addr) {
    const i = addr - BASE;
    if (i >= 0 && i < SIZE) {
      dirty[i] = 1;
      any = true;
    }
  }

  function draw() {
    if (!any) return;
    for (let i = 0; i < SIZE; i++) {
      if (!all && !dirty[i]) continue;
      dirty[i] = 0;
      ctx.fillStyle = PALETTE[memory.data[BASE + i] & 0x0f];
      ctx.fillRect(i & 31, i >> 5, 1, 1);
    }
    any = false;
    all = false;
  }

  function redrawAll() {
    all = true;
    any = true;
  }

  wrap.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let code = KEYS[e.key];
    if (code === undefined && e.key.length === 1) code = e.key.charCodeAt(0) & 0xff;
    if (code === undefined) return;
    memory.poke(0xff, code);
    e.preventDefault();
  });
  wrap.addEventListener('pointerdown', () => wrap.focus());

  return { mark, draw, redrawAll };
}
