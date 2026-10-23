# Rechnen: Addieren, Subtrahieren, Übertrag

Der 6502 kann addieren und subtrahieren, beides immer im Register `A`:

| Befehl | Bedeutung |
|---|---|
| `ADC` | **Ad**d with **C**arry: addiere eine Zahl samt Übertrag zu `A` |
| `SBC` | **S**ubtract with **C**arry: subtrahiere eine Zahl samt geliehenem Übertrag von `A` |

Das Ergebnis steht danach wieder in `A`.

## Ein erstes Rechenprogramm

```asm expect=A:38
CLC          ; Übertrag löschen (dazu gleich mehr)
LDA #$15
ADC #$23     ; $15 + $23 = $38
BRK
```

Die Zahlen sind hexadezimal: `$15` ist 21 und `$23` ist 35, die Summe 56 ist `$38`. Das Register `A` zeigt dir das Ergebnis in allen drei Schreibweisen.

## Das Carry-Flag

Was geschieht, wenn das Ergebnis größer als 255 wird? Probiere es aus:

```asm expect=A:84,C:1
CLC
LDA #$C0
ADC #$C4     ; $C0 + $C4 = $184, passt nicht in ein Byte
BRK
```

`$184` passt nicht in ein Byte (das Maximum ist `$FF`). Im Register `A` steht deshalb nur das niederwertige Byte, `$84`. Aber nichts geht verloren: Das **Carry-Flag** `C` (englisch *carry* = Übertrag) wird 1. Es ist das „Übertrag“-Bit, das wir von der schriftlichen Addition kennen.

::: merke
Passt ein Ergebnis nicht in ein Byte, bleibt das niederwertige Byte in `A`, und das Flag `C` wird 1.
:::

## Warum `CLC` am Anfang?

`ADC` addiert das Carry-Flag immer mit. Stand dort noch ein Übertrag von einer früheren Rechnung, wäre das Ergebnis um 1 zu groß. Deshalb löscht man es vor einer einzelnen Addition mit `CLC` (**Cl**ear **C**arry). Das Gegenstück ist `SEC` (**Se**t **C**arry).

Bei der Subtraktion ist es umgekehrt: Das Carry-Flag bedeutet „nichts geliehen“, es muss also vor `SBC` **gesetzt** werden:

```asm expect=A:09,C:1
SEC          ; nichts geliehen
LDA #$10
SBC #$07     ; $10 - $07 = $09
BRK
```

Wird bei der Subtraktion das Ergebnis kleiner als null, wird `C` zu 0 und `A` „läuft rückwärts über“:

```asm expect=A:F0,C:0
SEC
LDA #$10
SBC #$20     ; 16 - 32 = -16, als Byte $F0
BRK
```

`$F0` ist 240: Zählt man von 16 aus um 32 Schritte (`$20`) rückwärts, kommt man bei 240 an. Man kann das als „minus 16“ lesen. Mehr dazu im Kapitel über Verzweigungen.

## Das Zero-Flag und das Carry als Meldung

Ist das Ergebnis genau 0, wird auch `Z` gesetzt. Hier addieren wir `$80 + $80 = $100`:

```asm expect=A:00,C:1,Z:1
CLC
LDA #$80
ADC #$80
BRK
```

`A` ist `$00`, `C` ist 1 (Übertrag) und `Z` ist 1 (Ergebnis null). Auf diese Meldungen reagieren Programme mit den Verzweigungsbefehlen des nächsten Kapitels.

## Größere Zahlen: zwei Bytes

Mit dem Übertrag kann man auch Zahlen addieren, die größer als 255 sind. Man rechnet bytweise und reicht den Übertrag weiter: erst das niederwertige Byte (`ADC` ohne vorheriges `CLC` im zweiten Schritt!), dann das höherwertige.

Beispiel: `$01F0 + $0120 = $0310`.

```asm expect=$0010:10,$0011:03
CLC
LDA #$F0     ; niederwertiges Byte der ersten Zahl
ADC #$20     ; niederwertiges Byte der zweiten Zahl
STA $10      ; Ergebnis, niederwertig
LDA #$01     ; höherwertiges Byte der ersten Zahl
ADC #$01     ; höherwertiges Byte + Übertrag aus dem ersten Schritt
STA $11      ; Ergebnis, höherwertig
BRK
```

## Aufgaben

::: aufgabe Zwei Zahlen addieren
Addiere 5 und 7 im Akkumulator und speichere das Ergebnis in der Speicherzelle `$80`.
:::

::: loesung Lösung
```asm expect=$0080:0C,A:0C
CLC
LDA #5
ADC #7
STA $80
BRK
```
:::

::: aufgabe Subtrahieren
Berechne `$50 - $18` und lege das Ergebnis in `X` ab.
:::

::: loesung Lösung
```asm expect=X:38
SEC
LDA #$50
SBC #$18
TAX
BRK
```
:::

::: aufgabe Übertrag erkennen
Addiere `$FF + $01` und beobachte `A`, `C` und `Z`. Was ist anders, wenn du statt `$01` die Zahl `$00` addierst?
:::

::: loesung Lösung
Bei `$FF + $01` entsteht `A = $00` mit `C = 1` und `Z = 1`. Bei `$FF + $00` bleibt `A = $FF` und `C` bleibt 0.

```asm expect=A:00,C:1,Z:1
CLC
LDA #$FF
ADC #$01
BRK
```
:::
