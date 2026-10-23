# Zahlen: dezimal, hexadezimal, binär

Ein Byte besteht aus acht **Bits**, jedes Bit ist 0 oder 1. Damit gibt es 2⁸ = 256 verschiedene Bytes, die Zahlen 0 bis 255. Rechner kennen nur Bits; für uns Menschen gibt es drei gebräuchliche Schreibweisen derselben Zahl:

| Schreibweise | Zeichen davor | Beispiel für „fünfzehn“ |
|---|---|---|
| dezimal | keines | `15` |
| hexadezimal | `$` | `$0F` |
| binär | `%` | `%00001111` |

Alle drei sind im Quelltext erlaubt. Das hier lädt dreimal dieselbe Zahl:

```asm expect=A:0F
LDA #15
LDA #$0F
LDA #%00001111
```

## Warum hexadezimal?

Hexadezimal rechnet mit 16 Ziffern: `0` bis `9` und dann `A` bis `F` für zehn bis fünfzehn. Der Grund für diese Schreibweise: Ein Byte besteht aus zwei Hälften zu je vier Bits (einem **Halbbyte**), und jede Hälfte ist genau eine Hexziffer.

| Binär | Hex | Dezimal | | Binär | Hex | Dezimal |
|---|---|---|---|---|---|---|
| `0000` | `0` | 0 | | `1000` | `8` | 8 |
| `0001` | `1` | 1 | | `1001` | `9` | 9 |
| `0010` | `2` | 2 | | `1010` | `A` | 10 |
| `0011` | `3` | 3 | | `1011` | `B` | 11 |
| `0100` | `4` | 4 | | `1100` | `C` | 12 |
| `0101` | `5` | 5 | | `1101` | `D` | 13 |
| `0110` | `6` | 6 | | `1110` | `E` | 14 |
| `0111` | `7` | 7 | | `1111` | `F` | 15 |

Also ist `$DB` die Zahl `1101 1011`: das `D` ergibt `1101`, das `B` ergibt `1011`. Umgekehrt kannst du jedes Byte schnell in Hex umschreiben, ohne zu rechnen. Der Wert einer zweistelligen Hexzahl `$hl` ist 16 · h + l; `$DB` ist also 13 · 16 + 11 = 219.

::: merke
Eine Hexziffer = vier Bits. Ein Byte = zwei Hexziffern. Deshalb stehen in Assemblerprogrammen überall `$`-Zahlen.
:::

## Die Register in drei Schreibweisen

Im Feld **Register** zeigt der Emulator `A`, `X` und `Y` zugleich hexadezimal, dezimal und binär. Probiere es aus:

```asm expect=A:DB
LDA #$DB
```

Drücke **Senden und starten** und sieh in das Register `A`: `$DB`, `219` und `%1101 1011` bedeuten dasselbe.

## Zu große Zahlen

Ein Byte fasst höchstens 255. Rechnet man weiter, beginnt der Zähler wieder bei 0, wie der Kilometerzähler im Auto. Im Kapitel „Rechnen“ siehst du, wie der Prozessor einen solchen Überlauf meldet.

Adressen sind größer als ein Byte: Sie bestehen aus zwei Bytes, haben vier Hexziffern (`$0200`) und reichen bis `$FFFF`.

## Aufgaben

::: aufgabe Dreimal dieselbe Zahl
Lade die Zahl 200 in `A`: einmal dezimal, einmal hexadezimal, einmal binär. Wie schreibst du 200 in den beiden anderen Schreibweisen?
:::

::: loesung Lösung
200 = 12 · 16 + 8, also `$C8`. Binär: `1100` und `1000`, also `%11001000`.

```asm expect=A:C8
LDA #200
LDA #$C8
LDA #%11001000
```
:::

::: aufgabe Zahlen lesen
Welche Zahlen sind `$FF`, `%10000000` und `$10`? Prüfe deine Antwort, indem du sie in `A` lädst und das Register ansiehst.
:::

::: loesung Lösung
`$FF` = 255 (alle Bits gesetzt), `%10000000` = 128 = `$80` (nur das oberste Bit), `$10` = 16.

```asm expect=A:10
LDA #$FF
LDA #%10000000
LDA #$10
```
:::
