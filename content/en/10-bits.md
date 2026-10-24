# Bits: logic and shifting

So far you have treated bytes as numbers. This chapter shows how to treat them as a row of eight individual bits: clearing, setting, flipping, shifting and testing them.

## The logic instructions

All three combine `A` with a number or memory cell bit by bit. The result is in `A` again.

| Instruction | Name | The result bit is 1 if … |
|---|---|---|
| `AND` | and | both bits are 1 |
| `ORA` | or | at least one bit is 1 |
| `EOR` | exclusive or | exactly one bit is 1 (the bits differ) |

### `AND`: keeping or clearing bits (mask)

With `AND` you keep exactly the bits where the mask has a 1; all others become 0.

```asm expect=A:0B
LDA #$DB       ; 1101 1011
AND #$0F       ; 0000 1111  -> stays: 0000 1011
BRK
```

Here only the low nibble remains: `$DB` becomes `$0B`.

### `ORA`: setting bits

With `ORA` you set bits to 1 without touching the others.

```asm expect=A:0F
LDA #$0A       ; 0000 1010
ORA #$05       ; 0000 0101  -> 0000 1111
BRK
```

### `EOR`: flipping bits

With `EOR` you flip exactly the bits where the mask has a 1. Applied twice, it gives back the original. That is used later for swapping without a temporary store.

```asm expect=A:0F,X:0F
LDA #$0F       ; 0000 1111
EOR #$FF       ; flip all bits -> 1111 0000
TAX
EOR #$FF       ; and back
TAX
BRK
```

And a surprising use: `EOR` of a number with itself gives 0, because then all bits are equal.

```asm expect=A:00,Z:1
LDA #$5A
EOR #$5A
BRK
```

## Shifting

The shift instructions move all bits one place. The bit that falls out lands in the carry flag.

| Instruction | Effect |
|---|---|
| `ASL` | **a**rithmetic **s**hift **l**eft: to the left, a 0 comes in on the right |
| `LSR` | **l**ogical **s**hift **r**ight: to the right, a 0 comes in on the left |
| `ROL` | **ro**tate **l**eft: to the left, the old carry comes in on the right |
| `ROR` | **ro**tate **r**ight: to the right, the old carry comes in on the left |

A left shift by one place **doubles** the number, a right shift **halves** it (rounded down). That is faster than any multiplication:

```asm expect=A:20
LDA #$08       ; 0000 1000 = 8
ASL A          ; 0001 0000 = 16
ASL A          ; 0010 0000 = 32 = $20
BRK
```

`ASL A` works on the accumulator (addressing mode “accumulator”). The shift instructions also exist for memory cells: `ASL $10`.

The bit that was pushed out is in the carry flag:

```asm expect=A:02,C:1
LDA #$81       ; 1000 0001
ASL A          ; 0000 0010, carry = 1: the top bit fell out
BRK
```

And to the right: the 3 (`0000 0011`) becomes 1, the bit that fell out is in the carry.

```asm expect=A:01,C:1
LDA #$03
LSR A
BRK
```

## Testing a single bit

The top bit (bit 7) affects the flag `N`. So with `BMI` and `BPL` you test it for free. For any other bit you use `AND` with a mask and then test `Z`:

```asm expect=X:01
LDA #%00100100
AND #%00000100    ; isolate bit 2
BEQ not_set       ; result 0 -> the bit was not set
LDX #$01          ; the bit was set
JMP done
not_set:
LDX #$00
done:
BRK
```

## Tasks

::: aufgabe Keep the upper nibble
Take the value `$DB` and keep only the **upper** nibble: the lower nibble is to be set to 0, so that `$D0` results. Use `AND` with the right mask.
:::

::: loesung Solution
```asm expect=A:D0
LDA #$DB
AND #$F0
BRK
```
:::

::: aufgabe Times eight
Multiply `$03` by 8 without `ADC` and keep the result in `X`.
:::

::: loesung Solution
Double three times: 3 · 2 · 2 · 2 = 24 = `$18`.

```asm expect=X:18
LDA #$03
ASL A
ASL A
ASL A
TAX
BRK
```
:::

::: aufgabe Shifting without ASL
How do you turn `$08` into `$20`, that is **multiply it by four** (8 · 4 = 32), without using `ASL`? (There are at least two ways.)
:::

::: loesung Solution
You can add the number to itself (`$08 + $08 = $10`, once more `$10 + $10 = $20`):

```asm expect=A:20
CLC
LDA #$08
STA $10
ADC $10        ; 8 + 8 = $10
STA $10
ADC $10        ; $10 + $10 = $20
BRK
```

Or with `ROL` instead of `ASL`:

```asm expect=A:20
CLC            ; the carry must be 0, otherwise a 1 slips in
LDA #$08
ROL A
ROL A
BRK
```
:::
