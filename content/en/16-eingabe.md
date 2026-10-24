# Input and randomness

A program that just calculates to itself gets boring quickly. This computer has two special memory locations that connect programs with the outside world.

| Cell | Meaning |
|---|---|
| `$FF` | holds the **code of the last key pressed** |
| `$FE` | returns a new **random number** from 0 to 255 **every time it is read** |

These are not real computer chips: the emulator writes into `$FF` as soon as you press a key, and returns a different value from `$FE` every time. To the program it looks like normal memory: you simply read it with `LDA`.

## Keys

For the emulator to accept keys, you must **click the screen**. You can tell it accepts keys because it gets a **blue frame**, and below it you read, in green, “● Keyboard active”. If you click elsewhere, the frame disappears and “○ Keyboard off” is shown again. Only while the frame is there does every key go to the program.

The stored value is the ASCII code of the character. Common ones:

| Key | Value | Key | Value |
|---|---|---|---|
| `W` or arrow up | `$77` | `S` or arrow down | `$73` |
| `A` or arrow left | `$61` | `D` or arrow right | `$64` |

The program shows the key code as the colour of the dot at the top left. Run it, click the screen and press different keys:

```asm
loop:
  LDA $FF
  STA $0200
  JMP loop
```

Because the code stays until another key arrives, a program can read it again and again. If every key press should count only *once*, the program writes a 0 into the cell afterwards:

```asm
  LDA #$00
  STA $FF         ; key “used up”
```

## Reacting to a key

A program checks the key value with `CMP` and branches:

```asm
define key $FF

loop:
  LDA key
  CMP #$77          ; W?
  BEQ up
  CMP #$73          ; S?
  BEQ down
  JMP loop

up:
  LDA #$05          ; green
  STA $0200
  JMP loop

down:
  LDA #$02          ; red
  STA $0200
  JMP loop
```

With `W` the dot at the top left turns green, with `S` red. Note: the second `CMP` still uses the value fetched by `LDA key`; `CMP` does not change `A`.

## Randomness

Every `LDA $FE` returns something different. With it you can make surprising patterns: this program endlessly puts dots in a random colour at random places in the upper eight rows.

```asm
loop:
  LDX $FE           ; random place (0 to 255 from $0200)
  LDA $FE           ; random colour
  STA $0200,X
  JMP loop
```

Let it run and try different speeds. Over time the screen fills from the top.

::: hinweis
A random value is the basis of almost every game: where does the next enemy appear, which colour comes next? A random generator in real 6502 computers is usually a program that calculates the next number from the previous one; here it is prepared in a simpler way for you.
:::

## Tasks

::: aufgabe Random colour per key
Write a program that fills the cell `$0200` with a random colour on every key press.
:::

::: loesung Solution
```asm
loop:
  LDA $FF
  BEQ loop          ; 0 = no key
  LDA $FE
  STA $0200
  LDA #$00
  STA $FF           ; use up the key
  JMP loop
```
:::

::: aufgabe Traffic light
With `R` (`$72`) the dot should turn red, with `G` (`$67`) green, with `Y` (`$79`) yellow.
:::

::: loesung Solution
```asm
loop:
  LDA $FF
  CMP #$72
  BEQ red
  CMP #$67
  BEQ green
  CMP #$79
  BEQ yellow
  JMP loop
red:
  LDA #$02
  JMP show
green:
  LDA #$05
  JMP show
yellow:
  LDA #$07
show:
  STA $0200
  JMP loop
```
:::
