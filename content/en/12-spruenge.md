# Jumps and subroutines

A branch like `BNE` only reaches about 128 bytes and depends on a flag. This chapter shows two kinds of jump that are free of that.

## `JMP`: the jump without a condition

`JMP` always jumps, to any address in the whole memory.

```asm expect=$0200:03
  LDA #$03
  JMP there      ; jumps over the two BRKs
  BRK
  BRK
there:
  STA $0200
  BRK
```

If you go through it with **Single step**, you see the program counter jump over the two `BRK`s.

## Subroutines: `JSR` and `RTS`

You often need the same series of instructions in several places. Instead of copying it, you write it once as a **subroutine** and call it, just as you call a function in other languages.

| Instruction | Effect |
|---|---|
| `JSR label` | **J**ump to **S**ub**r**outine: jumps to `label` and remembers where to return |
| `RTS` | **R**e**t**urn from **S**ubroutine: jumps back, to the instruction after the `JSR` |

`JSR` puts the return address on the **stack**. The processor stores the address of the *last byte* of the `JSR` instruction there. `RTS` takes it off, adds one and jumps there.

```asm expect=X:05
  JSR prepare
  JSR count
  JSR finish

prepare:
  LDX #$00
  RTS

count:
  INX
  CPX #$05
  BNE count
  RTS

finish:
  BRK
```

How does it run?

1. `JSR prepare` jumps to the subroutine, sets `X` to 0 and returns.
2. `JSR count` jumps to the loop, counts `X` up to 5 and returns.
3. `JSR finish` jumps to `BRK`; the program ends.

Go through the program with **Single step** and watch the **Stack** line in the **registers** panel: with every `JSR` two bytes are added, with every `RTS` they disappear again.

## Two buttons for subroutines

When you check a program step by step, you do not want to go through every subroutine one instruction at a time. For that there are two buttons:

- **Skip call** executes one instruction. If it is a `JSR`, the subroutine runs through completely, and you land behind the call.
- **Run to return** keeps running until the subroutine you are currently in returns with `RTS`.

Try both on the example above.

## Passing values

A subroutine has no parameter list. Instead you agree in which register or memory cell values are passed. This one doubles `A`:

```asm expect=A:0C
  LDA #$03
  JSR double         ; A = 6
  JSR double         ; A = 12 = $0C
  BRK

double:              ; input: A   output: A
  ASL A
  RTS
```

It is worth writing a comment above every subroutine saying what it expects and what it delivers, because the source does not tell you by itself.

::: merke
`JSR` and `RTS` belong together like the outward and the return journey. If an `RTS` is missing, the program runs into the code behind it. And everything a subroutine puts on the stack, it must take off again before the `RTS`, otherwise `RTS` jumps to the wrong place.
:::

## Tasks

::: aufgabe Plus three
Write a subroutine that increases the contents of `A` by 3. Load `$02` into `A`, call the subroutine twice and write the final result to `$A0`.
:::

::: loesung Solution
```asm expect=$00A0:08
  LDA #$02
  JSR plus3
  JSR plus3
  STA $A0
  BRK

plus3:
  CLC
  ADC #$03
  RTS
```
:::

::: aufgabe Draw a dot
Write a subroutine `dot` that draws the value in `A` as a colour at the place whose number is in `X`. Then call it three times with different colours and places.
:::

::: loesung Solution
```asm expect=$0200:01,$0205:02,$021F:03
  LDA #$01
  LDX #$00
  JSR dot
  LDA #$02
  LDX #$05
  JSR dot
  LDA #$03
  LDX #$1F
  JSR dot
  BRK

dot:                 ; A = colour, X = number of the dot in row 1
  STA $0200,X
  RTS
```
:::
