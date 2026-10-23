# Exercises, session 2

The second set of exercises is more demanding. It starts with arithmetic and loops, moves on to the screen and ends with two animations. As with session 1: first try seriously yourself, then open the folded-away **hints**. They contain tips on how to proceed, not a finished program.

::: hinweis
For the animations (exercises 11 and 12) you must set the **speed** above the source code to **at least “100,000/s”**, otherwise the program waits in its delay loops for so long that you see nothing worthwhile. Exercise 6 is the other way round: there “5/s” is right. For the exercises with randomness (5 and 9), the cell `$FE` returns a new number every time it is read.
:::

## Exercise 1: Add two numbers and store the result

::: aufgabe Adding
Add the values 5 and 7 in the accumulator and store the result in memory cell `$80`.
:::

::: loesung Hints
Only a few steps: bring the carry to a known state, load, add, store. The target is `$80`.
:::

## Exercise 2: Storing a series of numbers

::: aufgabe Fill with a loop
Write a loop that fills the memory locations `$90` to `$99` with the values 0 to 9.
:::

::: loesung Hints
The loop needs a counter that is also the value: transfer it to `A` and store with indexed addressing from `$90`. Think about the counter value at which it must stop (ten values, so at 10).
:::

## Exercise 3: Swapping two memory locations

::: aufgabe Swapping with one register only
Swap the contents of `$91` and `$95` using only the accumulator as a temporary store (no other registers, no other memory cells, no stack).

**Hint:** of the three numbers A, B and (A XOR B), any two always determine the third: the third is redundant because it can be reconstructed.
:::

::: loesung Hints
The hint in the task is the way: from a XOR b and one of the two numbers you can get the other back. The accumulator is the only go-between, and the logic instruction can calculate directly with a memory cell. First form a XOR b and write it to the first cell, then recover a and b from it step by step. Try the sequence on paper with two small numbers first.
:::

## Exercise 4: Summing a series of numbers

::: aufgabe Sum
Add up the values from memory cells `$90` to `$99` (assume values are already stored there) and store the sum in `$C0`.
:::

::: loesung Hints
You have the sum (in the accumulator) and the index. `ADC` can calculate directly with an indexed memory cell. Before the loop: clear the carry, set the sum to 0. The sum only fits in a byte up to 255. Before testing, fill the cells with known values (for example as in exercise 2) so that you can check the result by hand.
:::

## Exercise 5: Finding the maximum in an array

::: aufgabe Maximum
Write random numbers to `$90` to `$99`, then find the maximum of the values and store it in `$80`.
:::

::: loesung Hints
Two parts: first fill the ten numbers (`$FE` returns a new one on every read), then find the maximum. Take the first value as the provisional maximum, go through the rest and take over a value if it is larger; a comparison and the carry flag tell you “greater or equal”. Test the search with fixed values first, because random numbers cannot be checked by hand.
:::

## Exercise 6: Countdown with screen output

::: aufgabe Countdown
Count down from 5 to 0 and write the current values to `$200` each time (visible in the screen area).
:::

::: loesung Hints
A loop that counts backwards, writing the counter to `$0200` in every round. Decide how the 0 is also written (which branch instruction reacts to “negative”?). You do not need a delay in the program: set the **speed to 5/s** above the source code and watch.
:::

## Exercise 7: Filling a stripe on the screen

::: aufgabe Stripe
Fill the first eight dots (from `$200`) with the colour white (`$01`).
:::

::: loesung Hints
Eight cells from `$0200` with the same value: a counter as the index, running from the length down to 0. A trick: count down first, then store; that way cell 0 gets its turn too.
:::

## Exercise 8: Drawing a block on the screen

::: aufgabe 2×2
Draw a square of 2×2 dots from `$200` in the colour `$0A`.
:::

::: loesung Hints
The screen consists of rows of 32 cells. Which four addresses belong to a square of 2×2 dots? One row further down is 32 (`$20`) cells on. That is four store instructions; you do not need a loop.
:::

## Exercise 9: Colourful bar

::: aufgabe Random colours
Paint the whole top row of the screen (`$200` to `$21F`) in random colours. Use the emulator's random generator (`$FE`).
:::

::: loesung Hints
Like exercise 7, but with 32 cells and a random colour instead of a fixed one: read `$FE` anew for every cell. If you end the loop with a branch instruction, mind which instructions change the flags: load instructions do, store instructions do not.
:::

## Exercise 10: Diagonal line

::: aufgabe Diagonal
Draw a diagonal line from top left to bottom right by filling the matching memory cells (the first eight cells of the main diagonal).
:::

::: loesung Hints
The diagonal lies on cells 0, 33, 66, … (one row down and one column along is 32 + 1). You need an index that grows by 33 in every round, and a second counter for the eight dots. Continue calculating the index in the accumulator and transfer it back to the index register. The first eight dots still fit in the first memory page.
:::

## Exercise 11: Knight Rider scanner (advanced)

::: aufgabe Scanner
A dot of colour `$04` should always run from the left to the right edge in the third row of the screen and then back again, like on the front grille of the car in the TV series “Knight Rider”.
:::

::: loesung Hints
Two loops: one for the way to the right, one back. In every round you draw the dot, wait (a nested counting loop), erase it again and move one cell on. Think about where the two end points should be drawn only **once**. The third row starts at `$0240`. Set the speed to **at least 100,000/s**, otherwise the scanner is very sluggish.
:::

## Exercise 12: Bouncing ball (challenge)

::: aufgabe Bouncing ball
A dot of colour `$04` should “fall” in the 16th column from the middle of the screen, hit the bottom edge of the screen as the “floor” and spring back up elastically, until at the upper turning point it reverses direction again. In other words, a realistic bouncing ball.
:::

::: loesung Hints
The field reaches beyond one memory page (from row 16 it starts at `$0400`), so an index in a register is not enough. Use a pointer in the zero page to the ball’s cell and move it 32 down or up (16-bit arithmetic with the carry). For the physics: waiting times from a table, long at the top and short at the bottom, reversed on the way up. Split the program into small subroutines (draw, erase, one row down, one row up, wait). Set the speed to **at least 100,000/s**.
:::

::: hinweis
Finally, a look at the order of magnitude: the fully commented source code of the C64 version of the classic game *Elite* comprises around 67,000 lines of 6502 assembly code. That is the upper end of the scale for a very ambitious, complex game that fits (without loading more) into 64 kilobytes.
:::
