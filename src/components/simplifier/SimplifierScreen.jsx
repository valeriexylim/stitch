import { useState, useEffect } from 'react'
import './SimplifierScreen.css'
import { parse, ParseError } from '../../logic/parser.js'
import { simplify, isNNF } from '../../logic/simplify.js'

const TARGETS = [
  { value: 'simplified', label: 'Simplified' },
  { value: 'nnf',        label: 'NNF'        },
  { value: 'cnf',        label: 'CNF'        },
]

export default function SimplifierScreen({ pendingFormula }) {
  const [input,          setInput]          = useState('')
  const [error,          setError]          = useState(null)
  const [steps,          setSteps]          = useState(null)
  const [stepIdx,        setStepIdx]        = useState(0)
  const [target,         setTarget]         = useState('simplified')
  const [distributivity, setDistributivity] = useState(false)
  const [showAll,        setShowAll]        = useState(false)

  useEffect(() => {
    if (!pendingFormula) return
    const f = pendingFormula.current.simplifier
    if (f) {
      setInput(f)
      setSteps(null)
      setError(null)
      pendingFormula.current.simplifier = ''
    }
  })

  const handleSimplify = () => {
    setError(null)
    setSteps(null)
    if (!input.trim()) return
    let formula
    try { formula = parse(input) }
    catch (e) { setError(e instanceof ParseError ? e.message : String(e)); return }
    const result = simplify(formula, { target, distributivity })
    setSteps(result)
    setStepIdx(0)
    setShowAll(false)
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSimplify() }

  const totalSteps   = steps ? steps.length : 0
  const currentStep  = steps ? steps[stepIdx] : null
  const isFirstStep  = stepIdx === 0
  const isLastStep   = stepIdx === totalSteps - 1

  return (
    <div className="simplifier-screen">
      {/* ── Input ── */}
      <div className="simp-input-area">
        <h3>Formula</h3>
        <div className="simp-input-row">
          <input
            className={`simp-input ${error ? 'input-error' : ''}`}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null) }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. P ↔ Q, ¬(P ∧ Q), (P → Q) ∧ (Q → R)"
            spellCheck={false}
          />
          <button className="btn-simplify" onClick={handleSimplify} disabled={!input.trim()}>
            Simplify
          </button>
        </div>
        {error && <p className="simp-error">{error}</p>}

        {/* ── Options ── */}
        <div className="simp-options">
          <span className="simp-options-label">Target:</span>
          {TARGETS.map(({ value, label }) => (
            <label key={value} className="simp-radio">
              <input
                type="radio"
                name="target"
                value={value}
                checked={target === value}
                onChange={() => setTarget(value)}
              />
              {label}
            </label>
          ))}
          <label className={`simp-checkbox ${target === 'cnf' ? 'disabled' : ''}`}>
            <input
              type="checkbox"
              checked={target === 'cnf' || distributivity}
              disabled={target === 'cnf'}
              onChange={(e) => setDistributivity(e.target.checked)}
            />
            Distributivity
          </label>
        </div>
      </div>

      {/* ── Results ── */}
      {steps && (
        <div className="simp-result">
          {/* Navigation bar */}
          <div className="simp-nav">
            <button
              className="simp-nav-btn"
              onClick={() => setStepIdx(0)}
              disabled={isFirstStep}
              title="First step"
            >«</button>
            <button
              className="simp-nav-btn"
              onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
              disabled={isFirstStep}
            >← Prev</button>
            <span className="simp-nav-counter">
              Step {stepIdx + 1} of {totalSteps}
            </span>
            <button
              className="simp-nav-btn"
              onClick={() => setStepIdx((i) => Math.min(totalSteps - 1, i + 1))}
              disabled={isLastStep}
            >Next →</button>
            <button
              className="simp-nav-btn"
              onClick={() => setStepIdx(totalSteps - 1)}
              disabled={isLastStep}
              title="Last step"
            >»</button>
            <button
              className="simp-nav-btn simp-showall"
              onClick={() => setShowAll((v) => !v)}
            >{showAll ? 'Hide list' : 'Show all'}</button>
          </div>

          {/* Current step card */}
          <div className="simp-step-card">
            {currentStep.rule ? (
              <>
                <div className="simp-step-rule">
                  <span className="rule-name">{currentStep.rule}</span>
                  <span className="rule-pattern">{currentStep.ruleDesc}</span>
                </div>
                <div className="simp-step-changed">
                  <span className="changed-label">Applied:</span>
                  <span className="changed-before">{currentStep.changed.before}</span>
                  <span className="changed-arrow">→</span>
                  <span className="changed-after">{currentStep.changed.after}</span>
                </div>
              </>
            ) : (
              <div className="simp-step-rule">
                <span className="rule-name">Original formula</span>
              </div>
            )}
            <div className="simp-step-formula">{currentStep.formulaStr}</div>
          </div>

          {/* All-steps list */}
          {showAll && (
            <div className="simp-all-steps">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`simp-all-row ${i === stepIdx ? 'current-row' : ''}`}
                  onClick={() => setStepIdx(i)}
                >
                  <span className="all-row-num">{i + 1}</span>
                  <span className="all-row-rule">
                    {step.rule ?? 'Original'}
                  </span>
                  <span className="all-row-formula">{step.formulaStr}</span>
                </div>
              ))}
            </div>
          )}

          {/* Done indicator */}
          {isLastStep && totalSteps > 1 && (
            <div className="simp-done">
              Simplification complete — {totalSteps - 1} step{totalSteps - 1 !== 1 ? 's' : ''} applied.
            </div>
          )}
          {totalSteps === 1 && (
            <div className="simp-done">Formula is already in its simplest form.</div>
          )}
        </div>
      )}
    </div>
  )
}
