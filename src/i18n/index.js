// Minimale Lokalisierung ohne Bibliothek.
// Texte stehen in Katalogen (src/i18n/<sprache>.js) unter Schlüsseln wie „asm.labelDup“.
// Platzhalter: {name}. Ein Parameter der Form { t: 'schlüssel' } wird selbst übersetzt.
// Fehlt ein Schlüssel in der gewählten Sprache, gilt der englische Text, sonst der Schlüssel selbst.

import { en } from './en.js';
import { de } from './de.js';

const catalogs = { en, de };
let locale = 'en';

export const DEFAULT_LOCALE = 'en';

export function availableLocales() {
  return Object.keys(catalogs);
}

export function registerLocale(code, catalog) {
  catalogs[code] = catalog;
}

export function setLocale(code) {
  if (!(code in catalogs)) throw new Error(`Unknown locale: ${code}`);
  locale = code;
}

export function getLocale() {
  return locale;
}

export function t(key, params = {}, loc = locale) {
  const text = catalogs[loc]?.[key] ?? catalogs[DEFAULT_LOCALE][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => {
    const v = params[name];
    if (v === undefined) return `{${name}}`;
    if (v !== null && typeof v === 'object' && 't' in v) return t(v.t, v.params ?? {}, loc);
    return String(v);
  });
}
