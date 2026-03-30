// Generate a full truth table for a formula.
//
// Returns:
//   { vars, rows, verdict }
//   vars    : string[]         — variable names in order of first appearance
//   rows    : Array<{ assignment: { [name]: boolean }, result: boolean }>
//   verdict : 'tautology' | 'contradiction' | 'contingent'

import { variables } from './ast.js'
import { evaluate } from './evaluate.js'

export const MAX_TRUTH_TABLE_VARS = 8
export const WARN_TRUTH_TABLE_VARS = 6

export function generateTruthTable(formula) {
  const vars = variables(formula)
  const n = vars.length
  const rowCount = 1 << n   // 2^n
  const rows = []

  for (let i = 0; i < rowCount; i++) {
    const assignment = {}
    for (let j = 0; j < n; j++) {
      // MSB first so the table reads naturally (T,T,...  T,T,...F  ...)
      // Negate so row 0 is all-true (standard truth-table convention).
      assignment[vars[j]] = !((i >> (n - 1 - j)) & 1)
    }
    rows.push({ assignment, result: evaluate(formula, assignment) })
  }

  const allTrue  = rows.every((r) => r.result)
  const allFalse = rows.every((r) => !r.result)
  const verdict  = allTrue ? 'tautology' : allFalse ? 'contradiction' : 'contingent'

  return { vars, rows, verdict }
}
