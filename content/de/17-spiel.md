# Ein kleines Spiel in Etappen

Jetzt hast du alles beisammen, um ein Spiel zu bauen. Statt eines fertigen Programms entsteht es hier in fünf kleinen Schritten. Jeder Schritt fügt eine Fähigkeit hinzu und lässt sich einzeln ausprobieren. Am Ende steht ein „Punktesammler“: Du steuerst einen weißen Punkt über das Spielfeld und sammelst grüne Beute ein; jede Beute zählt einen gelben Punkt in der untersten Zeile.

Das Spielfeld sind die oberen **acht Zeilen** des Bildschirms (`$0200` bis `$02FF`). Das hat einen guten Grund: Die Position des Punktes passt dann in **ein einziges Byte**. Die Zahl `pos` bedeutet „Punkt Nummer `pos` ab `$0200`“. Eine Zeile hat 32 Punkte, deshalb gilt:

| Bewegung | Rechnung |
|---|---|
| nach rechts | `pos` + 1 |
| nach links | `pos` − 1 |
| nach unten | `pos` + 32 |
| nach oben | `pos` − 32 |

::: hinweis
Klicke vor dem Spielen auf den **Bildschirm**, damit er die Tasten bekommt (Kapitel „Eingabe und Zufall“). Gesteuert wird mit `W`, `A`, `S`, `D` oder den Pfeiltasten.
:::

## Etappe 1: Der Spieler

Wir merken uns die Position in der Zelle `$10` und zeichnen dort einen weißen Punkt.

```asm expect=$0290:01
define pos $10

  LDA #$90          ; Zeile 4, Spalte 16: ungefähr in der Mitte
  STA pos
  LDX pos
  LDA #$01          ; weiß
  STA $0200,X       ; zeichnen
  BRK
```

Der Index kommt aus `X`, das aus der Zelle `pos` geladen wird. So steht die Position nur an einer Stelle.

## Etappe 2: Eine Taste lesen und einmal bewegen

Jetzt wartet das Programm auf eine Taste. Die Taste `D` verschiebt den Punkt um eins nach rechts.

```asm
define pos $10
define taste $FF

  LDA #$90
  STA pos
warten:
  LDA taste
  BEQ warten        ; 0 = noch keine Taste gedrückt
  CMP #$64          ; D?
  BNE zeichnen
  INC pos           ; einen Punkt nach rechts
zeichnen:
  LDX pos
  LDA #$01
  STA $0200,X
  BRK
```

Starte, klicke auf den Bildschirm und drücke `D`. Der Punkt erscheint rechts neben der Mitte. Bei jeder anderen Taste erscheint er in der Mitte.

## Etappe 3: Dauerbetrieb mit Vier Richtungen

Aus der einmaligen Bewegung wird eine **Spielschleife**: den alten Punkt löschen, die Taste lesen, die neue Position berechnen, zeichnen, kurz warten, von vorn.

```asm
define pos $10
define taste $FF
define hoch $77
define links $61
define runter $73
define rechts $64

  LDA #$90
  STA pos

spiel:
  LDX pos
  LDA #$00
  STA $0200,X       ; alten Punkt löschen

  LDA taste
  CMP #hoch
  BEQ nach_oben
  CMP #runter
  BEQ nach_unten
  CMP #links
  BEQ nach_links
  CMP #rechts
  BEQ nach_rechts
  JMP zeichnen

nach_oben:
  LDA pos
  SEC
  SBC #32
  STA pos
  JMP zeichnen
nach_unten:
  LDA pos
  CLC
  ADC #32
  STA pos
  JMP zeichnen
nach_links:
  DEC pos
  JMP zeichnen
nach_rechts:
  INC pos

zeichnen:
  LDX pos
  LDA #$01
  STA $0200,X       ; neuen Punkt zeichnen
  LDA #$00
  STA taste         ; Taste verbrauchen
  JSR pause
  JMP spiel

pause:
  LDY #$FF
aussen:
  LDX #$FF
innen:
  DEX
  BNE innen
  DEY
  BNE aussen
  RTS
```

Der Punkt folgt deinen Tasten. Du hast vier Dinge gesehen, die du schon kennst: einen Vergleich pro Taste (`CMP` mit `BEQ`), Unterprogramme (`pause`), Konstanten (`hoch`, `links`, …) und eine Schleife.

Ein Fehler fällt auf: Läuft der Punkt nach rechts aus einer Zeile hinaus, taucht er am Anfang der **nächsten** Zeile auf; am unteren Rand springt er nach oben. Das liegt an der Rechnung mit `pos`.

## Etappe 4: Wände

Wir bauen für jede Richtung eine Prüfung ein, bevor `pos` sich ändert:

| Richtung | Wand, wenn … | Prüfung |
|---|---|---|
| hoch | `pos` < 32 | `CMP #32` und `BCC` |
| runter | `pos` ≥ 224 | `CMP #224` und `BCS` |
| links | Spalte = 0 | `AND #31` ergibt 0, `BEQ` |
| rechts | Spalte = 31 | `AND #31` ergibt 31, `CMP #31`, `BEQ` |

Die Spalte erhält man mit `AND #31`: Das behält nur die unteren fünf Bit, also `pos` modulo 32.

```asm
define pos $10
define taste $FF
define hoch $77
define links $61
define runter $73
define rechts $64

  LDA #$90
  STA pos

spiel:
  LDX pos
  LDA #$00
  STA $0200,X

  LDA taste
  CMP #hoch
  BEQ nach_oben
  CMP #runter
  BEQ nach_unten
  CMP #links
  BEQ nach_links
  CMP #rechts
  BEQ nach_rechts
  JMP zeichnen

nach_oben:
  LDA pos
  CMP #32
  BCC zeichnen      ; oberste Zeile: Wand
  SEC
  SBC #32
  STA pos
  JMP zeichnen
nach_unten:
  LDA pos
  CMP #224
  BCS zeichnen      ; unterste Zeile des Feldes: Wand
  CLC
  ADC #32
  STA pos
  JMP zeichnen
nach_links:
  LDA pos
  AND #31
  BEQ zeichnen      ; Spalte 0: Wand
  DEC pos
  JMP zeichnen
nach_rechts:
  LDA pos
  AND #31
  CMP #31
  BEQ zeichnen      ; Spalte 31: Wand
  INC pos

zeichnen:
  LDX pos
  LDA #$01
  STA $0200,X
  LDA #$00
  STA taste
  JSR pause
  JMP spiel

pause:
  LDY #$FF
aussen:
  LDX #$FF
innen:
  DEX
  BNE innen
  DEY
  BNE aussen
  RTS
```

Jetzt bleibt der Punkt im Feld. Die Verzweigungen springen alle zu `zeichnen`, und zwar *über* die Änderung von `pos` hinweg.

## Etappe 5: Beute und Punktestand

Zuletzt kommen die Beute und der Punktestand dazu:

- Die Beute ist ein grüner Punkt an einer Zufallsstelle (`LDA $FE`).
- Steht der Spieler auf der Beute, zählt das Programm einen Punkt, malt einen gelben Punkt in die unterste Bildschirmzeile und setzt eine neue Beute.
- Nach 32 Punkten ist das Spiel gewonnen.

```asm
define pos $10
define ziel $11
define punkte $12
define taste $FF
define zufall $FE
define hoch $77
define links $61
define runter $73
define rechts $64
define spieler $01
define beute $05
define anzeige $07

  LDA #$90
  STA pos
  LDA #$00
  STA punkte
  JSR neue_beute

spiel:
  LDX pos
  LDA #$00
  STA $0200,X

  LDA taste
  CMP #hoch
  BEQ nach_oben
  CMP #runter
  BEQ nach_unten
  CMP #links
  BEQ nach_links
  CMP #rechts
  BEQ nach_rechts
  JMP zeichnen

nach_oben:
  LDA pos
  CMP #32
  BCC zeichnen
  SEC
  SBC #32
  STA pos
  JMP zeichnen
nach_unten:
  LDA pos
  CMP #224
  BCS zeichnen
  CLC
  ADC #32
  STA pos
  JMP zeichnen
nach_links:
  LDA pos
  AND #31
  BEQ zeichnen
  DEC pos
  JMP zeichnen
nach_rechts:
  LDA pos
  AND #31
  CMP #31
  BEQ zeichnen
  INC pos

zeichnen:
  LDX pos
  LDA #spieler
  STA $0200,X
  LDA #$00
  STA taste

  LDA pos
  CMP ziel
  BNE weiter        ; nicht auf der Beute
  INC punkte
  LDX punkte
  LDA #anzeige
  STA $05DF,X       ; Balken in der letzten Zeile ($05E0 und folgende)
  CPX #32
  BEQ gewonnen
  JSR neue_beute

weiter:
  JSR pause
  JMP spiel

gewonnen:
  BRK

neue_beute:
  LDA zufall        ; Zufallszahl = Lage der neuen Beute
  STA ziel
  TAX
  LDA #beute
  STA $0200,X
  RTS

pause:
  LDY #$FF
aussen:
  LDX #$FF
innen:
  DEX
  BNE innen
  DEY
  BNE aussen
  RTS
```

Das ist ein vollständiges Spiel in unter 150 Zeilen. Jede einzelne Zutat kennst du: Konstanten, Unterprogramme, Zufall, Eingabe, Vergleiche, Schleifen.

::: aufgabe Eigene Ideen
Verändere das Spiel:

- Mache die Pause kürzer oder länger (`LDY #$FF`).
- Wähle andere Farben für Spieler, Beute und Anzeige.
- Lass die Beute in einer anderen Farbe erscheinen, wenn der Punktestand eine Grenze überschreitet.
- Schaffe ein Hindernis, das der Spieler nicht betreten darf.
:::

## Und danach?

In der Beispielauswahl über dem Quelltext liegen größere Programme. Das Schlangenspiel hat denselben Aufbau wie dein Spiel (Spielschleife, Eingabe, Zeichnen, Kollision), nur mit einer Schlange aus mehreren Gliedern. Du findest es unter „Spiele“, ausführlich kommentiert. Mit dem, was du jetzt kennst, kannst du es Zeile für Zeile lesen.
