# Pointers I: indirect indexed

With `STA $0200,X` a loop can run through 256 cells, no more: `X` and `Y` only hold one byte. And the start address is fixed in the instruction. If you want to work on larger areas, or an area whose position only becomes clear while running (for example “the row the figure is standing in right now”), you need a **pointer**: a memory location that contains an **address**.

## A pointer consists of two bytes

An address is 16 bits long, so it does not fit in one byte. You put it in **two neighbouring cells** of the zero page: first the low byte, then the high byte. This method (“little endian”) is used by the 6502 everywhere: in machine code too, the address `$0420` is stored as `20 04`.

```asm expect=$0010:20,$0011:04
  LDA #$20
  STA $10        ; low byte of the pointer
  LDA #$04
  STA $11        ; high byte
  BRK
```

Now `$10` and `$11` together contain the address `$0420`. But how do you read or write *there*?

## The notation `($10),Y`

The instruction `STA ($10),Y` means: “Get the address from `$10` and `$11`, add `Y`, and store `A` there.” That is where the mode gets its name: first an *indirect* access through cells `$10/$11`, then *indexing* with `Y`.

You can follow it step by step:

```asm expect=A:0A
  LDY #$01        ; index
  LDA #$03
  STA $01         ; pointer low byte
  LDA #$07
  STA $02         ; pointer high byte  -> pointer = $0703
  LDX #$0A
  STX $0704       ; a value we want to find again
  LDA ($01),Y     ; $0703 + 1 = $0704  ->  A = $0A
  BRK
```

`($01)` reads the two bytes `$03` and `$07` from cells `$01` and `$02` and puts them together to the address `$0703`. `Y = 1` is added; so the access goes to `$0704`.

::: merke
`($zp),Y`: the pointer is in **two zero-page cells** `$zp` and `$zp+1`. `Y` is added to the address in them. Only `Y` is allowed as the index, and the pointer must be in the zero page.
:::

::: hinweis
**Why is the pointer in the zero page?** There is no `STA ($1F10),Y`. The instruction `STA ($10),Y` is only **two bytes** long: the opcode and a one-byte address. That address names the cell where the pointer is stored, and because it holds only one byte, the pointer can only lie in the zero page (`$00`–`$FF`). The reason lies in the instruction format: this keeps the instruction short and fast. A two-byte address for the pointer would have meant a longer instruction with more cycles. The zero page is scarce (only 256 bytes), but it is the place for pointers and fast variables.
:::

## Related: the indirect jump

`JMP` can also read a pointer. `JMP ($00F0)` does not jump to `$00F0`, but to the **address stored in `$00F0` and `$00F1`**:

```asm
  LDA #$01
  STA $F0         ; low byte
  LDA #$CC
  STA $F1         ; high byte
  JMP ($00F0)     ; jumps to $CC01
```

Go through the program with **Single step**: after the `JMP`, the program counter `PC` is at `$CC01`. Memory is empty there, so the program ends with a `BRK`.

## The standard case: working on the whole screen

The screen is 1024 bytes, in four pages of 256 bytes each. The pointer knows pages: the high byte *is* the page number. To change to the next page you just increase it.

```asm expect=$0200:05,$02FF:05,$0300:05,$05FF:05
define pointer $10

  LDA #$00
  STA pointer       ; low byte: 0
  LDA #$02
  STA pointer+1     ; high byte: 2 -> pointer = $0200
  LDX #$04          ; four pages
  LDA #$05          ; colour green
page:
  LDY #$00
dot:
  STA (pointer),Y   ; one dot of the page
  INY
  BNE dot           ; Y runs from 0 to 255 and back to 0
  INC pointer+1     ; next page
  DEX
  BNE page
  BRK
```

The inner loop `dot` runs 256 times, until `Y` wraps from 255 back to 0 (which sets the zero flag). The outer loop `page` increases the high byte of the pointer and starts again, four times in all.

With this loop you can fill the screen in any colour by changing the colour before `LDA #$05`. Also try fewer pages: `LDX #$02` fills only the upper half.

## Why not simply `STA $0200,Y`?

- The pointer can **change**. A program can use the same loop for one page once and another page next time.
- You can only get across several pages with a pointer.
- For lists, strings or tables that lie at a calculated place, it is the usual tool.

## Tasks

::: aufgabe Lower half
Fill only the **lower** half of the screen (`$0400` to `$05FF`) with the colour blue (`$06`).
:::

::: loesung Solution
The pointer starts at `$0400`, two pages are enough.

```asm expect=$03FF:00,$0400:06,$05FF:06
define pointer $10

  LDA #$00
  STA pointer
  LDA #$04
  STA pointer+1
  LDX #$02
  LDA #$06
page:
  LDY #$00
dot:
  STA (pointer),Y
  INY
  BNE dot
  INC pointer+1
  DEX
  BNE page
  BRK
```
:::

::: aufgabe Copy a page
Draw a gradient in the first page of the screen (`$0200`–`$02FF`) (colour = number of the dot, with `TYA`) and copy the page to the **third** page (`$0400`–`$04FF`). For that you need two pointers.
:::

::: loesung Solution
```asm expect=$0200:00,$02FF:FF,$0400:00,$04FF:FF
define source $10
define target $12

  LDA #$00
  STA source
  STA target
  LDA #$02
  STA source+1
  LDA #$04
  STA target+1

  LDY #$00
fill:
  TYA
  STA (source),Y
  INY
  BNE fill

copy:
  LDA (source),Y
  STA (target),Y
  INY
  BNE copy
  BRK
```
:::
