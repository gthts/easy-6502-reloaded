# Welcome: What is a processor?

The 6502 is a processor from the 1970s. It sat inside the Apple II, the Commodore 64, the Atari home computers and the Nintendo Entertainment System. It is simple enough to understand completely, which is why it is still a good chip to learn on: whoever knows what a 6502 does understands what every computer does at its core.

In this book you learn step by step how to program it. Each chapter introduces exactly one new idea, with a small example you can try right away.

## A computer has two parts

- The **memory** is a long row of boxes. Each box is called a **byte**, has an **address** (its number) and holds a number from 0 to 255.
- The **processor** fetches numbers from memory, calculates with them and puts results back.

The 6502 can address 65,536 bytes, that is the addresses `$0000` to `$FFFF`. (The `$` sign means the number is written in hexadecimal. Chapter 3 explains that.)

The program itself is also in memory: as a series of numbers. Each number means an **instruction**, for example “load a number” or “add”. The processor works through these instructions one after the other. It remembers which instruction is next in the **program counter** (`PC` for short).

## Assembler: instructions with names

Instead of writing numbers, you use short names like `LDA` or `STA`. A program called an **assembler** translates these names into the numbers the processor understands. This language of names is called assembly language. In this environment the **Assemble** button does the assembler's work.

## Getting to know the environment

The page is divided into three columns:

- **On the left** is this book. With the arrow at the top left you fold it away to the edge when you need more room. The chapter markers at the top show where you are and what you have already read.
- **In the middle** you work: in the **source code** you write your program. Below it you see the **execution** (the instruction that is next), the **screen**, the **registers** and the **monitor**, which shows memory.
- **On the right** is the reference, a lookup guide to all instructions.

Above the source code you find the most important buttons:

| Button | Effect |
|---|---|
| **Assemble** | translate the source and load it into memory |
| **Run** | let the program run |
| **Single step** | execute exactly one instruction |
| **Reset** | put the program back at its start |

Every code example in this book has two buttons: **Send to emulator** copies the example into the source code, **Send and run** also runs it immediately.

::: aufgabe The first run
Press **Send and run** on this tiny program. A white dot should appear at the top left of the screen. What exactly happens, you will learn in the next chapter.

```asm expect=$0200:01
LDA #$01
STA $0200
```
:::

::: hinweis
The emulator calculates exactly like a real 6502, just without a television or keyboard attached. The screen is a small square of 32 by 32 dots, and the keyboard is a single byte in memory. More on that step by step.
:::
