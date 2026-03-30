// DPLL SAT solver.
//
// Input:  a propositional formula
// Output: { sat: true, assignment } | { sat: false }
//
// Uses toCnfClauses() from cnf.js, then runs DPLL with unit propagation.

import { variables } from './ast.js'
import { toCnfClauses } from './cnf.js'

// ─── Public API ────────────────────────────────────────────────────────────

// checkSat(formula) → { sat: boolean, assignment?: { [name]: boolean } }
export function checkSat(formula) {
  const vars = variables(formula)
  const clauses = toCnfClauses(formula)

  // Tautology: empty clause list is always satisfied.
  if (clauses.length === 0) {
    const assignment = Object.fromEntries(vars.map((v) => [v, true]))
    return { sat: true, assignment }
  }

  // Immediate contradiction: a clause list containing an empty clause.
  if (clauses.some((c) => c.length === 0)) {
    return { sat: false }
  }

  const result = dpll(clauses, vars, {})
  return result
}

// ─── DPLL ──────────────────────────────────────────────────────────────────

function dpll(clauses, vars, assignment) {
  // Apply current assignment: remove satisfied clauses, trim false literals.
  const reduced = reduceClauses(clauses, assignment)
  if (reduced === null)        return { sat: false }  // empty clause found
  if (reduced.length === 0)   return { sat: true, assignment }

  // Unit propagation: a clause with exactly one unassigned literal must be true.
  const unit = reduced.find((c) => c.length === 1)
  if (unit) {
    const [lit] = unit
    return dpll(clauses, vars, { ...assignment, [lit.name]: lit.pos })
  }

  // Pure literal elimination: if a variable appears only positively or only
  // negatively across all remaining clauses, assign the satisfying value.
  const pure = findPureLiteral(reduced, vars, assignment)
  if (pure) {
    return dpll(clauses, vars, { ...assignment, [pure.name]: pure.pos })
  }

  // Branch on the first unassigned variable.
  const unassigned = vars.find((v) => !(v in assignment))
  if (!unassigned) return { sat: false }

  const tryTrue = dpll(clauses, vars, { ...assignment, [unassigned]: true })
  if (tryTrue.sat) return tryTrue
  return dpll(clauses, vars, { ...assignment, [unassigned]: false })
}

// Returns new clause list with `assignment` applied, or null if any clause is empty.
function reduceClauses(clauses, assignment) {
  const result = []
  for (const clause of clauses) {
    const reduced = []
    let satisfied = false
    for (const lit of clause) {
      const val = assignment[lit.name]
      if (val === undefined) {
        reduced.push(lit)
      } else if (val === lit.pos) {
        satisfied = true
        break
      }
      // val !== lit.pos → literal is false, drop it from clause
    }
    if (!satisfied) {
      if (reduced.length === 0) return null  // empty clause = contradiction
      result.push(reduced)
    }
  }
  return result
}

// Find a literal whose variable appears with only one polarity in all clauses.
function findPureLiteral(clauses, vars, assignment) {
  for (const v of vars) {
    if (v in assignment) continue
    let seenPos = false, seenNeg = false
    for (const clause of clauses) {
      for (const lit of clause) {
        if (lit.name === v) {
          if (lit.pos) seenPos = true
          else seenNeg = true
        }
      }
    }
    if (seenPos && !seenNeg) return { name: v, pos: true }
    if (seenNeg && !seenPos) return { name: v, pos: false }
  }
  return null
}
