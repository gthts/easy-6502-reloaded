# Adressierung II: mit Index

Bisher war jede Adresse im Programm fest eingetragen. Wer eine ganze Reihe von Zellen bearbeiten will, etwa die erste Bildschirmzeile, müsste jede Zelle einzeln hinschreiben. Mit der **indizierten Adressierung** addiert der Prozessor beim Zugriff den Inhalt von `X` oder `Y` zur Adresse. Eine Schleife, die `X` verändert, wandert so Zelle für Zelle durch den Speicher.

## Absolut mit Index: `$c000,X` und `$c000,Y`

```asm expect=$0200:01,$0201:01,$0202:01
LDA #$01
LDX #$00
STA $0200,X    ; Zelle $0200 + 0
INX
STA $0200,X    ; Zelle $0200 + 1
INX
STA $0200,X    ; Zelle $0200 + 2
BRK
```

Die Anweisung `STA $0200,X` bedeutet: „Speichere `A` in die Zelle `$0200 + X`.“ Das Programm schreibt in drei Nachbarzellen mit der immer gleichen Anweisung.

Jetzt in einer Schleife: Die erste Bildschirmzeile bekommt 32 Farben nacheinander.

```asm expect=$0200:00,$0201:01,$021F:1F
  LDX #$00
runde:
  TXA            ; die Farbe ist die Nummer des Punktes
  STA $0200,X
  INX
  CPX #$20       ; 32 Punkte
  BNE runde
  BRK
```

Auf dem Bildschirm sieht man die 16 Farben, zweimal hintereinander (nur die unteren vier Bit zählen).

## Rückwärts füllen

Wer rückwärts zählt, braucht keinen Vergleich. Dieses Muster siehst du oft: Das Register läuft von der Länge bis 0, und der Zugriff steht *nach* dem `DEX`, damit die Zelle 0 auch drankommt.

```asm expect=$0200:01,$0207:01,$0208:00
  LDA #$01
  LDX #$08       ; acht Punkte
fuell:
  DEX
  STA $0200,X    ; Zellen 7, 6, … 0
  BNE fuell
  BRK
```

## Nullseite mit Index: `$c0,X`

Dasselbe gibt es für die Nullseite, in der Kurzform:

```asm expect=$00A1:AA,$00A2:AA
LDX #$01
LDA #$AA
STA $A0,X      ; Zelle $A1
INX
STA $A0,X      ; Zelle $A2
BRK
```

Wird die Summe größer als ein Byte, **läuft die Adresse über**: Es bleibt in der Nullseite und beginnt wieder bei 0.

```asm expect=$0004:77
LDX #$05
LDA #$77
STA $FF,X      ; $FF + 5 = $104, in der Nullseite also $04
BRK
```

## Mit dem Y-Register

`Y` kann dasselbe wie `X`: `LDA $0200,Y` und `STA $0200,Y`. Es gibt Besonderheiten:

- `LDX` und `STX` verwenden `Y` als Index (`LDX $40,Y`), weil `X` sich nicht selbst als Index nehmen kann.
- Die Befehle `LDY` und `STY` verwenden dagegen `X` (`STY $40,X`).
- Ausnahmen betreffen nur wenige Befehle; der Assembler meldet es, wenn eine Kombination nicht existiert. Die Referenz führt auf, welche Arten es für jeden Befehl gibt.

## Einen Bereich kopieren

Mit einem Index lassen sich zwei Bereiche gleichzeitig durchlaufen: lesen mit einer Adresse, schreiben mit einer anderen.

```asm expect=$0220:00,$0221:01,$023F:1F
  LDX #$00
fuell:
  TXA
  STA $0200,X    ; erste Zeile mit Zahlen füllen
  INX
  CPX #$20
  BNE fuell
  LDX #$00
kopie:
  LDA $0200,X    ; lesen aus Zeile 1
  STA $0220,X    ; schreiben in Zeile 2
  INX
  CPX #$20
  BNE kopie
  BRK
```

## Aufgaben

::: aufgabe Streifen
Fülle die dritte Bildschirmzeile (`$0240` bis `$025F`) mit der Farbe grün (`$05`).
:::

::: loesung Lösung
```asm expect=$0240:05,$025F:05,$0260:00
  LDA #$05
  LDX #$20       ; 32 Punkte
fuell:
  DEX
  STA $0240,X
  BNE fuell
  BRK
```
:::

::: aufgabe Zwei Zeilen tauschen
Zeichne in Zeile 1 rote (`$02`) und in Zeile 2 gelbe (`$07`) Punkte. Tausche dann die Zeilen miteinander, so dass Rot unten und Gelb oben liegt. (Tipp: Ein Zwischenspeicher in `Y` hilft.)
:::

::: loesung Lösung
```asm expect=$0200:07,$021F:07,$0220:02,$023F:02
  LDX #$20
fuell:
  DEX
  LDA #$02
  STA $0200,X
  LDA #$07
  STA $0220,X
  CPX #$00      ; LDA hat die Flags verändert, darum eigens prüfen
  BNE fuell
  LDX #$20
tausch:
  DEX
  LDA $0200,X
  TAY            ; Zwischenspeicher
  LDA $0220,X
  STA $0200,X
  TYA
  STA $0220,X
  CPX #$00
  BNE tausch
  BRK
```
:::
