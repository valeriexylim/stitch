// Convert a propositional formula to CNF.
//
// Pipeline:
//   1. elimIff      — replace ↔ with (→ ∧ →)
//   2. elimImplies  — replace → with (¬ ∨)
//   3. toNNF        — push negations inward (De Morgan, double negation)
//   4. simpConst    — fold True/False constants
//   5. distributeOr — distribute ∨ over ∧
//   6. extractClauses — read off clause list
//
// Returns Array<Array<Literal>>
//   Literal: { name: string, pos: boolean }
//
// Special cases:
//   tautology    → []           (empty clause list — trivially satisfied)
//   contradiction → [[]]        (clause list with one empty clause)

import { And, Or, Not, True_, False_, Implies } from './ast.js'

// ─── Step 1: eliminate biconditionals ──────────────────────────────────────

function elimIff(node) {
  switch (node.type) {
    case 'Iff':
      return And(
        elimIff(Implies(node.left,  node.right)),
        elimIff(Implies(node.right, node.left))
      )
    case 'Implies': return Implies(elimIff(node.left), elimIff(node.right))
    case 'And':     return And(elimIff(node.left), elimIff(node.right))
    case 'Or':      return Or(elimIff(node.left), elimIff(node.right))
    case 'Not':     return Not(elimIff(node.operand))
    default:        return node
  }
}

// ─── Step 2: eliminate implications ────────────────────────────────────────

function elimImplies(node) {
  switch (node.type) {
    case 'Implies': return Or(Not(elimImplies(node.left)), elimImplies(node.right))
    case 'And':     return And(elimImplies(node.left), elimImplies(node.right))
    case 'Or':      return Or(elimImplies(node.left), elimImplies(node.right))
    case 'Not':     return Not(elimImplies(node.operand))
    default:        return node
  }
}

// ─── Step 3: Negation Normal Form ──────────────────────────────────────────

function toNNF(node) {
  if (node.type !== 'Not') {
    switch (node.type) {
      case 'And': return And(toNNF(node.left), toNNF(node.right))
      case 'Or':  return Or(toNNF(node.left), toNNF(node.right))
      default:    return node
    }
  }
  const inner = node.operand
  switch (inner.type) {
    case 'Not':   return toNNF(inner.operand)                                     // ¬¬φ → φ
    case 'And':   return toNNF(Or(Not(inner.left), Not(inner.right)))             // De Morgan
    case 'Or':    return toNNF(And(Not(inner.left), Not(inner.right)))            // De Morgan
    case 'True':  return False_()
    case 'False': return True_()
    default:      return node  // Not(Atom) — already a literal
  }
}

// ─── Step 4: simplify True/False constants ─────────────────────────────────

function simpConst(node) {
  switch (node.type) {
    case 'Not': {
      const o = simpConst(node.operand)
      if (o.type === 'True')  return False_()
      if (o.type === 'False') return True_()
      return Not(o)
    }
    case 'And': {
      const l = simpConst(node.left), r = simpConst(node.right)
      if (l.type === 'False' || r.type === 'False') return False_()
      if (l.type === 'True') return r
      if (r.type === 'True') return l
      return And(l, r)
    }
    case 'Or': {
      const l = simpConst(node.left), r = simpConst(node.right)
      if (l.type === 'True' || r.type === 'True') return True_()
      if (l.type === 'False') return r
      if (r.type === 'False') return l
      return Or(l, r)
    }
    default: return node
  }
}

// ─── Step 5: distribute ∨ over ∧ ───────────────────────────────────────────

function distributeOr(node) {
  if (node.type === 'And') {
    return And(distributeOr(node.left), distributeOr(node.right))
  }
  if (node.type === 'Or') {
    const l = distributeOr(node.left)
    const r = distributeOr(node.right)
    if (l.type === 'And') {
      return And(distributeOr(Or(l.left, r)), distributeOr(Or(l.right, r)))
    }
    if (r.type === 'And') {
      return And(distributeOr(Or(l, r.left)), distributeOr(Or(l, r.right)))
    }
    return Or(l, r)
  }
  return node
}

// ─── Step 6: extract clause list ───────────────────────────────────────────

function extractClauses(node) {
  if (node.type === 'And') {
    return [...extractClauses(node.left), ...extractClauses(node.right)]
  }
  return [extractLiterals(node)]
}

function extractLiterals(node) {
  if (node.type === 'Or') {
    return [...extractLiterals(node.left), ...extractLiterals(node.right)]
  }
  if (node.type === 'Atom') return [{ name: node.name, pos: true }]
  if (node.type === 'Not' && node.operand.type === 'Atom') {
    return [{ name: node.operand.name, pos: false }]
  }
  throw new Error(`toCnfClauses: unexpected node in clause — "${node.type}"`)
}

// ─── Public API ────────────────────────────────────────────────────────────

export function toCnfClauses(formula) {
  const noIff     = elimIff(formula)
  const noImpl    = elimImplies(noIff)
  const nnf       = toNNF(noImpl)
  const simplified = simpConst(nnf)

  if (simplified.type === 'True')  return []    // tautology
  if (simplified.type === 'False') return [[]]  // contradiction

  const cnf = distributeOr(simplified)
  return extractClauses(cnf)
}

// Exported for testing
export { elimIff, elimImplies, toNNF, simpConst, distributeOr }
