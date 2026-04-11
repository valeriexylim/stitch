# Stitch

An interactive, visual web app for learning propositional logic. Build formulas with blocks, run truth tables, simplify step by step, and verify natural deduction proofs — all in the browser, no backend required.

**Live demo: [scratch-for-logic.vercel.app](https://scratch-for-logic.vercel.app/)**

![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white) ![Vercel](https://img.shields.io/badge/deployed-Vercel-black?logo=vercel) ![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Block Builder
Construct formulas visually by selecting operators and atoms from a palette. Each node is colour-coded, selection is click-based, and the tree structure is always visible. Exports to JSON AST and LaTeX when the formula is well-formed.

### Truth Table / SAT Checker
- Formulas with ≤ 8 variables get a full truth table with a tautology / contradiction / contingent verdict.
- Formulas with > 8 variables fall back to a DPLL SAT solver and report satisfiable or unsatisfiable (with a satisfying assignment when one exists).

### Simplification Engine
Enter any formula and step through rewrite rules one at a time:
- Biconditional and implication elimination
- Double negation, De Morgan's laws
- Idempotence, absorption, identity, annihilation
- Optional distributivity
- Targets: fully simplified, NNF, or CNF

### Proof Checker
Write Fitch-style natural deduction proofs line by line. Supported rules:

| Group | Rules |
|---|---|
| Conjunction | ∧I, ∧E₁, ∧E₂ |
| Disjunction | ∨I₁, ∨I₂, ∨E |
| Negation | ¬I, ¬E |
| Implication | →I, →E, MT |
| Biconditional | ↔I, ↔E₁, ↔E₂ |
| Falsum | ⊥E |
| Reiteration | Copy |

Scope and subproof access are validated automatically. An in-app rules reference panel shows the schema and required citations for every rule.

> New to natural deduction? See [PROOFCHECKER.md](./PROOFCHECKER.md) for a plain-English guide with worked examples.

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/valeriexylim/stitch.git
cd stitch
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Input Syntax

Stitch accepts both Unicode symbols and ASCII equivalents:

| Operator | Unicode | ASCII |
|---|---|---|
| Negation | `¬` | `~` |
| Conjunction | `∧` | `&` |
| Disjunction | `∨` | `\|` |
| Implication | `→` | `->` |
| Biconditional | `↔` | `<->` |
| True | `⊤` | `T` |
| False | `⊥` | `F` |

Precedence (tightest to loosest): `¬` > `∧` > `∨` > `→` > `↔`. Implication is right-associative.

---

## Project Structure

```
src/
├── logic/            # Pure JS logic modules (no React dependencies)
│   ├── ast.js        # AST node constructors and utilities
│   ├── parser.js     # Recursive-descent parser
│   ├── serialize.js  # AST → display string / LaTeX
│   ├── evaluate.js   # Formula evaluator
│   ├── wff.js        # Well-formed formula checker
│   ├── builder.js    # Block builder tree helpers
│   ├── truthTable.js # Truth table generator
│   ├── cnf.js        # CNF conversion pipeline
│   ├── sat.js        # DPLL SAT solver
│   ├── simplify.js   # Step-by-step simplification engine
│   └── proof.js      # Natural deduction proof checker
└── components/
    ├── builder/      # Block Builder screen
    ├── checker/      # Truth Table / SAT screen
    ├── simplifier/   # Simplification screen
    └── proof/        # Proof Checker screen
```

Each module in `src/logic/` is independently testable and has no UI dependencies.

---

## Stack

- **React 18** — UI
- **Vite 5** — dev server and bundler
- **No external logic libraries** — parsing, evaluation, CNF conversion, SAT solving, and proof checking are all implemented from scratch

---

## License

MIT
