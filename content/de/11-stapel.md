# Der Stapel

Der **Stapel** (englisch *stack*) ist ein Zwischenlager für Zahlen nach dem Prinzip eines Tellerstapels: Was zuletzt oben draufgelegt wurde, wird zuerst wieder heruntergenommen. Das Ablegen heißt **push** („drücken“), das Herunternehmen in der 6502-Sprache **pull** („ziehen“).

Der Stapel lebt im Speicher, in den Adressen `$0100` bis `$01FF`. Er wächst von oben nach unten: Der **Stapelzeiger** `SP` zeigt auf die nächste freie Zelle. Anfangs ist `SP = $FF`, also zeigt er auf `$01FF`. Jeder Push schreibt in diese Zelle und verringert den Zeiger um 1, jeder Pull erhöht ihn um 1 und liest.

## Die Befehle

| Befehl | Wirkung |
|---|---|
| `PHA` | **P**us**h** **A**: `A` auf den Stapel legen |
| `PLA` | **Pul**l **A**: obersten Wert vom Stapel nach `A` holen |
| `PHP` | **P**us**h** **P**rocessor status: Flags auf den Stapel legen |
| `PLP` | **Pul**l **P**rocessor status: Flags zurückholen |
| `TSX`, `TXS` | `SP` nach `X` kopieren / `X` nach `SP` kopieren |

## Das erste Beispiel

```asm expect=A:03,X:05
LDA #$03
PHA            ; 3 auf den Stapel
LDA #$05
PHA            ; 5 darüber
PLA            ; zuletzt abgelegt, zuerst zurück: A = 5
TAX            ; X = 5 merken
PLA            ; jetzt die 3: A = 3
BRK
```

Gehe es mit **Einzelschritt** durch und beobachte im Feld **Register** den Stapelzeiger `SP` und die Zeile **Stapel**, die die obersten Bytes des Stapels zeigt: nach dem ersten `PHA` ist `SP = $FE`, nach dem zweiten `$FD`. Im **Monitor** (springe zu `$01F0`) siehst du dieselben Zahlen im Speicher.

Beachte: `PLA` löscht die Zahl nicht aus dem Speicher. Beim Herunterholen ändert sich nur der Stapelzeiger `SP`; der Wert bleibt in `$01FE` oder `$01FF` stehen, bis ein späteres `PHA` ihn einfach überschreibt. Löschen wäre unnötige Arbeit, denn der Stapelzeiger legt ohnehin fest, bis wohin der Stapel gilt.

::: merke
Der Stapel ist „last in, first out“: Man bekommt die Werte in der umgekehrten Reihenfolge zurück, in der man sie abgelegt hat.
:::

## Die Grenzen des Stapels

Der Stapel hat nur 256 Bytes (`$0100` bis `$01FF`), und der 6502 **prüft nichts**:

- **Zu viele `PHA`:** Bei `SP = $00` schreibt `PHA` nach `$0100` und setzt `SP` auf `$FF` zurück. Der Stapel läuft also im Kreis herum, und der neue Wert überschreibt unbemerkt den ältesten.
- **Zu viele `PLA` (auf leerem Stapel):** Leer heißt `SP = $FF`. Ein `PLA` setzt `SP` auf `$00` und holt, was zufällig in `$0100` steht, also Datenmüll.

Es gibt keine Fehlermeldung. Der Programmierer ist verantwortlich: Jedes `PHA` braucht sein `PLA`, und ein Unterprogramm muss den Stapel so hinterlassen, wie es ihn vorgefunden hat.

```asm expect=SP:FF,$0100:77
LDX #$00
TXS            ; SP = $00: der Stapel gilt als „voll“
LDA #$77
PHA            ; schreibt nach $0100, SP springt auf $FF zurück
BRK
```

## Ein sichtbares Beispiel

Dieses Programm spiegelt ein Muster: Die erste Schleife zeichnet Farben von links nach rechts und legt sie nebenbei auf den Stapel; die zweite holt sie in umgekehrter Reihenfolge wieder herunter und zeichnet sie daneben.

```asm expect=$0200:00,$020F:0F,$0210:0F,$021F:00
  LDX #$00
  LDY #$00
erste:
  TXA
  STA $0200,Y
  PHA
  INX
  INY
  CPY #$10
  BNE erste      ; solange Y nicht $10 ist
zweite:
  PLA
  STA $0200,Y
  INY
  CPY #$20
  BNE zweite
  BRK
```

`X` hält die Farbe, `Y` die Position. In der ersten Schleife gibt es 16 Farben von `$00` bis `$0F`, rechts daneben folgen sie rückwärts: ein Spiegelbild.

## Wozu noch?

Der Stapel hat zwei Hauptaufgaben:

- als **Zwischenlager**, wenn man mehr Werte zu merken hat, als es Register gibt, und
- für **Unterprogramme**: Der Prozessor merkt sich dort, wohin er zurückkehren soll (nächstes Kapitel).

## Aufgaben

::: aufgabe Tauschen über den Stapel
Im Akkumulator steht `$AA`, in `X` steht `$BB`. Vertausche die beiden Werte (`A` soll am Ende `$BB`, `X` soll `$AA` haben). Verwende dazu den Stapel. Überlege vorher: Warum genügen die Übertragungsbefehle (`TAX`, `TXA` …) allein für den Tausch nicht?
:::

::: loesung Lösung und Überlegungen
Mit Übertragungsbefehlen allein geht es nicht: `TAX` überschreibt `X`, bevor man dessen alten Wert gesichert hat, und `TXA` tut dasselbe mit `A`. Ein Tausch braucht immer einen **dritten Platz**, der einen der beiden Werte kurz hält. Das kann ein drittes Register sein:

```asm expect=A:BB,X:AA
LDA #$AA
LDX #$BB
PHA            ; A merken
TXA            ; A = X (= $BB)
TAY            ; Y = $BB als Zwischenlager
PLA            ; A = $AA, wieder vom Stapel
TAX            ; X = $AA
TYA            ; A = $BB
BRK
```

Man kommt aber auch **ohne `Y` und ohne eigene Speicherzelle** aus, wenn man ausnutzt, dass der Stapel nichts vergisst: Ein `PLA` ändert nur `SP`, die Zahl bleibt im Speicher liegen. Man legt `$AA` auf den Stapel, setzt `SP` wieder zurück („vergisst“ den Wert damit) und liest ihn danach direkt aus dem Stapelspeicher:

```asm expect=A:BB,X:AA,SP:FF
LDA #$AA
LDX #$BB
PHA            ; $AA auf den Stapel (Zelle $01FF), SP = $FE
TXA            ; A = $BB
TSX            ; X = SP = $FE
INX            ; X = $FF
TXS            ; SP = $FF: der Stapel gilt wieder als leer, $AA liegt aber noch in $01FF
LDX $01FF      ; ... und wird von dort gelesen
BRK
```

Die feste Adresse `$01FF` stimmt, weil `SP` am Anfang `$FF` war. (Eine Schreibweise `LDX $0100,X` gibt es nicht: `LDX` kennt als Index nur `Y`.)

**Was ist am schnellsten?** Wenn es um Prozessortakte geht, gewinnt eine Zelle der Nullseite als Zwischenspeicher: nur 3 Befehle und **8 Takte**. Beide Lösungen oben brauchen 15 Takte.

```asm expect=A:BB,X:AA
LDA #$AA
LDX #$BB
STA $10        ; 3 Takte: A parken
TXA            ; 2 Takte: A = X
LDX $10        ; 3 Takte: X = altes A
BRK
```

Der Stapel lohnt sich also nur, wenn keine Zelle und kein Register frei ist, oder wenn man ihn ohnehin für etwas anderes braucht.
:::

::: aufgabe Drei Werte umdrehen
Lege `$01`, `$02`, `$03` nacheinander mit `PHA` ab und hole sie wieder. In welcher Reihenfolge kommen sie? Schreibe sie der Reihe nach in die Zellen `$30`, `$31`, `$32`.
:::

::: loesung Lösung
```asm expect=$0030:03,$0031:02,$0032:01
LDA #$01
PHA
LDA #$02
PHA
LDA #$03
PHA
PLA
STA $30
PLA
STA $31
PLA
STA $32
BRK
```
:::
