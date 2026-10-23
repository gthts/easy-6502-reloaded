# Easy 6502 Reloaded

Eine Lern- und Entwicklungsumgebung für die 6502-Assemblersprache im Browser – mit Lehrbuch, Quelltexteditor, Emulator, Debugger, Monitor und Referenz. Zweisprachig (Deutsch/Englisch).
*A learning and development environment for 6502 assembly in the browser – tutorial, source editor, emulator, debugger, monitor and reference. Bilingual (German/English).*

Abgeleitet von [Easy 6502](https://skilldrick.github.io/easy6502/) (Nick Morgan) und dem [6502 Assembler und Simulator](https://itema-as.github.io/6502js/) (Stian Soreng, Nick Morgan, Torkild Ulvøy Resheim).

Status: Version 0.1, lauffähig. Den Fortschritt verfolgt [TODO.md](TODO.md).

## Was es kann

- **Lehrbuch** in 19 Kapiteln mit gleichmäßiger Lernkurve (von „Was ist ein Prozessor?“ bis zu Zeigern und einem kleinen Spiel), Aufgaben mit aufklappbaren Lösungen, zwei Übungskapiteln und „An Emulator senden“ bei jedem Beispiel
- **Quelltexteditor** mit Zeilennummern, Syntaxhervorhebung, Fehleranzeige, Haltepunkten im Zeilenrand, Dateien, Schnellspeicherplätzen und Beispielbibliothek
- **Emulator** (alle 151 offiziellen Befehle, Dezimalmodus, Takte) mit Ablaufansicht (10 Instruktionen davor und danach), Disassemblierung, Registern (editierbar), Stapel, 16-Zeilen-Monitor mit Suche und Überschreiben, Haltepunkten an Marken, „PC setzen“
- **Referenz** mit Übersicht, Adressierungsarten, allen Befehlen, Opcode-Tabelle und Verweisen aus Lehrbuch, Ablauf und Editor (`F1`)
- Läuft vollständig im Browser; keine Konten, keine Nachverfolgung, **keine Fremdbibliotheken**

## Starten

Unter Windows genügt ein Doppelklick auf `start.cmd` (öffnet den Browser). Andernfalls:

    node tools/serve.mjs

und <http://127.0.0.1:8080/> öffnen. Die Datei `index.html` allein per Doppelklick zu öffnen genügt nicht, weil Browser Module von `file://` blockieren. Benötigt wird nur Node.js (ab Version 20), keine Pakete.

## Prüfen

    npm test

Die Tests decken den Prozessorkern, Assembler, Disassembler, Markdown-Umsetzer, Referenzdaten und **alle Codebeispiele des Lehrbuchs** ab (sie werden übersetzt und ausgeführt, die angegebenen Ergebnisse geprüft). Der Funktionstest von Klaus Dormann läuft zusätzlich, wenn `DORMANN_BIN` auf `6502_functional_test.bin` zeigt; in der Automatisierung auf GitHub geschieht das von selbst.

## Veröffentlichen (GitHub Pages)

Die Datei `.github/workflows/pages.yml` prüft jeden Push und jede Änderungsanfrage und stellt nach einem Push auf `main` die Seite bereit. Einmalig im Repository unter *Settings → Pages* als Quelle **GitHub Actions** wählen. Die ausgelieferte Seite baut `node tools/build-site.mjs` nach `_site/` (nur `index.html`, `src`, `content`, `examples`, Lizenz und Hinweise). Alle Pfade sind relativ, die Seite läuft daher auch unter `https://<name>.github.io/<repository>/`.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `src/core` | CPU, Speicher, Assembler, Disassembler, Ablaufsteuerung |
| `src/ui` | Oberfläche (Editor, Ansichten, Lehrbuch, Referenz) |
| `src/i18n` | Übersetzungen der Oberfläche |
| `src/reference` | sprachneutrale Daten der Referenz |
| `content/<sprache>` | Lehrbuch (Markdown), Referenztexte, „Über“ |
| `examples` | Beispielprogramme und `index.json` |
| `tests`, `tools` | Tests, Entwicklungsserver, Seitenaufbau |
| `upstream` | unveränderte Originale der beiden Vorlagen zur Einsicht (nicht Teil der Seite) |

Neue Sprache: `src/i18n/<code>.js` anlegen, in `src/i18n/index.js` eintragen und `content/<code>/` mit denselben Dateien füllen. Die Tests prüfen, dass alle Schlüssel und Beispiele vollständig sind.

## Lizenz

Programmcode: GNU General Public License v3 (siehe [LICENSE](LICENSE)). Lehrtexte: CC BY 4.0. Einzelheiten und Herkunftsnachweise in [NOTICE.md](NOTICE.md).
