# Numbers: decimal, hexadecimal, binary

A byte consists of eight **bits**, each bit is 0 or 1. That gives 2⁸ = 256 different bytes, the numbers 0 to 255. Computers only know bits; for us humans there are three common ways to write the same number:

| Notation | Prefix | Example for “fifteen” |
|---|---|---|
| decimal | none | `15` |
| hexadecimal | `$` | `$0F` |
| binary | `%` | `%00001111` |

All three are allowed in the source. This loads the same number three times:

```asm expect=A:0F
LDA #15
LDA #$0F
LDA #%00001111
```

## Why hexadecimal?

Hexadecimal counts with 16 digits: `0` to `9` and then `A` to `F` for ten to fifteen. The reason for this notation: a byte consists of two halves of four bits each (a **nibble**), and each half is exactly one hex digit.

| Binary | Hex | Decimal | | Binary | Hex | Decimal |
|---|---|---|---|---|---|---|
| `0000` | `0` | 0 | | `1000` | `8` | 8 |
| `0001` | `1` | 1 | | `1001` | `9` | 9 |
| `0010` | `2` | 2 | | `1010` | `A` | 10 |
| `0011` | `3` | 3 | | `1011` | `B` | 11 |
| `0100` | `4` | 4 | | `1100` | `C` | 12 |
| `0101` | `5` | 5 | | `1101` | `D` | 13 |
| `0110` | `6` | 6 | | `1110` | `E` | 14 |
| `0111` | `7` | 7 | | `1111` | `F` | 15 |

So `$DB` is the number `1101 1011`: the `D` gives `1101`, the `B` gives `1011`. Conversely, you can quickly rewrite any byte in hex without calculating. The value of a two-digit hex number `$hl` is 16 · h + l; so `$DB` is 13 · 16 + 11 = 219.

::: merke
One hex digit = four bits. One byte = two hex digits. That is why `$` numbers appear everywhere in assembly programs.
:::

## The registers in three notations

In the **registers** panel the emulator shows `A`, `X` and `Y` in hexadecimal, decimal and binary at the same time. Try it:

```asm expect=A:DB
LDA #$DB
```

Press **Send and run** and look at register `A`: `$DB`, `219` and `%1101 1011` mean the same thing.

## Numbers that are too big

A byte holds at most 255. If you keep counting, the counter starts again at 0, like the odometer of a car. In the chapter “Arithmetic” you will see how the processor reports such an overflow.

Addresses are larger than one byte: they consist of two bytes, have four hex digits (`$0200`) and go up to `$FFFF`.

## Tasks

::: aufgabe The same number three times
Load the number 200 into `A`: once in decimal, once in hexadecimal, once in binary. How do you write 200 in the two other notations?
:::

::: loesung Solution
200 = 12 · 16 + 8, so `$C8`. In binary: `1100` and `1000`, so `%11001000`.

```asm expect=A:C8
LDA #200
LDA #$C8
LDA #%11001000
```
:::

::: aufgabe Reading numbers
Which numbers are `$FF`, `%10000000` and `$10`? Check your answer by loading them into `A` and looking at the register.
:::

::: loesung Solution
`$FF` = 255 (all bits set), `%10000000` = 128 = `$80` (only the top bit), `$10` = 16.

```asm expect=A:10
LDA #$FF
LDA #%10000000
LDA #$10
```
:::
