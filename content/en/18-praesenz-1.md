# Exercises, session 1

These fifteen exercises are meant for practice in the classroom session. Each comes with a **check**: a value your program must leave in a register or in memory at the end. You can read it in the **registers** panel or in the **monitor** (field “Go to”, for example `$0080`).

Try each exercise yourself first, and seriously. Every exercise comes with folded-away **hints**: tips on how to proceed, but no finished program. Open them only after you have searched for a while and are stuck; a minute without success is not yet a reason. There are usually several correct ways.

::: hinweis
End every program with `BRK`. Then the emulator stops, and the values stay in place for you to inspect. If an exercise assumes a starting value in a memory cell, put it there yourself at the start of the program with `LDA`/`STA`.
:::

## Exercise 1: Arithmetic (addition)

::: aufgabe Addition
Load the values `$15` and `$23` and add them. The result should be in register `A`.

**Check:** `A` = `$38`
:::

::: loesung Hints
Think about which flag must have a known state before an addition, and set it with the right instruction. Then load the first number into `A` and add the second directly as a number (not as a memory cell). The result is in `A` afterwards.
:::

## Exercise 2: Memory transfer

::: aufgabe Copying via X
Copy the value `$42` from memory address `$80` to `$81`. Use register `X` as a temporary store.

**Check:** memory address `$81` = `$42`
:::

::: loesung Hints
The starting value must first be in `$80`: put it there yourself (via `A`). To copy it you then only need load and store instructions, but for register `X` instead of `A`: first load from `$80` into `X`, then store from `X` to `$81`.
:::

## Exercise 3: Logical operations

::: aufgabe Mask
Take the value `$DB` and mask the low 4 bits (all other bits are set to 0). The result should be in memory address `$20`.

**Check:** memory address `$20` = `$0B`
:::

::: loesung Hints
A mask keeps the bits where it has a 1. Which mask keeps exactly the lower four bits? Write it in binary first, then in hexadecimal. Combine with the right logic instruction and store the result.
:::

## Exercise 4: Branching

::: aufgabe Equal or not
Load `$05` into register `X`. If `X` equals `$05`, jump to a label and load `$99` into register `A`. Otherwise load `$11`.

**Check:** `A` = `$99`
:::

::: loesung Hints
You need three building blocks: a comparison of `X` with the number, a branch instruction that jumps on “equal”, and a label as the target. The “not equal” case follows right after the branch; after it the program must jump over the “equal” part, otherwise it runs into it and overwrites the result.
:::

## Exercise 5: Increment/decrement

::: aufgabe Counting down three times
Start with `$10` in register `Y`. Decrease `Y` three times and store the result in memory address `$30`.

**Check:** memory address `$30` = `$0D`
:::

::: loesung Hints
Count an index register down three times (one instruction per step) and store it with the store instruction for exactly that register. Check: `$10` minus 3 is `$0D`.
:::

## Exercise 6: Bit manipulation (shifting)

::: aufgabe Twice to the left
Load `$08` into register `A` and shift all bits twice to the left. The result should be in memory address `$40`. **Challenge:** can you do it without the `ASL` instruction?

**Check:** memory address `$40` = `$20`
:::

::: loesung Hints
Shifting one place to the left doubles a number; shifting twice multiplies it by four. Store the result in `$40` afterwards. For the challenge: which other instructions double a number? Think of adding a number to itself (for that it must also be in a memory cell) or of rotating (mind which value the carry must have beforehand).
:::

## Exercise 7: Stack operations

::: aufgabe Swapping
The accumulator holds `$AA`, register `X` holds `$BB`. Swap these values, but use only the stack and/or registers. In the end `$BB` should be in register `A` and `$AA` in register `X`.

**Check:** `A` = `$BB`, `X` = `$AA`
:::

::: loesung Hints
Transfer instructions alone cannot do the swap, because every transfer overwrites a value. You need room for one value: the stack, and another register as a go-between. Work out the order beforehand with slips of paper for `A`, `X`, `Y` and the stack, so that no value is ever lost.
:::

## Exercise 8: Indexed addressing

::: aufgabe Three cells
Write the values `$01`, `$02`, `$03` into memory addresses `$50`, `$51`, `$52`. Use register `X` as the index.

**Check:** `$50` = `$01`, `$51` = `$02`, `$52` = `$03`
:::

::: loesung Hints
A small loop is enough. The value is always 1 more than the index; you can calculate it from the index (transfer the index register to `A`, add 1) and store it with indexed addressing from `$50`. Clear the carry before the addition. Think about the counter value at which the loop must stop. Alternatively without a loop: load and store three times, raising the index by hand.
:::

## Exercise 9: Flags and carry

::: aufgabe Check the carry
Add `$FF + $01` and check whether a carry occurs. If yes, store `$01` in address `$60`, otherwise `$00`.

**Check:** memory address `$60` = `$01`
:::

::: loesung Hints
The carry flag shows that a result does not fit in a byte. Bring it to a known state first, add, and branch with the instruction that reacts to the carry. Both paths (with and without carry) must each store the right value in `$60` and arrive at the same end of the program.
:::

## Exercise 10: Loops

::: aufgabe Sum
Count from `$00` to `$05` and add up all the values. The final result (0+1+2+3+4+5 = 15 = `$0F`) should be in memory address `$70`.

**Check:** memory address `$70` = `$0F`
:::

::: loesung Hints
Counter and sum are two different things: one register counts from 0 to 5, another collects the sum. But `ADC` only calculates with a number or a memory cell, not with a register. How do you get the counter into a memory cell? Check when the loop must end (at 5 or only at 6?) and clear the carry in every round.
:::

## Exercise 11: Logical operations

::: aufgabe Combining bits
Combine the bits of `$0A` and `$05` and store the result in `$80`.

**Check:** memory address `$80` = `$0F`
:::

::: loesung Hints
Which of the three logic instructions sets bits without changing the others? Write both numbers in binary one above the other and combine them by hand to check the result.
:::

## Exercise 12: Comparing and conditional storing

::: aufgabe Greater or less
Compare the value in `$90` with `$10`.

- If it is smaller, write `$00` to `$91`.
- If it is greater or equal, write `$01` to `$91`.

Before the test, load for example `LDA #$12` and `STA $90`.

**Check:** `$91` = `$01` if `$90` ≥ `$10`, otherwise `$00`
:::

::: loesung Hints
First put the test value in `$90`, load it back and compare it with `$10`. After the comparison the carry flag shows “greater or equal”. Build two paths (“less than” and “greater or equal”) that each store to `$91` and join at the same end. Finally test with a value below `$10`.
:::

## Exercise 13: Subroutines

::: aufgabe Plus three
Write a subroutine that increases the contents of register `A` by 3. Load `$02` into `A`, call the subroutine twice and write the final result to `$A0`.

**Check:** memory address `$A0` = `$08`
:::

::: loesung Hints
Two parts: the subroutine (label, calculation, return instruction at the end) and the main program, which calls it twice and stores the result. The subroutine must not end up in the program flow: it goes after the instruction that ends the program. Do not forget the carry before the addition.
:::

## Exercise 14: Memory increment

::: aufgabe Increasing cells
Set `$B0` to 0 and increase the memory cell five times with `INC` in a loop.

**Check:** memory address `$B0` = `$05`
:::

::: loesung Hints
There is an instruction that increases a memory cell directly, without loading it into a register first. You only need the loop to count the five rounds; count backwards with an index register, then the comparison is not needed. Set the cell to 0 beforehand.
:::

## Exercise 15: Bit test

::: aufgabe Highest bit
Check whether the most significant bit (bit 7) is set in memory cell `$C0`. Store `$01` in `$C1` if so, otherwise `$00`. To prepare, load `LDA #$80` and `STA $C0`, or another test value.

**Check:** `$C1` = `$01` if bit 7 is set, otherwise `$00`
:::

::: loesung Hints
The top bit of a loaded value lands in the flag `N`; a branch instruction tests it. Alternatively: isolate the bit with a mask and `AND` and test the zero flag. Put the test value in `$C0` first and also try a value without bit 7 set.
:::
