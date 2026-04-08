import { useState } from 'react'
import './RulesReference.css'

const GROUPS = [
  {
    heading: 'Implication',
    rows: [
      { name: 'Modus Ponens (→E)',      symbol: '→E',  schema: 'p → q,  p  ⊢  q',          cit: 'implication, antecedent' },
      { name: 'Modus Tollens (MT)',      symbol: 'MT',  schema: 'p → q,  ¬q  ⊢  ¬p',         cit: 'implication, neg. consequent' },
      { name: 'Conditional Proof (→I)', symbol: '→I',  schema: '[assume p … derive q]  ⊢  p → q', cit: 'last line of subproof' },
    ],
  },
  {
    heading: 'Conjunction',
    rows: [
      { name: 'Conjunctive Addition (∧I)',              symbol: '∧I',  schema: 'p,  q  ⊢  p ∧ q',   cit: 'both conjuncts' },
      { name: 'Conj. Simplification — left (∧E₁)',     symbol: '∧E₁', schema: 'p ∧ q  ⊢  p',        cit: 'the conjunction' },
      { name: 'Conj. Simplification — right (∧E₂)',    symbol: '∧E₂', schema: 'p ∧ q  ⊢  q',        cit: 'the conjunction' },
    ],
  },
  {
    heading: 'Disjunction',
    rows: [
      { name: 'Disjunctive Addition — left (∨I₁)',  symbol: '∨I₁', schema: 'p  ⊢  p ∨ q',          cit: 'the left disjunct' },
      { name: 'Disjunctive Addition — right (∨I₂)', symbol: '∨I₂', schema: 'q  ⊢  p ∨ q',          cit: 'the right disjunct' },
      { name: 'Division into Cases (∨E)',            symbol: '∨E',  schema: 'p ∨ q,  [p…r],  [q…r]  ⊢  r', cit: 'disjunction, end of subproof 1, end of subproof 2' },
    ],
  },
  {
    heading: 'Negation & Contradiction',
    rows: [
      { name: 'Proof by Contradiction (¬I)',       symbol: '¬I',  schema: '[assume p … derive ⊥]  ⊢  ¬p', cit: 'last line of subproof (must be ⊥)' },
      { name: 'Contradiction Introduction (¬E)',   symbol: '¬E',  schema: 'p,  ¬p  ⊢  ⊥',         cit: 'a formula and its negation' },
      { name: 'Ex Falso (⊥E)',                     symbol: '⊥E',  schema: '⊥  ⊢  anything',        cit: 'the ⊥ line' },
    ],
  },
  {
    heading: 'Biconditional',
    rows: [
      { name: 'Biconditional Intro (↔I)',           symbol: '↔I',  schema: 'p → q,  q → p  ⊢  p ↔ q', cit: 'both implications' },
      { name: 'Biconditional Elim — forward (↔E₁)', symbol: '↔E₁', schema: 'p ↔ q,  p  ⊢  q',       cit: 'biconditional, left side' },
      { name: 'Biconditional Elim — backward (↔E₂)',symbol: '↔E₂', schema: 'p ↔ q,  q  ⊢  p',       cit: 'biconditional, right side' },
    ],
  },
  {
    heading: 'Structural',
    rows: [
      { name: 'Premise',    symbol: '—', schema: '(given fact)',          cit: 'none' },
      { name: 'Assumption', symbol: '—', schema: '(opens a subproof)',    cit: 'none' },
      { name: 'Reiteration (Copy)', symbol: 'Copy', schema: 'p  ⊢  p',   cit: 'the line being copied' },
    ],
  },
]

export default function RulesReference() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rules-ref">
      <button className="rules-ref-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? '▲ Hide rules reference' : '▼ Rules reference (Epp Table 2.3.1)'}
      </button>

      {open && (
        <div className="rules-ref-body">
          {GROUPS.map((group) => (
            <div key={group.heading} className="rules-ref-group">
              <div className="rules-ref-heading">{group.heading}</div>
              <table className="rules-ref-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Schema</th>
                    <th>Cite</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.symbol + row.name}>
                      <td className="ref-name">{row.name}</td>
                      <td className="ref-schema">{row.schema}</td>
                      <td className="ref-cit">{row.cit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
