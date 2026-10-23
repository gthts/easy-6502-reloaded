# The stack

The **stack** is a temporary store for numbers that works like a pile of plates: what was put on top last is taken off first. Putting on is called **push**, taking off is called **pull** in 6502 language.

The stack lives in memory, in the addresses `$0100` to `$01FF`. It grows from top to bottom: the **stack pointer** `SP` points to the next free cell. At first `SP = $FF`, so it points to `$01FF`. Every push writes into that cell and decreases the pointer by 1; every pull increases it by 1 and reads.

## The instructions

| Instruction | Effect |
|---|---|
| `PHA` | **P**us**h** **A**: put `A` on the stack |
| `PLA` | **Pul**l **A**: take the top value from the stack into `A` |
| `PHP` | **P**us**h** **P**rocessor status: put the flags on the stack |
| `PLP` | **Pul**l **P**rocessor status: get the flags back |
| `TSX`, `TXS` | copy `SP` to `X` / copy `X` to `SP` |

## The first example

```asm expect=A:03,X:05
LDA #$03
PHA            ; 3 onto the stack
LDA #$05
PHA            ; 5 on top of it
PLA            ; last in, first out: A = 5
TAX            ; remember it in X
PLA            ; now the 3: A = 3
BRK
```

Go through it with **Single step** and watch the stack pointer `SP` in the **registers** panel and the **Stack** line, which shows the top bytes of the stack: after the first `PHA`, `SP = $FE`, after the second `$FD`. In the **monitor** (go to `$01F0`) you see the same numbers in memory.

::: merke
The stack is “last in, first out”: you get the values back in the reverse order from which you put them on.
:::

## A visible example

This program mirrors a pattern: the first loop draws colours from left to right and puts them on the stack on the way; the second takes them off again in reverse order and draws them next to it.

```asm expect=$0200:00,$020F:0F,$0210:0F,$021F:00
  LDX #$00
  LDY #$00
first:
  TXA
  STA $0200,Y
  PHA
  INX
  INY
  CPY #$10
  BNE first      ; as long as Y is not $10
second:
  PLA
  STA $0200,Y
  INY
  CPY #$20
  BNE second
  BRK
```

`X` holds the colour, `Y` the position. In the first loop there are 16 colours from `$00` to `$0F`, and next to them they follow backwards: a mirror image.

## What else is it for?

The stack has two main jobs:

- as a **temporary store** when you have more values to remember than there are registers, and
- for **subroutines**: the processor remembers there where to return to (next chapter).

## Tasks

::: aufgabe Swapping via the stack
The accumulator holds `$AA`, register `X` holds `$BB`. Swap the two values (`A` should end up with `$BB`, `X` with `$AA`). Use the stack for it.
:::

::: loesung Solution
```asm expect=A:BB,X:AA
LDA #$AA
LDX #$BB
PHA            ; $AA onto the stack
TXA            ; A = X (= $BB)
TAY            ; Y = $BB as a temporary store
PLA            ; A = $AA, back from the stack
TAX            ; X = $AA
TYA            ; A = $BB
BRK
```

The stack holds the old `A`, register `Y` serves as a temporary store for `$BB`. With `TXA`, `TAY`, `PLA`, `TAX` and `TYA` the values slip past each other.
:::

::: aufgabe Turning three values around
Put `$01`, `$02`, `$03` on the stack one after the other with `PHA` and get them back. In which order do they come? Write them in order to cells `$30`, `$31`, `$32`.
:::

::: loesung Solution
```asm expect=$0030:03,$0031:02,$0032:01
LDA #$01
PHA
LDA #$02
PHA
LDA #$03
PHA
PLA
STA $30
PLA
STA $31
PLA
STA $32
BRK
```
:::
