# Easy 6502 Reloaded

**English** · [Deutsch](#easy-6502-reloaded-deutsch)

A learning and development environment for 6502 assembly in the browser: tutorial, source code editor, emulator, debugger, monitor and reference. Bilingual (English/German).

Derived from [Easy 6502](https://skilldrick.github.io/easy6502/) (Nick Morgan) and the [6502 Assembler and Simulator](https://itema-as.github.io/6502js/) (Stian Soreng, Nick Morgan, Torkild Ulvøy Resheim).

Status: version 0.1, working. Progress is tracked in [TODO.md](TODO.md) (in German).

## Features

- **Tutorial** in 19 chapters with an even learning curve (from “What is a processor?” to pointers and a small game), tasks with fold-away solutions, two exercise chapters and a “Send to emulator” button on every example
- **Source editor** with line numbers, syntax highlighting, error display, breakpoints in the margin, files, quick slots and an example library
- **Emulator** (all 151 official instructions, decimal mode, cycle counts) with an execution view (10 instructions before and after), disassembly, editable registers, stack, a 16-line monitor with search and overwrite, breakpoints that follow labels, and “set PC”
- **Reference** with an overview, addressing modes, all instructions, an opcode table, and links from the tutorial, the execution view and the editor (`F1`)
- Runs entirely in the browser; no accounts, no tracking, **no third-party libraries**

## Run it locally

On Windows, double-click `start.cmd` (it opens the browser). Otherwise:

    node tools/serve.mjs

and open <http://127.0.0.1:8080/>. Double-clicking `index.html` alone is not enough, because browsers block modules loaded from `file://`. You only need Node.js (version 20 or later), no packages.

## Tests

    npm test

The tests cover the processor core, assembler, disassembler, Markdown renderer, reference data and **every code example in the tutorial** (they are assembled and run, and the stated results are checked). Klaus Dormann's functional test runs in addition when `DORMANN_BIN` points to `6502_functional_test.bin`; on GitHub this happens automatically in the workflow.

## Publishing (GitHub Pages)

The file `.github/workflows/pages.yml` checks every push and pull request and, after a push to `main`, deploys the site. Once, in the repository under *Settings → Pages*, choose **GitHub Actions** as the source. `node tools/build-site.mjs` assembles the site into `_site/` (only `index.html`, `src`, `content`, `examples`, licence and notices). All paths are relative, so the site also works under `https://<name>.github.io/<repository>/`.

## Layout

| Folder | Contents |
|---|---|
| `src/core` | CPU, memory, assembler, disassembler, run control |
| `src/ui` | user interface (editor, views, tutorial, reference) |
| `src/i18n` | translations of the interface |
| `src/reference` | language-neutral reference data |
| `content/<language>` | tutorial (Markdown), reference texts, “About” |
| `examples` | example programs and `index.json` |
| `tests`, `tools` | tests, development server, site build |
| `upstream` | unmodified originals of the two models, for reference (not part of the site) |

Adding a language: create `src/i18n/<code>.js`, register it in `src/i18n/index.js` and fill `content/<code>/` with the same files. The tests check that all keys and examples are complete.

## Licence

Program code: GNU General Public License v3 (see [LICENSE](LICENSE)). Texts: CC BY 4.0. Details and credits in [NOTICE.md](NOTICE.md) (in German).

---

# Easy 6502 Reloaded (Deutsch)

[English](#easy-6502-reloaded) · **Deutsch**

Eine Lern- und Entwicklungsumgebung für die 6502-Assemblersprache im Browser – mit Lehrbuch, Quelltexteditor, Emulator, Debugger, Monitor und Referenz. Zweisprachig (Deutsch/Englisch).

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
