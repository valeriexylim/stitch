import { useState, useCallback, useEffect } from 'react'
import './ProofChecker.css'
import { RULE_NAMES, validateProof } from '../../logic/proof.js'
import RulesReference from './RulesReference.jsx'

// Rules that need no citations
const NO_CIT_RULES = new Set(['Premise', 'Assumption'])

const RULE_DISPLAY = {
  'Premise':  'Premise',
  'Assumption': 'Assumption',
  '∧I':   'Conjunctive Addition (∧I)',
  '∧E₁':  'Conj. Simplification — left (∧E₁)',
  '∧E₂':  'Conj. Simplification — right (∧E₂)',
  '∨I₁':  'Disjunctive Addition — left (∨I₁)',
  '∨I₂':  'Disjunctive Addition — right (∨I₂)',
  '∨E':   'Division into Cases (∨E)',
  '¬I':   'Proof by Contradiction (¬I)',
  '¬E':   'Contradiction Introduction (¬E)',
  '→I':   'Conditional Proof (→I)',
  '→E':   'Modus Ponens (→E)',
  'MT':   'Modus Tollens (MT)',
  '↔I':   'Biconditional Intro (↔I)',
  '↔E₁':  'Biconditional Elim — forward (↔E₁)',
  '↔E₂':  'Biconditional Elim — backward (↔E₂)',
  '⊥E':   'Ex Falso (⊥E)',
  'Copy': 'Reiteration (Copy)',
}

let _nextId = 1
const newLine = (depth = 0) => ({
  id: _nextId++,
  formulaText: '',
  rule: 'Premise',
  citText: '',
  depth,
})

export default function ProofChecker({ pendingFormula }) {
  const [lines, setLines]           = useState([newLine(0)])
  const [results, setResults]       = useState(null)
  const [validated, setValidated]   = useState(false)

  useEffect(() => {
    if (!pendingFormula) return
    const f = pendingFormula.current.proof
    if (f) {
      const premiseLine = { ...newLine(0), formulaText: f, rule: 'Premise' }
      setLines([premiseLine])
      setResults(null)
      setValidated(false)
      pendingFormula.current.proof = ''
    }
  })

  // ── Derived state ─────────────────────────────────────────────────────────

  const allOk = results && results.every((r) => r.ok)

  // ── Mutations ─────────────────────────────────────────────────────────────

  const updateLine = useCallback((id, patch) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    setValidated(false)
    setResults(null)
  }, [])

  const addLine = useCallback(() => {
    setLines((prev) => {
      const last = prev[prev.length - 1]
      return [...prev, newLine(last ? last.depth : 0)]
    })
    setValidated(false)
    setResults(null)
  }, [])

  const deleteLine = useCallback((id) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)))
    setValidated(false)
    setResults(null)
  }, [])

  const indentLine = useCallback((id, delta) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l
        const d = Math.max(0, l.depth + delta)
        return { ...l, depth: d }
      })
    )
    setValidated(false)
    setResults(null)
  }, [])

  const clearAll = useCallback(() => {
    setLines([newLine(0)])
    setResults(null)
    setValidated(false)
  }, [])

  // ── Validation ────────────────────────────────────────────────────────────

  const handleValidate = () => {
    const r = validateProof(lines)
    setResults(r)
    setValidated(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="proof-screen">
      {/* Top controls */}
      <div className="proof-controls">
        <button className="btn-proof primary" onClick={handleValidate}>
          Check proof
        </button>
        <button className="btn-proof" onClick={clearAll}>
          Clear
        </button>
        {validated && (
          <span className={`proof-validate-status ${allOk ? 'all-ok' : 'has-err'}`}>
            {allOk
              ? `Valid — ${lines.length} line${lines.length !== 1 ? 's' : ''}`
              : 'Proof has errors'}
          </span>
        )}
      </div>

      {/* Proof table */}
      <div className="proof-table">
        <div className="proof-table-header">
          <span>#</span>
          <span></span>
          <span>Formula</span>
          <span>Rule</span>
          <span>Cit.</span>
          <span></span>
        </div>

        {lines.map((line, i) => {
          const result    = results ? results[i] : null
          const hasError  = result && !result.ok
          const needsCit  = !NO_CIT_RULES.has(line.rule)

          return (
            <div key={line.id}>
              <div
                className={`proof-line-row ${hasError ? 'row-error' : result ? 'row-ok' : ''}`}
              >
                {/* Line number */}
                <span className="cell-num">{i + 1}</span>

                {/* Depth controls (indent/outdent) */}
                <span className="cell-depth">
                  <button
                    className="depth-btn"
                    title="Outdent"
                    onClick={() => indentLine(line.id, -1)}
                    disabled={line.depth === 0}
                  >←</button>
                  <button
                    className="depth-btn"
                    title="Indent"
                    onClick={() => indentLine(line.id, +1)}
                  >→</button>
                </span>

                {/* Formula */}
                <span className="cell-formula">
                  {Array.from({ length: line.depth }, (_, k) => (
                    <span key={k} className="depth-indent" />
                  ))}
                  <input
                    className={`formula-input ${hasError && !result?.error?.includes('citation') ? 'input-error' : ''}`}
                    type="text"
                    value={line.formulaText}
                    placeholder="formula"
                    spellCheck={false}
                    onChange={(e) => updateLine(line.id, { formulaText: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleValidate() }}
                  />
                </span>

                {/* Rule */}
                <select
                  className="rule-select"
                  value={line.rule}
                  onChange={(e) => updateLine(line.id, { rule: e.target.value, citText: '' })}
                >
                  {RULE_NAMES.map((r) => (
                    <option key={r} value={r}>{RULE_DISPLAY[r] ?? r}</option>
                  ))}
                </select>

                {/* Citations */}
                <input
                  className="cit-input"
                  type="text"
                  value={line.citText}
                  placeholder={needsCit ? 'e.g. 1,2' : ''}
                  disabled={!needsCit}
                  onChange={(e) => updateLine(line.id, { citText: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleValidate() }}
                />

                {/* Delete */}
                <button
                  className="btn-delete-line"
                  title="Remove line"
                  onClick={() => deleteLine(line.id)}
                >×</button>
              </div>

              {/* Error message */}
              {hasError && (
                <div className="line-result">{result.error}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add line */}
      <button className="btn-add-line" onClick={addLine}>
        + Add line
      </button>

      <p className="proof-help">
        Use <code>¬</code> <code>∧</code> <code>∨</code> <code>→</code> <code>↔</code> <code>⊤</code> <code>⊥</code> or ASCII (<code>~</code> <code>&amp;</code> <code>|</code> <code>-&gt;</code> <code>&lt;-&gt;</code> <code>T</code> <code>F</code>).
        Indent lines to open a subproof (Assumption rule).
      </p>

      <RulesReference />
    </div>
  )
}
