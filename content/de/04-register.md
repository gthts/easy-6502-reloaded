# Register und Übertragungen

Im ersten Programm hast du schon das Register `A` benutzt. Der 6502 hat insgesamt drei Allzweckregister, jedes fasst ein Byte:

| Register | Name | Aufgabe |
|---|---|---|
| `A` | Akkumulator | Rechnen und Vergleichen |
| `X` | Indexregister X | Zählen, später auch Adressieren |
| `Y` | Indexregister Y | wie `X` |

Dazu kommen drei weitere, die du im Feld **Register** siehst:

- `PC`, der **Programmzähler**, zeigt auf den nächsten Befehl.
- `SP`, der **Stapelzeiger**, gehört zum Stapel (ein eigenes Kapitel).
- `P`, das **Statusregister**: eine Reihe einzelner Bits, die **Flags**, mit denen der Prozessor Eigenschaften des letzten Ergebnisses festhält. Sie heißen `N V - B D I Z C`. Anklicken schaltet ein Flag um, probiere es aus.

## Laden und Speichern

Jedes der drei Register hat einen Ladebefehl und einen Speicherbefehl:

| Laden | Speichern | Register |
|---|---|---|
| `LDA` | `STA` | `A` |
| `LDX` | `STX` | `X` |
| `LDY` | `STY` | `Y` |

## Übertragen zwischen Registern

Man kann den Inhalt eines Registers auch in ein anderes kopieren. Die Namen verraten, was passiert:

| Befehl | Bedeutung |
|---|---|
| `TAX` | **T**ransfer **A** to **X** |
| `TAY` | **T**ransfer **A** to **Y** |
| `TXA` | **T**ransfer **X** to **A** |
| `TYA` | **T**ransfer **Y** to **A** |

Kopiert wird nur; die Quelle behält ihren Wert.

## Zählen

Die Indexregister kann man direkt hoch- und herunterzählen:

| Befehl | Bedeutung |
|---|---|
| `INX` | `X` um 1 erhöhen (*increment*) |
| `INY` | `Y` um 1 erhöhen |
| `DEX` | `X` um 1 verringern (*decrement*) |
| `DEY` | `Y` um 1 verringern |

## Ein Beispiel

```asm expect=A:C0,X:C1,Y:C0
LDA #$C0   ; Lade die Zahl $C0 in A
TAX        ; Kopiere A nach X
INX        ; Erhöhe X um 1
TAY        ; Kopiere A auch nach Y
BRK        ; Ende des Programms
```

Alles hinter einem Strichpunkt ist **Kommentar**: Der Assembler überspringt ihn, er ist nur für Menschen da. `BRK` beendet das Programm; der Emulator hält dort an.

Gehe das Programm mit **Einzelschritt** durch und beobachte `A`, `X` und `Y`. Nach `INX` ist `X` um eins größer als `A`.

## Flags Z und N

Bei jedem Laden, Übertragen und Zählen merkt sich der Prozessor zwei Dinge über das Ergebnis:

- `Z` (zero) ist 1, wenn das Ergebnis 0 war.
- `N` (negative) ist 1, wenn das oberste Bit (Bit 7) des Ergebnisses gesetzt ist, die Zahl also `$80` oder größer ist.

Das siehst du mit diesem Programm. Gehe mit **Einzelschritt** durch und achte auf die Flags im Statusregister:

```asm expect=Z:1,N:0
LDA #$80    ; N wird 1
LDA #$00    ; Z wird 1, N wird 0
```

Die Flags sind das Gedächtnis des Prozessors. Mit ihnen entscheiden später die Verzweigungsbefehle, was als Nächstes geschieht.

## Aufgaben

::: aufgabe Übertragen prüfen
Du kennst `TAX`. Schreibe ein Programm, das `TXA` und `TYA` ausprobiert, und prüfe mit **Einzelschritt**, ob dein Verständnis stimmt.
:::

::: loesung Lösung
```asm expect=A:07,X:05,Y:07
LDX #$05
LDY #$07
TXA        ; A = 5
TYA        ; A = 7 (überschreibt A)
BRK
```
:::

::: aufgabe Mit Y statt X
Schreibe das Beispiel von oben so um, dass es `Y` statt `X` zum Zählen benutzt.
:::

::: loesung Lösung
```asm expect=A:C0,Y:C1
LDA #$C0
TAY
INY
BRK
```
:::
