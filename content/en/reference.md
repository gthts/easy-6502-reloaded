# Overview

## This environment

| Addresses | Use |
|---|---|
| `$0000` – `$00FF` | Zero page: fast variables and pointers |
| `$00FE` | returns a **random number** (0 to 255) every time it is read |
| `$00FF` | holds the code of the **last key pressed** (click the screen first!) |
| `$0100` – `$01FF` | Stack (grows downwards, `SP` starts at `$FF`) |
| `$0200` – `$05FF` | **Screen**: 32 × 32 pixels, one byte per pixel (only the low 4 bits count) |
| `$0600` – `$FFFF` | Program (the source is placed from `$0600`) and free memory |

The program starts at `$0600`. `BRK` stops it; empty memory contains `BRK`, so a program without an end runs into a stop.

Keys: `W`/arrow up `$77`, `A`/arrow left `$61`, `S`/arrow down `$73`, `D`/arrow right `$64`.

## The 16 colours

| `$0` | `$1` | `$2` | `$3` | `$4` | `$5` | `$6` | `$7` |
|---|---|---|---|---|---|---|---|
| black | white | dark red | light cyan | purple | green | blue | yellow |

| `$8` | `$9` | `$A` | `$B` | `$C` | `$D` | `$E` | `$F` |
|---|---|---|---|---|---|---|---|
| orange | brown | light red | dark grey | grey | light green | light blue | light grey |

## Source code notation

| What | Notation | Example |
|---|---|---|
| Number | `$` hexadecimal, `%` binary, otherwise decimal, `'a'` character | `$FF`, `%1010`, `200`, `'A'` |
| Label | name with a colon | `loop:` |
| Constant | `define name value` or `name = value` | `define colour $05` |
| Expression | `+ − * / & \| ^`, parentheses, `<` low byte and `>` high byte, `*` current address | `LDA #<table`, `STA pointer+1` |
| Start address | `*= address` or `.org address` | `*= $0700` |
| Bytes | `dcb`, `.byte`, `.db` | `dcb 1,2,$FF,"Hi"` |
| 16-bit numbers | `dcw`, `.word`, `.dw` (low byte first) | `dcw table` |
| Text | `.text`, `.ascii` | `.text "Hello"` |
| Reserve space | `.res count[,value]` | `.res 16` |
| Comment | from `;` to the end of the line | `INX ; next one` |

Instruction names may be written in upper or lower case; labels and constants are case-sensitive.

## Controls

| Where | How | Effect |
|---|---|---|
| Source | `Tab` / `Shift+Tab` | indent and outdent (also several lines) |
| Source | `Ctrl+S` | save file |
| Source | `F1` over an instruction name | opens the instruction in this reference |
| Line number | click | set or clear a breakpoint |
| Execution, disassembly | click a line | breakpoint |
| Execution | double-click, or drag the highlighted line | move the program counter there |
| Execution, disassembly | click the instruction name | open the instruction in the reference |
| Monitor | click a byte, type two hex digits | overwrite the byte |
| Registers | type a value, click a flag | change the register or flag |

## The flags

The status register `P` consists of eight bits:

| Flag | Name | Meaning |
|---|---|---|
| `N` | Negative | bit 7 of the result |
| `V` | Overflow | overflow in signed arithmetic |
| `-` | | always 1, no meaning |
| `B` | Break | pushed onto the stack by `BRK` and `PHP` |
| `D` | Decimal | decimal mode for `ADC` and `SBC` |
| `I` | Interrupt | interrupt disable (no effect here) |
| `Z` | Zero | the result was 0 |
| `C` | Carry | carry, or “nothing borrowed” |

## Cycles

The tables give the number of cycles per instruction. “+” means: one more cycle if adding `X`/`Y` to the address crosses a page boundary (reading instructions only). For branches, one cycle is added if the branch is taken, and one more if the target is on another page.

## Sources

The opcode table follows the documentation by John Pickens, Bruce Clark and Ed Spittles (6502.org) and was checked with Klaus Dormann's functional test. Undocumented (“illegal”) instructions are not included.
