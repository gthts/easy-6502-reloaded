# The first program

In the first chapter you ran a tiny program that drew a single white dot at the top left. It consisted of the two lines `LDA #$01` and `STA $0200`. Here we add two more pairs like it, so that three coloured dots appear. You already know the first two lines; the rest is new and shows how the pattern repeats.

```asm expect=$0200:01,$0201:05,$0202:08
LDA #$01
STA $0200
LDA #$05
STA $0201
LDA #$08
STA $0202
```

Press **Send and run**. Three coloured dots appear at the top left; the first is the white dot from before. The program consists of just two different instructions, repeated.

## Two instructions

- `LDA #$01` means **L**oa**d A**: “Load the value `$01` into register `A`.”
- `STA $0200` means **St**ore **A**: “Store the contents of `A` at memory address `$0200`.”

A **register** is a small box right inside the processor. Register `A` is also called the **accumulator**; most calculations go through it. It holds exactly one byte, a number from 0 to 255.

The `#` sign is important: `LDA #$01` loads the number `$01` itself. Without `#`, `$01` would be an address, and the processor would load the *contents* of the memory cell with that address. We come back to this in the chapter “Addressing I”.

::: merke
`#` means: the number itself. A number without `#` is an address.
:::

## The screen is a piece of memory

The screen has no instruction for drawing. Instead, part of the memory has been chosen to be the screen: the addresses `$0200` to `$05FF`, that is 1024 bytes, exactly 32 by 32 dots. The value in each cell determines the colour of the matching dot. Cell `$0200` is the dot at the very top left, `$0201` the one next to it, and `$05FF` the one at the very bottom right.

There are 16 colours:

| Value | Colour | Value | Colour |
|---|---|---|---|
| `$00` | black | `$08` | orange |
| `$01` | white | `$09` | brown |
| `$02` | dark red | `$0A` | light red |
| `$03` | light cyan | `$0B` | dark grey |
| `$04` | purple | `$0C` | grey |
| `$05` | green | `$0D` | light green |
| `$06` | blue | `$0E` | light blue |
| `$07` | yellow | `$0F` | light grey |

## Watching the program work

The program ran so fast just now that you could not follow anything. Now we go slowly:

1. Press **Reset**. The screen turns black again.
2. Look at the **execution** panel: the highlighted instruction is the one that runs next. Next to it is the program counter `PC`, which starts at `$0600`. That is where the assembler puts the program.
3. Press **Single step**. In the **registers** panel `A` jumps from `$00` to `$01`, and `PC` moves on to the next instruction.
4. Press once more. Now a white dot lights up at the top left: `STA $0200` has written the value `$01` into screen memory.
5. Carry on until all three dots are there, and watch `A` each time.

::: hinweis
In the **monitor** (below) you can type `$0200` into the “Go to” field and then see the same bytes as numbers: `01 05 08 …`. Screen and memory are two views of the same thing.
:::

## Tasks

::: aufgabe Change the colours
Change the colours of the three dots. Look them up in the table above.
:::

::: aufgabe A dot at the bottom right
Draw a fourth dot in the bottom right corner of the screen.
:::

::: loesung Solution
The address of the bottom right corner is `$05FF`.

```asm expect=$05FF:07
LDA #$07
STA $05FF
```
:::

::: aufgabe A row
Draw the first eight dots of the top row in eight different colours. You can still do it without a loop; you just need patience.
:::

::: loesung Solution
```asm expect=$0200:01,$0201:02,$0202:03,$0203:04,$0204:05,$0205:06,$0206:07,$0207:08
LDA #$01
STA $0200
LDA #$02
STA $0201
LDA #$03
STA $0202
LDA #$04
STA $0203
LDA #$05
STA $0204
LDA #$06
STA $0205
LDA #$07
STA $0206
LDA #$08
STA $0207
```

That is tedious, and that is exactly what loops are for later.
:::
