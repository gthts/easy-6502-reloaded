# Easy 6502 Reloaded

Eine Lern- und Entwicklungsumgebung für die 6502-Assemblersprache im Browser.
Abgeleitet von [Easy 6502](https://skilldrick.github.io/easy6502/) (Nick Morgan)
und dem [6502 Assembler und Simulator](https://itema-as.github.io/6502js/)
(Stian Soreng, Nick Morgan, Torkild Ulvøy Resheim).

Status: Kern, Oberfläche, Editor, Lehrbuch und Referenz (M1 bis M7) lauffähig; Beispielkatalog und Veröffentlichung folgen. Den Fortschritt verfolgt [TODO.md](TODO.md).

## Ziele

- Ein zentraler Emulator statt vieler Einzelinstanzen
- Ablaufansicht, Disassemblierung, Monitor und Haltepunkte, unabhängig voneinander und von der Emulatorschleife entkoppelt
- Ein einklappbares Lehrbuch mit Kapitelmarken und Beispielen, die sich per Knopfdruck in den Editor übernehmen lassen
- Eine Referenz (Adressierungsarten, Befehle, Opcodes) mit Sprungmarken
- Viele Beispielprogramme
- Keine Fremdbibliotheken, keine Bauwerkzeuge: reines HTML, CSS und JavaScript, lauffähig auf GitHub Pages

## Lizenz

GNU General Public License v3 (siehe [LICENSE](LICENSE)); Lehrtexte nach CC BY 4.0.
Einzelheiten und Herkunftsnachweise in [NOTICE.md](NOTICE.md).

## Starten

Unter Windows genügt ein Doppelklick auf `start.cmd` (öffnet den Browser). Andernfalls:

    node tools/serve.mjs

und <http://127.0.0.1:8080/> öffnen. Die Datei `index.html` allein per Doppelklick zu öffnen genügt nicht, weil Browser Module von `file://` blockieren. Die Seite braucht einen Webserver (Module), aber keine Pakete und keinen Bauvorgang; auf GitHub Pages läuft sie unverändert.

## Prüfen

    npm test

Benötigt nur Node.js (ab Version 20), keine Pakete. Der Funktionstest von Klaus Dormann läuft zusätzlich, wenn `DORMANN_BIN` auf `6502_functional_test.bin` zeigt.
