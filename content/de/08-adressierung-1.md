# Adressierung I: Zahl, Nullseite, Adresse

Fast jeder Befehl braucht einen **Operanden**: die Zahl oder Speicherstelle, mit der er arbeiten soll. Wie man ihn angibt, heißt **Adressierungsart**. Der 6502 kennt davon dreizehn. Das klingt nach viel; man lernt sie aber am besten in kleinen Gruppen. In diesem Kapitel kommen die einfachsten dran.

## Implizit und Akkumulator

Manche Befehle brauchen keinen Operanden, weil er im Befehl selbst steckt: `INX` zählt immer `X` hoch, `CLC` löscht immer das Carry-Flag. Das ist die **implizite** Adressierung.

Einige Befehle arbeiten wahlweise auf `A`, etwa das Schieben `ASL A` (Kapitel 10). Das heißt **Akkumulator**-Adressierung.

## Unmittelbar: `#$c0`

Die Zahl steht gleich im Befehl.

```asm expect=X:01
LDX #$01     ; X = 1
```

Du kennst das schon. Das `#` sagt: „Die Zahl selbst.“

## Absolut: `$c000`

Hier steht im Befehl eine **Adresse**, an der der Operand zu finden ist. Eine Adresse besteht aus zwei Bytes, im Befehl zuerst das niederwertige Byte, dann das höherwertige: `STA $0420` wird zu den drei Bytes `8D 20 04`.

```asm expect=$0420:07
LDA #$07
STA $0420    ; Speichere A in der Zelle $0420
```

## Nullseite: `$c0`

Der Speicher ist in **Seiten** zu je 256 Bytes eingeteilt. Die erste Seite, die Adressen `$0000` bis `$00FF`, heißt **Nullseite** (*zero page*). Ihre Adressen passen in ein einziges Byte. Deshalb haben fast alle Befehle eine kürzere und schnellere Form für sie.

Probiere es aus. Schreibe diese beiden Zeilen, übersetze sie und sieh im **Ablauf** nach, aus wie vielen Bytes jeder Befehl besteht:

```asm
STA $22      ; Nullseite: 85 22          (2 Bytes)
STA $2222    ; absolut:   8D 22 22       (3 Bytes)
```

Die Zeile mit der Nullseite braucht ein Byte weniger und läuft einen Takt schneller (3 statt 4). Der Assembler wählt die kurze Form von selbst, sobald die Adresse bekannt ist und unter `$0100` liegt.

Darum benutzt man die Nullseite für wichtige **Variablen**: kleine Speicherstellen, auf die ein Programm oft zugreift. Du kannst dir den Inhalt im **Monitor** ansehen: Tippe bei „Springe zu“ `$0000` ein.

::: hinweis
In dieser Umgebung sind die Zellen `$FE` und `$FF` reserviert: `$FE` liefert bei jedem Lesen eine Zufallszahl, `$FF` enthält die zuletzt gedrückte Taste (Kapitel „Eingabe und Zufall“). Lege dort keine eigenen Variablen an.
:::

## Zahl oder Adresse?

Der häufigste Anfängerfehler: `#` vergessen. Der Unterschied:

```asm expect=A:05
LDA #$05     ; A bekommt die Zahl 5
STA $01      ; Zelle $01 enthält jetzt 5
LDA #$00     ; A ist wieder 0
LDA $01      ; A bekommt den INHALT von Zelle $01: wieder 5
```

Und mit `ADC`:

```asm expect=A:00,C:1,Z:1
CLC
LDA #$80
STA $01
ADC $01      ; addiert den Inhalt von $01, also $80 (nicht die Zahl 1)
BRK
```

`ADC #$01` addierte 1; `ADC $01` addiert den **Inhalt** von Zelle `$01`. Hier ist das `$80`. Das Ergebnis `$80 + $80 = $100` passt nicht in ein Byte: `A` ist `$00`, das Carry-Flag 1.

::: merke
`#$05` ist die Zahl 5. `$05` ist die Speicherzelle mit der Nummer 5. Beim Lesen eines Programms prüft man zuerst: Steht ein `#` davor?
:::

## Relativ

Verzweigungsbefehle wie `BNE` kennst du: Sie springen um einen kleinen Abstand vor oder zurück. Das ist die **relative** Adressierung, im Quelltext schreibt man dafür eine Marke, und der Assembler rechnet den Abstand aus.

## Übersicht

| Art | Schreibweise | Beispiel |
|---|---|---|
| implizit | – | `INX` |
| Akkumulator | `A` | `ASL A` |
| unmittelbar | `#$c0` | `LDA #$05` |
| Nullseite | `$c0` | `LDA $05` |
| absolut | `$c000` | `LDA $0205` |
| relativ | Marke | `BNE schleife` |

Die übrigen Arten folgen in den nächsten Kapiteln: mit Index (`,X` und `,Y`) und über Zeiger (Klammern).

## Aufgaben

::: aufgabe Zahl oder Zelle
Speichere die Zahl `$42` in der Zelle `$30` und kopiere sie dann in die Zelle `$31`. Du darfst dafür das Register `A` benutzen.
:::

::: loesung Lösung
```asm expect=$0030:42,$0031:42
LDA #$42
STA $30
LDA $30      ; Inhalt von $30 laden
STA $31
BRK
```
:::

::: aufgabe Ein Fehler, den man macht
Was ist der Unterschied zwischen `LDX #$02` und `LDX $02`? Überlege erst, dann probiere beides mit einer Zelle `$02`, in der zuvor `$09` abgelegt wurde.
:::

::: loesung Lösung
`LDX #$02` lädt die Zahl 2, `LDX $02` den Inhalt der Zelle `$02`, hier 9.

```asm expect=X:09
LDA #$09
STA $02
LDX #$02     ; X = 2
LDX $02      ; X = 9
BRK
```
:::
