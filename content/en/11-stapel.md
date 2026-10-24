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

Note: `PLA` does not erase the number from memory. When you pull a value, only the stack pointer `SP` changes; the value stays in `$01FE` or `$01FF` until a later `PHA` simply overwrites it. Erasing would be wasted work, because the stack pointer already determines how far the stack extends.

::: merke
The stack is “last in, first out”: you get the values back in the reverse order from which you put them on.
:::

## The limits of the stack

The stack has only 256 bytes (`$0100` to `$01FF`), and the 6502 **checks nothing**:

- **Too many `PHA`:** With `SP = $00`, `PHA` writes to `$0100` and sets `SP` back to `$FF`. The stack wraps around, and the new value silently overwrites the oldest one.
- **Too many `PLA` (on an empty stack):** Empty means `SP = $FF`. A `PLA` sets `SP` to `$00` and fetches whatever happens to be in `$0100`: garbage.

There is no error message. The programmer is responsible: every `PHA` needs its `PLA`, and a subroutine must leave the stack as it found it.

```asm expect=SP:FF,$0100:77
LDX #$00
TXS            ; SP = $00: the stack counts as “full”
LDA #$77
PHA            ; writes to $0100, SP wraps back to $FF
BRK
```

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
The accumulator holds `$AA`, register `X` holds `$BB`. Swap the two values (`A` should end up with `$BB`, `X` with `$AA`). Use the stack for it. Think first: why are the transfer instructions (`TAX`, `TXA` …) alone not enough for the swap?
:::

::: loesung Solution and reflections
Transfer instructions alone cannot do it: `TAX` overwrites `X` before its old value has been saved, and `TXA` does the same to `A`. A swap always needs a **third place** that holds one of the two values for a moment. That can be a third register:

```asm expect=A:BB,X:AA
LDA #$AA
LDX #$BB
PHA            ; remember A
TXA            ; A = X (= $BB)
TAY            ; Y = $BB as a temporary store
PLA            ; A = $AA, back from the stack
TAX            ; X = $AA
TYA            ; A = $BB
BRK
```

But you can also manage **without `Y` and without a memory cell of your own** by using the fact that the stack forgets nothing: a `PLA` only changes `SP`, the number stays in memory. You put `$AA` on the stack, set `SP` back (which “forgets” the value) and then read it directly from stack memory:

```asm expect=A:BB,X:AA,SP:FF
LDA #$AA
LDX #$BB
PHA            ; $AA onto the stack (cell $01FF), SP = $FE
TXA            ; A = $BB
TSX            ; X = SP = $FE
INX            ; X = $FF
TXS            ; SP = $FF: the stack counts as empty again, but $AA still lies in $01FF
LDX $01FF      ; ... and is read from there
BRK
```

The fixed address `$01FF` is right because `SP` was `$FF` at the start. (There is no `LDX $0100,X`: `LDX` only knows `Y` as an index.)

**What is fastest?** When processor cycles count, a zero-page cell as a temporary store wins: just 3 instructions and **8 cycles**. Both solutions above need 15 cycles.

```asm expect=A:BB,X:AA
LDA #$AA
LDX #$BB
STA $10        ; 3 cycles: park A
TXA            ; 2 cycles: A = X
LDX $10        ; 3 cycles: X = old A
BRK
```

So the stack only pays off if no cell and no register is free, or if you need it for something else anyway.
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
