// Step-by-step simplification engine for propositional logic formulas.
//
// simplify(formula, options) → Step[]
//
// Step: {
//   formula   : AST,
//   formulaStr: string,
//   rule      : string | null,    // null for the original formula
//   ruleDesc  : string | null,    // e.g. "(φ ↔ ψ) → (φ → ψ) ∧ (ψ → φ)"
//   changed   : { before: string, after: string } | null
// }
//
// Options:
//   target        : 'simplified' (default) | 'nnf' | 'cnf'
//   distributivity: boolean (default false) — applies distributivity in 'simplified' mode

import { And, Or, Not, Implies, Iff, True_, False_ } from './ast.js'
import { equals } from './ast.js'
import { toString } from './serialize.js'

// ─── Rule factory ──────────────────────────────────────────────────────────────

function rule(name, pattern, match) {
  return { name, pattern, match }
}

// ─── Individual rules ──────────────────────────────────────────────────────────

// 1. Biconditional elimination
const bicondElim = rule(
  'Biconditional elimination',
  '(φ ↔ ψ) → (φ → ψ) ∧ (ψ → φ)',
  (n) => n.type === 'Iff'
    ? And(Implies(n.left, n.right), Implies(n.right, n.left))
    : null
)

// 2. Implication elimination
const implElim = rule(
  'Implication elimination',
  '(φ → ψ) → ¬φ ∨ ψ',
  (n) => n.type === 'Implies' ? Or(Not(n.left), n.right) : null
)

// 3. Double negation
const doubleNeg = rule(
  'Double negation',
  '¬¬φ → φ',
  (n) => n.type === 'Not' && n.operand.type === 'Not' ? n.operand.operand : null
)

// 4a. De Morgan — ¬(φ ∧ ψ) → ¬φ ∨ ¬ψ
const deMorganAnd = rule(
  'De Morgan (∧)',
  '¬(φ ∧ ψ) → ¬φ ∨ ¬ψ',
  (n) => n.type === 'Not' && n.operand.type === 'And'
    ? Or(Not(n.operand.left), Not(n.operand.right))
    : null
)

// 4b. De Morgan — ¬(φ ∨ ψ) → ¬φ ∧ ¬ψ
const deMorganOr = rule(
  'De Morgan (∨)',
  '¬(φ ∨ ψ) → ¬φ ∧ ¬ψ',
  (n) => n.type === 'Not' && n.operand.type === 'Or'
    ? And(Not(n.operand.left), Not(n.operand.right))
    : null
)

// Negation of constants
const negTrue = rule(
  'Negation of ⊤',
  '¬⊤ → ⊥',
  (n) => n.type === 'Not' && n.operand.type === 'True' ? False_() : null
)

const negFalse = rule(
  'Negation of ⊥',
  '¬⊥ → ⊤',
  (n) => n.type === 'Not' && n.operand.type === 'False' ? True_() : null
)

// 6. Idempotence
const idempotenceAnd = rule(
  'Idempotence (∧)',
  'φ ∧ φ → φ',
  (n) => n.type === 'And' && equals(n.left, n.right) ? n.left : null
)

const idempotenceOr = rule(
  'Idempotence (∨)',
  'φ ∨ φ → φ',
  (n) => n.type === 'Or' && equals(n.left, n.right) ? n.left : null
)

// Complementation & tautology (produce constants — run before identity/annihilation)
const complementAnd = rule(
  'Complementation (∧)',
  'φ ∧ ¬φ → ⊥',
  (n) => {
    if (n.type !== 'And') return null
    if (n.right.type === 'Not' && equals(n.left, n.right.operand)) return False_()
    if (n.left.type  === 'Not' && equals(n.right, n.left.operand)) return False_()
    return null
  }
)

const tautologyOr = rule(
  'Tautology (∨)',
  'φ ∨ ¬φ → ⊤',
  (n) => {
    if (n.type !== 'Or') return null
    if (n.right.type === 'Not' && equals(n.left, n.right.operand)) return True_()
    if (n.left.type  === 'Not' && equals(n.right, n.left.operand)) return True_()
    return null
  }
)

// 7. Absorption
const absorptionAnd = rule(
  'Absorption (∧)',
  'φ ∧ (φ ∨ ψ) → φ',
  (n) => {
    if (n.type !== 'And') return null
    const { left, right } = n
    if (right.type === 'Or' && (equals(left, right.left) || equals(left, right.right))) return left
    if (left.type  === 'Or' && (equals(right, left.left) || equals(right, left.right))) return right
    return null
  }
)

const absorptionOr = rule(
  'Absorption (∨)',
  'φ ∨ (φ ∧ ψ) → φ',
  (n) => {
    if (n.type !== 'Or') return null
    const { left, right } = n
    if (right.type === 'And' && (equals(left, right.left) || equals(left, right.right))) return left
    if (left.type  === 'And' && (equals(right, left.left) || equals(right, left.right))) return right
    return null
  }
)

// 8. Identity
const identityAnd = rule(
  'Identity (∧)',
  'φ ∧ ⊤ → φ',
  (n) => {
    if (n.type !== 'And') return null
    if (n.right.type === 'True') return n.left
    if (n.left.type  === 'True') return n.right
    return null
  }
)

const identityOr = rule(
  'Identity (∨)',
  'φ ∨ ⊥ → φ',
  (n) => {
    if (n.type !== 'Or') return null
    if (n.right.type === 'False') return n.left
    if (n.left.type  === 'False') return n.right
    return null
  }
)

// 9. Annihilation
const annihilAnd = rule(
  'Annihilation (∧)',
  'φ ∧ ⊥ → ⊥',
  (n) => {
    if (n.type !== 'And') return null
    if (n.left.type === 'False' || n.right.type === 'False') return False_()
    return null
  }
)

const annihilOr = rule(
  'Annihilation (∨)',
  'φ ∨ ⊤ → ⊤',
  (n) => {
    if (n.type !== 'Or') return null
    if (n.left.type === 'True' || n.right.type === 'True') return True_()
    return null
  }
)

// Optional: distributivity
const distOrOverAnd = rule(
  'Distribution (∨ over ∧)',
  'φ ∨ (ψ ∧ χ) → (φ ∨ ψ) ∧ (φ ∨ χ)',
  (n) => {
    if (n.type !== 'Or') return null
    if (n.right.type === 'And') return And(Or(n.left, n.right.left), Or(n.left, n.right.right))
    if (n.left.type  === 'And') return And(Or(n.left.left, n.right), Or(n.left.right, n.right))
    return null
  }
)

const distAndOverOr = rule(
  'Distribution (∧ over ∨)',
  'φ ∧ (ψ ∨ χ) → (φ ∧ ψ) ∨ (φ ∧ χ)',
  (n) => {
    if (n.type !== 'And') return null
    if (n.right.type === 'Or') return Or(And(n.left, n.right.left), And(n.left, n.right.right))
    if (n.left.type  === 'Or') return Or(And(n.left.left, n.right), And(n.left.right, n.right))
    return null
  }
)

// ─── Rule sets ─────────────────────────────────────────────────────────────────

// Applied in this exact order: rules earlier in the list have higher priority.
const RULES_NNF = [
  bicondElim, implElim,
  doubleNeg, deMorganAnd, deMorganOr,
  negTrue, negFalse,
]

const RULES_BOOL = [
  idempotenceAnd, idempotenceOr,
  complementAnd, tautologyOr,
  absorptionAnd, absorptionOr,
  identityAnd, identityOr,
  annihilAnd, annihilOr,
]

function buildRuleSet(target, distributivity) {
  if (target === 'nnf') return RULES_NNF
  const bool = [...RULES_NNF, ...RULES_BOOL]
  // Only distOrOverAnd is safe in any mode: it monotonically moves ∧ upward
  // toward CNF.  distAndOverOr cannot be combined with distOrOverAnd without
  // creating an infinite oscillation.
  if (target === 'cnf') return [...bool, distOrOverAnd]
  if (distributivity)   return [...bool, distOrOverAnd]
  return bool
}

// ─── Tree traversal ────────────────────────────────────────────────────────────

function mkBinary(type, left, right) {
  switch (type) {
    case 'And':     return And(left, right)
    case 'Or':      return Or(left, right)
    case 'Implies': return Implies(left, right)
    case 'Iff':     return Iff(left, right)
  }
}

// Find the first applicable rule in `rules`, depth-first (root first).
// Returns { newFormula, ruleName, ruleDesc, changed } or null.
function applyOnce(node, rules) {
  // Try rules at root
  for (const r of rules) {
    const result = r.match(node)
    if (result !== null) {
      return {
        newFormula: result,
        ruleName: r.name,
        ruleDesc: r.pattern,
        changed: { before: toString(node), after: toString(result) },
      }
    }
  }

  // Recurse into children; reconstruct parent around the updated child
  if (node.type === 'Not') {
    const inner = applyOnce(node.operand, rules)
    if (inner) return { ...inner, newFormula: Not(inner.newFormula) }
  }

  if (node.type === 'And' || node.type === 'Or' ||
      node.type === 'Implies' || node.type === 'Iff') {
    const lR = applyOnce(node.left, rules)
    if (lR) return { ...lR, newFormula: mkBinary(node.type, lR.newFormula, node.right) }
    const rR = applyOnce(node.right, rules)
    if (rR) return { ...rR, newFormula: mkBinary(node.type, node.left, rR.newFormula) }
  }

  return null
}

// ─── NNF / CNF detection ───────────────────────────────────────────────────────

export function isNNF(node) {
  switch (node.type) {
    case 'Atom': case 'True': case 'False': return true
    case 'Not':  return node.operand.type === 'Atom'
    case 'And':  case 'Or': return isNNF(node.left) && isNNF(node.right)
    default:     return false  // Implies / Iff / Not(compound) are not NNF
  }
}

function isCNF(node) {
  if (node.type === 'And') return isCNF(node.left) && isCNF(node.right)
  return isClause(node)
}

function isClause(node) {
  if (node.type === 'Or') return isClause(node.left) && isClause(node.right)
  return isLiteral(node)
}

function isLiteral(node) {
  return node.type === 'Atom' || node.type === 'True' || node.type === 'False' ||
         (node.type === 'Not' && node.operand.type === 'Atom')
}

// ─── Public API ────────────────────────────────────────────────────────────────

// simplify(formula, options) → Step[]
// Stops when no rule applies, or when the target form is reached.
export function simplify(formula, options = {}) {
  const { target = 'simplified', distributivity = false } = options
  const rules = buildRuleSet(target, distributivity)

  const steps = [{
    formula,
    formulaStr: toString(formula),
    rule: null,
    ruleDesc: null,
    changed: null,
  }]

  let current = formula
  const MAX_STEPS = 300

  while (steps.length <= MAX_STEPS) {
    const r = applyOnce(current, rules)
    if (!r) break

    current = r.newFormula
    steps.push({
      formula: current,
      formulaStr: toString(current),
      rule: r.ruleName,
      ruleDesc: r.ruleDesc,
      changed: r.changed,
    })

    if (target === 'nnf' && isNNF(current)) break
    if (target === 'cnf' && isCNF(current)) break
  }

  return steps
}
