# Eingabe und Zufall

Ein Programm, das nur vor sich hin rechnet, ist schnell langweilig. Dieser Rechner hat zwei besondere Speicherstellen, die Programme mit der Außenwelt verbinden.

| Zelle | Bedeutung |
|---|---|
| `$FF` | enthält den **Code der zuletzt gedrückten Taste** |
| `$FE` | liefert bei **jedem Lesen** eine neue **Zufallszahl** von 0 bis 255 |

Das sind keine echten Computerbausteine: Der Emulator schreibt in `$FF`, sobald du eine Taste drückst, und gibt bei `$FE` jedes Mal einen anderen Wert zurück. Für das Programm sieht es aber aus wie normaler Speicher: man liest einfach mit `LDA`.

## Tasten

Damit der Emulator Tasten annimmt, musst du den **Bildschirm anklicken**. Daran erkennst du, dass er die Tasten annimmt: Der Bildschirm bekommt einen **blauen Rahmen**, und unter ihm steht in Grün „● Tastatur aktiv“. Klickst du woanders hin, verschwindet der Rahmen, und dort steht wieder „○ Tastatur aus“. Nur solange der Rahmen da ist, geht jede Taste an das Programm.

Der gespeicherte Wert ist der ASCII-Code des Zeichens. Gebräuchlich sind:

| Taste | Wert | Taste | Wert |
|---|---|---|---|
| `W` oder Pfeil hoch | `$77` | `S` oder Pfeil runter | `$73` |
| `A` oder Pfeil links | `$61` | `D` oder Pfeil rechts | `$64` |

Das Programm zeigt den Tastencode als Farbe des Punktes oben links an. Starte es, klicke auf den Bildschirm und drücke verschiedene Tasten:

```asm
loop:
  LDA $FF
  STA $0200
  JMP loop
```

Weil der Code stehen bleibt, bis eine andere Taste kommt, kann ein Programm ihn immer wieder lesen. Soll jeder Tastendruck nur *einmal* zählen, schreibt das Programm danach eine 0 in die Zelle:

```asm
  LDA #$00
  STA $FF         ; Taste „verbraucht“
```

## Auf eine Taste reagieren

Ein Programm prüft den Tastenwert mit `CMP` und verzweigt:

```asm
define taste $FF

loop:
  LDA taste
  CMP #$77          ; W?
  BEQ hoch
  CMP #$73          ; S?
  BEQ runter
  JMP loop

hoch:
  LDA #$05          ; grün
  STA $0200
  JMP loop

runter:
  LDA #$02          ; rot
  STA $0200
  JMP loop
```

Mit `W` wird der Punkt oben links grün, mit `S` rot. Beachte: Die zweite `CMP` benutzt noch immer den Wert, den `LDA taste` geholt hat; `CMP` verändert `A` nicht.

## Zufall

Jedes `LDA $FE` liefert etwas anderes. Damit kann man überraschende Muster erzeugen: Dieses Programm setzt unaufhörlich Punkte mit zufälliger Farbe an zufällige Stellen in den oberen acht Zeilen.

```asm
loop:
  LDX $FE           ; zufälliger Ort (0 bis 255 ab $0200)
  LDA $FE           ; zufällige Farbe
  STA $0200,X
  JMP loop
```

Lass es laufen und stelle verschiedene Geschwindigkeiten ein. Mit der Zeit füllt sich der Bildschirm von oben.

::: hinweis
Ein Zufallswert ist die Grundlage fast jedes Spiels: wo erscheint der nächste Gegner, welche Farbe fällt als Nächstes? Ein Zufallsgenerator in echten 6502-Computern ist meist ein Programm, das aus der vorigen Zahl rechnerisch die nächste ableitet; hier ist es einfacher für dich vorbereitet.
:::

## Aufgaben

::: aufgabe Zufallsfarbe pro Taste
Schreibe ein Programm, das bei jedem Tastendruck die Zelle `$0200` mit einer Zufallsfarbe füllt.
:::

::: loesung Lösung
```asm
loop:
  LDA $FF
  BEQ loop          ; 0 = keine Taste
  LDA $FE
  STA $0200
  LDA #$00
  STA $FF           ; Taste verbrauchen
  JMP loop
```
:::

::: aufgabe Ampel
Mit `R` (`$72`) soll der Punkt rot, mit `G` (`$67`) grün, mit `Y` (`$79`) gelb werden.
:::

::: loesung Lösung
```asm
loop:
  LDA $FF
  CMP #$72
  BEQ rot
  CMP #$67
  BEQ gruen
  CMP #$79
  BEQ gelb
  JMP loop
rot:
  LDA #$02
  JMP zeigen
gruen:
  LDA #$05
  JMP zeigen
gelb:
  LDA #$07
zeigen:
  STA $0200
  JMP loop
```
:::
