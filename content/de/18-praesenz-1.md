# Übungsaufgaben Präsenz 1

Diese fünfzehn Aufgaben sind für das Üben in der Präsenzveranstaltung gedacht. Zu jeder gehört eine **Prüfung**: ein Wert, den dein Programm am Ende im Register oder im Speicher hinterlassen muss. Du kannst ihn im Feld **Register** oder im **Monitor** ablesen (Feld „Springe zu“, zum Beispiel `$0080`).

Versuche jede Aufgabe zuerst selbst, und zwar ernsthaft. Zu jeder Aufgabe gibt es eingeklappte **Lösungshinweise**: Vorgehenstipps, aber keinen fertigen Programmtext. Öffne sie erst, wenn du eine Weile gesucht hast und nicht weiterkommst; nach einer Minute ohne Erfolg lohnt sich das noch nicht. Es gibt meist mehrere richtige Wege.

::: hinweis
Beende jedes Programm mit `BRK`. Dann hält der Emulator an, und die Werte bleiben zum Nachsehen stehen. Wenn eine Aufgabe einen Anfangswert in einer Speicherzelle voraussetzt, lege ihn mit `LDA`/`STA` am Anfang des Programms selbst dort ab.
:::

## Übung 1: Arithmetik (Addition)

::: aufgabe Addition
Lade die Werte `$15` und `$23` und addiere sie. Das Ergebnis soll im Register `A` stehen.

**Prüfung:** `A` = `$38`
:::

::: loesung Lösungshinweise
Überlege, welches Flag vor einer Addition einen bekannten Zustand haben muss, und stelle es mit dem passenden Befehl her. Lade dann die erste Zahl in `A` und addiere die zweite direkt als Zahl (nicht als Speicherzelle). Das Ergebnis steht danach wieder in `A`.
:::

## Übung 2: Speicher-Transfer

::: aufgabe Kopieren über X
Kopiere den Wert `$42` von der Speicheradresse `$80` nach `$81`. Verwende das Register `X` als Zwischenspeicher.

**Prüfung:** Speicheradresse `$81` = `$42`
:::

::: loesung Lösungshinweise
Der Ausgangswert muss erst in `$80` stehen: Lege ihn dort selbst ab (über `A`). Zum Kopieren brauchst du dann nur Lade- und Speicherbefehle, aber für das Register `X` statt für `A`: erst von `$80` nach `X` laden, dann von `X` nach `$81` speichern.
:::

## Übung 3: Logische Operationen

::: aufgabe Maske
Nimm den Wert `$DB` und maskiere die niederwertigen 4 Bits (alle anderen Bits werden auf 0 gesetzt). Das Ergebnis soll in der Speicheradresse `$20` stehen.

**Prüfung:** Speicheradresse `$20` = `$0B`
:::

::: loesung Lösungshinweise
Eine Maske behält die Bits, an denen sie eine 1 hat. Welche Maske behält genau die unteren vier Bits? Schreibe sie erst binär auf, dann hexadezimal. Verknüpfe mit dem passenden Logikbefehl und speichere das Ergebnis.
:::

## Übung 4: Verzweigung

::: aufgabe Gleich oder nicht
Lade `$05` in das Register `X`. Wenn `X` gleich `$05` ist, springe zu einer Marke und lade `$99` in das Register `A`. Sonst lade `$11`.

**Prüfung:** `A` = `$99`
:::

::: loesung Lösungshinweise
Du brauchst drei Bausteine: einen Vergleich von `X` mit der Zahl, einen Verzweigungsbefehl, der bei „gleich“ springt, und eine Marke als Ziel. Der Fall „ungleich“ steht gleich hinter der Verzweigung; danach muss das Programm über den „gleich“-Teil hinwegspringen, sonst läuft es hinein und überschreibt das Ergebnis.
:::

## Übung 5: Increment/Decrement

::: aufgabe Dreimal herunterzählen
Starte mit `$10` im Register `Y`. Verringere `Y` dreimal und speichere das Ergebnis in der Speicheradresse `$30`.

**Prüfung:** Speicheradresse `$30` = `$0D`
:::

::: loesung Lösungshinweise
Zähle ein Indexregister dreimal herunter (ein Befehl je Schritt) und speichere es mit dem Speicherbefehl für genau dieses Register. Rechne nach: `$10` minus 3 ist `$0D`.
:::

## Übung 6: Bit-Manipulation (Schieben)

::: aufgabe Zweimal nach links
Lade `$08` in das Register `A` und verschiebe alle Bits zweimal nach links. Das Ergebnis soll in der Speicheradresse `$40` stehen. **Herausforderung:** Schaffst du es ohne den Befehl `ASL`?

**Prüfung:** Speicheradresse `$40` = `$20`
:::

::: loesung Lösungshinweise
Ein Schieben um eine Stelle nach links verdoppelt eine Zahl; zweimal Schieben vervierfacht sie. Speichere das Ergebnis danach in `$40`. Für die Herausforderung: Welche anderen Befehle verdoppeln eine Zahl? Denke an die Addition einer Zahl zu sich selbst (dafür muss sie auch in einer Speicherzelle stehen) oder an die Rotation (beachte, welchen Wert das Carry vorher haben muss).
:::

## Übung 7: Stack-Operationen

::: aufgabe Tauschen
Im Akkumulator steht `$AA`, im Register `X` steht `$BB`. Vertausche diese Werte, aber nutze dafür nur Stapel und/oder Register. Am Ende soll `$BB` im Register `A` und `$AA` im Register `X` stehen.

**Prüfung:** `A` = `$BB`, `X` = `$AA`
:::

::: loesung Lösungshinweise
Mit Übertragungsbefehlen allein geht der Tausch nicht, weil jede Übertragung einen Wert überschreibt. Du brauchst Platz für einen Wert: den Stapel und ein weiteres Register als Zwischenstation. Spiele die Reihenfolge vorher mit Zetteln für `A`, `X`, `Y` und Stapel durch, so dass nie ein Wert verloren geht.
:::

## Übung 8: Indizierte Adressierung

::: aufgabe Drei Zellen
Schreibe die Werte `$01`, `$02`, `$03` in die Speicheradressen `$50`, `$51`, `$52`. Benutze dabei das Register `X` als Index.

**Prüfung:** `$50` = `$01`, `$51` = `$02`, `$52` = `$03`
:::

::: loesung Lösungshinweise
Eine kleine Schleife genügt. Der Wert ist immer um 1 größer als der Index; du kannst ihn aus dem Index berechnen (das Indexregister nach `A` übertragen, 1 addieren) und mit indizierter Adressierung ab `$50` speichern. Vor der Addition das Carry löschen. Überlege, bei welchem Zählerstand die Schleife aufhören muss. Alternativ ohne Schleife: dreimal laden und speichern, mit dem Index von Hand erhöht.
:::

## Übung 9: Flags und Carry

::: aufgabe Übertrag prüfen
Addiere `$FF + $01` und prüfe, ob ein Übertrag (Carry) auftritt. Wenn ja, speichere `$01` in der Adresse `$60`, sonst `$00`.

**Prüfung:** Speicheradresse `$60` = `$01`
:::

::: loesung Lösungshinweise
Das Carry-Flag zeigt an, dass ein Ergebnis nicht in ein Byte passt. Bringe es zuerst in einen bekannten Zustand, addiere, und verzweige mit dem Befehl, der auf das Carry reagiert. Beide Wege (mit und ohne Carry) müssen jeweils den passenden Wert in `$60` speichern und am selben Ende des Programms ankommen.
:::

## Übung 10: Schleifen

::: aufgabe Summe
Zähle von `$00` bis `$05` und summiere alle Werte. Das Endergebnis (0+1+2+3+4+5 = 15 = `$0F`) soll in der Speicheradresse `$70` stehen.

**Prüfung:** Speicheradresse `$70` = `$0F`
:::

::: loesung Lösungshinweise
Zähler und Summe sind zwei verschiedene Dinge: Ein Register zählt von 0 bis 5, ein anderes sammelt die Summe. `ADC` rechnet aber nur mit einer Zahl oder Speicherzelle, nicht mit einem Register. Wie bekommst du den Zähler in eine Speicherzelle? Prüfe, wann die Schleife enden muss (bei 5 oder erst bei 6?) und lösche das Carry in jeder Runde.
:::

## Übung 11: Logische Operationen

::: aufgabe Bits vereinigen
Setze die Bits von `$0A` und `$05` zusammen und speichere das Ergebnis in `$80`.

**Prüfung:** Speicheradresse `$80` = `$0F`
:::

::: loesung Lösungshinweise
Welcher der drei Logikbefehle setzt Bits, ohne die anderen zu verändern? Schreibe beide Zahlen binär untereinander und kombiniere sie von Hand, um das Ergebnis zu prüfen.
:::

## Übung 12: Vergleichen und bedingte Speicherung

::: aufgabe Größer oder kleiner
Vergleiche den Wert in `$90` mit `$10`.

- Ist er kleiner, schreibe `$00` nach `$91`.
- Ist er größer oder gleich, schreibe `$01` nach `$91`.

Lade vor dem Test zum Beispiel `LDA #$12` und `STA $90`.

**Prüfung:** `$91` = `$01`, wenn `$90` ≥ `$10` ist, sonst `$00`
:::

::: loesung Lösungshinweise
Lege den Testwert zuerst in `$90` ab, lade ihn zurück und vergleiche ihn mit `$10`. Nach dem Vergleich zeigt das Carry-Flag „größer oder gleich“ an. Baue zwei Wege („kleiner“ und „größer oder gleich“), die jeweils in `$91` speichern und am selben Ende zusammenlaufen. Prüfe zuletzt mit einem Testwert unter `$10`.
:::

## Übung 13: Unterprogramme

::: aufgabe Plus drei
Schreibe ein Unterprogramm, das den Inhalt des Registers `A` um 3 erhöht. Lade `$02` nach `A`, rufe das Unterprogramm zweimal auf und schreibe das Endergebnis nach `$A0`.

**Prüfung:** Speicheradresse `$A0` = `$08`
:::

::: loesung Lösungshinweise
Zwei Teile: das Unterprogramm (Marke, Rechnung, Rückkehrbefehl am Ende) und das Hauptprogramm, das es zweimal aufruft und das Ergebnis speichert. Das Unterprogramm darf nicht in den Programmfluss geraten: Es steht hinter dem Befehl, der das Programm beendet. Vergiss das Carry vor der Addition nicht.
:::

## Übung 14: Speicher-Inkrement

::: aufgabe Zellen erhöhen
Setze `$B0` auf 0 und erhöhe die Speicherzelle fünfmal mit `INC` in einer Schleife.

**Prüfung:** Speicheradresse `$B0` = `$05`
:::

::: loesung Lösungshinweise
Es gibt einen Befehl, der eine Speicherzelle direkt erhöht, ohne dass sie erst in ein Register geladen werden muss. Die Schleife brauchst du nur zum Zählen der fünf Runden; zähle mit einem Indexregister rückwärts, dann entfällt der Vergleich. Setze die Zelle vorher auf 0.
:::

## Übung 15: Bit-Test

::: aufgabe Höchstes Bit
Prüfe, ob in der Speicherzelle `$C0` das höchstwertige Bit (Bit 7) gesetzt ist. Speichere `$01` in `$C1`, wenn ja, sonst `$00`. Zur Vorbereitung lade `LDA #$80` und `STA $C0`, oder einen anderen Testwert.

**Prüfung:** `$C1` = `$01`, wenn Bit 7 gesetzt ist, sonst `$00`
:::

::: loesung Lösungshinweise
Das oberste Bit eines geladenen Werts landet im Flag `N`; ein Verzweigungsbefehl fragt es ab. Alternativ: das Bit mit einer Maske und `AND` isolieren und das Zero-Flag prüfen. Lege den Testwert zuerst in `$C0` ab und probiere auch einen Wert ohne gesetztes Bit 7.
:::
