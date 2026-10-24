// Zweipass-Assembler für den 6502.
//
// Unterstützte Schreibweise (kompatibel zu den Vorlagen Easy 6502 und 6502js):
//   Marken        name:            (Doppelpunkt erforderlich)
//   Konstanten    define name wert   oder   name = wert
//   Ursprung      *= $0600           oder   .org $0600
//   Daten         dcb 1,2,"x"  .byte  .db  |  dcw / .word / .dw  |  .text / .ascii "abc"  |  .res n[,wert]
//   Zahlen        $ff  %1010  255  'a'
//   Ausdrücke     + - * / & | ^ ( ) sowie <x (Low-Byte) und >x (High-Byte); * allein ist der Zählerstand
//   Kommentar     ; bis Zeilenende

import { BY_MNEMONIC, BRANCHES, MNEMONICS } from './opcodes.js';
import { t } from '../i18n/index.js';

export const DEFAULT_ORIGIN = 0x0600;

class AsmError extends Error {
  constructor(key, params = {}) {
    super(key);
    this.key = key;
    this.params = params;
  }
}

// ---- Ausdrücke -----------------------------------------------------------

function tokenize(src) {
  const tokens = [];
  const re = /\s*(?:(\$[0-9a-fA-F]+|%[01]+|\d+)|('(?:[^'\\]|\\.)')|([A-Za-z_][A-Za-z0-9_]*)|([-+*\/&|^()<>]))/y;
  let pos = 0;
  src = src.trim();
  while (pos < src.length) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) throw new AsmError('expr.unexpectedChar', { ch: src[pos] });
    pos = re.lastIndex;
    if (m[1] !== undefined) {
      const t = m[1];
      tokens.push({ t: 'num', v: t[0] === '$' ? parseInt(t.slice(1), 16) : t[0] === '%' ? parseInt(t.slice(1), 2) : parseInt(t, 10) });
    } else if (m[2] !== undefined) {
      const body = m[2].slice(1, -1);
      tokens.push({ t: 'num', v: (body[0] === '\\' ? unescapeChar(body[1]) : body).charCodeAt(0) });
    } else if (m[3] !== undefined) tokens.push({ t: 'id', v: m[3] });
    else tokens.push({ t: 'op', v: m[4] });
    while (pos < src.length && /\s/.test(src[pos])) pos++;
  }
  return tokens;
}

function unescapeChar(c) {
  return { n: '\n', t: '\t', r: '\r', 0: '\0', '\\': '\\', "'": "'", '"': '"' }[c] ?? c;
}

// Wertet einen Ausdruck aus. `lookup(name)` liefert eine Zahl oder undefined (unbekannt).
// Ergebnis: { value, known }. Unbekannte Namen machen das Ergebnis unbekannt (Wert 0).
function evaluate(src, lookup, pc) {
  const tokens = tokenize(src);
  if (tokens.length === 0) throw new AsmError('expr.missing');
  let i = 0;
  let known = true;

  const peek = () => tokens[i];
  const isOp = (v) => tokens[i] && tokens[i].t === 'op' && tokens[i].v === v;

  function primary() {
    const tk = tokens[i++];
    if (!tk) throw new AsmError('expr.incomplete');
    if (tk.t === 'num') return tk.v;
    if (tk.t === 'id') {
      const v = lookup(tk.v);
      if (v === undefined) { known = false; return 0; }
      return v;
    }
    if (tk.v === '(') {
      const v = orExpr();
      if (!isOp(')')) throw new AsmError('expr.closeParen');
      i++;
      return v;
    }
    if (tk.v === '*') return pc;
    throw new AsmError('expr.unexpectedChar', { ch: tk.v });
  }
  function unary() {
    if (isOp('-')) { i++; return -unary(); }
    if (isOp('+')) { i++; return unary(); }
    if (isOp('<')) { i++; return unary() & 0xff; }
    if (isOp('>')) { i++; return (unary() >> 8) & 0xff; }
    return primary();
  }
  function mul() {
    let v = unary();
    while (isOp('*') || isOp('/')) {
      const op = tokens[i++].v;
      const r = unary();
      if (op === '*') v *= r;
      else { if (r === 0) { if (known) throw new AsmError('expr.divZero'); v = 0; } else v = Math.trunc(v / r); }
    }
    return v;
  }
  function add() {
    let v = mul();
    while (isOp('+') || isOp('-')) { const op = tokens[i++].v; const r = mul(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function orExpr() {
    let v = add();
    while (isOp('&') || isOp('|') || isOp('^')) {
      const op = tokens[i++].v;
      const r = add();
      v = op === '&' ? v & r : op === '|' ? v | r : v ^ r;
    }
    return v;
  }

  const value = orExpr();
  if (i < tokens.length) throw new AsmError('expr.unexpectedChar', { ch: peek().v });
  return { value, known };
}

// ---- Zeilenanalyse -----------------------------------------------------------

// Entfernt den Kommentar, beachtet dabei Zeichenketten und Zeichenkonstanten
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '\\') i++;
      else if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ';') return line.slice(0, i);
  }
  return line;
}

// Teilt an Kommas außerhalb von Zeichenketten und Klammern
function splitArgs(s) {
  const out = [];
  let q = null, depth = 0, cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) {
      cur += ch;
      if (ch === '\\') { cur += s[++i] ?? ''; }
      else if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") { q = ch; cur += ch; }
    else if (ch === '(') { depth++; cur += ch; }
    else if (ch === ')') { depth--; cur += ch; }
    else if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseString(s) {
  const body = s.slice(1, -1);
  const bytes = [];
  for (let i = 0; i < body.length; i++) {
    let ch = body[i];
    if (ch === '\\') ch = unescapeChar(body[++i]);
    bytes.push(ch.charCodeAt(0) & 0xff);
  }
  return bytes;
}

function isStringArg(s) {
  return s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"';
}

// Klammert der erste Klammerausdruck den ganzen Text ein, z. B. "(a+b)" aber nicht "(a)+(b)"?
function fullyParenthesized(s) {
  if (s[0] !== '(' || s[s.length - 1] !== ')') return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') { depth--; if (depth === 0 && i < s.length - 1) return false; }
  }
  return depth === 0;
}

// Zerlegt den Operanden in Form und Ausdruck
function parseOperand(text) {
  const s = text.trim();
  if (s === '') return { form: 'none' };
  if (/^a$/i.test(s)) return { form: 'acc' };
  if (s[0] === '#') return { form: 'imm', expr: s.slice(1) };
  let m;
  if ((m = /^\((.*),\s*x\s*\)$/i.exec(s)) && fullyParenthesized(s)) return { form: 'izx', expr: m[1] };
  if ((m = /^\((.*)\)\s*,\s*y$/i.exec(s))) return { form: 'izy', expr: m[1] };
  if (fullyParenthesized(s)) return { form: 'ind', expr: s.slice(1, -1) };
  if ((m = /^(.*),\s*x$/i.exec(s))) return { form: 'x', expr: m[1] };
  if ((m = /^(.*),\s*y$/i.exec(s))) return { form: 'y', expr: m[1] };
  return { form: 'plain', expr: s };
}

// ---- Assembler -----------------------------------------------------------

/**
 * Übersetzt Quelltext.
 * @returns {{
 *   ok: boolean,
 *   errors: {line:number, key:string, params:object, message:string}[],
 *   segments: {addr:number, bytes:number[]}[],
 *   labels: Object<string,number>,
 *   lineMap: {line:number, addr:number, size:number}[],
 *   origin: number
 * }}
 */
export function assemble(source, options = {}) {
  const origin = options.origin ?? DEFAULT_ORIGIN;
  const lines = source.split(/\r\n|\r|\n/);
  const errors = [];
  const symbols = new Map(); // Marken und Konstanten
  const labelNames = new Set(); // nur Marken (Adressen)
  const modeChoice = new Map(); // Zeile -> in Pass 1 gewählte Adressierungsart (Größe bleibt gleich)

  let segments;
  let lineMap;

  for (let pass = 1; pass <= 2; pass++) {
    segments = [];
    lineMap = [];
    let pc = origin;
    let seg = null;

    const emit = (bytes) => {
      if (!seg || seg.addr + seg.bytes.length !== pc) {
        seg = { addr: pc, bytes: [] };
        segments.push(seg);
      }
      for (const b of bytes) seg.bytes.push(b & 0xff);
      pc += bytes.length;
      if (pc > 0x10000) throw new AsmError('asm.addrSpace');
    };
    const skip = (n) => { pc += n; seg = null; };

    const lookup = (name) => symbols.get(name);

    for (let ln = 0; ln < lines.length; ln++) {
      const lineNo = ln + 1;
      let text = stripComment(lines[ln]).trim();
      if (text === '') continue;
      try {
        // Marke am Zeilenanfang
        let m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/.exec(text);
        if (m) {
          const name = m[1];
          if (pass === 1) {
            if (symbols.has(name)) throw new AsmError('asm.labelDup', { name });
            if (MNEMONICS.has(name.toUpperCase())) throw new AsmError('asm.labelMnemonic', { name });
            symbols.set(name, pc);
            labelNames.add(name);
          } else if (symbols.get(name) !== pc) {
            throw new AsmError('asm.labelShift', { name });
          }
          text = m[2].trim();
          if (text === '') continue;
        }

        // Konstante: name = wert   |   define name wert
        if ((m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/.exec(text))) {
          defineConstant(m[1], m[2]);
          continue;
        }
        if ((m = /^\.?define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/i.exec(text))) {
          defineConstant(m[1], m[2]);
          continue;
        }
        // Ursprung
        if ((m = /^\*\s*=\s*(.+)$/.exec(text)) || (m = /^\.org\s+(.+)$/i.exec(text))) {
          const r = evaluate(m[1], lookup, pc);
          if (!r.known) throw new AsmError('asm.orgForward');
          if (r.value < 0 || r.value > 0xffff) throw new AsmError('asm.orgRange');
          pc = r.value;
          seg = null;
          continue;
        }

        const word = /^(\.?[A-Za-z_][A-Za-z0-9_]*)\s*(.*)$/.exec(text);
        if (!word) throw new AsmError('asm.lineUnknown', { text });
        const head = word[1].toUpperCase();
        const rest = word[2];

        if (['DCB', '.BYTE', '.DB', 'DB', '.DCB'].includes(head)) {
          const start = pc;
          const out = [];
          for (const arg of splitArgs(rest)) {
            if (arg === '') throw new AsmError('asm.emptyValue');
            if (isStringArg(arg)) out.push(...parseString(arg));
            else out.push(byteValue(arg, pc + out.length));
          }
          emit(out);
          lineMap.push({ line: lineNo, addr: start, size: out.length });
          continue;
        }
        if (['DCW', '.WORD', '.DW', 'DW', '.DCW'].includes(head)) {
          const start = pc;
          const out = [];
          for (const arg of splitArgs(rest)) {
            const r = evaluate(arg, lookup, pc + out.length);
            if (pass === 2 && !r.known) throw new AsmError('asm.unknownSymbol', { expr: arg });
            if (r.value < -0x8000 || r.value > 0xffff) throw new AsmError('asm.wordRange', { value: r.value });
            out.push(r.value & 0xff, (r.value >> 8) & 0xff);
          }
          emit(out);
          lineMap.push({ line: lineNo, addr: start, size: out.length });
          continue;
        }
        if (['.TEXT', '.ASCII', 'TEXT', '.ASCIIZ'].includes(head)) {
          const start = pc;
          const out = [];
          for (const arg of splitArgs(rest)) {
            if (!isStringArg(arg)) throw new AsmError('asm.stringExpected');
            out.push(...parseString(arg));
          }
          if (head === '.ASCIIZ') out.push(0);
          emit(out);
          lineMap.push({ line: lineNo, addr: start, size: out.length });
          continue;
        }
        if (['.RES', '.DS', '.FILL'].includes(head)) {
          const args = splitArgs(rest);
          const n = evaluate(args[0], lookup, pc);
          if (!n.known) throw new AsmError('asm.countForward');
          if (n.value < 0 || pc + n.value > 0x10000) throw new AsmError('asm.countInvalid');
          const start = pc;
          if (args.length > 1) emit(new Array(n.value).fill(byteValue(args[1], pc)));
          else skip(n.value);
          lineMap.push({ line: lineNo, addr: start, size: n.value });
          continue;
        }

        if (!MNEMONICS.has(head)) {
          throw new AsmError('asm.unknownCmd', { name: word[1] });
        }

        const start = pc;
        const bytes = encode(head, rest, pc, lineNo);
        emit(bytes);
        lineMap.push({ line: lineNo, addr: start, size: bytes.length });
      } catch (e) {
        if (!(e instanceof AsmError)) throw e;
        if (pass === 1 || !errors.some((x) => x.line === lineNo)) {
          // Fehler aus Pass 1 gelten weiter; Pass 2 meldet nur neue Zeilen
          if (!errors.some((x) => x.line === lineNo)) errors.push({ line: lineNo, key: e.key, params: e.params, message: t(e.key, e.params) });
        }
      }
    }

    function defineConstant(name, exprText) {
      const r = evaluate(exprText, lookup, pc);
      if (pass === 1) {
        if (symbols.has(name)) throw new AsmError('asm.constDup', { name });
        if (!r.known) throw new AsmError('asm.constForward', { name });
        symbols.set(name, r.value);
      }
    }

    function byteValue(exprText, at) {
      const r = evaluate(exprText, lookup, at);
      if (pass === 2 && !r.known) throw new AsmError('asm.unknownSymbol', { expr: exprText });
      if (r.value < -128 || r.value > 255) throw new AsmError('asm.byteRange', { value: r.value });
      return r.value & 0xff;
    }

    function encode(mn, operandText, at, lineNo) {
      const modes = BY_MNEMONIC[mn];
      const op = parseOperand(operandText);
      const need = (mode) => {
        if (!(mode in modes)) {
          throw new AsmError('asm.modeUnsupported', { mn, mode: { t: 'mode.' + mode } });
        }
        return modes[mode];
      };
      const val = (size) => {
        const r = evaluate(op.expr, lookup, at);
        if (pass === 2 && !r.known) throw new AsmError("asm.unknownSymbol", { expr: op.expr });
        return r;
      };
      const fits = (r, lim) => r.known && r.value >= 0 && r.value < lim;

      // Nullseite oder absolut wählen; in Pass 2 bleibt die Wahl aus Pass 1 bestehen
      const pick = (zpMode, absMode, r) => {
        let mode;
        if (pass === 1) {
          mode = zpMode in modes && fits(r, 256) ? zpMode : absMode;
          modeChoice.set(lineNo, mode);
        } else {
          mode = modeChoice.get(lineNo) ?? absMode;
        }
        if (!(mode in modes)) {
          if (absMode in modes) mode = absMode;
          else if (zpMode in modes) mode = zpMode;
          else throw new AsmError('asm.modeUnknown', { mn });
        }
        return mode;
      };
      const operandBytes = (mode, r) => {
        if (mode === 'imm' || mode === 'zp' || mode === 'zpx' || mode === 'zpy' || mode === 'izx' || mode === 'izy') {
          if (pass === 2 && (r.value < (mode === 'imm' ? -128 : 0) || r.value > 255)) {
            throw new AsmError('asm.byteRange', { value: r.value });
          }
          return [r.value & 0xff];
        }
        if (r.value < 0 || r.value > 0xffff) {
          if (pass === 2) throw new AsmError('asm.addrRange', { value: r.value });
        }
        return [r.value & 0xff, (r.value >> 8) & 0xff];
      };

      switch (op.form) {
        case 'none':
          if ('imp' in modes) return [modes.imp];
          if ('acc' in modes) return [modes.acc];
          throw new AsmError('asm.needOperand', { mn });
        case 'acc':
          if ('acc' in modes) return [modes.acc];
          // „A“ kann auch eine Konstante sein
          return encodeValueForm({ ...op, form: 'plain', expr: 'A' });
        default:
          return encodeValueForm(op);
      }

      function encodeValueForm(o) {
        const r = (() => {
          const rr = evaluate(o.expr, lookup, at);
          if (pass === 2 && !rr.known) throw new AsmError('asm.unknownSymbol', { expr: o.expr });
          return rr;
        })();
        switch (o.form) {
          case 'imm': return [need('imm'), ...operandBytes('imm', r)];
          case 'izx': return [need('izx'), ...operandBytes('izx', r)];
          case 'izy': return [need('izy'), ...operandBytes('izy', r)];
          case 'ind': return [need('ind'), ...operandBytes('ind', r)];
          case 'x': { const mode = pick('zpx', 'abx', r); return [modes[mode], ...operandBytes(mode, r)]; }
          case 'y': { const mode = pick('zpy', 'aby', r); return [modes[mode], ...operandBytes(mode, r)]; }
          case 'plain': {
            if (BRANCHES.has(mn)) {
              const rel = r.value - (at + 2);
              if (pass === 2 && (rel < -128 || rel > 127)) {
                throw new AsmError('asm.branchFar', { rel });
              }
              return [modes.rel, rel & 0xff];
            }
            const mode = pick('zp', 'abs', r);
            return [modes[mode], ...operandBytes(mode, r)];
          }
        }
        throw new AsmError('asm.operandUnclear');
      }
    }
  }

  const labels = {};
  for (const name of labelNames) labels[name] = symbols.get(name);

  errors.sort((a, b) => a.line - b.line);
  return { ok: errors.length === 0, errors, segments, labels, lineMap, origin };
}

// Schreibt das Ergebnis in einen Speicher und liefert die Startadresse
export function loadInto(memory, result) {
  for (const s of result.segments) memory.load(s.addr, s.bytes);
  // Start wie in den Vorlagen bei $0600, sofern dort Programm liegt; sonst am ersten übersetzten Byte.
  // (Beispiele, die zuerst Daten an andere Adressen legen, etwa das Skifahrer-Beispiel, beginnen weiter bei $0600.)
  const atOrigin = result.segments.some((seg) => seg.addr <= result.origin && result.origin < seg.addr + seg.bytes.length);
  if (atOrigin) return result.origin;
  return result.segments.length ? result.segments[0].addr : result.origin;
}
