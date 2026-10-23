# Addressing II: with an index

So far every address in the program was written out. If you want to work on a whole series of cells, such as the first screen row, you would have to write every cell individually. With **indexed addressing** the processor adds the contents of `X` or `Y` to the address on every access. A loop that changes `X` then walks through memory cell by cell.

## Absolute with index: `$c000,X` and `$c000,Y`

```asm expect=$0200:01,$0201:01,$0202:01
LDA #$01
LDX #$00
STA $0200,X    ; cell $0200 + 0
INX
STA $0200,X    ; cell $0200 + 1
INX
STA $0200,X    ; cell $0200 + 2
BRK
```

The instruction `STA $0200,X` means: “Store `A` in cell `$0200 + X`.” The program writes to three neighbouring cells with the same instruction every time.

Now in a loop: the first screen row gets 32 colours in a row.

```asm expect=$0200:00,$0201:01,$021F:1F
  LDX #$00
round:
  TXA            ; the colour is the number of the dot
  STA $0200,X
  INX
  CPX #$20       ; 32 dots
  BNE round
  BRK
```

On the screen you see the 16 colours, twice in a row (only the low four bits count).

## Filling backwards

If you count backwards, you do not need a comparison. You see this pattern often: the register runs from the length down to 0, and the access comes *after* the `DEX` so that cell 0 gets its turn too.

```asm expect=$0200:01,$0207:01,$0208:00
  LDA #$01
  LDX #$08       ; eight dots
fill:
  DEX
  STA $0200,X    ; cells 7, 6, … 0
  BNE fill
  BRK
```

## Zero page with index: `$c0,X`

The same exists for the zero page, in the short form:

```asm expect=$00A1:AA,$00A2:AA
LDX #$01
LDA #$AA
STA $A0,X      ; cell $A1
INX
STA $A0,X      ; cell $A2
BRK
```

If the sum becomes larger than a byte, the **address wraps around**: it stays in the zero page and starts again at 0.

```asm expect=$0004:77
LDX #$05
LDA #$77
STA $FF,X      ; $FF + 5 = $104, in the zero page that is $04
BRK
```

## With the Y register

`Y` can do the same as `X`: `LDA $0200,Y` and `STA $0200,Y`. There are a few special cases:

- `LDX` and `STX` use `Y` as the index (`LDX $40,Y`), because `X` cannot index itself.
- `LDY` and `STY`, on the other hand, use `X` (`STY $40,X`).
- Exceptions only concern a few instructions; the assembler reports when a combination does not exist. The reference lists which modes exist for each instruction.

## Copying an area

With an index you can walk through two areas at once: reading from one address, writing to another.

```asm expect=$0220:00,$0221:01,$023F:1F
  LDX #$00
fill:
  TXA
  STA $0200,X    ; fill the first row with numbers
  INX
  CPX #$20
  BNE fill
  LDX #$00
copy:
  LDA $0200,X    ; read from row 1
  STA $0220,X    ; write to row 2
  INX
  CPX #$20
  BNE copy
  BRK
```

## Tasks

::: aufgabe Stripe
Fill the third screen row (`$0240` to `$025F`) with the colour green (`$05`).
:::

::: loesung Solution
```asm expect=$0240:05,$025F:05,$0260:00
  LDA #$05
  LDX #$20       ; 32 dots
fill:
  DEX
  STA $0240,X
  BNE fill
  BRK
```
:::

::: aufgabe Swap two rows
Draw red (`$02`) dots in row 1 and yellow (`$07`) dots in row 2. Then swap the rows so that red is below and yellow above. (Hint: a temporary store in `Y` helps.)
:::

::: loesung Solution
```asm expect=$0200:07,$021F:07,$0220:02,$023F:02
  LDX #$20
fill:
  DEX
  LDA #$02
  STA $0200,X
  LDA #$07
  STA $0220,X
  CPX #$00      ; LDA changed the flags, so check explicitly
  BNE fill
  LDX #$20
swap:
  DEX
  LDA $0200,X
  TAY            ; temporary store
  LDA $0220,X
  STA $0200,X
  TYA
  STA $0220,X
  CPX #$00
  BNE swap
  BRK
```
:::
