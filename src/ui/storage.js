// Browserspeicher mit Rückfall: nichts hängt davon ab, dass er verfügbar ist.
const PREFIX = 'e6502.';

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* Speicher gesperrt oder voll: Einstellung gilt nur für diese Sitzung */
    }
  },
};
