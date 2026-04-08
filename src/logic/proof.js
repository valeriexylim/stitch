// Natural deduction proof checker.
//
// validateProof(lines) → Result[]
//
// ProofLine: {
//   id       : number   — unique React key (not the line number)
//   formulaText: string — raw text, parsed here
//   rule     : string   — e.g. 'Premise', '→I', '∧E₁'
//   citText  : string   — comma-separated 1-based line numbers, e.g. "1,3"
//   depth    : number   — scope depth, 0 = top level
// }
//
// Result: { ok: boolean, error: string | null }
//
// A line whose rule is 'Assumption' opens a subproof.
// All other lines must cite in-scope or closed-subproof lines as required.

import { parse } from './parser.js'
import { equals } from './ast.js'
import { toString as fmtStr } from './serialize.js'

// ─── Public constants ──────────────────────────────────────────────────────────

export const RULE_NAMES = [
  'Premise', 'Assumption',
  '∧I', '∧E₁', '∧E₂',
  '∨I₁', '∨I₂', '∨E',
  '¬I', '¬E',
  '→I', '→E', 'MT',
  '↔I', '↔E₁', '↔E₂',
  '⊥E',
  'Copy',
]

// How many citations each rule requires (null = checked per-rule)
const CIT_COUNT = {
  '∧I': 2, '∧E₁': 1, '∧E₂': 1,
  '∨I₁': 1, '∨I₂': 1, '∨E': 3,
  '¬I': 1, '¬E': 2,
  '→I': 1, '→E': 2, 'MT': 2,
  '↔I': 2, '↔E₁': 2, '↔E₂': 2,
  '⊥E': 1, 'Copy': 1,
}

// ─── Citation parsing ─────────────────────────────────────────────────────────

// "1,3,5" → [1,3,5]   invalid → null
export function parseCitations(citText) {
  if (!citText.trim()) return []
  return citText.split(',').reduce((acc, s) => {
    if (acc === null) return null
    const n = parseInt(s.trim(), 10)
    if (isNaN(n) || n <= 0 || String(n) !== s.trim()) return null
    acc.push(n)
    return acc
  }, [])
}

// ─── Scope helpers ────────────────────────────────────────────────────────────

// Line `from` is directly accessible from line `to` (both 0-indexed).
// True iff the scope depth never drops below lines[from].depth between from and to,
// and no new Assumption at the same depth appears after `from` (which would close
// the subproof containing `from` and start a sibling subproof).
export function isRegularlyAccessible(lines, from, to) {
  if (from < 0 || from >= to) return false
  const d = lines[from].depth
  for (let k = from + 1; k < to; k++) {
    if (lines[k].depth < d) return false
    if (lines[k].depth === d && lines[k].rule === 'Assumption') return false
  }
  return true
}

// Line `citedIdx` is the closing conclusion of a subproof that can be cited by
// a subproof-discharging rule at `currentIdx`.
// Conditions:
//   1. lines[citedIdx].depth > lines[currentIdx].depth
//   2. The subproof is closed immediately after citedIdx: the line at citedIdx+1
//      either has depth < lines[citedIdx].depth (normal closure) or is a new
//      Assumption at the same depth (sibling subproof starts, closing the previous one).
export function isSubproofConclusion(lines, citedIdx, currentIdx) {
  if (citedIdx < 0 || citedIdx >= currentIdx) return false
  const d = lines[citedIdx].depth
  if (d <= lines[currentIdx].depth) return false
  const next = citedIdx + 1
  if (next >= currentIdx) return true   // nothing between them
  return lines[next].depth < d ||
         (lines[next].depth === d && lines[next].rule === 'Assumption')
}

// Walk backwards from conclusionIdx to find the 'Assumption' that opened the
// same subproof.  Returns the 0-based index of the assumption or null.
export function findSubproofAssumption(lines, conclusionIdx) {
  const depth = lines[conclusionIdx].depth
  for (let i = conclusionIdx - 1; i >= 0; i--) {
    if (lines[i].depth < depth) break // stepped out of the subproof scope
    if (lines[i].depth === depth && lines[i].rule === 'Assumption') {
      // Confirm continuity: no line between i and conclusionIdx has depth < depth
      let ok = true
      for (let k = i + 1; k <= conclusionIdx; k++) {
        if (lines[k].depth < depth) { ok = false; break }
      }
      if (ok) return i
    }
  }
  return null
}

// ─── Result helpers ───────────────────────────────────────────────────────────

const ok  = ()    => ({ ok: true,  error: null })
const err = (msg) => ({ ok: false, error: msg  })

// ─── Rule validation ──────────────────────────────────────────────────────────

function validateRule(lines, parsed, i, formula, cidxs, rule) {
  const getF = (idx) => {
    const f = parsed[idx]
    return (!f || f.__error) ? null : f
  }

  // Shorthand: cited formula at position pos in cidxs
  const cf = (pos) => getF(cidxs[pos])

  // Regular-accessibility error message
  const accessErr = (cidx) =>
    isRegularlyAccessible(lines, cidx, i)
      ? null
      : `Line ${cidx + 1} is not accessible from here (it is inside a closed subproof)`

  switch (rule) {
    // ── Conjunction ───────────────────────────────────────────────────────────
    case '∧I': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      if (formula.type !== 'And') return err('∧I: the derived formula must be a conjunction')
      if (!equals(formula.left, fa))  return err(`∧I: left side must match line ${a + 1}`)
      if (!equals(formula.right, fb)) return err(`∧I: right side must match line ${b + 1}`)
      return ok()
    }

    case '∧E₁': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (fa.type !== 'And') return err(`Line ${cidxs[0] + 1} must be a conjunction`)
      if (!equals(formula, fa.left)) return err(`∧E₁: formula must be the left conjunct of line ${cidxs[0] + 1}`)
      return ok()
    }

    case '∧E₂': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (fa.type !== 'And') return err(`Line ${cidxs[0] + 1} must be a conjunction`)
      if (!equals(formula, fa.right)) return err(`∧E₂: formula must be the right conjunct of line ${cidxs[0] + 1}`)
      return ok()
    }

    // ── Disjunction ───────────────────────────────────────────────────────────
    case '∨I₁': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (formula.type !== 'Or') return err('∨I₁: derived formula must be a disjunction')
      if (!equals(formula.left, fa)) return err(`∨I₁: left disjunct must match line ${cidxs[0] + 1}`)
      return ok()
    }

    case '∨I₂': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (formula.type !== 'Or') return err('∨I₂: derived formula must be a disjunction')
      if (!equals(formula.right, fa)) return err(`∨I₂: right disjunct must match line ${cidxs[0] + 1}`)
      return ok()
    }

    case '∨E': {
      const [aidx, bidx, cidx] = cidxs
      const e = accessErr(aidx)
      if (e) return err(e)
      const disj = getF(aidx)
      if (!disj) return err(`Line ${aidx + 1} has no valid formula`)
      if (disj.type !== 'Or') return err(`Line ${aidx + 1} must be a disjunction (φ ∨ ψ)`)

      if (!isSubproofConclusion(lines, bidx, i))
        return err(`Line ${bidx + 1} is not the conclusion of a closed subproof at this point`)
      if (!isSubproofConclusion(lines, cidx, i))
        return err(`Line ${cidx + 1} is not the conclusion of a closed subproof at this point`)

      const bAssIdx = findSubproofAssumption(lines, bidx)
      const cAssIdx = findSubproofAssumption(lines, cidx)
      if (bAssIdx === null) return err(`Cannot find assumption for subproof ending at line ${bidx + 1}`)
      if (cAssIdx === null) return err(`Cannot find assumption for subproof ending at line ${cidx + 1}`)

      const bAss = getF(bAssIdx), cAss = getF(cAssIdx)
      const bCon = getF(bidx),    cCon = getF(cidx)
      if (!bAss) return err(`Assumption at line ${bAssIdx + 1} has no valid formula`)
      if (!cAss) return err(`Assumption at line ${cAssIdx + 1} has no valid formula`)

      // Assumptions must match the two disjuncts (either order)
      const match1 = equals(bAss, disj.left)  && equals(cAss, disj.right)
      const match2 = equals(bAss, disj.right) && equals(cAss, disj.left)
      if (!match1 && !match2)
        return err(`∨E: the assumptions of the two subproofs must match the disjuncts of line ${aidx + 1}`)

      if (!bCon) return err(`Line ${bidx + 1} has no valid formula`)
      if (!cCon) return err(`Line ${cidx + 1} has no valid formula`)
      if (!equals(bCon, cCon))
        return err('∨E: both subproofs must derive the same conclusion')
      if (!equals(formula, bCon))
        return err('∨E: derived formula must match the common conclusion of both subproofs')
      return ok()
    }

    // ── Negation ──────────────────────────────────────────────────────────────
    case '¬I': {
      const cidx = cidxs[0]
      if (!isSubproofConclusion(lines, cidx, i))
        return err(`Line ${cidx + 1} is not the conclusion of a closed subproof at this point`)
      const assIdx = findSubproofAssumption(lines, cidx)
      if (assIdx === null) return err(`Cannot find assumption for subproof ending at line ${cidx + 1}`)
      const concl = getF(cidx)
      if (!concl) return err(`Line ${cidx + 1} has no valid formula`)
      if (concl.type !== 'False') return err(`¬I: the subproof must conclude with ⊥ (line ${cidx + 1} is not ⊥)`)
      const assump = getF(assIdx)
      if (!assump) return err(`Assumption at line ${assIdx + 1} has no valid formula`)
      if (formula.type !== 'Not') return err('¬I: derived formula must be a negation')
      if (!equals(formula.operand, assump))
        return err(`¬I: expected ¬(${fmtStr(assump)}), got ${fmtStr(formula)}`)
      return ok()
    }

    case '¬E': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      if (formula.type !== 'False') return err('¬E: derived formula must be ⊥')
      if (fb.type === 'Not' && equals(fa, fb.operand)) return ok()
      if (fa.type === 'Not' && equals(fb, fa.operand)) return ok()
      return err('¬E: one cited formula must be the negation of the other')
    }

    // ── Implication ───────────────────────────────────────────────────────────
    case '→I': {
      const cidx = cidxs[0]
      if (!isSubproofConclusion(lines, cidx, i))
        return err(`Line ${cidx + 1} is not the conclusion of a closed subproof at this point`)
      const assIdx = findSubproofAssumption(lines, cidx)
      if (assIdx === null) return err(`Cannot find assumption for subproof ending at line ${cidx + 1}`)
      const concl  = getF(cidx)
      const assump = getF(assIdx)
      if (!concl)  return err(`Line ${cidx + 1} has no valid formula`)
      if (!assump) return err(`Assumption at line ${assIdx + 1} has no valid formula`)
      if (formula.type !== 'Implies') return err('→I: derived formula must be an implication')
      if (!equals(formula.left, assump) || !equals(formula.right, concl))
        return err(`→I: expected ${fmtStr(assump)} → ${fmtStr(concl)}, got ${fmtStr(formula)}`)
      return ok()
    }

    case '→E': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      // Either fa = φ→ψ & fb = φ & formula = ψ, or swapped
      if (fa.type === 'Implies' && equals(fa.left, fb) && equals(fa.right, formula)) return ok()
      if (fb.type === 'Implies' && equals(fb.left, fa) && equals(fb.right, formula)) return ok()
      return err('Modus Ponens (→E): one cited formula must be an implication whose antecedent is the other cited formula')
    }

    case 'MT': {
      // Modus Tollens: φ → ψ, ¬ψ ⊢ ¬φ
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      if (formula.type !== 'Not') return err('Modus Tollens (MT): derived formula must be a negation')
      // Find which cited formula is the implication
      let impl, negConseq
      if (fa.type === 'Implies') { impl = fa; negConseq = fb }
      else if (fb.type === 'Implies') { impl = fb; negConseq = fa }
      else return err('Modus Tollens (MT): one cited formula must be an implication')
      if (negConseq.type !== 'Not') return err('Modus Tollens (MT): one cited formula must be the negation of the consequent')
      if (!equals(negConseq.operand, impl.right))
        return err('Modus Tollens (MT): the negated formula must match the consequent of the implication')
      if (!equals(formula.operand, impl.left))
        return err(`Modus Tollens (MT): expected ¬(${fmtStr(impl.left)}), got ${fmtStr(formula)}`)
      return ok()
    }

    // ── Biconditional ─────────────────────────────────────────────────────────
    case '↔I': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      if (formula.type !== 'Iff') return err('↔I: derived formula must be a biconditional')
      if (fa.type !== 'Implies' || fb.type !== 'Implies')
        return err('↔I: both cited formulas must be implications')
      // Check (φ→ψ) and (ψ→φ) in either order
      const ok1 = equals(fa.left, formula.left) && equals(fa.right, formula.right)
               && equals(fb.left, formula.right) && equals(fb.right, formula.left)
      const ok2 = equals(fb.left, formula.left) && equals(fb.right, formula.right)
               && equals(fa.left, formula.right) && equals(fa.right, formula.left)
      if (!ok1 && !ok2) return err('↔I: the two implications must be converses of each other and match the biconditional')
      return ok()
    }

    case '↔E₁': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      // Find which is the biconditional
      let bic, ante
      if      (fa.type === 'Iff') { bic = fa; ante = fb }
      else if (fb.type === 'Iff') { bic = fb; ante = fa }
      else return err('↔E₁: one cited formula must be a biconditional')
      if (equals(bic.left, ante) && equals(bic.right, formula)) return ok()
      return err(`↔E₁: given ${fmtStr(ante)} and the biconditional, the derived formula must be the right side`)
    }

    case '↔E₂': {
      const [a, b] = [cidxs[0], cidxs[1]]
      const e = accessErr(a) ?? accessErr(b)
      if (e) return err(e)
      const [fa, fb] = [cf(0), cf(1)]
      if (!fa) return err(`Line ${a + 1} has no valid formula`)
      if (!fb) return err(`Line ${b + 1} has no valid formula`)
      let bic, ante
      if      (fa.type === 'Iff') { bic = fa; ante = fb }
      else if (fb.type === 'Iff') { bic = fb; ante = fa }
      else return err('↔E₂: one cited formula must be a biconditional')
      if (equals(bic.right, ante) && equals(bic.left, formula)) return ok()
      return err(`↔E₂: given ${fmtStr(ante)} and the biconditional, the derived formula must be the left side`)
    }

    // ── Falsum / Reiteration ─────────────────────────────────────────────────
    case '⊥E': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (fa.type !== 'False') return err(`⊥E: line ${cidxs[0] + 1} must be ⊥`)
      return ok() // Ex falso: any formula follows
    }

    case 'Copy': {
      const e = accessErr(cidxs[0])
      if (e) return err(e)
      const fa = cf(0)
      if (!fa) return err(`Line ${cidxs[0] + 1} has no valid formula`)
      if (!equals(formula, fa)) return err(`Copy: formula must exactly match line ${cidxs[0] + 1}`)
      return ok()
    }

    default:
      return err(`Unknown rule: "${rule}"`)
  }
}

// ─── Main validator ───────────────────────────────────────────────────────────

export function validateProof(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return []

  // Parse all formulas up front
  const parsed = lines.map((line) => {
    if (!line.formulaText.trim()) return null
    try { return parse(line.formulaText) }
    catch (e) { return { __error: e.message } }
  })

  return lines.map((line, i) => {
    const formula = parsed[i]

    if (!formula)            return err('Formula is empty')
    if (formula.__error)     return err(formula.__error)

    if (line.rule === 'Premise' || line.rule === 'Assumption') return ok()

    if (!RULE_NAMES.includes(line.rule)) return err(`Unknown rule: "${line.rule}"`)

    const cits = parseCitations(line.citText)
    if (cits === null) return err('Invalid citation format — use comma-separated line numbers, e.g. "1,2"')

    const needed = CIT_COUNT[line.rule]
    if (needed !== undefined && cits.length !== needed) {
      return err(`${line.rule} requires ${needed} citation${needed !== 1 ? 's' : ''}, got ${cits.length}`)
    }

    // Convert to 0-indexed; validate existence
    const cidxs = cits.map((n) => n - 1)
    for (const cidx of cidxs) {
      if (cidx < 0 || cidx >= lines.length)
        return err(`Line ${cidx + 1} does not exist`)
      if (cidx === i)
        return err('A line cannot cite itself')
    }

    return validateRule(lines, parsed, i, formula, cidxs, line.rule)
  })
}
