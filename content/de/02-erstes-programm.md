# Das erste Programm

Im ersten Kapitel hast du ein winziges Programm gestartet, das einen einzigen weißen Punkt oben links gezeichnet hat. Es bestand aus den zwei Zeilen `LDA #$01` und `STA $0200`. Hier hängen wir zwei weitere solche Paare an, damit drei farbige Punkte entstehen. Die ersten beiden Zeilen kennst du also schon; der Rest ist neu und zeigt, wie sich das Muster wiederholt.

```asm expect=$0200:01,$0201:05,$0202:08
LDA #$01
STA $0200
LDA #$05
STA $0201
LDA #$08
STA $0202
```

Drücke auf **Senden und starten**. Oben links erscheinen drei farbige Punkte; der erste ist der weiße Punkt von vorhin. Das Programm besteht nur aus zwei verschiedenen Befehlen, die sich wiederholen.

## Zwei Befehle

- `LDA #$01` heißt **L**o**ad A**: „Lade den Wert `$01` in das Register `A`.“
- `STA $0200` heißt **St**ore **A**: „Speichere den Inhalt von `A` an der Speicheradresse `$0200`.“

Ein **Register** ist ein kleines Fach direkt im Prozessor. Das Register `A` heißt auch **Akkumulator**; über ihn laufen die meisten Rechnungen. Es fasst genau ein Byte, also eine Zahl von 0 bis 255.

Das Zeichen `#` ist wichtig: `LDA #$01` lädt die Zahl `$01` selbst. Ohne `#` wäre `$01` eine Adresse, und der Prozessor würde den *Inhalt* der Speicherzelle mit dieser Adresse laden. Im Kapitel „Adressierung I“ kommen wir darauf zurück.

::: merke
`#` heißt: die Zahl selbst. Eine Zahl ohne `#` ist eine Adresse.
:::

## Der Bildschirm ist ein Stück Speicher

Der Bildschirm hat keinen eigenen Befehl zum Zeichnen. Stattdessen ist ein Teil des Speichers als Bildschirm gewählt: die Adressen `$0200` bis `$05FF`, das sind 1024 Bytes, genau 32 mal 32 Punkte. Der Wert in jeder Zelle bestimmt die Farbe des zugehörigen Punktes. Die Zelle `$0200` ist der Punkt ganz oben links, `$0201` der rechts daneben, und `$05FF` der ganz unten rechts.

Es gibt 16 Farben:

| Wert | Farbe | Wert | Farbe |
|---|---|---|---|
| `$00` | schwarz | `$08` | orange |
| `$01` | weiß | `$09` | braun |
| `$02` | dunkelrot | `$0A` | hellrot |
| `$03` | hellcyan | `$0B` | dunkelgrau |
| `$04` | violett | `$0C` | grau |
| `$05` | grün | `$0D` | hellgrün |
| `$06` | blau | `$0E` | hellblau |
| `$07` | gelb | `$0F` | hellgrau |

## Dem Programm beim Arbeiten zusehen

Das Programm lief gerade so schnell, dass du nichts verfolgen konntest. Jetzt gehen wir langsam vor:

1. Drücke **Zurücksetzen**. Der Bildschirm wird wieder schwarz.
2. Sieh dir das Feld **Ablauf** an: Der hervorgehobene Befehl ist der, der als Nächstes ausgeführt wird. Rechts daneben steht der Programmzähler `PC`, er beginnt bei `$0600`. An dieser Adresse legt der Assembler das Programm ab.
3. Drücke **Einzelschritt**. Im Feld **Register** springt `A` von `$00` auf `$01`, und `PC` wandert zum nächsten Befehl.
4. Drücke noch einmal. Jetzt leuchtet oben links ein weißer Punkt auf: `STA $0200` hat den Wert `$01` in den Bildschirmspeicher geschrieben.
5. Mach weiter, bis alle drei Punkte da sind, und beobachte jedes Mal `A`.

::: hinweis
Im **Monitor** (unten) kannst du in das Feld „Springe zu“ `$0200` eintippen und siehst dann dieselben Bytes als Zahlen: `01 05 08 …`. Bildschirm und Speicher sind zwei Ansichten desselben Dinges.
:::

## Aufgaben

::: aufgabe Farben ändern
Ändere die Farben der drei Punkte. Schlage dazu in der Tabelle oben nach.
:::

::: aufgabe Ein Punkt unten rechts
Zeichne einen vierten Punkt in die rechte untere Ecke des Bildschirms.
:::

::: loesung Lösung
Die Adresse der rechten unteren Ecke ist `$05FF`.

```asm expect=$05FF:07
LDA #$07
STA $05FF
```
:::

::: aufgabe Eine Reihe
Zeichne die ersten acht Punkte der obersten Zeile in acht verschiedenen Farben. Es geht noch ohne Schleife; du brauchst nur Geduld.
:::

::: loesung Lösung
```asm expect=$0200:01,$0201:02,$0202:03,$0203:04,$0204:05,$0205:06,$0206:07,$0207:08
LDA #$01
STA $0200
LDA #$02
STA $0201
LDA #$03
STA $0202
LDA #$04
STA $0203
LDA #$05
STA $0204
LDA #$06
STA $0205
LDA #$07
STA $0206
LDA #$08
STA $0207
```

Das ist mühsam, und genau dafür gibt es später Schleifen.
:::
