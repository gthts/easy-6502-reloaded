# Zeiger II: indiziert-indirekt

Das letzte Kapitel hat `($zp),Y` vorgestellt: ein Zeiger, zu dem `Y` addiert wird. Es gibt noch eine zweite Zeigerart mit einer ähnlichen Schreibweise und einer ganz anderen Bedeutung. Sie ist **seltener** und nur dann nützlich, wenn man **mehrere Zeiger** in einer Tabelle hat.

## Die Schreibweise `($zp,X)`

Hier steht der Index *in* der Klammer:

- Erst wird `X` zur **Nullseitenadresse** addiert (`$zp + X`). Damit wählt man einen Eintrag in einer Zeigertabelle.
- Dann wird die Adresse gelesen, die dort steht (zwei Bytes, wie immer niederwertig zuerst).
- Dort liegt der Operand.

Einen Index addiert diese Art zur Adresse *nicht*; sie wählt nur *welcher* Zeiger gemeint ist.

```asm expect=A:0A
  LDX #$01
  LDA #$05
  STA $01         ; Zeiger niederwertig
  LDA #$07
  STA $02         ; Zeiger höherwertig  -> $0705
  LDY #$0A
  STY $0705       ; der Wert, den wir finden wollen
  LDA ($00,X)     ; $00 + X = $01: dort steht der Zeiger $0705
  BRK
```

Denke dir `($00,X)` als `($00 + X)`. Hier ist `X` gleich `$01`, es wird also der Zeiger bei `$01` benutzt: `$0705`. Das Register `A` bekommt also den Wert, den vorher `Y` dorthin geschrieben hat; nur auf einem Umweg.

::: merke
`($zp,X)` rechnet **vor** dem Nachschlagen: `X` wählt den Eintrag in einer Tabelle von Zeigern. `($zp),Y` rechnet **nach** dem Nachschlagen: `Y` wird zur gefundenen Adresse addiert. Die Klammer zeigt, wo der Index hingehört.
:::

## Wozu eine Zeigertabelle?

Stell dir mehrere Figuren vor, jede mit ihrer eigenen Position auf dem Bildschirm. Man legt die Positionen als Zeiger nebeneinander in die Nullseite und läuft mit `X` durch sie hindurch. Weil jeder Zeiger zwei Bytes lang ist, zählt man `X` in **Zweierschritten**.

```asm expect=$0200:01,$0205:01,$020A:01
define tabelle $20

  ; drei Zeiger in der Nullseite: $0200, $0205 und $020A
  LDA #$00
  STA tabelle
  LDA #$02
  STA tabelle+1
  LDA #$05
  STA tabelle+2
  LDA #$02
  STA tabelle+3
  LDA #$0A
  STA tabelle+4
  LDA #$02
  STA tabelle+5

  LDA #$01          ; Farbe weiß
  LDX #$00
figur:
  STA (tabelle,X)   ; Punkt an der Adresse, auf die der X-te Zeiger zeigt
  INX
  INX               ; nächster Zeiger: zwei Bytes weiter
  CPX #$06
  BNE figur
  BRK
```

Die Schleife durchläuft die drei Zeiger bei `$20`, `$22`, `$24` und zeichnet an jedem Ort einen weißen Punkt.

## Beide Arten im Vergleich

| | `($zp),Y` | `($zp,X)` |
|---|---|---|
| Wie oft gebraucht | sehr häufig | selten |
| `X` / `Y` wirkt | **nach** dem Nachschlagen auf die Adresse | **vor** dem Nachschlagen auf die Zeigertabelle |
| Typische Aufgabe | Bereich oder Seite durchlaufen | aus mehreren Zeigern einen auswählen |
| Zeigerzellen | `$zp`, `$zp+1` | `$zp+X`, `$zp+X+1` |

Beide Arten brauchen den Zeiger in der **Nullseite**. Wenn du später fremde Programme liest, ist `($zp),Y` die Schreibweise, die dir fast überall begegnet.

## Aufgabe

::: aufgabe Zwei Punkte
Lege zwei Zeiger in `$30` und `$32` an, die auf `$0210` und `$0230` zeigen. Zeichne mit `($30,X)` und einer Schleife beide Punkte in der Farbe rot (`$02`).
:::

::: loesung Lösung
```asm expect=$0210:02,$0230:02
define tabelle $30

  LDA #$10
  STA tabelle
  LDA #$02
  STA tabelle+1
  LDA #$30
  STA tabelle+2
  LDA #$02
  STA tabelle+3

  LDA #$02
  LDX #$00
punkt:
  STA (tabelle,X)
  INX
  INX
  CPX #$04
  BNE punkt
  BRK
```
:::
