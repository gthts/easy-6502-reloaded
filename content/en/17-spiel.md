# A small game in stages

Now you have everything you need to build a game. Instead of a finished program, it is built here in five small steps. Each step adds one ability and can be tried out on its own. At the end you have a “dot collector”: you steer a white dot across the playing field and collect green prey; every piece of prey counts a yellow dot in the bottom row.

The playing field is the upper **eight rows** of the screen (`$0200` to `$02FF`). That has a good reason: the position of the dot then fits in **one single byte**. The number `pos` means “dot number `pos` from `$0200`”. A row has 32 dots, so:

| Movement | Calculation |
|---|---|
| to the right | `pos` + 1 |
| to the left | `pos` − 1 |
| down | `pos` + 32 |
| up | `pos` − 32 |

::: hinweis
Before playing, click the **screen** so that it receives the keys (a blue frame and “Keyboard active” below it show it) (chapter “Input and randomness”). You steer with `W`, `A`, `S`, `D` or the arrow keys. From stage 3 on, the game runs in a loop; set the **speed to 10,000/s** above the source code for it. The short pause in the program is tuned for that.
:::

## Stage 1: The player

We remember the position in cell `$10` and draw a white dot there.

```asm expect=$0290:01
define pos $10

  LDA #$90          ; row 4, column 16: roughly in the middle
  STA pos
  LDX pos
  LDA #$01          ; white
  STA $0200,X       ; draw
  BRK
```

The index comes from `X`, which is loaded from the cell `pos`. That way the position is stored in one place only.

## Stage 2: Reading a key and moving once

Now the program waits for a key. The key `D` moves the dot one place to the right.

```asm
define pos $10
define key $FF

  LDA #$90
  STA pos
wait:
  LDA key
  BEQ wait          ; 0 = no key pressed yet
  CMP #$64          ; D?
  BNE draw
  INC pos           ; one dot to the right
draw:
  LDX pos
  LDA #$01
  STA $0200,X
  BRK
```

Run it, click the screen and press `D`. The dot appears to the right of the middle. With any other key it appears in the middle.

## Stage 3: Continuous play with four directions

The one-off movement becomes a **game loop**: erase the old dot, read the key, calculate the new position, draw, wait briefly, start again.

```asm
define pos $10
define key $FF
define up $77
define left $61
define down $73
define right $64

  LDA #$90
  STA pos

game:
  LDX pos
  LDA #$00
  STA $0200,X       ; erase the old dot

  LDA key
  CMP #up
  BEQ go_up
  CMP #down
  BEQ go_down
  CMP #left
  BEQ go_left
  CMP #right
  BEQ go_right
  JMP draw

go_up:
  LDA pos
  SEC
  SBC #32
  STA pos
  JMP draw
go_down:
  LDA pos
  CLC
  ADC #32
  STA pos
  JMP draw
go_left:
  DEC pos
  JMP draw
go_right:
  INC pos

draw:
  LDX pos
  LDA #$01
  STA $0200,X       ; draw the new dot
  LDA #$00
  STA key           ; use up the key
  JSR pause
  JMP game

pause:
  LDX #$FF
inner:
  DEX
  BNE inner
  RTS
```

The dot follows your keys. You have seen four things you already know: one comparison per key (`CMP` with `BEQ`), subroutines (`pause`), constants (`up`, `left`, …) and a loop.

One flaw stands out: if the dot runs out of a row to the right, it shows up at the start of the **next** row; at the bottom edge it jumps to the top. That is due to the calculation with `pos`.

## Stage 4: Walls

For each direction we build in a check before `pos` changes:

| Direction | Wall if … | Check |
|---|---|---|
| up | `pos` < 32 | `CMP #32` and `BCC` |
| down | `pos` ≥ 224 | `CMP #224` and `BCS` |
| left | column = 0 | `AND #31` gives 0, `BEQ` |
| right | column = 31 | `AND #31` gives 31, `CMP #31`, `BEQ` |

You get the column with `AND #31`: it keeps only the lower five bits, that is `pos` modulo 32.

```asm
define pos $10
define key $FF
define up $77
define left $61
define down $73
define right $64

  LDA #$90
  STA pos

game:
  LDX pos
  LDA #$00
  STA $0200,X

  LDA key
  CMP #up
  BEQ go_up
  CMP #down
  BEQ go_down
  CMP #left
  BEQ go_left
  CMP #right
  BEQ go_right
  JMP draw

go_up:
  LDA pos
  CMP #32
  BCC draw          ; top row: wall
  SEC
  SBC #32
  STA pos
  JMP draw
go_down:
  LDA pos
  CMP #224
  BCS draw          ; bottom row of the field: wall
  CLC
  ADC #32
  STA pos
  JMP draw
go_left:
  LDA pos
  AND #31
  BEQ draw          ; column 0: wall
  DEC pos
  JMP draw
go_right:
  LDA pos
  AND #31
  CMP #31
  BEQ draw          ; column 31: wall
  INC pos

draw:
  LDX pos
  LDA #$01
  STA $0200,X
  LDA #$00
  STA key
  JSR pause
  JMP game

pause:
  LDX #$FF
inner:
  DEX
  BNE inner
  RTS
```

Now the dot stays inside the field. The branches all jump to `draw`, *over* the change of `pos`.

## Stage 5: Prey and score

Finally the prey and the score are added:

- The prey is a green dot at a random place (`LDA $FE`).
- If the player stands on the prey, the program counts a point, paints a yellow dot in the bottom screen row and places new prey.
- After 32 points the game is won.

```asm
define pos $10
define target $11
define points $12
define key $FF
define random $FE
define up $77
define left $61
define down $73
define right $64
define player $01
define prey $05
define score $07

  LDA #$90
  STA pos
  LDA #$00
  STA points
  JSR new_prey

game:
  LDX pos
  LDA #$00
  STA $0200,X

  LDA key
  CMP #up
  BEQ go_up
  CMP #down
  BEQ go_down
  CMP #left
  BEQ go_left
  CMP #right
  BEQ go_right
  JMP draw

go_up:
  LDA pos
  CMP #32
  BCC draw
  SEC
  SBC #32
  STA pos
  JMP draw
go_down:
  LDA pos
  CMP #224
  BCS draw
  CLC
  ADC #32
  STA pos
  JMP draw
go_left:
  LDA pos
  AND #31
  BEQ draw
  DEC pos
  JMP draw
go_right:
  LDA pos
  AND #31
  CMP #31
  BEQ draw
  INC pos

draw:
  LDX pos
  LDA #player
  STA $0200,X
  LDA #$00
  STA key

  LDA pos
  CMP target
  BNE carry_on      ; not on the prey
  INC points
  LDX points
  LDA #score
  STA $05DF,X       ; bar in the last row ($05E0 and following)
  CPX #32
  BEQ won
  JSR new_prey

carry_on:
  JSR pause
  JMP game

won:
  BRK

new_prey:
  LDA random        ; random number = position of the new prey
  STA target
  TAX
  LDA #prey
  STA $0200,X
  RTS

pause:
  LDX #$FF
inner:
  DEX
  BNE inner
  RTS
```

That is a complete game in under 150 lines. You know every single ingredient: constants, subroutines, randomness, input, comparisons, loops.

::: aufgabe Your own ideas
Change the game:

- Make the pause shorter or longer (the value `#$FF` in `pause`).
- Choose other colours for player, prey and score.
- Let the prey appear in a different colour when the score passes a limit.
- Create an obstacle the player may not enter.
:::

## And then?

In the example menu above the source code there are larger programs. The snake game has the same structure as your game (game loop, input, drawing, collision), only with a snake made of several segments. You find it under “Games”, fully commented. With what you know now, you can read it line by line.
