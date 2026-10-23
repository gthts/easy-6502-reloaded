# Übungsaufgaben Präsenz 2

Der zweite Satz Aufgaben ist anspruchsvoller. Er beginnt mit Rechnen und Schleifen, geht dann zum Bildschirm über und endet mit zwei Animationen. Wie bei Präsenz 1 gilt: erst ernsthaft selbst versuchen, dann die eingeklappten **Lösungshinweise** öffnen. Sie enthalten Vorgehenstipps, keinen fertigen Programmtext.

::: hinweis
Bei den Animationen (Aufgaben 11 und 12) musst du die **Geschwindigkeit** über dem Quelltext auf **mindestens „100.000/s“** stellen, sonst wartet das Programm in seinen Pausenschleifen so lange, dass man nichts Rechtes sieht. Bei Aufgabe 6 geht es umgekehrt: Dort ist „5/s“ richtig. Bei Aufgaben mit Zufall (5 und 9) liefert die Zelle `$FE` bei jedem Lesen eine neue Zahl.
:::

## Aufgabe 1: Zwei Zahlen addieren und das Ergebnis speichern

::: aufgabe Addieren
Addiere die Werte 5 und 7 im Akkumulator und speichere das Ergebnis in der Speicherzelle `$80`.
:::

::: loesung Lösungshinweise
Nur wenige Schritte: Carry in einen bekannten Zustand bringen, laden, addieren, speichern. Das Ziel ist `$80`.
:::

## Aufgabe 2: Zahlenfolge speichern

::: aufgabe Schleife füllen
Schreibe eine Schleife, die die Speicherstellen `$90` bis `$99` mit den Werten 0 bis 9 füllt.
:::

::: loesung Lösungshinweise
Die Schleife braucht einen Zähler, der zugleich der Wert ist: Übertrage ihn nach `A` und speichere mit indizierter Adressierung ab `$90`. Überlege, bei welchem Zählerstand sie enden muss (zehn Werte, also bei 10).
:::

## Aufgabe 3: Zwei Speicherstellen vertauschen

::: aufgabe Tausch mit nur einem Register
Vertausche die Inhalte von `$91` und `$95` unter alleiniger Verwendung des Akkumulators als Zwischenspeicher (keine anderen Register, keine anderen Speicherzellen, kein Stapel).

**Tipp:** Von den drei Zahlen A, B und (A XOR B) legen je zwei immer die dritte eindeutig fest: Die dritte ist also überflüssig, weil sie sich rekonstruieren lässt.
:::

::: loesung Lösungshinweise
Der Tipp der Aufgabe ist der Weg: Aus a XOR b und einer der beiden Zahlen kann man die andere zurückgewinnen. Der Akkumulator ist die einzige Zwischenstation, und der Logikbefehl kann direkt mit einer Speicherzelle rechnen. Bilde erst a XOR b und schreibe es in die erste Zelle, gewinne dann daraus Schritt für Schritt a und b zurück. Probiere die Folge vorher mit zwei kleinen Zahlen auf Papier.
:::

## Aufgabe 4: Summation einer Zahlenreihe

::: aufgabe Summe
Summiere die Werte aus den Speicherzellen `$90` bis `$99` (dort seien bereits Werte abgelegt) und speichere die Summe in `$C0`.
:::

::: loesung Lösungshinweise
Du hast die Summe (im Akkumulator) und den Index. `ADC` kann direkt mit einer indizierten Speicherzelle rechnen. Vor der Schleife: Carry löschen, Summe auf 0. Die Summe passt nur bis 255 in ein Byte. Fülle vor dem Test die Zellen mit bekannten Werten (zum Beispiel wie in Aufgabe 2), damit du das Ergebnis nachrechnen kannst.
:::

## Aufgabe 5: Maximum in einem Feld finden

::: aufgabe Maximum
Schreibe Zufallszahlen nach `$90` bis `$99`, bestimme danach das Maximum der Werte und speichere es in `$80`.
:::

::: loesung Lösungshinweise
Zwei Teile: erst die zehn Zahlen füllen (`$FE` liefert bei jedem Lesen eine neue), dann das Maximum suchen. Nimm den ersten Wert als vorläufiges Maximum, gehe die übrigen durch und übernimm einen Wert, wenn er größer ist; ein Vergleich und das Carry-Flag sagen dir „größer oder gleich“. Teste die Suche zuerst mit festen Werten, denn Zufallszahlen lassen sich nicht nachrechnen.
:::

## Aufgabe 6: Countdown mit Bildschirmausgabe

::: aufgabe Countdown
Zähle von 5 herunter bis 0 und schreibe die jeweils aktuellen Werte in `$200` (sichtbar im Bildschirmbereich).
:::

::: loesung Lösungshinweise
Eine Schleife, die rückwärts zählt, mit Ausgabe des Zählers nach `$0200` in jeder Runde. Entscheide, wie auch die 0 noch ausgegeben wird (welcher Verzweigungsbefehl reagiert auf „negativ“?). Eine Wartezeit brauchst du im Programm nicht: Stelle über dem Quelltext bei „Geschwindigkeit“ **5/s** ein und sieh zu.
:::

## Aufgabe 7: Einen Streifen auf dem Bildschirm füllen

::: aufgabe Streifen
Fülle die ersten acht Punkte (ab `$200`) mit der Farbe Weiß (`$01`).
:::

::: loesung Lösungshinweise
Acht Zellen ab `$0200` mit demselben Wert: ein Zähler als Index, der von der Länge rückwärts bis 0 läuft. Ein Trick: Erst herunterzählen, dann speichern; so kommt auch die Zelle 0 noch dran.
:::

## Aufgabe 8: Einen Block auf den Bildschirm zeichnen

::: aufgabe 2×2
Zeichne ein Quadrat von 2×2 Punkten ab `$200` mit der Farbe `$0A`.
:::

::: loesung Lösungshinweise
Der Bildschirm besteht aus Zeilen zu 32 Zellen. Welche vier Adressen gehören zu einem Quadrat aus 2×2 Punkten? Eine Zeile tiefer liegt 32 (`$20`) Zellen weiter. Das sind vier Speicherbefehle; eine Schleife brauchst du nicht.
:::

## Aufgabe 9: Bunter Balken

::: aufgabe Zufallsfarben
Bemale die gesamte oberste Zeile des Bildschirms (`$200` bis `$21F`) mit zufälligen Farben. Benutze den Zufallsgenerator des Emulators (`$FE`).
:::

::: loesung Lösungshinweise
Wie Aufgabe 7, nur mit 32 Zellen und einer Zufallsfarbe statt einer festen: Lies `$FE` für jede Zelle neu. Wenn du die Schleife mit einem Verzweigungsbefehl beendest, beachte, welche Befehle die Flags verändern: Ladebefehle tun es, Speicherbefehle nicht.
:::

## Aufgabe 10: Diagonale Linie

::: aufgabe Diagonale
Zeichne eine diagonale Linie von oben links nach unten rechts, indem du die jeweils passenden Speicherzellen füllst (die ersten acht Zellen der Hauptdiagonalen).
:::

::: loesung Lösungshinweise
Die Diagonale liegt auf den Zellen 0, 33, 66, … (eine Zeile tiefer und eine Spalte weiter ist 32 + 1). Du brauchst einen Index, der in jeder Runde um 33 wächst, und einen zweiten Zähler für die acht Punkte. Rechne den Index im Akkumulator weiter und übertrage ihn zurück ins Indexregister. Die ersten acht Punkte passen noch in die erste Speicherseite.
:::

## Aufgabe 11: Knight-Rider-Laufleiste (fortgeschritten)

::: aufgabe Laufleiste
Ein Pixel der Farbe `$04` soll in der dritten Zeile des Bildschirms immer vom linken zum rechten Rand laufen und dann wieder zurück, wie am Kühlergrill des Autos in der Fernsehserie „Knight Rider“.
:::

::: loesung Lösungshinweise
Zwei Schleifen: eine für den Weg nach rechts, eine zurück. In jeder Runde zeichnest du den Punkt, wartest (eine verschachtelte Zählschleife), löschst ihn wieder und gehst eine Zelle weiter. Überlege, wo die beiden Endpunkte nur **einmal** gezeichnet werden sollen. Die dritte Zeile beginnt bei `$0240`. Stelle die Geschwindigkeit auf **mindestens 100.000/s**, sonst ist das Lauflicht sehr träge.
:::

## Aufgabe 12: Springender Ball (Herausforderung)

::: aufgabe Springball
Ein Pixel der Farbe `$04` soll in der 16. Spalte aus der Mitte des Bildschirms „fallen“, am unteren Rand als „Boden“ aufschlagen und elastisch wieder hochspringen, bis es am oberen Totpunkt wieder die Richtung umkehrt. Also quasi ein realistischer Springball.
:::

::: loesung Lösungshinweise
Das Spielfeld reicht über eine Speicherseite hinaus (ab Zeile 16 beginnt es bei `$0400`), ein Index in einem Register genügt deshalb nicht. Nimm einen Zeiger in der Nullseite auf die Zelle des Balls und verschiebe ihn um 32 nach unten oder oben (16-Bit-Rechnung mit dem Carry). Für die Physik: Wartezeiten aus einer Tabelle, oben lang und unten kurz, beim Aufsteigen umgekehrt. Zerlege das Programm in kleine Unterprogramme (zeichnen, löschen, eine Zeile tiefer, eine Zeile höher, warten). Stelle die Geschwindigkeit auf **mindestens 100.000/s**.
:::

::: hinweis
Zum Schluss ein Blick auf die Größenordnung: Der vollständig kommentierte Quelltext der C64-Fassung des Spieleklassikers *Elite* umfasst rund 67 000 Zeilen 6502-Assemblercode. Das ist das obere Ende der Skala für ein sehr ehrgeiziges, komplexes Spiel, das (ohne Nachladen) in 64 Kilobyte passt.
:::
