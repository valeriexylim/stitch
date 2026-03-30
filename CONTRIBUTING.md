# Contributing to Stitch

## Development setup

```bash
npm install
npm run dev     # dev server at http://localhost:5173
npm test        # run all unit tests (Vitest)
```

## Project conventions

### Logic modules (`src/logic/`)

Each file is a pure ES module with no React imports. All logic is independently unit-tested. When adding or modifying logic:

- Keep functions pure where possible.
- Every exported function should have tests in a sibling `*.test.js` file.
- AST nodes are plain objects — use the constructors in `ast.js` (`Atom`, `Not`, `And`, etc.) rather than creating `{ type: '...' }` literals directly.

### AST shape

```js
{ type: 'Atom',    name: 'P' }
{ type: 'Not',     operand: <node> }
{ type: 'And',     left: <node>, right: <node> }
{ type: 'Or',      left: <node>, right: <node> }
{ type: 'Implies', left: <node>, right: <node> }
{ type: 'Iff',     left: <node>, right: <node> }
{ type: 'True' }
{ type: 'False' }
{ type: 'Hole' }   // incomplete slot in the Block Builder only
```

### Adding a simplification rule

1. Add the rewrite function to `src/logic/simplify.js` following the pattern of existing rules (return `null` if the rule doesn't apply, otherwise return `{ result, before, after }`).
2. Add it to the appropriate rule set in `buildRuleSet`.
3. Add a unit test in `simplify.test.js`.

### Adding a proof rule

1. Add the rule name to `RULE_NAMES` in `src/logic/proof.js`.
2. Add the expected citation count to `CIT_COUNT`.
3. Add a `case` in `validateRule`.
4. Add tests in `proof.test.js` covering both the valid case and common error cases.

## Scope

Stitch covers propositional logic only. The following are intentionally out of scope:

- First-order / predicate logic
- Quantifiers
- Proof search / automatic solving
- Collaborative editing
