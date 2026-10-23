# TODO – Easy 6502 Reloaded

Legende: `[ ]` offen · `[~]` in Arbeit · `[x]` erledigt. Jeder Abschnitt ist ein Meilenstein.

## M0 – Grundlagen
- [x] Quellen beider Repositories gesichtet, Lizenzen geprüft
- [x] Projekt angelegt, Git eingerichtet, Originale unter `upstream/`
- [x] Entscheidung: Oberflächenvariante B2 (Lehrbuch links und Referenz rechts jeweils an den Rand einklappbar; Mitte: Editor, darunter Ablauf und Bildschirm, darunter Monitor)
- [x] Entscheidung: GPL v3 für den Code, CC BY 4.0 für übernommene Lehrtexte
- [~] Vorläufig: Emulator im Hauptfaden, Ansichten entkoppelt (eigene Aktualisierungstakte); Web Worker bleibt Option, falls die Leistung nicht reicht
- [x] Entscheidung: Lokalisierung von Anfang an vorsehen; Ausgangssprache Englisch, Deutsch zusätzlich (siehe Abschnitt Lokalisierung)
- [~] Ordnerstruktur: `src/{core,i18n,ui}`, `tests/`, `tools/` und `index.html` angelegt; `src/{tutorial,reference}` und `content/` folgen
- [ ] Gestaltungsgrundlagen (Farben, Schrift, helles/dunkles Thema)

## M1 – Kern (ohne Oberfläche, mit Prüfläufen)
- [x] CPU: alle 151 offiziellen Opcodes, Adressierungsarten, Flags, Taktzyklen, Dezimalmodus
- [x] Speicher 64 KiB mit Lese-/Schreibhaken (für Anzeige, Monitor, Ein-/Ausgabe)
- [x] Assembler: Marken, Direktiven (`*=`, `.org`, `dcb`, `.byte`, `dcw`, `.word`, `.text`, `.res`, `define`, `name = wert`), Ausdrücke, Fehler mit Zeilennummer und Übersetzungsschlüssel
- [x] Zuordnung Quellzeile ↔ Adresse (`lineMap`)
- [x] Disassembler (einzelne Adresse, Bereich, rückwärts mit Heuristik und bekannten Anfängen)
- [x] Ablaufsteuerung (`Machine`): Lauf mit Befehlsbudget, Einzelschritt, Schritt über, Schritt hinaus, Halt bei Haltepunkt/BRK, Ablaufprotokoll
- [x] Geschwindigkeitsregelung (Zeitgeber der Oberfläche, M2)
- [x] Prüfläufe: 17 Tests (`npm test`), Funktionstest von Klaus Dormann (GPL v3) besteht; die Binärdatei liegt nicht im Projekt, Pfad über `DORMANN_BIN`
- [ ] Dormann-Datei und Anleitung für die Prüfung in CI aufnehmen (optional)
- [ ] Inoffizielle Opcodes: vorerst ausgeschlossen

## Lokalisierung (querschnittlich)
- [x] Modul `src/i18n` mit Katalogen (`en.js` Ausgangssprache, `de.js`), Platzhalter und Schachtelung
- [x] Fehlermeldungen des Assemblers als Schlüssel mit Parametern; Namen der Adressierungsarten im Katalog
- [ ] Alle Texte der Oberfläche über Schlüssel; keine fest eingebauten Zeichenketten in `src/ui`
- [x] Sprachwahl in der Oberfläche, Erkennung über `navigator.language`, Speicherung im Browser
- [ ] Lehrbuch und Referenz je Sprache als eigene Inhaltsdateien (`content/<sprache>/`), Rückfall auf Englisch
- [x] Prüfung auf fehlende Schlüssel (Test: jeder Schlüssel in `en` existiert in `de`, gleiche Platzhalter)
- [ ] Datums-, Zahlen- und Hexformate unabhängig von der Sprache halten

## M2 – Oberfläche: Rahmen
- [x] Aufteilung Lehrbuch · Arbeitsfläche · Referenz, Seitenleisten ein-/ausklappbar und in der Breite ziehbar (auch per Pfeiltasten); Mitte: Quelltext, Ablauf + Bildschirm/Register, Monitor (Entwurf B2)
- [ ] Anordnung wählbar (Bereiche tauschen, Referenz unten oder seitlich) – zurückgestellt
- [x] Höhen von Quelltext und Ablauf per senkrechter Trennlinie ziehbar (Maus, Pfeiltasten, Doppelklick = Standard); im Browserspeicher gemerkt; der Monitor bleibt bei 16 Zeilen
- [x] Trennlinien der Seitenleisten mit der Maus geprüft (echtes Ziehen im Browser)
- [x] Bildschirm 32×32 mit 16 Farben; Tasten über `$FF` (W A S D, Pfeiltasten), Zufallszahl über `$FE`
- [~] Tastaturbedienung und Barrierefreiheit: Trennlinien und Monitor per Tastatur bedienbar, Beschriftungen übersetzt; Prüfung auf Kontrast und Screenreader steht aus
- [x] Laufzeit-Zeitgeber der Maschine getrennt vom Zeichnen der Ansichten; Geschwindigkeit 1/s bis maximal
- [x] Hell/Dunkel/Automatisch, Sprachwahl (Englisch/Deutsch)
- [ ] Ansicht für schmale Bildschirme prüfen (Seitenleisten als Schubladen sind angelegt)
- [x] Zustand (Anordnung, Darstellung, Sprache, Geschwindigkeit, Quelltext) im Browserspeicher, mit Rückfall ohne Speicher

## M3 – Quelltexteditor
- [x] Zeilennummern
- [x] Syntaxhervorhebung (eigene Umsetzung, ohne Bibliothek; mit Tests)
- [x] Fehlermarkierung nach dem Übersetzen (Zeile, Randmarke, Meldung anklickbar)
- [x] Haltepunkte im Zeilenrand; aktive Zeile hervorgehoben und beim Schritt sichtbar gehalten
- [x] Speichern/Laden als Datei (Herunterladen, Dateiauswahl, Ziehen und Ablegen, Strg+S); Herunterladen noch nicht von Hand geprüft
- [x] 5 Schnellspeicherplätze im Browserspeicher (Titel aus erster Zeile, Zeitstempel, Rückfrage beim Überschreiben)
- [ ] Schnellspeicherplätze umbenennen, Anzahl wählbar
- [x] Rückgängig/Wiederholen (auch nach Laden), Einrücken mehrerer Zeilen, Tabulator, Einrückung bei Enter
- [ ] Suchen/Ersetzen, Kommentieren per Tastenkürzel, Bildschirmleser-Hinweise für den Editor

## M4 – Ablaufansicht und Disassemblierung
- [x] Ablaufansicht: aktive Instruktion hervorgehoben, 10 Instruktionen davor und danach, Marken eingeblendet
- [x] Entkoppelt von der Emulatorschleife (Zeichnen über requestAnimationFrame)
- [x] Haltepunkte per Klick auf die Zeile; sie hängen an der nächsten Marke davor (Marke + Abstand) und überstehen Änderungen am Quelltext; entfällt die Marke, entfällt der Haltepunkt; im Browserspeicher gemerkt
- [x] Haltepunkt per Auswahl einer Marke aus einer Liste (Markenliste oder Eingabe, Knopf „Haltepunkt“)
- [x] „PC setzen“: Adresse, Marke aus Liste, Doppelklick auf eine Zeile, Ziehen der hervorgehobenen Zeile, Pfeile für eine Instruktion zurück/vor
- [x] Disassemblierfenster (frei wählbarer Bereich, Marken, Blättern, „PC folgen“, Haltepunkte per Klick)
- [x] Register, Flags und Stapel (8 Bytes); Register und Flags direkt bearbeitbar (PC-Änderung setzt die Ausführung dort fort)
- [x] Register A, X, Y zusätzlich binär (8 Bit, in Vierergruppen)

## M5 – Monitor
- [x] Anordnung: Monitor und Disassemblierfenster stehen nebeneinander (bei schmaler Mitte untereinander)
- [x] Immer aktiv, unabhängig von der Hauptschleife
- [x] 16 Zeilen × 16 Bytes, Blättern (Rad, Tasten, Knöpfe), Springen zu Adresse oder Marke
- [x] Bytefolge suchen (Hexbytes, `??` als Platzhalter, "Text"), weitersuchen mit Umbruch, Treffer hervorgehoben
- [x] Überschreiben von Hexwerten direkt im Feld (Byte anklicken, zwei Ziffern tippen, Pfeiltasten)
- [ ] Überschreiben auch in der Textspalte, Auswahl mehrerer Bytes, Füllen eines Bereichs
- [x] Geänderte Bytes kurz hervorheben

## M6 – Lehrbuch
- [x] Inhaltsformat: Markdown unter `content/<sprache>/` mit `index.json`; eigener Umsetzer (`src/ui/markdown.js`) mit Codeblöcken, Tabellen, Behältern (`::: hinweis|merke|aufgabe|loesung`); kein innerHTML
- [x] Einklappbarer Bereich mit Kapitelmarken (Leiste und Auswahl), Lesefortschritt (gelesen = bis zum Ende gescrollt), Volltextsuche, Vor/Zurück
- [x] Beispiele mit „An Emulator senden“ (Strg+Z holt den alten Quelltext zurück)
- [x] „Senden und starten“ direkt am Beispiel
- [x] **Neuer Lehrplan** mit 17 Sachkapiteln und Aufgaben samt aufklappbaren Lösungen je Kapitel (deutsch); alle Codebeispiele werden von `tests/content.test.mjs` übersetzt, Ergebnisse (`expect=`) geprüft
- [x] Englische Fassung des Lehrbuchs (`content/en/`, 19 Kapitel; Dateinamen bleiben deutsch, weil daraus die Kapitelkennungen für Verweise entstehen); alle Beispiele werden ebenfalls geprüft
- [ ] Englische Fassung gegenlesen lassen (Muttersprachler); sie ist eine sinngemäße Übersetzung des deutschen Textes
- [ ] Änderungen künftig in beiden Sprachen nachführen (Test prüft Übersetzbarkeit der Beispiele, nicht Gleichlauf der Texte)
- [ ] Probelesen: Verständlichkeit, Tempo, Tonfall („du“) mit echten Lernenden prüfen
- [ ] Querverweise Lehrbuch → Referenz (M7) bei Befehlen
- [x] Text auf Grundlage von Easy 6502 neu verfasst und umgegliedert (CC BY 4.0, Nennung unter jedem Kapitel und in NOTICE.md); die Schlange ist aus dem Lehrbuch heraus: Kapitel 17 baut ein kleines Spiel in fünf Etappen, die Schlange liegt kommentiert in der Beispielauswahl
- [x] Indirekt-indiziert `($zp),Y` (Kapitel 14, zuerst) und indiziert-indirekt `($zp,X)` (Kapitel 15) in getrennten Kapiteln
- [x] Die beiden PDF-Übungsblätter sind als Kapitel 18 und 19 („Übungsaufgaben Präsenz 1/2“) am Ende des Lehrbuchs; Aufgabentexte übernommen, Lösungen ergänzt und geprüft
- [x] Urheberlage der Übungsblätter: Sie stammen vom Projektinhaber und stehen unter derselben Lizenz wie das Projekt (geklärt); die PDFs selbst liegen nicht im Git

### Lehrplan – Stand (Kapitel 1 bis 19)
Einführung · Erstes Programm · Zahlen · Register · Rechnen · Verzweigen · Schleifen · Adressierung I · Adressierung II (Index) · Bits · Stapel · Sprünge und Unterprogramme · Ordnung (Namen, Daten) · Zeiger I · Zeiger II · Eingabe und Zufall · Spiel in Etappen · Präsenz 1 · Präsenz 2

### Lehrplan – ursprünglicher Entwurf
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
- [x] Übersicht dieser Umgebung (Speicherplan, Farben, Schreibweise, Bedienung, Flags, Takte), Adressierungsarten, alle 56 Befehle (Wirkung, Flags, Beschreibung, Tabelle der Adressierungsarten mit Opcode/Bytes/Takten), Opcode-Tabelle 16×16 mit Gruppenfarben
- [x] Sprungmarken: Kopfleiste der Referenz (Übersicht · Adressierung · Befehle · Opcodes); Befehlsnamen im Lehrbuchtext, im Ablauf und in der Disassemblierung öffnen den Befehl; F1 im Editor; Opcode-Zelle öffnet den Befehl mit der Adressierungsart; Rückverweis in das passende Lehrbuchkapitel
- [x] Ein-/ausklappbar (rechts); frei platzierbar bleibt zurückgestellt (siehe M2)
- [x] Suche über Name und Beschreibung der Befehle
- [x] Opcode-Quelle angegeben (Pickens, Clark, Spittles; 6502.org); Tabelle mit dem Funktionstest von Klaus Dormann geprüft
- [x] Englische Fassung der Referenz (`content/en/reference.json`, `reference.md`)
- [ ] Beispiel je Befehl (kurzes Programm mit „An Emulator senden“)

## M8 – Beispielprogramme
- [x] Katalog (`examples/index.json`) mit Titel und Beschreibung (de/en), Gruppe (Kleine Programme, Vorführungen, Spiele) und Stufe; Auswahl über dem Quelltext
- [ ] Beschreibungen prüfen: sie sind aus den Dateiköpfen abgeleitet, einige Vorführungen noch nicht angesehen
- [x] 18 Beispiele aus 6502js (darunter die kommentierte Schlange) liegen unter `examples/` und werden getestet
- [ ] Urheberlage der Beispiele klären (Hinweise im Quelltext, GPL der Quelle)
- [x] Laden in den Editor (rückgängig mit Strg+Z); [ ] eigene Warnung bei ungesicherten Änderungen nicht nötig, solange Rückgängig und Schnellspeicherplätze reichen
- [ ] Weitere Vorführungen (Tech-Demos) ergänzen

## M9 – Veröffentlichung
- [x] Lizenzhinweise in der Oberfläche: Seite „Über“ (Knopf oben rechts, zweisprachig) mit Lizenzen, Herkunft, Dank und Datenschutz; Verweise auf LICENSE und NOTICE.md
- [ ] Prüfung der Fremdinhalte: Urheberlage der Beispielprogramme (Hinweise im Quelltext, GPL der Quelle) vor der Veröffentlichung abschließend klären; Beschreibungen der Beispiele gegenlesen
- [x] Ansicht für Mobilgeräte (geprüft im Emulationsmodus 375×812): kompakte Kopfzeile, Werkzeugleiste zum Wischen, Seitenleisten als Schubladen (höchstens eine offen), Seite nicht breiter als der Bildschirm
- [ ] Auf einem echten Telefon und Tablet ausprobieren (Bedienung per Touch, Bildschirmtastatur, Tastencodes für das Spiel: es gibt keine Pfeiltasten)
- [ ] Bildschirm-Steuerkreuz für Touchgeräte erwägen
- [x] Leistungsprüfung: bei „Maximal“ rund 16,7 Millionen Befehle je Sekunde (zum Vergleich: ein echter 6502 schafft etwa 0,4 Millionen); Zeitscheibe des Emulators auf 5 ms verkürzt, damit Anzeige und Bedienung nicht verhungern; Heap bleibt bei 4 MB
- [ ] Bildraten im sichtbaren Browser messen (die Vorschau zeichnet im Hintergrund nicht)
- [x] Vorbereitet: Workflow `.github/workflows/pages.yml` (Tests mit Dormann, dann Bereitstellung), `tools/build-site.mjs`, `.gitattributes`, `.gitignore`, Metadaten und Symbol in `index.html`, README mit Anleitung
- [ ] GitHub-Repository anlegen, GitHub Pages einrichten (**erst nach ausdrücklicher Freigabe**; Name des Repositorys und Sichtbarkeit festlegen)
- [x] Automatische Prüfläufe (GitHub Actions) im Workflow enthalten; noch nie auf GitHub gelaufen

## Offene Fragen
- Gewünschter Name des Repositorys?
- Weitere Sprachen nach Deutsch?
