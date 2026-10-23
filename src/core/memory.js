// 64 KiB Hauptspeicher mit Haken für Ein-/Ausgabe, Anzeige und Überwachung.

export class Memory {
  constructor() {
    this.data = new Uint8Array(0x10000);
    // onRead(addr) darf einen Wert liefern (undefined = Speicherinhalt verwenden)
    this.onRead = null;
    // onWrite(addr, value) wird nach jedem Schreibzugriff der CPU aufgerufen
    this.onWrite = null;
  }

  read(addr) {
    if (this.onRead !== null) {
      const v = this.onRead(addr);
      if (v !== undefined) return v & 0xff;
    }
    return this.data[addr];
  }

  write(addr, value) {
    this.data[addr] = value;
    if (this.onWrite !== null) this.onWrite(addr, value & 0xff);
  }

  // Zugriff ohne Haken (Monitor, Disassemblierung, Laden)
  peek(addr) {
    return this.data[addr & 0xffff];
  }

  poke(addr, value) {
    addr &= 0xffff;
    value &= 0xff;
    this.data[addr] = value;
    if (this.onWrite !== null) this.onWrite(addr, value);
  }

  load(addr, bytes) {
    for (let i = 0; i < bytes.length; i++) this.poke(addr + i, bytes[i]);
  }

  clear() {
    for (let i = 0; i < 0x10000; i++) if (this.data[i] !== 0) this.poke(i, 0);
  }

  // Sucht eine Bytefolge ab `from`; null im Muster passt auf jedes Byte. Mit `wrap` geht die Suche am Ende von vorn weiter.
  // Liefert die Adresse oder -1.
  find(pattern, from = 0, wrap = false) {
    const n = pattern.length;
    if (n === 0) return -1;
    const last = 0x10000 - n;
    const at = (a) => {
      for (let i = 0; i < n; i++) if (pattern[i] !== null && this.data[a + i] !== pattern[i]) return false;
      return true;
    };
    for (let a = Math.max(0, from); a <= last; a++) if (at(a)) return a;
    if (wrap) for (let a = 0; a < Math.min(from, last + 1); a++) if (at(a)) return a;
    return -1;
  }
}
