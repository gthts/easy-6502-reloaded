// Überträgt Übersetzungen auf Elemente mit data-i18n*-Attributen.
import { t } from '../i18n/index.js';

const ATTRS = [
  ['data-i18n-title', 'title'],
  ['data-i18n-label', 'aria-label'],
  ['data-i18n-placeholder', 'placeholder'],
];

export function applyTranslations(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const [attr, target] of ATTRS) {
    for (const el of root.querySelectorAll(`[${attr}]`)) el.setAttribute(target, t(el.getAttribute(attr)));
  }
  document.title = t('app.title');
}
