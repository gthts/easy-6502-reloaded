# Ordnung im Programm: Namen und Daten

Je länger ein Programm wird, desto mehr Zahlen kommen darin vor: Adressen, Farben, Grenzwerte. Nach ein paar Dutzend Zeilen weiß niemand mehr, was `$12` bedeutet. Die Lösung: Zahlen bekommen Namen.

## Konstanten mit `define`

`define` gibt einer Zahl einen Namen. Wo der Name steht, setzt der Assembler die Zahl ein.

```asm expect=$0200:01
define weiss $01
define bildschirm $0200

  LDA #weiss
  STA bildschirm
  BRK
```

Das Beispiel entspricht genau `LDA #$01` und `STA $0200`, ist aber viel lesbarer. Die Schreibweise `name = wert` bedeutet dasselbe:

```asm expect=$0010:04
farbe = $04
zeiger = $10

  LDA #farbe
  STA zeiger
  BRK
```

Namen dürfen aus Buchstaben, Ziffern und dem Unterstrich bestehen und nicht mit einer Ziffer beginnen. Große und kleine Buchstaben sind verschieden. `LDA #weiss` lädt die Zahl, `LDA weiss` dagegen den Inhalt der Zelle mit der Nummer `weiss`.

Mit einfachen Ausdrücken kann man rechnen: `STA zeiger+1`, `LDA #hoehe-1`, `LDA #<adresse` (niederwertiges Byte) und `LDA #>adresse` (höherwertiges Byte).

::: merke
Eine Konstante ist ein Name für eine **Zahl**; eine Marke ist ein Name für eine **Stelle im Programm**. Beides steht im Quelltext, beides löst der Assembler auf. Mit Konstanten ändert man eine Zahl an genau einer Stelle, statt sie überall zu suchen.
:::

## Daten ablegen: `dcb` und `dcw`

Nicht jedes Byte im Speicher ist ein Befehl. Mit `dcb` (*define constant byte*) legt man Bytes direkt ab; `dcw` legt 16-Bit-Zahlen ab (erst das niederwertige, dann das höherwertige Byte). Eine Marke davor macht die Daten ansprechbar:

```asm expect=$0200:01,$0203:04,$0207:08
  LDX #$00
holen:
  LDA farben,X      ; X-tes Byte der Tabelle
  STA $0200,X
  INX
  CPX #$08
  BNE holen
  BRK

farben:
  dcb $01,$02,$03,$04,$05,$06,$07,$08
```

Die Tabelle steht **hinter** `BRK`, denn der Prozessor soll sie nie ausführen. Im **Disassemblierfenster** (neben dem Monitor) kannst du `farben` anwählen: Dort wird die Tabelle als Befehle gedeutet, was man an wirren Befehlen erkennt, die in Wirklichkeit gar keine sind. Daten und Programm sind im Speicher nicht unterscheidbar; nur der Programmablauf entscheidet.

Auch Text geht, mit Anführungszeichen:

```asm expect=$0020:48,$0021:69
  LDX #$00
holen:
  LDA text,X
  STA $20,X
  INX
  CPX #$02
  BNE holen
  BRK

text:
  dcb "Hi"
```

## Der Speicherplan

Ein Programm muss festlegen, was wo liegt. In dieser Umgebung gilt:

| Bereich | Verwendung |
|---|---|
| `$0000` – `$00FF` | Nullseite: Variablen. `$FE` und `$FF` sind reserviert (Zufall, Taste). |
| `$0100` – `$01FF` | Stapel |
| `$0200` – `$05FF` | Bildschirm |
| `$0600` – `$FFFF` | Programm und Daten; das Programm beginnt standardmäßig bei `$0600`. |

Mit `*= adresse` (oder gleichbedeutend `.org adresse`) verschiebt man die Stelle, an der es weitergeht. Das ist selten nötig; ein Beispiel:

```asm expect=$0700:AA,$0701:BB
  LDA $0700      ; liest die Daten unten
  BRK

*= $0700
daten:
  dcb $AA,$BB
```

## Gut kommentieren

Ein Kommentar sagt, **warum** etwas geschieht, nicht, **was** der Befehl tut. `INX ; X um eins erhöhen` ist überflüssig. `INX ; nächster Gegner` ist hilfreich. Dazu lohnt sich ein Kopf am Anfang jedes Programms, der sagt, was es tut und welche Speicherstellen es verwendet.

## Aufgaben

::: aufgabe Mit Namen
Schreibe das Programm „drei Punkte“ aus dem zweiten Kapitel neu, so dass die Farben und die Adresse jedes Punktes als Konstante benannt sind.
:::

::: loesung Lösung
```asm expect=$0200:01,$0201:05,$0202:08
define punkt1 $0200
define punkt2 $0201
define punkt3 $0202
define weiss $01
define gruen $05
define orange $08

  LDA #weiss
  STA punkt1
  LDA #gruen
  STA punkt2
  LDA #orange
  STA punkt3
  BRK
```
:::

::: aufgabe Eine Tabelle zeichnen
Lege eine Tabelle mit den Farbwerten `$02, $04, $06, $08, $0A` an und zeichne sie als erste fünf Punkte der obersten Zeile.
:::

::: loesung Lösung
```asm expect=$0200:02,$0204:0A
  LDX #$00
holen:
  LDA tabelle,X
  STA $0200,X
  INX
  CPX #$05
  BNE holen
  BRK

tabelle:
  dcb $02,$04,$06,$08,$0A
```
:::
