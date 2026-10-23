# Comparing and branching

So far every program ran stubbornly from top to bottom. It gets interesting when the program makes decisions. For that there are **branch instructions**. They jump to another place in the program if a flag has a certain value, and do nothing otherwise.

## Labels

To name the target of a jump you put a **label** in the source: a name with a colon that marks a place in the program. The assembler converts the name into the right address.

## Branching on equal and not equal

```asm expect=X:03,$0200:03,$0201:03
  LDX #$08
count:             ; <- this is a label
  DEX
  STX $0200
  CPX #$03
  BNE count        ; back to "count" if X is not 3
  STX $0201
  BRK
```

What happens here?

1. `LDX #$08` sets `X` to 8.
2. Under the label `count:` is the start of a **loop**: `DEX` decreases `X` by 1, `STX $0200` shows it as a pixel colour at the top left.
3. `CPX #$03` **compares** `X` with 3 (*compare X*). Nothing is changed; only the flags are set: `Z` is 1 if both are equal.
4. `BNE count` (*branch if not equal*) jumps back to the label as long as `Z` is zero, that is as long as `X` is not yet 3. Otherwise the program simply continues with the next line.

Go through the program with **Single step**: in the **execution** panel you see the program counter jump back after `BNE`, and register `X` counts down.

## The compare instructions

| Instruction | Compares |
|---|---|
| `CMP` | `A` with a number |
| `CPX` | `X` with a number |
| `CPY` | `Y` with a number |

After the comparison the flags show the result:

| Case | `Z` | `C` |
|---|---|---|
| register = number | 1 | 1 |
| register > number | 0 | 1 |
| register < number | 0 | 0 |

(`C` here means “no borrow needed”: the register is at least as large as the number.)

## The branch instructions

| Instruction | Jumps if … | Meaning |
|---|---|---|
| `BEQ` | `Z` = 1 | **eq**ual |
| `BNE` | `Z` = 0 | **n**ot **e**qual |
| `BCS` | `C` = 1 | **c**arry **s**et: greater or equal |
| `BCC` | `C` = 0 | **c**arry **c**lear: less than |
| `BMI` | `N` = 1 | **mi**nus: top bit set |
| `BPL` | `N` = 0 | **pl**us: top bit not set |
| `BVS`, `BVC` | `V` = 1 / 0 | overflow (rarely needed) |

## If … then … else

With a branch forwards you build a decision:

```asm expect=A:99
  LDX #$05
  CPX #$05
  BNE otherwise      ; not equal? then go to "otherwise"
  LDA #$99           ; equal: this
  JMP done           ; and jump over the else part
otherwise:
  LDA #$11           ; not equal: this
done:
  BRK
```

`JMP done` is a jump without a condition. It is explained in the chapter “Jumps and subroutines”; here it only prevents the else part from running after the then part.

## How far can you jump?

In machine code a branch does not hold the target address, only **one byte** with the distance to the next instruction: positive (up to 127) forwards, “negative” (down to −128) backwards. You can read it in the execution panel: `BNE count` appears there as the bytes `D0 F8`. `D0` is the instruction and `F8` is the distance −8: eight bytes back, counted from the end of the branch.

So branches only reach about 128 bytes. If you have to jump further, use `JMP`. If the assembler reports “Branch target too far away”, that is exactly what happened.

::: merke
First set the flag (for example with `CMP`), then react to it with `Bxx`. Almost every instruction changes the flags; so there is normally no other instruction between the comparison and the branch.
:::

## Tasks

::: aufgabe BEQ
The counterpart of `BNE` is `BEQ`. Write a program that uses `BEQ`: load `$07` into `A`; if `A` equals `$07`, load `$01` into `X`, otherwise `$02`.
:::

::: loesung Solution
```asm expect=X:01
  LDA #$07
  CMP #$07
  BEQ equal
  LDX #$02
  JMP done
equal:
  LDX #$01
done:
  BRK
```
:::

::: aufgabe Greater or less
`BCS` and `BCC` decide between “greater or equal” and “less than”. Write a program that compares `$12` with `$10` and sets `Y` to 1 if `$12` is greater or equal, otherwise to 0.
:::

::: loesung Solution
```asm expect=Y:01
  LDA #$12
  CMP #$10
  BCS big
  LDY #$00
  JMP done
big:
  LDY #$01
done:
  BRK
```
:::
