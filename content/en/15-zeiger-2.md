# Pointers II: indexed indirect

The last chapter introduced `($zp),Y`: a pointer to which `Y` is added. There is a second kind of pointer with a similar notation and a quite different meaning. It is **rarer** and only useful when you have **several pointers** in a table.

## The notation `($zp,X)`

Here the index is *inside* the parentheses:

- First `X` is added to the **zero-page address** (`$zp + X`). That selects an entry in a table of pointers.
- Then the address stored there is read (two bytes, low byte first as always).
- The operand is at that address.

This mode does *not* add an index to the address; it only selects *which* pointer is meant.

```asm expect=A:0A
  LDX #$01
  LDA #$05
  STA $01         ; pointer low byte
  LDA #$07
  STA $02         ; pointer high byte  -> $0705
  LDY #$0A
  STY $0705       ; the value we want to find
  LDA ($00,X)     ; $00 + X = $01: the pointer $0705 is stored there
  BRK
```

Think of `($00,X)` as `($00 + X)`. Here `X` is `$01`, so the pointer at `$01` is used: `$0705`. Register `A` gets the value `Y` wrote there earlier, only by a detour.

::: merke
`($zp,X)` calculates **before** the lookup: `X` selects the entry in a table of pointers. `($zp),Y` calculates **after** the lookup: `Y` is added to the address found. The parenthesis shows where the index belongs.
:::

## What is a pointer table for?

Imagine several figures, each with its own position on the screen. You put the positions as pointers next to each other in the zero page and run through them with `X`. Because each pointer is two bytes long, you count `X` in **steps of two**.

```asm expect=$0200:01,$0205:01,$020A:01
define table $20

  ; three pointers in the zero page: $0200, $0205 and $020A
  LDA #$00
  STA table
  LDA #$02
  STA table+1
  LDA #$05
  STA table+2
  LDA #$02
  STA table+3
  LDA #$0A
  STA table+4
  LDA #$02
  STA table+5

  LDA #$01          ; colour white
  LDX #$00
figure:
  STA (table,X)     ; dot at the address the X-th pointer points to
  INX
  INX               ; next pointer: two bytes further
  CPX #$06
  BNE figure
  BRK
```

The loop runs through the three pointers at `$20`, `$22`, `$24` and draws a white dot at each place.

## Both kinds compared

| | `($zp),Y` | `($zp,X)` |
|---|---|---|
| How often used | very often | rarely |
| `X` / `Y` acts … | **after** the lookup, on the address | **before** the lookup, on the pointer table |
| Typical job | run through an area or page | pick one of several pointers |
| Pointer cells | `$zp`, `$zp+1` | `$zp+X`, `$zp+X+1` |

Both kinds need the pointer in the **zero page**. When you read other people's programs later, `($zp),Y` is the notation you will meet almost everywhere.

## Task

::: aufgabe Two dots
Create two pointers at `$30` and `$32` that point to `$0210` and `$0230`. Draw both dots in red (`$02`) with `($30,X)` and a loop.
:::

::: loesung Solution
```asm expect=$0210:02,$0230:02
define table $30

  LDA #$10
  STA table
  LDA #$02
  STA table+1
  LDA #$30
  STA table+2
  LDA #$02
  STA table+3

  LDA #$02
  LDX #$00
dot:
  STA (table,X)
  INX
  INX
  CPX #$04
  BNE dot
  BRK
```
:::
