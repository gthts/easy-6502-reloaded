# Loops

A **loop** repeats part of the program. You have already seen one in the last chapter: a label, a few instructions and a branch instruction that jumps back. This chapter turns that into a tool.

## The counting loop

The basic pattern: a counter (usually `X` or `Y`) is changed in every round, and at the end of the round a comparison decides on another round.

```asm expect=X:05
  LDX #$00
round:
  INX
  CPX #$05
  BNE round
  BRK
```

The body of the loop here is just `INX`. It runs five times, then `X` equals 5 and `BNE` falls through.

## A counter without a comparison

Branch instructions check the flags of the **last** instruction. `DEX` also sets `Z` if the result is 0. If you count backwards from a start value down to 0, you save the comparison:

```asm expect=X:00,A:0F
  LDX #$05
sum:
  CLC
  TXA
  ADC $10         ; adds the contents of memory cell $10
  STA $10
  DEX
  BNE sum
  LDA $10
  BRK
```

This example adds 5+4+3+2+1 = 15 in memory cell `$10`. (`ADC $10` without `#` calculates with the *contents* of the cell; the next chapter explains it in more detail. At first `$10` holds 0, because memory is empty at the start.) What is new is only that `DEX` itself sets the zero flag and `BNE` reacts to it.

::: hinweis
This structure is common: loops count backwards because `DEX`/`DEY` together with `BNE` make the comparison unnecessary. One drawback: the loop never runs zero times. With `X = 0` at the start, `DEX` would jump to 255 and run 256 rounds.
:::

## A visible loop

A program you can see: the dot at the top left runs through the colours.

```asm
  LDX #$00
colour:
  STX $0200
  INX
  JMP colour
```

This runs through all 256 values (only the low 4 bits determine the colour, so the 16 colours repeat). At high speed it is just flicker. Choose a smaller number such as “20/s” under “Speed” in the menu, and you can follow the colour changes one by one.

## Delay: a loop within a loop

The processor is fast; if you want something slow, you have to keep it busy. That works with a **delay loop**: a loop that does nothing. Nest two of them, and the waiting time becomes long.

```asm
  LDX #$00
colour:
  STX $0200
  INX
  LDY #$FF
wait:
  DEY
  BNE wait
  JMP colour
```

The inner loop (`wait`) counts `Y` from 255 down to 0 and uses up well over a thousand cycles. Only then does it continue with the next colour. At high speed the colour now changes at a pace you can follow.

## Tasks

::: aufgabe Sum 0 to 5
Count from 0 to 5 and add up all the numbers. The result (0+1+2+3+4+5 = 15) should end up in memory cell `$70`.
:::

::: loesung Solution
`A` holds the running sum, `X` the counter. Because `ADC` only calculates with a number or a memory cell, the loop puts the counter in `$71` for a moment.

```asm expect=$0070:0F
  LDA #$00       ; sum
  LDX #$00       ; counter
round:
  STX $71        ; keep the counter for a moment
  CLC
  ADC $71        ; sum += counter
  INX
  CPX #$06
  BNE round
  STA $70
  BRK
```
:::

::: aufgabe Counting to five
Set memory cell `$B0` to 0 and increase it five times with `INC $B0` (an instruction that increases a memory cell by 1) in a loop.
:::

::: loesung Solution
```asm expect=$00B0:05
  LDA #$00
  STA $B0
  LDX #$05
again:
  INC $B0
  DEX
  BNE again
  BRK
```
:::
