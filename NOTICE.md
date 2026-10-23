# Herkunft und Lizenzen

## Übernommenes und abgeleitetes Material

| Quelle | Stand | Lizenz | Verwendung |
|---|---|---|---|
| [skilldrick/easy6502](https://github.com/skilldrick/easy6502) (Nick Morgan) | bb213ae | Lehrtext: CC BY 4.0; Simulator: GPL | Lehrtext wird überarbeitet und umgegliedert (Namensnennung erforderlich) |
| [itema-as/6502js](https://github.com/itema-as/6502js) (Stian Soreng, Nick Morgan, Torkild U. Resheim) | 9c449d7 | GPL v3 | Beispielprogramme, Opcode-Tabellen und Referenztexte als Vorlage |

Die unveränderten Originale liegen zur Einsicht unter `upstream/`.
Sie sind keine Bestandteile der Anwendung und werden nicht ausgeliefert.

## Folgerungen

- Wird Code aus den beiden Simulatoren übernommen, ist das Ergebnis ein abgeleitetes Werk und fällt unter die GPL. Das Projekt steht deshalb insgesamt unter GPL v3.
- Der Emulatorkern wird neu geschrieben (entkoppelte Architektur); die Quellen dienen als Vergleich.
- Die Schrift „C64 Pro Mono“ (Style64) aus 6502js darf nicht verändert oder weiterverteilt werden und wird **nicht** übernommen.
- Die Opcode-Dokumentation stammt laut 6502js von John Pickens, Bruce Clark und Ed Spittles (6502.org).
- Beispielprogramme tragen teils Vermerke wie „Submitted by Anonymous“. Die Urheberlage ist vor der Veröffentlichung zu klären (siehe TODO.md).

## Lehrbuch (content/)

- Die Kapitel wurden **neu verfasst** und gegenüber „Easy 6502“ (Nick Morgan, CC BY 4.0) umgegliedert: andere Reihenfolge, kleinere Schritte, eigene Beispiele und Aufgaben. Die Gliederung und viele Beispielideen (zum Beispiel Spiegelmuster mit dem Stapel, `JSR`-Beispiel, Zeigerbeispiele) gehen auf das Original zurück. Namensnennung: Nick Morgan, https://skilldrick.github.io/easy6502/, Lizenz CC BY 4.0.
- Die Schlange aus dem Original ist nicht mehr Teil des Lehrbuchs; die kommentierte Fassung aus 6502js liegt in der Beispielauswahl.
- Kapitel 18 und 19 („Übungsaufgaben Präsenz 1/2“) beruhen auf zwei Übungsblättern des Projektinhabers. Die Aufgabentexte sind übernommen, die Lösungen neu geschrieben. Die Übungsblätter stammen vom Projektinhaber und werden unter denselben Bedingungen wie das Projekt veröffentlicht (Code: GPL v3, Lehrtexte: CC BY 4.0).

## Referenz (content/*/reference.*, src/reference/)

Die Texte zu Befehlen und Adressierungsarten sind eigens geschrieben. Die Opcode-Tabelle und die Taktzahlen richten sich nach der Dokumentation von John Pickens, Bruce Clark und Ed Spittles (6502.org, „NMOS 6502 Opcodes“), die Taktzahlen und der Seitenfehler von `JMP ($xxFF)` nach den allgemein bekannten Eigenschaften des NMOS-6502.

## Seite „Über“

Die Lizenz- und Herkunftsangaben in der Oberfläche (`content/*/about.md`) fassen diese Datei zusammen. Bei Änderungen an einer der beiden Stellen bitte die andere nachführen.
