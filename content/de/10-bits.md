# Bits: Logik und Schieben

Bisher hast du Bytes als Zahlen behandelt. Dieses Kapitel zeigt, wie man sie als Reihe von acht einzelnen Bits behandelt: löschen, setzen, umkehren, verschieben und abfragen.

## Die logischen Befehle

Alle drei verknüpfen `A` Bit für Bit mit einer Zahl oder Speicherzelle. Das Ergebnis steht wieder in `A`.

| Befehl | Name | Ergebnisbit ist 1, wenn … |
|---|---|---|
| `AND` | und | beide Bits 1 sind |
| `ORA` | oder | mindestens ein Bit 1 ist |
| `EOR` | exklusiv-oder | genau ein Bit 1 ist (die Bits verschieden sind) |

### `AND`: Bits behalten oder löschen (Maske)

Mit `AND` behält man genau die Bits, an denen die Maske eine 1 hat; alle anderen werden 0.

```asm expect=A:0B
LDA #$DB       ; 1101 1011
AND #$0F       ; 0000 1111  -> bleibt: 0000 1011
BRK
```

Hier bleibt nur das niederwertige Halbbyte: `$DB` wird zu `$0B`.

### `ORA`: Bits setzen

Mit `ORA` setzt man Bits auf 1, ohne die anderen anzufassen.

```asm expect=A:0F
LDA #$0A       ; 0000 1010
ORA #$05       ; 0000 0101  -> 0000 1111
BRK
```

### `EOR`: Bits umkehren

Mit `EOR` kehrt man genau die Bits um, an denen die Maske eine 1 hat. Zweimal angewandt, ergibt es wieder das Original. Das wird später für den Tausch ohne Zwischenspeicher benutzt.

```asm expect=A:0F,X:0F
LDA #$0F       ; 0000 1111
EOR #$FF       ; alle Bits umkehren -> 1111 0000
TAX
EOR #$FF       ; und zurück
TAX
BRK
```

Und ein überraschender Nutzen: `EOR` einer Zahl mit sich selbst ergibt 0, denn dann sind alle Bits gleich.

```asm expect=A:00,Z:1
LDA #$5A
EOR #$5A
BRK
```

## Schieben

Die Schiebebefehle verschieben alle Bits um eine Stelle. Das Bit, das herausfällt, landet im Carry-Flag.

| Befehl | Wirkung |
|---|---|
| `ASL` | **a**rithmetic **s**hift **l**eft: nach links, rechts kommt eine 0 nach |
| `LSR` | **l**ogical **s**hift **r**ight: nach rechts, links kommt eine 0 nach |
| `ROL` | **ro**tate **l**eft: nach links, das alte Carry kommt rechts hinein |
| `ROR` | **ro**tate **r**ight: nach rechts, das alte Carry kommt links hinein |

Ein Linksschieben um eine Stelle **verdoppelt** die Zahl, ein Rechtsschieben **halbiert** sie (abgerundet). Das ist schneller als jede Multiplikation:

```asm expect=A:20
LDA #$08       ; 0000 1000 = 8
ASL A          ; 0001 0000 = 16
ASL A          ; 0010 0000 = 32 = $20
BRK
```

`ASL A` wirkt auf den Akkumulator (Adressierungsart „Akkumulator“). Die Schiebebefehle gibt es auch für Speicherzellen: `ASL $10`.

Das herausgeschobene Bit steht im Carry-Flag:

```asm expect=A:02,C:1
LDA #$81       ; 1000 0001
ASL A          ; 0000 0010, Carry = 1: das oberste Bit ist herausgefallen
BRK
```

Und nach rechts: Die 3 (`0000 0011`) wird zu 1, das herausgefallene Bit steckt im Carry.

```asm expect=A:01,C:1
LDA #$03
LSR A
BRK
```

## Ein einzelnes Bit abfragen

Das oberste Bit (Bit 7) wirkt sich auf das Flag `N` aus. Mit `BMI` und `BPL` fragt man es also kostenlos ab. Für beliebige Bits benutzt man `AND` mit einer Maske und fragt dann `Z` ab:

```asm expect=X:01
LDA #%00100100
AND #%00000100    ; Bit 2 isolieren
BEQ nicht_gesetzt ; Ergebnis 0 -> Bit war nicht gesetzt
LDX #$01          ; Bit war gesetzt
JMP ende
nicht_gesetzt:
LDX #$00
ende:
BRK
```

## Aufgaben

::: aufgabe Oberes Halbbyte behalten
Nimm den Wert `$DB` und behalte nur das **obere** Halbbyte: Das untere Halbbyte soll auf 0 gesetzt werden, so dass `$D0` entsteht. Benutze `AND` mit der passenden Maske.
:::

::: loesung Lösung
```asm expect=A:D0
LDA #$DB
AND #$F0
BRK
```
:::

::: aufgabe Mal acht
Multipliziere `$03` ohne `ADC` mit 8 und lege das Ergebnis in `X` ab.
:::

::: loesung Lösung
Dreimal verdoppeln: 3 · 2 · 2 · 2 = 24 = `$18`.

```asm expect=X:18
LDA #$03
ASL A
ASL A
ASL A
TAX
BRK
```
:::

::: aufgabe Schieben ohne ASL
Wie macht man aus `$08` den Wert `$20`, also eine **Vervierfachung** (8 · 4 = 32), ohne `ASL` zu benutzen? (Es gibt mindestens zwei Wege.)
:::

::: loesung Lösung
Man kann die Zahl mit sich selbst addieren (`$08 + $08 = $10`, noch einmal `$10 + $10 = $20`):

```asm expect=A:20
CLC
LDA #$08
STA $10
ADC $10        ; 8 + 8 = $10
STA $10
ADC $10        ; $10 + $10 = $20
BRK
```

Oder mit `ROL` anstelle von `ASL`:

```asm expect=A:20
CLC            ; Carry muss 0 sein, sonst rutscht eine 1 hinein
LDA #$08
ROL A
ROL A
BRK
```
:::
