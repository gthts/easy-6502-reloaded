# Registers and transfers

In the first program you already used register `A`. The 6502 has three general-purpose registers in all, each holding one byte:

| Register | Name | Purpose |
|---|---|---|
| `A` | accumulator | calculating and comparing |
| `X` | index register X | counting, later also addressing |
| `Y` | index register Y | like `X` |

Three more are shown in the **registers** panel:

- `PC`, the **program counter**, points to the next instruction.
- `SP`, the **stack pointer**, belongs to the stack (a chapter of its own).
- `P`, the **status register**: a row of single bits, the **flags**, with which the processor records properties of the last result. They are called `N V - B D I Z C`. Clicking one toggles it; try it.

## Loading and storing

Each of the three registers has a load instruction and a store instruction:

| Load | Store | Register |
|---|---|---|
| `LDA` | `STA` | `A` |
| `LDX` | `STX` | `X` |
| `LDY` | `STY` | `Y` |

## Transfers between registers

You can also copy the contents of one register into another. The names tell you what happens:

| Instruction | Meaning |
|---|---|
| `TAX` | **T**ransfer **A** to **X** |
| `TAY` | **T**ransfer **A** to **Y** |
| `TXA` | **T**ransfer **X** to **A** |
| `TYA` | **T**ransfer **Y** to **A** |

Only a copy is made; the source keeps its value.

## Counting

The index registers can be counted up and down directly:

| Instruction | Meaning |
|---|---|
| `INX` | increase `X` by 1 (*increment*) |
| `INY` | increase `Y` by 1 |
| `DEX` | decrease `X` by 1 (*decrement*) |
| `DEY` | decrease `Y` by 1 |

## An example

```asm expect=A:C0,X:C1,Y:C0
LDA #$C0   ; load the number $C0 into A
TAX        ; copy A to X
INX        ; increase X by 1
TAY        ; copy A to Y as well
BRK        ; end of the program
```

Everything after a semicolon is a **comment**: the assembler skips it, it is only there for humans. `BRK` ends the program; the emulator stops there.

Go through the program with **Single step** and watch `A`, `X` and `Y`. After `INX`, `X` is one larger than `A`.

## Flags Z and N

With every load, transfer and count, the processor remembers two things about the result:

- `Z` (zero) is 1 if the result was 0.
- `N` (negative) is 1 if the top bit (bit 7) of the result is set, that is if the number is `$80` or larger.

You can see this with this program. Go through it with **Single step** and watch the flags in the status register:

```asm expect=Z:1,N:0
LDA #$80    ; N becomes 1
LDA #$00    ; Z becomes 1, N becomes 0
```

The flags are the processor's memory. Later the branch instructions use them to decide what happens next.

## Tasks

::: aufgabe Check the transfers
You know `TAX`. Write a program that tries out `TXA` and `TYA`, and check with **Single step** whether your understanding is right.
:::

::: loesung Solution
```asm expect=A:07,X:05,Y:07
LDX #$05
LDY #$07
TXA        ; A = 5
TYA        ; A = 7 (overwrites A)
BRK
```
:::

::: aufgabe With Y instead of X
Rewrite the example above so that it uses `Y` instead of `X` for counting.
:::

::: loesung Solution
```asm expect=A:C0,Y:C1
LDA #$C0
TAY
INY
BRK
```
:::
