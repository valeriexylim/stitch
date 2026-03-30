import { useState } from 'react'
import './CheckerScreen.css'
import TruthTable from './TruthTable.jsx'
import { parse, ParseError } from '../../logic/parser.js'
import { variables } from '../../logic/ast.js'
import { toString as fmtStr } from '../../logic/serialize.js'
import { generateTruthTable, MAX_TRUTH_TABLE_VARS, WARN_TRUTH_TABLE_VARS } from '../../logic/truthTable.js'
import { checkSat } from '../../logic/sat.js'

export default function CheckerScreen() {
  const [input, setInput]       = useState('')
  const [result, setResult]     = useState(null)   // null | result object
  const [error, setError]       = useState(null)   // parse error string

  const handleCheck = () => {
    setResult(null)
    setError(null)

    if (!input.trim()) return

    let formula
    try {
      formula = parse(input)
    } catch (e) {
      setError(e instanceof ParseError ? e.message : String(e))
      return
    }

    const vars     = variables(formula)
    const varCount = vars.length
    const formulaStr = fmtStr(formula)

    if (varCount > MAX_TRUTH_TABLE_VARS) {
      // SAT only
      const satResult = checkSat(formula)
      setResult({ mode: 'sat', varCount, formulaStr, satResult })
    } else {
      // Truth table (with optional warning)
      const tableData = generateTruthTable(formula)
      setResult({
        mode: 'truth-table',
        varCount,
        formulaStr,
        warn: varCount > WARN_TRUTH_TABLE_VARS,
        ...tableData,
      })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCheck()
  }

  return (
    <div className="checker-screen">
      <div className="checker-input-area">
        <h3>Formula</h3>
        <div className="checker-input-row">
          <input
            className={`checker-input ${error ? 'input-error' : ''}`}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. P → Q, (P ∧ Q) ↔ R, P ∨ ¬P"
            spellCheck={false}
          />
          <button className="btn-check" onClick={handleCheck} disabled={!input.trim()}>
            Check
          </button>
        </div>

        <p className="checker-hint">
          Use: <code>¬</code> or <code>~</code>, <code>∧</code> or <code>&amp;</code>,{' '}
          <code>∨</code> or <code>|</code>, <code>→</code> or <code>-&gt;</code>,{' '}
          <code>↔</code> or <code>&lt;-&gt;</code>, <code>T</code> / <code>F</code>
        </p>

        {error && <p className="checker-error">{error}</p>}
      </div>

      {result && <CheckerResult result={result} />}
    </div>
  )
}

function CheckerResult({ result }) {
  const { mode, varCount, formulaStr, warn } = result

  return (
    <div className="checker-result">
      <div className="result-meta">
        <span className="result-formula">{formulaStr}</span>
        <span className="result-vars">{varCount} variable{varCount !== 1 ? 's' : ''}</span>
        <span className={`result-mode-badge ${mode === 'sat' ? 'badge-sat' : 'badge-tt'}`}>
          {mode === 'sat' ? 'SAT mode' : 'Truth table'}
        </span>
      </div>

      {warn && (
        <div className="checker-warning">
          This formula has {varCount} variables — the truth table has {1 << varCount} rows
          and may be slow to render.
        </div>
      )}

      {mode === 'sat' && varCount > MAX_TRUTH_TABLE_VARS && (
        <div className="checker-info">
          Truth table disabled for formulas with more than {MAX_TRUTH_TABLE_VARS} variables.
          Using SAT mode instead.
        </div>
      )}

      {mode === 'truth-table' && (
        <TruthTable
          vars={result.vars}
          rows={result.rows}
          verdict={result.verdict}
          formulaStr={formulaStr}
        />
      )}

      {mode === 'sat' && <SatResult result={result.satResult} />}
    </div>
  )
}

function SatResult({ result }) {
  if (!result.sat) {
    return (
      <div className="sat-result">
        <div className="verdict-badge verdict-contradiction">
          Unsatisfiable — no assignment makes this formula true
        </div>
      </div>
    )
  }

  const entries = Object.entries(result.assignment)

  return (
    <div className="sat-result">
      <div className="verdict-badge verdict-tautology" style={{ background: '#d3f9d8', color: '#2b9348' }}>
        Satisfiable
      </div>
      {entries.length > 0 && (
        <div className="sat-assignment">
          <span className="sat-assignment-label">Satisfying assignment:</span>
          <span className="sat-assignment-vals">
            {entries.map(([name, val]) => (
              <span key={name} className={`sat-lit ${val ? 'val-true' : 'val-false'}`}>
                {name} = {val ? 'T' : 'F'}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}
