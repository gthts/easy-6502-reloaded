// Eingaben der Bedienelemente: Adressen/Marken und Suchmuster.

// „$0200“, „0x200“, „0200“ oder ein Markenname (Marken haben Vorrang vor reinen Hexziffern).
// Ergebnis: Adresse oder null.
export function parseAddress(text, labels = {}) {
  const s = text.trim();
  if (s === '') return null;
  if (Object.prototype.hasOwnProperty.call(labels, s)) return labels[s];
  const m = /^(?:\$|0x)?([0-9a-fA-F]{1,4})$/.exec(s);
  return m ? parseInt(m[1], 16) : null;
}

// Suchmuster: Hexbytes („A9 00“, „a900“, „$a9 $00“), „??“ für ein beliebiges Byte, oder Text in Anführungszeichen.
// Ergebnis: Liste aus Zahlen und null (= beliebig), oder null bei Fehler.
export function parseSearch(text) {
  const s = text.trim();
  if (s === '') return null;
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    const out = [];
    const body = s.slice(1, -1);
    for (let i = 0; i < body.length; i++) {
      let ch = body[i];
      if (ch === '\\' && i + 1 < body.length) ch = { n: '\n', t: '\t', 0: '\0' }[body[++i]] ?? body[i];
      const c = ch.charCodeAt(0);
      if (c > 0xff) return null;
      out.push(c);
    }
    return out.length ? out : null;
  }
  const out = [];
  for (const tok of s.split(/[\s,]+/)) {
    const t = tok.replace(/^\$/, '');
    if (t === '??') out.push(null);
    else if (/^[0-9a-fA-F]{2}$/.test(t)) out.push(parseInt(t, 16));
    else if (/^(?:[0-9a-fA-F]{2}|\?\?)+$/.test(t)) {
      // zusammengeschrieben: „a900“
      for (let i = 0; i < t.length; i += 2) out.push(t.slice(i, i + 2) === '??' ? null : parseInt(t.slice(i, i + 2), 16));
    } else return null;
  }
  return out.length ? out : null;
}
