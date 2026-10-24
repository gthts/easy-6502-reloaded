# Zeiger I: indirekt-indiziert

Mit `STA $0200,X` kann eine Schleife durch 256 Zellen laufen, mehr nicht: `X` und `Y` fassen nur ein Byte. Und die Anfangsadresse steht fest im Befehl. Wer größere Bereiche bearbeiten will, oder einen Bereich, dessen Lage sich erst während des Laufs ergibt (zum Beispiel „die Zeile, in der die Figur gerade steht“), braucht einen **Zeiger** (englisch *pointer*): eine Speicherstelle, die eine **Adresse** enthält.

## Ein Zeiger besteht aus zwei Bytes

Eine Adresse ist 16 Bit lang, passt also nicht in ein Byte. Man legt sie in **zwei benachbarte Zellen** der Nullseite: zuerst das niederwertige Byte, dann das höherwertige. Dieses Verfahren („Little Endian“) hat der 6502 überall: Auch im Maschinencode steht die Adresse `$0420` als `20 04`.

```asm expect=$0010:20,$0011:04
  LDA #$20
  STA $10        ; niederwertiges Byte des Zeigers
  LDA #$04
  STA $11        ; höherwertiges Byte
  BRK
```

Nun enthalten `$10` und `$11` zusammen die Adresse `$0420`. Aber wie liest oder schreibt man *dort*?

## Die Schreibweise `($10),Y`

Der Befehl `STA ($10),Y` heißt: „Hole die Adresse aus `$10` und `$11`, addiere `Y` und speichere `A` dort.“ Das ist der Name der Art: Erst wird *indirekt* über die Zellen `$10/$11` zugegriffen, dann wird *indiziert* mit `Y`.

Du kannst es Schritt für Schritt nachvollziehen:

```asm expect=A:0A
  LDY #$01        ; Index
  LDA #$03
  STA $01         ; Zeiger niederwertig
  LDA #$07
  STA $02         ; Zeiger höherwertig  -> Zeiger = $0703
  LDX #$0A
  STX $0704       ; ein Wert, den wir wiederfinden wollen
  LDA ($01),Y     ; $0703 + 1 = $0704  ->  A = $0A
  BRK
```

`($01)` liest die beiden Bytes `$03` und `$07` aus den Zellen `$01` und `$02` und setzt sie zur Adresse `$0703` zusammen. Dazu kommt `Y = 1`; zugegriffen wird also auf `$0704`.

::: merke
`($zp),Y` : Der Zeiger steht in **zwei Nullseitenzellen** `$zp` und `$zp+1`. Zur Adresse darin wird `Y` addiert. Nur `Y` ist als Index erlaubt, und der Zeiger muss in der Nullseite liegen.
:::

::: hinweis
**Warum liegt der Zeiger in der Nullseite?** Es gibt kein `STA ($1F10),Y`. Der Befehl `STA ($10),Y` ist nur **zwei Bytes** lang: der Opcode und eine Ein-Byte-Adresse. Diese Adresse nennt die Zelle, in der der Zeiger steht, und weil sie nur ein Byte fasst, kann der Zeiger nur in der Nullseite (`$00`–`$FF`) liegen. Der Grund liegt im Befehlsaufbau: So bleibt der Befehl kurz und schnell. Eine zweibyteige Adresse für den Zeiger hätte einen längeren Befehl mit mehr Takten bedeutet. Die Nullseite ist knapp (nur 256 Bytes), aber sie ist der Ort für Zeiger und schnelle Variablen.
:::

## Verwandt: der indirekte Sprung

Auch `JMP` kann einen Zeiger lesen. `JMP ($00F0)` springt nicht nach `$00F0`, sondern an die **Adresse, die in `$00F0` und `$00F1` steht**:

```asm
  LDA #$01
  STA $F0         ; niederwertig
  LDA #$CC
  STA $F1         ; höherwertig
  JMP ($00F0)     ; springt nach $CC01
```

Gehe das Programm mit **Einzelschritt** durch: Nach dem `JMP` steht der Programmzähler `PC` auf `$CC01`. Dort ist der Speicher leer, das Programm endet also mit einem `BRK`.

## Der Standardfall: den ganzen Bildschirm bearbeiten

Der Bildschirm ist 1024 Bytes groß, in vier Seiten zu je 256 Bytes. Der Zeiger kennt Seiten: Das höherwertige Byte *ist* die Seitennummer. Zum Wechseln auf die nächste Seite erhöht man nur es.

```asm expect=$0200:05,$02FF:05,$0300:05,$05FF:05
define zeiger $10

  LDA #$00
  STA zeiger        ; niederwertiges Byte: 0
  LDA #$02
  STA zeiger+1      ; höherwertiges Byte: 2 -> Zeiger = $0200
  LDX #$04          ; vier Seiten
  LDA #$05          ; Farbe grün
seite:
  LDY #$00
punkt:
  STA (zeiger),Y    ; einen Punkt der Seite
  INY
  BNE punkt         ; Y läuft von 0 bis 255 und wieder auf 0
  INC zeiger+1      ; nächste Seite
  DEX
  BNE seite
  BRK
```

Die innere Schleife `punkt` läuft 256-mal, bis `Y` von 255 wieder auf 0 zurückspringt (das setzt das Zero-Flag). Die äußere Schleife `seite` erhöht das höherwertige Zeigerbyte und startet von neuem, viermal insgesamt.

Mit dieser Schleife kannst du den Bildschirm in jeder Farbe füllen, indem du die Farbe vor `LDA #$05` änderst. Probiere auch weniger Seiten: `LDX #$02` füllt nur die obere Hälfte.

## Warum nicht einfach `STA $0200,Y`?

- Der Zeiger kann sich **ändern**. Ein Programm kann mit derselben Schleife einmal eine Seite, einmal eine andere bearbeiten.
- Über mehrere Seiten kommt man nur mit einem Zeiger.
- Für Listen, Zeichenketten oder Tabellen, die an einer berechneten Stelle liegen, ist er das übliche Werkzeug.

## Aufgaben

::: aufgabe Untere Hälfte
Fülle nur die **untere** Hälfte des Bildschirms (`$0400` bis `$05FF`) mit der Farbe blau (`$06`).
:::

::: loesung Lösung
Der Zeiger beginnt bei `$0400`, zwei Seiten genügen.

```asm expect=$03FF:00,$0400:06,$05FF:06
define zeiger $10

  LDA #$00
  STA zeiger
  LDA #$04
  STA zeiger+1
  LDX #$02
  LDA #$06
seite:
  LDY #$00
punkt:
  STA (zeiger),Y
  INY
  BNE punkt
  INC zeiger+1
  DEX
  BNE seite
  BRK
```
:::

::: aufgabe Eine Seite kopieren
Zeichne in die erste Seite des Bildschirms (`$0200`–`$02FF`) einen Verlauf (Farbe = Nummer des Punktes, mit `TYA`) und kopiere die Seite in die **dritte** Seite (`$0400`–`$04FF`). Dazu brauchst du zwei Zeiger.
:::

::: loesung Lösung
```asm expect=$0200:00,$02FF:FF,$0400:00,$04FF:FF
define quelle $10
define ziel $12

  LDA #$00
  STA quelle
  STA ziel
  LDA #$02
  STA quelle+1
  LDA #$04
  STA ziel+1

  LDY #$00
fuell:
  TYA
  STA (quelle),Y
  INY
  BNE fuell

kopie:
  LDA (quelle),Y
  STA (ziel),Y
  INY
  BNE kopie
  BRK
```
:::
