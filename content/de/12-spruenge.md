# Sprünge und Unterprogramme

Eine Verzweigung wie `BNE` reicht nur etwa 128 Bytes weit und hängt von einem Flag ab. Dieses Kapitel zeigt zwei Sprungarten, die davon frei sind.

## `JMP`: der Sprung ohne Bedingung

`JMP` ist ein nicht an eine Bedingung geknüpfter Sprung an eine beliebige Adresse im Speicher.

```asm expect=$0200:03
  LDA #$03
  JMP dort       ; springt über die beiden BRK hinweg
  BRK
  BRK
dort:
  STA $0200
  BRK
```

Wenn du es mit **Einzelschritt** durchgehst, siehst du, dass der Programmzähler über die zwei `BRK` hinwegspringt.

## Unterprogramme: `JSR` und `RTS`

Oft braucht man dieselbe Folge von Befehlen an mehreren Stellen. Statt sie zu kopieren, schreibt man sie einmal als **Unterprogramm** (englisch *subroutine*) und ruft sie auf, so wie man in anderen Sprachen eine Funktion aufruft.

| Befehl | Wirkung |
|---|---|
| `JSR marke` | **J**ump to **S**ub**r**outine: springt zu `marke` und merkt sich, wohin zurückzukehren ist |
| `RTS` | **R**e**t**urn from **S**ubroutine: springt zurück, hinter den `JSR` |

Die Rückkehradresse legt `JSR` auf den **Stapel**. Der Prozessor legt dort die Adresse des *letzten Bytes* des `JSR`-Befehls ab. `RTS` holt sie herunter, zählt eins dazu und springt dorthin.

```asm expect=X:05
  JSR vorbereiten
  JSR zaehlen
  JSR ende

vorbereiten:
  LDX #$00
  RTS

zaehlen:
  INX
  CPX #$05
  BNE zaehlen
  RTS

ende:
  BRK
```

Wie verläuft das?

1. `JSR vorbereiten` springt zum Unterprogramm, setzt `X` auf 0 und kehrt zurück.
2. `JSR zaehlen` springt zur Schleife, zählt `X` bis 5 und kehrt zurück.
3. `JSR ende` springt zu `BRK`; das Programm endet.

Gehe das Programm mit **Einzelschritt** durch und achte auf die Zeile **Stapel** im Feld **Register**: Bei jedem `JSR` kommen zwei Bytes hinzu, bei jedem `RTS` verschwinden sie wieder.

## Zwei Knöpfe für Unterprogramme

Wenn du ein Programm Schritt für Schritt prüfst, willst du nicht jedes Unterprogramm einzeln durchgehen. Dafür gibt es zwei Knöpfe:

- **Aufruf überspringen** führt einen Befehl aus. Steht dort ein `JSR`, läuft das Unterprogramm ganz durch, und du landest hinter dem Aufruf.
- **Bis Rückkehr** läuft weiter, bis das Unterprogramm, in dem du dich gerade befindest, mit `RTS` zurückkehrt.

Probiere beides am Beispiel oben aus.

## Werte übergeben

Ein Unterprogramm hat keine Parameterliste. Man verabredet stattdessen, in welchem Register oder in welcher Speicherzelle Werte übergeben werden. Das hier verdoppelt `A`:

```asm expect=A:0C
  LDA #$03
  JSR verdoppeln     ; A = 6
  JSR verdoppeln     ; A = 12 = $0C
  BRK

verdoppeln:          ; Eingabe: A   Ausgabe: A
  ASL A
  NOP                ; Die NOPs tun nichts. Sie machen das Unterprogramm nur lang genug,
  NOP                ; damit man „Einzelschritt“ (geht in das Unterprogramm hinein)
  NOP                ; und „Bis Rückkehr“ (läuft bis zum RTS) deutlich unterscheiden kann.
  RTS
```

Drücke bei der Zeile `JSR verdoppeln` **Einzelschritt**: Der Programmzähler wandert in das Unterprogramm und durch jedes `NOP`. Mit **Bis Rückkehr** läuft es dagegen ohne Halt bis zum `RTS`, und mit **Aufruf überspringen** erledigt ein einziger Klick das ganze Unterprogramm.

Es lohnt sich, über jedes Unterprogramm in einem Kommentar zu schreiben, was es erwartet und was es liefert, denn der Quelltext verrät das nicht selbst.

::: merke
`JSR` und `RTS` gehören zusammen wie Hinfahrt und Rückfahrt. Fehlt ein `RTS`, läuft das Programm in den Code dahinter hinein. Und alles, was ein Unterprogramm auf den Stapel legt, muss es vor dem `RTS` wieder herunternehmen, sonst springt `RTS` an die falsche Stelle.
:::

## Aufgaben

::: aufgabe Plus drei
Schreibe ein Unterprogramm, das den Inhalt von `A` um 3 erhöht. Lade `$02` nach `A`, rufe das Unterprogramm zweimal auf und schreibe das Endergebnis in die Zelle `$A0`.
:::

::: loesung Lösung
```asm expect=$00A0:08
  LDA #$02
  JSR plus3
  JSR plus3
  STA $A0
  BRK

plus3:
  CLC
  ADC #$03
  RTS
```
:::

::: aufgabe Punkt zeichnen
Schreibe ein Unterprogramm `punkt`, das den Wert in `A` als Farbe an die Stelle `X` der **ersten Bildschirmzeile** zeichnet (also in die Zelle `$0200 + X`). Rufe es dann dreimal mit verschiedenen Farben und Stellen auf.
:::

::: loesung Lösung
```asm expect=$0200:01,$0205:02,$021F:03
  LDA #$01
  LDX #$00
  JSR punkt
  LDA #$02
  LDX #$05
  JSR punkt
  LDA #$03
  LDX #$1F
  JSR punkt
  BRK

punkt:               ; A = Farbe, X = Nummer des Punktes in Zeile 1
  STA $0200,X
  RTS
```
:::
