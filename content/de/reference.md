# Übersicht

## Diese Umgebung

| Adressen | Verwendung |
|---|---|
| `$0000` – `$00FF` | Nullseite: schnelle Variablen und Zeiger |
| `$00FE` | liefert bei jedem Lesen eine **Zufallszahl** (0 bis 255) |
| `$00FF` | enthält den Code der **zuletzt gedrückten Taste** (Bildschirm anklicken!) |
| `$0100` – `$01FF` | Stapel (wächst nach unten, `SP` beginnt bei `$FF`) |
| `$0200` – `$05FF` | **Bildschirm**: 32 × 32 Punkte, ein Byte je Punkt (nur die unteren 4 Bit zählen) |
| `$0600` – `$FFFF` | Programm (der Quelltext wird ab `$0600` abgelegt) und freier Speicher |

Das Programm beginnt bei `$0600`. `BRK` hält es an; leerer Speicher enthält `BRK`, ein Programm ohne Ende läuft also in den Halt.

Tasten: `W`/Pfeil hoch `$77`, `A`/Pfeil links `$61`, `S`/Pfeil runter `$73`, `D`/Pfeil rechts `$64`.

## Die 16 Farben

| `$0` | `$1` | `$2` | `$3` | `$4` | `$5` | `$6` | `$7` |
|---|---|---|---|---|---|---|---|
| {farbe:0} schwarz | {farbe:1} weiß | {farbe:2} dunkelrot | {farbe:3} hellcyan | {farbe:4} violett | {farbe:5} grün | {farbe:6} blau | {farbe:7} gelb |

| `$8` | `$9` | `$A` | `$B` | `$C` | `$D` | `$E` | `$F` |
|---|---|---|---|---|---|---|---|
| {farbe:8} orange | {farbe:9} braun | {farbe:A} hellrot | {farbe:B} dunkelgrau | {farbe:C} grau | {farbe:D} hellgrün | {farbe:E} hellblau | {farbe:F} hellgrau |

## Schreibweise im Quelltext

| Was | Schreibweise | Beispiel |
|---|---|---|
| Zahl | `$` hexadezimal, `%` binär, sonst dezimal, `'a'` Zeichen | `$FF`, `%1010`, `200`, `'A'` |
| Marke | Name mit Doppelpunkt | `schleife:` |
| Konstante | `define name wert` oder `name = wert` | `define farbe $05` |
| Ausdruck | `+ − * / & \| ^`, Klammern, `<` niederwertiges und `>` höherwertiges Byte, `*` aktuelle Adresse | `LDA #<tabelle`, `STA zeiger+1` |
| Anfangsadresse | `*= adresse` oder `.org adresse` | `*= $0700` |
| Bytes | `dcb`, `.byte`, `.db` | `dcb 1,2,$FF,"Hi"` |
| 16-Bit-Zahlen | `dcw`, `.word`, `.dw` (niederwertig zuerst) | `dcw tabelle` |
| Text | `.text`, `.ascii` | `.text "Hallo"` |
| Platz freihalten | `.res anzahl[,wert]` | `.res 16` |
| Kommentar | ab `;` bis zum Zeilenende | `INX ; nächster` |

Befehlsnamen dürfen groß oder klein geschrieben werden; Marken und Konstanten unterscheiden Groß- und Kleinschreibung.

## Bedienung

| Wo | Wie | Wirkung |
|---|---|---|
| Quelltext | `Tab` / `Umschalt+Tab` | ein- und ausrücken (auch mehrere Zeilen) |
| Quelltext | `Strg+S` | Datei speichern |
| Quelltext | `F1` über einem Befehlsnamen | diese Referenz öffnet den Befehl |
| Quelltext | `Strg+F`, `Strg+H`, `F3` | suchen, ersetzen, nächster Treffer |
| Quelltext | `F9` | Haltepunkt in der aktuellen Zeile setzen oder löschen |
| Quelltext | `Escape`, dann `Tab` | den Editor mit der Tastatur verlassen (sonst fügt `Tab` Leerzeichen ein) |
| Zeilennummer | Klick | Haltepunkt setzen oder löschen |
| Ablauf | Klick auf eine Zeile | Haltepunkt |
| Ablauf | Doppelklick, oder die hervorgehobene Zeile ziehen | Programmzähler dorthin setzen |
| Ablauf | Klick auf den Befehlsnamen | Befehl in der Referenz öffnen |
| Monitor | Byte anklicken, zwei Hexziffern tippen | Byte überschreiben |
| Monitor | Textspalte anklicken, Zeichen tippen | Bytes mit Zeichencodes überschreiben |
| Register | Wert eintippen, Flag anklicken | Register oder Flag ändern |

## Die Flags

Das Statusregister `P` besteht aus acht Bits:

| Flag | Name | Bedeutung |
|---|---|---|
| `N` | Negative | Bit 7 des Ergebnisses |
| `V` | Overflow | Überlauf bei vorzeichenbehafteter Rechnung |
| `-` | | immer 1, ohne Bedeutung |
| `B` | Break | von `BRK` und `PHP` auf den Stapel gelegt |
| `D` | Decimal | Dezimalmodus für `ADC` und `SBC` |
| `I` | Interrupt | Unterbrechungssperre (hier ohne Wirkung) |
| `Z` | Zero | Ergebnis war 0 |
| `C` | Carry | Übertrag oder „nichts geliehen“ |

## Takte

Die meisten Befehle brauchen immer gleich viele Takte. Bei zwei Gruppen hängt die Zahl vom Zustand ab; in den Tabellen der Befehle steht dann ein „+“ hinter der Zahl.

**1. Lesende Befehle mit indiziertem Zugriff: +1 Takt bei Seitenüberschreitung**

Betroffen sind `ADC`, `AND`, `CMP`, `EOR`, `LDA`, `LDX`, `LDY`, `ORA`, `SBC` in den Adressierungsarten `abs,X`, `abs,Y` und `(zp),Y`. Der Prozessor addiert `X` oder `Y` zuerst nur auf das niederwertige Adressbyte. Bleibt die Adresse dabei auf derselben **Seite** (gleiches höherwertiges Byte), ist der Wert sofort da; läuft das niederwertige Byte über, braucht er einen Takt, um das höherwertige Byte zu berichtigen.

| Befehl | `X`/`Y` | Adresse | Takte |
|---|---|---|---|
| `LDA $0310,X` | `$20` | `$0330` (gleiche Seite $03) | 4 |
| `LDA $03F0,X` | `$20` | `$0410` (Seite $03 → $04) | 5 |
| `LDA ($40),Y`, Zeiger `$03F0` | `$05` | `$03F5` (gleiche Seite) | 5 |
| `LDA ($40),Y`, Zeiger `$03F0` | `$20` | `$0410` (Seitenwechsel) | 6 |

**2. Verzweigungen: 2, 3 oder 4 Takte**

| Fall | Takte |
|---|---|
| Bedingung nicht erfüllt, es geht einfach weiter | 2 |
| Bedingung erfüllt, Ziel auf derselben Seite wie der **folgende** Befehl | 3 |
| Bedingung erfüllt, Ziel auf einer anderen Seite | 4 |

Maßgeblich ist die Seite der Adresse **hinter** dem Verzweigungsbefehl, nicht die des Befehls selbst. Beispiel: Steht `BNE` auf `$05FD`, folgt der nächste Befehl auf `$05FF`; ein Sprung nach `$0600` ist dann ein Seitenwechsel (4 Takte), ein Sprung nach `$05F0` nicht (3 Takte).

**Immer gleich lang** sind dagegen alle schreibenden Befehle (`STA`, `STX`, `STY`) und alle Befehle, die einen Wert im Speicher verändern (`ASL`, `LSR`, `ROL`, `ROR`, `INC`, `DEC`): Sie rechnen den vollen Weg immer durch, auch bei `abs,X`. Ebenso der Dezimalmodus (`D`): Er kostet beim hier nachgebildeten NMOS-6502 keinen zusätzlichen Takt (erst der 65C02 braucht einen).

Zum Ausprobieren: Das Feld „Takte“ bei den Registern zählt mit und zeigt den Unterschied nach einem Einzelschritt.

## Herkunft

Die Opcode-Tabelle richtet sich nach der Dokumentation von John Pickens, Bruce Clark und Ed Spittles (6502.org) und wurde mit dem Funktionstest von Klaus Dormann geprüft. Nicht dokumentierte („illegale“) Befehle sind nicht enthalten.
