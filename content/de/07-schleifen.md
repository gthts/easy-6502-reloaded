# Schleifen

Eine **Schleife** wiederholt einen Teil des Programms. Du hast im letzten Kapitel schon eine gesehen: Eine Marke, ein paar Befehle und ein Verzweigungsbefehl, der zurückspringt. Dieses Kapitel macht daraus ein Handwerkszeug.

## Die Zählschleife

Das Grundmuster: Ein Zähler (meist `X` oder `Y`) wird bei jeder Runde verändert, am Ende der Runde entscheidet ein Vergleich über eine weitere Runde.

```asm expect=X:05
  LDX #$00
runde:
  INX
  CPX #$05
  BNE runde
  BRK
```

Der Körper der Schleife hier ist nur `INX`. Er läuft fünfmal, dann ist `X` gleich 5 und `BNE` fällt durch.

## Ein Zähler ohne Vergleich

Verzweigungsbefehle prüfen die Flags des **letzten** Befehls. Auch `DEX` setzt `Z`, wenn das Ergebnis 0 ist. Wer von einem Startwert rückwärts bis 0 zählt, spart sich deshalb den Vergleich:

```asm expect=X:00,A:0F
  LDX #$05
summe:
  CLC
  TXA
  ADC $10         ; addiert den Inhalt der Speicherzelle $10
  STA $10
  DEX
  BNE summe
  LDA $10
  BRK
```

Dieses Beispiel addiert 5+4+3+2+1 = 15 in der Speicherzelle `$10`. (`ADC $10` ohne `#` rechnet mit dem *Inhalt* der Zelle; das erklärt das nächste Kapitel genauer. Anfangs steht in `$10` eine 0, weil der Speicher zu Beginn leer ist.) Neu ist nur, dass `DEX` selbst das Zero-Flag setzt und `BNE` darauf reagiert.

::: hinweis
Dieser Aufbau ist üblich: Schleifen zählen rückwärts, weil `DEX`/`DEY` mit `BNE` den Vergleich überflüssig machen. Ein Nachteil: Die Schleife läuft nie mit 0 Runden. Mit `X = 0` am Anfang würde `DEX` auf 255 springen und 256 Runden drehen.
:::

## Eine sichtbare Schleife

Ein Programm, das man sieht: Der Punkt oben links durchläuft die Farben.

```asm
  LDX #$00
farbe:
  STX $0200
  INX
  JMP farbe
```

Das läuft durch alle 256 Werte (nur die unteren 4 Bit bestimmen die Farbe, daher wiederholen sich die 16 Farben). Bei hoher Geschwindigkeit ist das ein Flimmern. Wähle oben im Menü „Geschwindigkeit“ eine kleinere Zahl wie „20/s“, dann kannst du die Farbwechsel einzeln verfolgen.

## Verzögerung: Schleife in der Schleife

Der Prozessor ist schnell; will man etwas Langsames, muss man ihn beschäftigen. Das geht mit einer **Verzögerungsschleife**: einer Schleife, die nichts tut. Schachtelt man zwei, wird die Wartezeit lang.

```asm
  LDX #$00
farbe:
  STX $0200
  INX
  LDY #$FF
warte:
  DEY
  BNE warte
  JMP farbe
```

Die innere Schleife (`warte`) zählt `Y` von 255 auf 0 herunter und verbraucht dabei gut tausend Takte. Erst dann geht es mit der nächsten Farbe weiter. Bei hoher Geschwindigkeit wechselt die Farbe jetzt in einem Tempo, das man verfolgen kann.

## Aufgaben

::: aufgabe Summe 0 bis 5
Zähle von 0 bis 5 und addiere alle Zahlen. Das Ergebnis (0+1+2+3+4+5 = 15) soll in der Speicherzelle `$70` stehen.
:::

::: loesung Lösung
`A` hält die laufende Summe, `X` den Zähler. Weil `ADC` nur mit einer Zahl oder Speicherzelle rechnet, legt die Schleife den Zähler kurz in `$71` ab.

```asm expect=$0070:0F
  LDA #$00       ; Summe
  LDX #$00       ; Zähler
runde:
  STX $71        ; Zähler zwischenspeichern
  CLC
  ADC $71        ; Summe += Zähler
  INX
  CPX #$06
  BNE runde
  STA $70
  BRK
```
:::

::: aufgabe Zählen bis fünf
Setze die Speicherzelle `$B0` auf 0 und erhöhe sie fünfmal mit `INC $B0` (ein Befehl, der eine Speicherzelle um 1 erhöht) in einer Schleife.
:::

::: loesung Lösung
```asm expect=$00B0:05
  LDA #$00
  STA $B0
  LDX #$05
nochmal:
  INC $B0
  DEX
  BNE nochmal
  BRK
```
:::
