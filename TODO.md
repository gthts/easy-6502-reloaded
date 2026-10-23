# TODO – Easy 6502 Reloaded

Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt. Jeder Abschnitt ist ein Meilenstein.

## M0 – Grundlagen
- [x] Quellen beider Repositories gesichtet, Lizenzen geprüft
- [x] Projekt angelegt, Git eingerichtet, Originale unter `upstream/`
- [ ] **Entscheidung:** Oberflächenvariante (A/B/C, siehe Visualisierungen)
- [ ] **Entscheidung:** Lizenz GPL v3 bestätigen
- [ ] **Entscheidung:** Emulator im Hauptfaden mit entkoppelter Anzeige oder in einem Web Worker (Worker: auf GitHub Pages kein gemeinsamer Speicher ohne Sonderkopfzeilen, daher Nachrichtenaustausch)
- [ ] **Entscheidung:** Sprache der Oberfläche (nur Deutsch oder zweisprachig)
- [ ] Ordnerstruktur: `index.html`, `src/{core,ui,tutorial,reference}`, `content/`, `examples/`
- [ ] Gestaltungsgrundlagen (Farben, Schrift, helles/dunkles Thema)

## M1 – Kern (ohne Oberfläche, mit Prüfläufen)
- [ ] CPU: alle 151 offiziellen Opcodes, Adressierungsarten, Flags, Taktzyklen
- [ ] Speicher 64 KiB mit Lese-/Schreibhaken (für Anzeige, Monitor, Haltepunkte)
- [ ] Assembler: Marken, Direktiven (`.org`, `.byte`, `.word`, `.text`, `define`), Ausdrücke (`<`, `>`, `+`, `-`), Fehler mit Zeilennummer
- [ ] Zuordnung Quellzeile ↔ Adresse (für Haltepunkte und Hervorhebung)
- [ ] Disassembler (einzelne Adresse, Bereich, rückwärts mit Heuristik)
- [ ] Ablaufsteuerung: Lauf, Einzelschritt, Schritt über Unterprogramm, Schritt hinaus, Geschwindigkeit, Halt bei Haltepunkt/BRK
- [ ] Prüfläufe: Funktionstest von Klaus Dormann (Lizenz prüfen), eigene Einzeltests
- [ ] Inoffizielle Opcodes: vorerst ausgeschlossen

## M2 – Oberfläche: Rahmen
- [ ] Aufteilung Lehrbuch · Arbeitsfläche · Referenz, jeweils ein-/ausklappbar und in der Größe veränderbar
- [ ] Anordnung wählbar (Bereiche tauschen, Referenz unten oder seitlich)
- [ ] Bildschirm 32×32 mit 16 Farben wie in beiden Vorlagen; Pfeiltasten über `$FF`
- [ ] Tastaturbedienung und Barrierefreiheit (Fokus, ARIA, Kontrast)
- [ ] Zustand (Anordnung, Thema) im Browserspeicher

## M3 – Quelltexteditor
- [ ] Zeilennummern
- [ ] Syntaxhervorhebung (eigene Umsetzung, ohne Bibliothek)
- [ ] Fehlermarkierung nach dem Assemblieren
- [ ] Haltepunkte im Zeilenrand
- [ ] Speichern/Laden als Datei (Herunterladen, Dateiauswahl, Ziehen und Ablegen)
- [ ] Mehrere Schnellspeicherplätze im Browserspeicher (benannt, mit Zeitstempel)
- [ ] Rückgängig/Wiederholen, Einrücken, Tabulator

## M4 – Ablaufansicht und Disassemblierung
- [ ] Ablaufansicht: aktive Instruktion hervorgehoben, ca. 10 Instruktionen davor und danach, Marken des Quelltextes eingeblendet
- [ ] Entkoppelt von der Emulatorschleife (eigener Aktualisierungstakt)
- [ ] Haltepunkte per Klick oder per Auswahl einer Marke
- [ ] „Springe zu“: Adresse, Marke aus Liste oder Verschieben der hervorgehobenen Zeile (naher Sprung)
- [ ] Disassemblierfenster (frei wählbarer Bereich) bleibt zusätzlich bestehen
- [ ] Register-, Flag- und Stapelanzeige; Register per Eingabe änderbar

## M5 – Monitor
- [ ] Immer aktiv, unabhängig von der Hauptschleife
- [ ] 16 Zeilen × 16 Bytes, Blättern, Springen zu Adresse oder Marke
- [ ] Bytefolge suchen (hexadezimal und Text)
- [ ] Überschreiben von Hexwerten direkt im Feld
- [ ] Geänderte Bytes kurz hervorheben

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
- [ ] Übernahme der 18 Beispiele aus 6502js (liegen bereits unter `examples/`; Urheberlage klären)
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
- Oberfläche deutsch, englisch oder zweisprachig?
