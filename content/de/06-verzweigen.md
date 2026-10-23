# Vergleichen und Verzweigen

Bisher lief jedes Programm stur von oben nach unten. Interessant wird es, wenn das Programm Entscheidungen trifft. Dafür gibt es **Verzweigungsbefehle** (englisch *branch*). Sie springen zu einer anderen Stelle im Programm, wenn ein Flag einen bestimmten Wert hat, und tun sonst nichts.

## Marken

Um das Ziel eines Sprungs anzugeben, setzt man im Quelltext eine **Marke** (englisch *label*): einen Namen mit Doppelpunkt, der eine Stelle im Programm kennzeichnet. Der Assembler rechnet den Namen in die richtige Adresse um.

## Verzweigen bei gleich und ungleich

```asm expect=X:03,$0200:03,$0201:03
  LDX #$08
zaehlen:           ; <- das ist eine Marke
  DEX
  STX $0200
  CPX #$03
  BNE zaehlen      ; zurück zu „zaehlen“, falls X ungleich 3
  STX $0201
  BRK
```

Was passiert hier?

1. `LDX #$08` setzt `X` auf 8.
2. Unter der Marke `zaehlen:` steht der Anfang einer **Schleife**: `DEX` verringert `X` um 1, `STX $0200` zeigt es als Pixelfarbe oben links.
3. `CPX #$03` **vergleicht** `X` mit 3 (*compare X*). Dabei wird nichts verändert; nur die Flags werden gesetzt: `Z` ist 1, wenn beide gleich sind.
4. `BNE zaehlen` (*branch if not equal*) springt zurück zur Marke, solange `Z` null ist, also solange `X` noch nicht 3 ist. Sonst läuft das Programm einfach mit der nächsten Zeile weiter.

Gehe das Programm mit **Einzelschritt** durch: Im Feld **Ablauf** siehst du, wie der Programmzähler nach `BNE` zurückspringt, und im Register `X` zählt es herunter.

## Die Vergleichsbefehle

| Befehl | Vergleicht |
|---|---|
| `CMP` | `A` mit einer Zahl |
| `CPX` | `X` mit einer Zahl |
| `CPY` | `Y` mit einer Zahl |

Nach dem Vergleich zeigen die Flags das Ergebnis:

| Fall | `Z` | `C` |
|---|---|---|
| Register = Zahl | 1 | 1 |
| Register > Zahl | 0 | 1 |
| Register < Zahl | 0 | 0 |

(`C` ist hier „kein Borger nötig“: Das Register ist mindestens so groß wie die Zahl.)

## Die Verzweigungsbefehle

| Befehl | Springt, wenn … | Bedeutung |
|---|---|---|
| `BEQ` | `Z` = 1 | **e**qual, gleich |
| `BNE` | `Z` = 0 | **n**ot **e**qual, ungleich |
| `BCS` | `C` = 1 | **c**arry **s**et: größer oder gleich |
| `BCC` | `C` = 0 | **c**arry **c**lear: kleiner |
| `BMI` | `N` = 1 | **mi**nus: oberstes Bit gesetzt |
| `BPL` | `N` = 0 | **pl**us: oberstes Bit nicht gesetzt |
| `BVS`, `BVC` | `V` = 1 / 0 | Überlauf (selten gebraucht) |

## Wenn … dann … sonst

Mit einer Verzweigung nach vorn baut man eine Fallunterscheidung:

```asm expect=A:99
  LDX #$05
  CPX #$05
  BNE sonst          ; ungleich? dann zu „sonst“
  LDA #$99           ; gleich: dies hier
  JMP ende           ; und über den Sonst-Teil hinweg
sonst:
  LDA #$11           ; ungleich: dies hier
ende:
  BRK
```

`JMP ende` ist ein Sprung ohne Bedingung. Er wird im Kapitel „Sprünge und Unterprogramme“ erklärt; hier verhindert er nur, dass nach dem Dann-Teil auch noch der Sonst-Teil ausgeführt wird.

## Wie weit kann man springen?

Im Maschinencode steht bei einer Verzweigung nicht die Zieladresse, sondern nur ein **Byte** mit dem Abstand zum nächsten Befehl: positiv (bis 127) nach vorn, „negativ“ (bis −128) nach hinten. Im Ablauf kannst du das nachlesen: `BNE zaehlen` steht dort als Bytes `D0 F8`. Dabei ist `D0` der Befehl und `F8` der Abstand −8: acht Bytes zurück, vom Ende der Verzweigung gerechnet.

Verzweigungen reichen also nur etwa 128 Bytes weit. Wer weiter springen muss, nimmt `JMP`. Meldet der Assembler „Sprungziel zu weit entfernt“, ist genau das passiert.

::: merke
Zuerst das Flag setzen (zum Beispiel mit `CMP`), dann mit `Bxx` darauf reagieren. Die Flags werden von fast jedem Befehl verändert; zwischen Vergleich und Verzweigung steht darum normalerweise kein anderer Befehl.
:::

## Aufgaben

::: aufgabe BEQ
Das Gegenstück zu `BNE` ist `BEQ`. Schreibe ein Programm, das `BEQ` benutzt: Lade `$07` in `A`; ist `A` gleich `$07`, so lade `$01` in `X`, sonst `$02`.
:::

::: loesung Lösung
```asm expect=X:01
  LDA #$07
  CMP #$07
  BEQ gleich
  LDX #$02
  JMP ende
gleich:
  LDX #$01
ende:
  BRK
```
:::

::: aufgabe Größer oder kleiner
`BCS` und `BCC` entscheiden zwischen „größer oder gleich“ und „kleiner“. Schreibe ein Programm, das `$12` mit `$10` vergleicht und `Y` auf 1 setzt, wenn `$12` größer oder gleich ist, sonst auf 0.
:::

::: loesung Lösung
```asm expect=Y:01
  LDA #$12
  CMP #$10
  BCS gross
  LDY #$00
  JMP ende
gross:
  LDY #$01
ende:
  BRK
```
:::
