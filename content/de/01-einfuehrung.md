# Willkommen: Was ist ein Prozessor?

Der 6502 ist ein Prozessor aus den 1970er Jahren. Er steckte im Apple II, im Commodore 64, in den Atari-Heimcomputern und im Nintendo Entertainment System. Er ist einfach genug, um ihn vollständig zu verstehen, und dafür eignet er sich bis heute zum Lernen: Wer weiß, was ein 6502 tut, versteht, was jeder Rechner im Kern tut.

In diesem Lehrbuch lernst du Schritt für Schritt, ihn zu programmieren. Jedes Kapitel führt genau eine neue Idee ein, mit einem kleinen Beispiel, das du sofort ausprobieren kannst.

## Ein Rechner besteht aus zwei Teilen

- Der **Speicher** ist eine lange Reihe von Fächern. Jedes Fach heißt **Byte**, hat eine **Adresse** (seine Nummer) und enthält eine Zahl von 0 bis 255.
- Der **Prozessor** holt sich Zahlen aus dem Speicher, rechnet damit und legt Ergebnisse wieder dort ab.

Der 6502 kann 65 536 Bytes ansprechen, also die Adressen `$0000` bis `$FFFF`. (Das Zeichen `$` bedeutet, dass die Zahl hexadezimal geschrieben ist. Das erklärt Kapitel 3.)

Auch das Programm selbst steht im Speicher: als Folge von Zahlen. Jede Zahl bedeutet einen **Befehl** (englisch *instruction*), zum Beispiel „lade eine Zahl“ oder „addiere“. Der Prozessor arbeitet diese Befehle einen nach dem anderen ab. Welcher Befehl als Nächster dran ist, merkt er sich im **Programmzähler** (*program counter*, kurz `PC`).

## Assembler: Befehle mit Namen

Statt Zahlen zu schreiben, benutzt man kurze Namen wie `LDA` oder `STA`. Ein Programm namens **Assembler** übersetzt diese Namen in die Zahlen, die der Prozessor versteht. Diese Namen-Sprache heißt Assemblersprache. In dieser Umgebung übernimmt der Knopf **Übersetzen** die Arbeit des Assemblers.

## Die Umgebung kennenlernen

Die Seite ist in drei Spalten geteilt:

- **Links** steht dieses Lehrbuch. Mit dem Pfeil oben links klappst du es an den Rand weg, wenn du mehr Platz brauchst. Die Kapitelmarken oben zeigen, wo du bist und was du schon gelesen hast.
- **In der Mitte** arbeitest du: Im **Quelltext** schreibst du dein Programm. Darunter siehst du den **Ablauf** (den Befehl, der gerade dran ist), den **Bildschirm**, die **Register** und den **Monitor**, der den Speicher zeigt.
- **Rechts** steht später die Referenz, ein Nachschlagewerk zu allen Befehlen.

Über dem Quelltext findest du die wichtigsten Knöpfe:

| Knopf | Wirkung |
|---|---|
| **Übersetzen** | Quelltext übersetzen und in den Speicher laden |
| **Start** | Programm laufen lassen |
| **Einzelschritt** | Genau einen Befehl ausführen |
| **Zurücksetzen** | Programm wieder an den Anfang stellen |

Jedes Codebeispiel in diesem Buch hat zwei Knöpfe: **An Emulator senden** kopiert das Beispiel in den Quelltext, **Senden und starten** führt es außerdem sofort aus.

::: aufgabe Der erste Start
Drücke bei diesem winzigen Programm auf **Senden und starten**. Oben links auf dem Bildschirm sollte ein weißer Punkt erscheinen. Was genau passiert, erfährst du im nächsten Kapitel.

```asm expect=$0200:01
LDA #$01
STA $0200
```
:::

::: hinweis
Der Emulator rechnet hier genau wie ein echter 6502, nur ohne Fernseher und Tastatur dran. Der Bildschirm ist ein kleines Quadrat aus 32 mal 32 Punkten, und die Tastatur ist ein einzelnes Byte im Speicher. Mehr dazu kommt Schritt für Schritt.
:::
