# Arithmetic: adding, subtracting, carry

The 6502 can add and subtract, always in register `A`:

| Instruction | Meaning |
|---|---|
| `ADC` | **Ad**d with **C**arry: add a number plus the carry to `A` |
| `SBC` | **S**ubtract with **C**arry: subtract a number and the borrowed carry from `A` |

The result is in `A` afterwards.

## A first calculation

```asm expect=A:38
CLC          ; clear the carry (more on this in a moment)
LDA #$15
ADC #$23     ; $15 + $23 = $38
BRK
```

The numbers are hexadecimal: `$15` is 21 and `$23` is 35, and the sum 56 is `$38`. Register `A` shows you the result in all three notations.

## The carry flag

What happens when the result is larger than 255? Try it:

```asm expect=A:84,C:1
CLC
LDA #$C0
ADC #$C4     ; $C0 + $C4 = $184, does not fit in a byte
BRK
```

`$184` does not fit in a byte (the maximum is `$FF`). So `A` only holds the low byte, `$84`. But nothing is lost: the **carry flag** `C` becomes 1. It is the “carry” bit we know from written addition.

::: merke
If a result does not fit in a byte, the low byte stays in `A` and the flag `C` becomes 1.
:::

## Why `CLC` at the start?

`ADC` always adds the carry flag as well. If a carry from an earlier calculation was still there, the result would be 1 too large. So before a single addition you clear it with `CLC` (**Cl**ear **C**arry). The counterpart is `SEC` (**Se**t **C**arry).

With subtraction it is the other way round: the carry flag means “nothing borrowed”, so it must be **set** before `SBC`:

```asm expect=A:09,C:1
SEC          ; nothing borrowed
LDA #$10
SBC #$07     ; $10 - $07 = $09
BRK
```

If the result of a subtraction drops below zero, `C` becomes 0 and `A` “wraps around backwards”:

```asm expect=A:F0,C:0,N:1
SEC
LDA #$10
SBC #$20     ; 16 - 32 = -16, as a byte $F0
BRK
```

`$F0` is 240: counting backwards from 16 in 32 steps (`$20`) lands on 240. You can read that as “minus 16”. Because the top bit (bit 7) of the result is set as well, the flag `N` (“negative”) is also set. How to react to `C` and `N` is shown in the next chapter, on branching.

## The zero flag and the carry as a message

If the result is exactly 0, `Z` is set too. Here we add `$80 + $80 = $100`:

```asm expect=A:00,C:1,Z:1
CLC
LDA #$80
ADC #$80
BRK
```

`A` is `$00`, `C` is 1 (carry) and `Z` is 1 (result zero). Programs react to these messages with the branch instructions of the next chapter.

## Bigger numbers: two bytes

With the carry you can also add numbers larger than 255. You calculate byte by byte and pass the carry on: first the low byte (no `CLC` before the second step, `ADC` takes the carry along!), then the high byte.

Example: `$01F0 + $0120 = $0310`.

```asm expect=$0010:10,$0011:03
CLC
LDA #$F0     ; low byte of the first number
ADC #$20     ; low byte of the second number
STA $10      ; result, low byte
LDA #$01     ; high byte of the first number
ADC #$01     ; high byte + carry from the first step
STA $11      ; result, high byte
BRK
```

## Tasks

::: aufgabe Add two numbers
Add 5 and 7 in the accumulator and store the result in memory cell `$80`.
:::

::: loesung Solution
```asm expect=$0080:0C,A:0C
CLC
LDA #5
ADC #7
STA $80
BRK
```
:::

::: aufgabe Subtract
Calculate `$50 - $18` and keep the result in `X`.
:::

::: loesung Solution
```asm expect=X:38
SEC
LDA #$50
SBC #$18
TAX
BRK
```
:::

::: aufgabe Spot the carry
Add `$FF + $01` and watch `A`, `C` and `Z`. What is different if you add `$00` instead of `$01`?
:::

::: loesung Solution
With `$FF + $01` you get `A = $00` with `C = 1` and `Z = 1`. With `$FF + $00`, `A` stays `$FF` and `C` stays 0.

```asm expect=A:00,C:1,Z:1
CLC
LDA #$FF
ADC #$01
BRK
```
:::
