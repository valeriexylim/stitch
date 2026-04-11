# Understanding the Proof Checker & Natural Deduction

If you're completely lost on *why* this proof checker exists, what it does, and why features like "indentation" matter, you are not alone! Natural Deduction is counter-intuitive at first. 

This document breaks it down into plain English.

## 1. What is the Purpose of this Proof Checker?
This tool is **not** for simplifying algebraic equations (like turning `A + A` into `2A`), and it's **not** just showing that statement A equates to statement B.

Instead, **Natural Deduction is about writing an air-tight argument.** 

Imagine a lawyer standing in a courtroom trying to prove a defendant is guilty. The lawyer can't just say, *"He was at the scene, therefore he's guilty."* The judge will say, *"You skipped a step. You need a rule that connects being at the scene to being guilty."*

For logic students, this Proof Checker acts like an incredibly strict judge. It gives them a set of starting facts (Premises) and a final Goal. The student has to build a bridge from the facts to the goal using **only officially allowed legal moves (Rules of Inference).** The checker ensures the student didn't skip any steps or cheat.

## 2. Why all this "Indentation", "Open/Closed", and "Subproof" stuff?
This is the hardest part to grasp, but it is the core of how real logic works.

Sometimes, to prove a point, you have to propose a **"What If"** hypothetical scenario.

### The Real World vs. The Pretend Bubble
* **No Indent (Depth 0):** This is the **Real World**. Everything written at Depth 0 is an undeniable fact (a Premise), or a conclusion that has been permanently proven.
* **Indent (Depth 1+):** This is a **Pretend Bubble** (a "Subproof"). When you use the `Assumption` rule, you are saying: *"Let's pretend, just for a moment, that pigs can fly."* Because you are now living in a hypothetical fantasy land, **you must indent your text.** 

As long as you are indented, you are inside that pretend bubble. You can apply rules to your flying pigs and see what happens. This is an **Open Subproof**.

### Stepping Out of the Bubble (Closing the Subproof)
You can't stay in the pretend bubble forever. Eventually, you have to step back out into the Real World. To do this, you **Outdent** (move the text back to the left).

When you outdent, you are **Closing the Subproof**. You destroy the pretend bubble. You are no longer allowed to use any of the facts generated inside it, *except* to say what you learned from the experiment.

**Example of the Bubble:**
1. Let's assume it rains today. `[Assumption, Indented 1x]`
2. If it rains, the grass gets wet. `[Rule application, Indented 1x]`
3. Therefore, the grass is wet. `[Rule application, Indented 1x]`
4. **IF** it rains today, **THEN** the grass gets wet. `[Conclusion, Outdented to 0]`

Notice Line 4 is back in the Real World. It doesn't claim that the grass *is* wet. It just claims that *if* the hypothetical scenario in the bubble happened, the wet grass is the result.

## 3. How this helps students
1. **Prevents Cheating/Leaping:** A human professor grading homework might miss a tiny logical leap. The computer strictly verifies that every single line has the exact correct `Rule` and references the correct `Cit` (citations).
2. **Teaches Scope:** Students often struggle with logic because they use a hypothetical assumption as a permanent fact. The indentation physically stops them. If they try to cite line 2 down at line 8 after the bubble is closed, the checker will scream: `"Line 2 is not accessible from here (it is inside a closed subproof)"`. This visualizes the concept of "Scope".
3. **Interactive Sandboxing:** Students can try different rule combinations and instantly get feedback on whether their logical bridge is structurally sound.

## 4. Copy/Paste Examples to Test Your App

Here are three examples showing exactly how to enter them in your app. 

*(Note: `F` means False/Contradiction. `|` means OR. `~` means NOT. `->` means IF-THEN).*

### Example A: Modus Tollens (No Bubbles / No Indentation)
**Goal:** Prove `~P` (Not P) given `P -> Q` and `~Q`.

* Line 1: `P -> Q` | **Rule:** Premise | **Cit:** ` ` | **Indent:** 0
* Line 2: `~Q`     | **Rule:** Premise | **Cit:** ` ` | **Indent:** 0
* Line 3: `~P`     | **Rule:** MT      | **Cit:** `1, 2` | **Indent:** 0

### Example B: Or-Introduction (One Pretend Bubble)
**Goal:** Prove `P -> (P | Q)`

* Line 1: `P`           | **Rule:** Assumption | **Cit:** ` ` | **Indent:** 1 (Open Bubble)
* Line 2: `P | Q`       | **Rule:** ∨I₁        | **Cit:** `1` | **Indent:** 1 (Inside Bubble)
* Line 3: `P -> (P | Q)`| **Rule:** →I         | **Cit:** `2` | **Indent:** 0 (Close Bubble)

### Example C: Proof by Contradiction (A Bubble within a Bubble)
**Goal**: Prove `Q -> ~~Q`

* Line 1: `Q`         | **Rule:** Assumption | **Cit:** ` `   | **Indent:** 1 (Open Bubble A)
* Line 2: `~Q`        | **Rule:** Assumption | **Cit:** ` `   | **Indent:** 2 (Open Bubble B, inside A)
* Line 3: `F`         | **Rule:** ¬E         | **Cit:** `1, 2`| **Indent:** 2 (Inside Bubble B)
* Line 4: `~~Q`       | **Rule:** ¬I         | **Cit:** `3`   | **Indent:** 1 (Close Bubble B, back to A)
* Line 5: `Q -> ~~Q`  | **Rule:** →I         | **Cit:** `4`   | **Indent:** 0 (Close Bubble A, back to Real World)
