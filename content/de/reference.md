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
| schwarz | weiß | dunkelrot | hellcyan | violett | grün | blau | gelb |

| `$8` | `$9` | `$A` | `$B` | `$C` | `$D` | `$E` | `$F` |
|---|---|---|---|---|---|---|---|
| orange | braun | hellrot | dunkelgrau | grau | hellgrün | hellblau | hellgrau |

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
| Zeilennummer | Klick | Haltepunkt setzen oder löschen |
| Ablauf, Disassemblierung | Klick auf eine Zeile | Haltepunkt |
| Ablauf | Doppelklick, oder die hervorgehobene Zeile ziehen | Programmzähler dorthin setzen |
| Ablauf, Disassemblierung | Klick auf den Befehlsnamen | Befehl in der Referenz öffnen |
| Monitor | Byte anklicken, zwei Hexziffern tippen | Byte überschreiben |
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

Die Tabellen geben die Taktzahl je Befehl an. „+“ bedeutet: Ein Takt kommt dazu, wenn beim Addieren von `X`/`Y` zur Adresse eine Seitengrenze überschritten wird (nur bei lesenden Befehlen). Bei Verzweigungen kommt ein Takt dazu, wenn gesprungen wird, und noch einer, wenn das Ziel auf einer anderen Seite liegt.

## Herkunft

Die Opcode-Tabelle richtet sich nach der Dokumentation von John Pickens, Bruce Clark und Ed Spittles (6502.org) und wurde mit dem Funktionstest von Klaus Dormann geprüft. Nicht dokumentierte („illegale“) Befehle sind nicht enthalten.
