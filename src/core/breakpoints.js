// Haltepunkte, die Änderungen am Quelltext überstehen.
// Statt einer festen Adresse merkt man sich „Marke + Abstand“ der nächstgelegenen Marke davor.
// Nach jedem Übersetzen werden die Adressen aus den neuen Marken berechnet. Gibt es die Marke
// nicht mehr (oder trifft der Abstand keinen Befehlsanfang), entfällt der Haltepunkt.
// Ohne Marke vor der Adresse bleibt es bei der festen Adresse.

/** @returns {{label:string, offset:number} | {addr:number}} */
export function anchorFor(addr, labels) {
  let best = null;
  for (const [name, a] of Object.entries(labels)) {
    if (a <= addr && (best === null || a > best.addr || (a === best.addr && name < best.name))) best = { name, addr: a };
  }
  return best ? { label: best.name, offset: addr - best.addr } : { addr };
}

/**
 * @param {Set<number>} [valid]  zulässige Adressen (Anfänge von Befehlen/Daten aus der Quelltextzuordnung)
 * @returns {number|null}
 */
export function resolveAnchor(anchor, labels, valid = null) {
  let addr;
  if ('label' in anchor) {
    if (!(anchor.label in labels)) return null;
    addr = labels[anchor.label] + anchor.offset;
  } else addr = anchor.addr;
  if (addr < 0 || addr > 0xffff) return null;
  if (valid && !valid.has(addr)) return null;
  return addr;
}
