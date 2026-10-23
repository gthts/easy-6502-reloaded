# Order in the program: names and data

The longer a program gets, the more numbers appear in it: addresses, colours, limits. After a few dozen lines nobody knows what `$12` means any more. The solution: give numbers names.

## Constants with `define`

`define` gives a number a name. Wherever the name appears, the assembler inserts the number.

```asm expect=$0200:01
define white $01
define screen $0200

  LDA #white
  STA screen
  BRK
```

The example is exactly `LDA #$01` and `STA $0200`, but far more readable. The notation `name = value` means the same:

```asm expect=$0010:04
colour = $04
pointer = $10

  LDA #colour
  STA pointer
  BRK
```

Names may consist of letters, digits and the underscore, and must not start with a digit. Upper and lower case are different. `LDA #white` is the number, `LDA white` would be the cell with the number `white`: the `#` still applies.

You can calculate with simple expressions: `STA pointer+1`, `LDA #height-1`, `LDA #<address` (low byte) and `LDA #>address` (high byte).

::: merke
A constant is a name for a **number**; a label is a name for a **place in the program**. Both appear in the source, and the assembler resolves both. With constants you change a number in exactly one place instead of searching for it everywhere.
:::

## Storing data: `dcb` and `dcw`

Not every byte in memory is an instruction. With `dcb` (*define constant byte*) you store bytes directly; `dcw` stores 16-bit numbers (first the low byte, then the high byte). A label in front makes the data addressable:

```asm expect=$0200:01,$0203:04,$0207:08
  LDX #$00
fetch:
  LDA colours,X     ; X-th byte of the table
  STA $0200,X
  INX
  CPX #$08
  BNE fetch
  BRK

colours:
  dcb $01,$02,$03,$04,$05,$06,$07,$08
```

The table is **behind** `BRK`, because the processor should never execute it. In the **disassembly** panel (next to the monitor) you can pick `colours`: there the table is read as instructions, which you recognise by odd instructions that are not really instructions at all. Data and program cannot be told apart in memory; only the program flow decides.

Text works too, with quotation marks:

```asm expect=$0020:48,$0021:69
  LDX #$00
fetch:
  LDA text,X
  STA $20,X
  INX
  CPX #$02
  BNE fetch
  BRK

text:
  dcb "Hi"
```

## The memory map

A program has to decide what goes where. In this environment:

| Area | Use |
|---|---|
| `$0000` – `$00FF` | Zero page: variables. `$FE` and `$FF` are reserved (random, key). |
| `$0100` – `$01FF` | Stack |
| `$0200` – `$05FF` | Screen |
| `$0600` – `$FFFF` | Program and data; the program starts at `$0600` by default. |

With `*= address` (or equivalently `.org address`) you move the place where things continue. That is rarely necessary; an example:

```asm expect=$0700:AA,$0701:BB
  LDA $0700      ; reads the data below
  BRK

*= $0700
data:
  dcb $AA,$BB
```

## Commenting well

A comment says **why** something happens, not **what** the instruction does. `INX ; increase X by one` is superfluous. `INX ; next enemy` is helpful. It is also worth putting a header at the start of every program saying what it does and which memory locations it uses.

## Tasks

::: aufgabe With names
Rewrite the “three dots” program from the second chapter so that the colours and the address of each dot are named constants.
:::

::: loesung Solution
```asm expect=$0200:01,$0201:05,$0202:08
define dot1 $0200
define dot2 $0201
define dot3 $0202
define white $01
define green $05
define orange $08

  LDA #white
  STA dot1
  LDA #green
  STA dot2
  LDA #orange
  STA dot3
  BRK
```
:::

::: aufgabe Drawing a table
Create a table with the colour values `$02, $04, $06, $08, $0A` and draw it as the first five dots of the top row.
:::

::: loesung Solution
```asm expect=$0200:02,$0204:0A
  LDX #$00
fetch:
  LDA table,X
  STA $0200,X
  INX
  CPX #$05
  BNE fetch
  BRK

table:
  dcb $02,$04,$06,$08,$0A
```
:::
