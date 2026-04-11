# Contributing to Stitch

## Setup

```bash
npm install
npm run dev   # http://localhost:5173
npm test      # run all unit tests (Vitest)
```

## How the code is organised

```
src/logic/        # pure JS modules — no React, independently unit-tested
src/components/   # React UI, one folder per screen
```

All logic lives in `src/logic/`. Each file has a matching `*.test.js`. Keep them in sync.

## Key conventions

- **AST nodes** are plain objects. Use the constructors in `ast.js` (`Atom`, `Not`, `And`, …) — don't write `{ type: '...' }` literals by hand.
- **Logic functions** should be pure where possible and return `null` when a rule/pattern doesn't apply.
- **No external logic libraries** — parsing, evaluation, simplification, and proof checking are all implemented from scratch.

## Adding a simplification rule

1. Add a rewrite function to `src/logic/simplify.js` (return `null` if the rule doesn't apply, otherwise `{ result, before, after }`).
2. Register it in `buildRuleSet`.
3. Add tests in `simplify.test.js`.

## Adding a proof rule

1. Add the rule name to `RULE_NAMES` in `src/logic/proof.js`.
2. Set its citation count in `CIT_COUNT`.
3. Add a `case` in `validateRule`.
4. Add tests in `proof.test.js` — cover both the valid case and common errors.

## Scope

Propositional logic only. First-order logic, quantifiers, proof search, and collaborative editing are intentionally out of scope.
