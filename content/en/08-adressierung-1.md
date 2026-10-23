# Addressing I: number, zero page, address

Almost every instruction needs an **operand**: the number or memory location it is supposed to work with. How you specify it is called the **addressing mode**. The 6502 has thirteen of them. That sounds like a lot, but you learn them best in small groups. This chapter covers the simplest ones.

## Implied and accumulator

Some instructions need no operand because it is part of the instruction: `INX` always counts `X` up, `CLC` always clears the carry flag. This is **implied** addressing.

Some instructions work optionally on `A`, such as the shift `ASL A` (chapter 10). This is called **accumulator** addressing.

## Immediate: `#$c0`

The number is part of the instruction.

```asm expect=X:01
LDX #$01     ; X = 1
```

You know this already. The `#` says: “the number itself.”

## Absolute: `$c000`

Here the instruction contains an **address** where the operand is found. An address consists of two bytes, in the instruction first the low byte, then the high byte: `STA $0420` becomes the three bytes `8D 20 04`.

```asm expect=$0420:07
LDA #$07
STA $0420    ; store A in cell $0420
```

## Zero page: `$c0`

Memory is divided into **pages** of 256 bytes each. The first page, the addresses `$0000` to `$00FF`, is called the **zero page**. Its addresses fit in a single byte. That is why almost all instructions have a shorter and faster form for it.

Try it. Write these two lines, assemble them and look in the **execution** panel at how many bytes each instruction has:

```asm
STA $22      ; zero page: 85 22          (2 bytes)
STA $2222    ; absolute:  8D 22 22       (3 bytes)
```

The zero-page line needs one byte less and runs one cycle faster (3 instead of 4). The assembler picks the short form by itself as soon as the address is known and below `$0100`.

That is why the zero page is used for important **variables**: small memory locations a program accesses often. You can look at the contents in the **monitor**: enter `$0000` under “Go to”.

::: hinweis
In this environment the cells `$FE` and `$FF` are reserved: `$FE` returns a random number on every read, `$FF` holds the key pressed last (chapter “Input and randomness”). Do not put your own variables there.
:::

## Number or address?

The most common beginner's mistake: forgetting the `#`. The difference:

```asm expect=A:05
LDA #$05     ; A gets the number 5
STA $01      ; cell $01 now holds 5
LDA #$00     ; A is 0 again
LDA $01      ; A gets the CONTENTS of cell $01: 5 again
```

And with `ADC`:

```asm expect=A:00,C:1,Z:1
CLC
LDA #$80
STA $01
ADC $01      ; adds the contents of $01, that is $80 (not the number 1)
BRK
```

`ADC #$01` would add 1; `ADC $01` adds the **contents** of cell `$01`. Here that is `$80`. The result `$80 + $80 = $100` does not fit in a byte: `A` is `$00`, the carry flag 1.

::: merke
`#$05` is the number 5. `$05` is the memory cell number 5. When reading a program, check first: is there a `#` in front?
:::

## Relative

You know branch instructions like `BNE`: they jump a small distance forwards or backwards. That is **relative** addressing; in the source you write a label, and the assembler calculates the distance.

## Overview

| Mode | Notation | Example |
|---|---|---|
| implied | – | `INX` |
| accumulator | `A` | `ASL A` |
| immediate | `#$c0` | `LDA #$05` |
| zero page | `$c0` | `LDA $05` |
| absolute | `$c000` | `LDA $0205` |
| relative | label | `BNE loop` |

The other modes follow in the next chapters: with an index (`,X` and `,Y`) and via pointers (parentheses).

## Tasks

::: aufgabe Number or cell
Store the number `$42` in cell `$30` and then copy it to cell `$31`. You may use register `A` for that.
:::

::: loesung Solution
```asm expect=$0030:42,$0031:42
LDA #$42
STA $30
LDA $30      ; load the contents of $30
STA $31
BRK
```
:::

::: aufgabe A mistake people make
What is the difference between `LDX #$02` and `LDX $02`? Think first, then try both with a cell `$02` in which `$09` was stored beforehand.
:::

::: loesung Solution
`LDX #$02` loads the number 2, `LDX $02` the contents of cell `$02`, here 9.

```asm expect=X:09
LDA #$09
STA $02
LDX #$02     ; X = 2
LDX $02      ; X = 9
BRK
```
:::
