# TODO – Easy 6502 Reloaded

Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt. Jeder Abschnitt ist ein Meilenstein.

## M0 – Grundlagen
- [x] Quellen beider Repositories gesichtet, Lizenzen geprüft
- [x] Projekt angelegt, Git eingerichtet, Originale unter `upstream/`
- [x] Entscheidung: Oberflächenvariante B2 (Lehrbuch links und Referenz rechts jeweils an den Rand einklappbar; Mitte: Editor, darunter Ablauf und Bildschirm, darunter Monitor)
- [x] Entscheidung: GPL v3 für den Code, CC BY 4.0 für übernommene Lehrtexte
- [~] Vorläufig: Emulator im Hauptfaden, Ansichten entkoppelt (eigene Aktualisierungstakte); Web Worker bleibt Option, falls die Leistung nicht reicht
- [x] Entscheidung: Lokalisierung von Anfang an vorsehen; Ausgangssprache Englisch, Deutsch zusätzlich (siehe Abschnitt Lokalisierung)
- [~] Ordnerstruktur: `src/{core,i18n}` und `tests/` angelegt; `index.html`, `src/{ui,tutorial,reference}`, `content/` folgen
- [ ] Gestaltungsgrundlagen (Farben, Schrift, helles/dunkles Thema)

## M1 – Kern (ohne Oberfläche, mit Prüfläufen)
- [x] CPU: alle 151 offiziellen Opcodes, Adressierungsarten, Flags, Taktzyklen, Dezimalmodus
- [x] Speicher 64 KiB mit Lese-/Schreibhaken (für Anzeige, Monitor, Ein-/Ausgabe)
- [x] Assembler: Marken, Direktiven (`*=`, `.org`, `dcb`, `.byte`, `dcw`, `.word`, `.text`, `.res`, `define`, `name = wert`), Ausdrücke, Fehler mit Zeilennummer und Übersetzungsschlüssel
- [x] Zuordnung Quellzeile ↔ Adresse (`lineMap`)
- [x] Disassembler (einzelne Adresse, Bereich, rückwärts mit Heuristik und bekannten Anfängen)
- [x] Ablaufsteuerung (`Machine`): Lauf mit Befehlsbudget, Einzelschritt, Schritt über, Schritt hinaus, Halt bei Haltepunkt/BRK, Ablaufprotokoll
- [ ] Geschwindigkeitsregelung (Takt/Zeitgeber) gehört zur Oberfläche (M2)
- [x] Prüfläufe: 17 Tests (`npm test`), Funktionstest von Klaus Dormann (GPL v3) besteht; die Binärdatei liegt nicht im Projekt, Pfad über `DORMANN_BIN`
- [ ] Dormann-Datei und Anleitung für die Prüfung in CI aufnehmen (optional)
- [ ] Inoffizielle Opcodes: vorerst ausgeschlossen

## Lokalisierung (querschnittlich)
- [x] Modul `src/i18n` mit Katalogen (`en.js` Ausgangssprache, `de.js`), Platzhalter und Schachtelung
- [x] Fehlermeldungen des Assemblers als Schlüssel mit Parametern; Namen der Adressierungsarten im Katalog
- [ ] Alle Texte der Oberfläche über Schlüssel; keine fest eingebauten Zeichenketten in `src/ui`
- [ ] Sprachwahl in der Oberfläche, Erkennung über `navigator.language`, Speicherung im Browser
- [ ] Lehrbuch und Referenz je Sprache als eigene Inhaltsdateien (`content/<sprache>/`), Rückfall auf Englisch
- [ ] Prüfung auf fehlende Schlüssel (Test: jeder Schlüssel in `en` existiert in `de`)
- [ ] Datums-, Zahlen- und Hexformate unabhängig von der Sprache halten

## M2 – Oberfläche: Rahmen
- [x] Aufteilung Lehrbuch · Arbeitsfläche · Referenz, Seitenleisten ein-/ausklappbar und in der Breite ziehbar (auch per Pfeiltasten); Mitte: Quelltext, Ablauf + Bildschirm/Register, Monitor (Entwurf B2)
- [ ] Anordnung wählbar (Bereiche tauschen, Referenz unten oder seitlich) – zurückgestellt
- [x] Bildschirm 32×32 mit 16 Farben; Tasten über `$FF` (W A S D, Pfeiltasten), Zufallszahl über `$FE`
- [~] Tastaturbedienung und Barrierefreiheit: Trennlinien und Monitor per Tastatur bedienbar, Beschriftungen übersetzt; Prüfung auf Kontrast und Screenreader steht aus
- [x] Laufzeit-Zeitgeber der Maschine getrennt vom Zeichnen der Ansichten; Geschwindigkeit 1/s bis maximal
- [x] Hell/Dunkel/Automatisch, Sprachwahl (Englisch/Deutsch)
- [ ] Ansicht für schmale Bildschirme prüfen (Seitenleisten als Schubladen sind angelegt)
- [x] Zustand (Anordnung, Darstellung, Sprache, Geschwindigkeit, Quelltext) im Browserspeicher, mit Rückfall ohne Speicher

## M3 – Quelltexteditor
- [ ] Zeilennummern
- [ ] Syntaxhervorhebung (eigene Umsetzung, ohne Bibliothek)
- [ ] Fehlermarkierung nach dem Assemblieren
- [ ] Haltepunkte im Zeilenrand
- [ ] Speichern/Laden als Datei (Herunterladen, Dateiauswahl, Ziehen und Ablegen)
- [ ] Mehrere Schnellspeicherplätze im Browserspeicher (benannt, mit Zeitstempel)
- [ ] Rückgängig/Wiederholen, Einrücken, Tabulator

## M4 – Ablaufansicht und Disassemblierung
- [x] Ablaufansicht: aktive Instruktion hervorgehoben, 10 Instruktionen davor und danach, Marken eingeblendet
- [x] Entkoppelt von der Emulatorschleife (Zeichnen über requestAnimationFrame)
- [~] Haltepunkte per Klick auf die Zeile (fertig); per Auswahl einer Marke steht aus
- [ ] „Springe zu“: Adresse, Marke aus Liste oder Verschieben der hervorgehobenen Zeile (naher Sprung)
- [ ] Disassemblierfenster (frei wählbarer Bereich) bleibt zusätzlich bestehen
- [~] Register- und Flaganzeige fertig; Stapelanzeige und Änderung per Eingabe stehen aus

## M5 – Monitor
- [x] Immer aktiv, unabhängig von der Hauptschleife
- [x] 16 Zeilen × 16 Bytes, Blättern (Rad, Tasten, Knöpfe), Springen zu Adresse oder Marke
- [ ] Bytefolge suchen (hexadezimal und Text)
- [ ] Überschreiben von Hexwerten direkt im Feld
- [x] Geänderte Bytes kurz hervorheben

## M6 – Lehrbuch
- [ ] Inhaltsformat festlegen (Markdown unter `content/`, einfacher eigener Umsetzer)
- [ ] Einklappbarer Bereich mit Kapitelmarken, Lesefortschritt, Suche
- [ ] Beispiele mit „An Emulator senden“ (Quelltext in den Editor übernehmen)
- [ ] Optional: „Ausführen“ direkt am Beispiel
- [ ] **Neuer Lehrplan** mit gleichmäßiger Lernkurve (Entwurf unten), Übungsaufgaben je Kapitel
- [ ] Text aus Easy 6502 überarbeiten (CC BY 4.0, Namensnennung); die Schlange in Teilschritten statt als einen Block
- [ ] Indexiert-indirekt und indirekt-indiziert in getrennten Kapiteln
- [ ] Klären, ob die beiden PDF-Übungsblätter im Projektordner („Präsenz 1/2“) als Aufgabenquelle dienen sollen

### Lehrplan – Entwurf
1. Was ist ein Prozessor? Register, Speicher, Bildschirm
2. Erstes Programm: `LDA`, `STA`, Bildschirm
3. Zahlen: hexadezimal, Bits, Flags
4. Rechnen: `ADC`, `SBC`, Übertrag
5. Vergleichen und Verzweigen: `CMP`, `BNE`, Marken
6. Schleifen mit `X` und `Y`
7. Adressierung I: unmittelbar, absolut, Nullseite
8. Adressierung II: indiziert (`,X` / `,Y`)
9. Stapel, `JSR` / `RTS`
10. Adressierung III: indirekt (`JMP`)
11. Zeiger, Teil 1: indirekt-indiziert `($zp),Y` (häufig, zuerst)
12. Zeiger, Teil 2: indiziert-indirekt `($zp,X)` (selten, später)
13. Eingabe: Tastatur, Zufallszahl
14. Kleine Spiele in Etappen (Punkt bewegen → Wand → Schlange wächst …)
15. Schlange: das ganze Spiel, aus bekannten Teilen zusammengesetzt

## M7 – Referenz
- [ ] Übersicht der Adressierungsarten, Befehle (mit Flags), Opcode-Tabelle 16×16
- [ ] Sprungmarken aus Lehrbuch, Befehlsanzeige und Disassemblierung in die Referenz
- [ ] Ein-/ausklappbar, frei platzierbar
- [ ] Opcode-Quelle prüfen und angeben

## M8 – Beispielprogramme
- [ ] Katalog mit Beschreibung, Schwierigkeit und Schlagworten
- [~] 18 Beispiele aus 6502js liegen unter `examples/` und lassen sich alle übersetzen; Urheberlage klären
- [ ] Laden in den Editor, Warnung bei ungesicherten Änderungen
- [ ] Weitere Vorführungen (Tech-Demos) ergänzen

## M9 – Veröffentlichung
- [ ] Prüfung der Fremdinhalte, Lizenzhinweise in der Oberfläche
- [ ] Ansicht für Mobilgeräte
- [ ] Leistungsprüfung (langer Lauf, volle Geschwindigkeit)
- [ ] GitHub-Repository anlegen, GitHub Pages einrichten (**erst nach Rückfrage**)
- [ ] Automatische Prüfläufe (GitHub Actions, optional)

## Offene Fragen
- Gewünschter Name des Repositorys?
- Weitere Sprachen nach Deutsch?
