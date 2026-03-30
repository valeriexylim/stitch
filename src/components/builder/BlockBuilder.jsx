import { useState } from 'react'
import './BlockBuilder.css'
import FormulaView from './FormulaView.jsx'
import Palette from './Palette.jsx'
import { Hole, createNode, setAt, hasHoles, pathsEqual } from '../../logic/builder.js'
import { checkWff } from '../../logic/wff.js'
import { toString as fmtStr, toLatex } from '../../logic/serialize.js'

const DEFAULT_ATOMS = ['P', 'Q', 'R', 'S']

export default function BlockBuilder() {
  const [formula, setFormula] = useState(Hole())
  const [selectedPath, setSelectedPath] = useState(null)
  const [atoms, setAtoms] = useState(DEFAULT_ATOMS)
  const [customAtom, setCustomAtom] = useState('')
  const [copied, setCopied] = useState(null)

  // Toggle selection: clicking the same node again deselects it.
  const handleSelect = (path) => {
    setSelectedPath((prev) =>
      prev && pathsEqual(prev, path) ? null : path
    )
  }

  const handlePaletteClick = (type, name) => {
    if (selectedPath === null) return
    const newNode = createNode(type, name)
    setFormula((prev) => setAt(prev, selectedPath, newNode))
    // Auto-advance selection to the first child slot, if any.
    if (type === 'Not') {
      setSelectedPath([...selectedPath, 'operand'])
    } else if (['And', 'Or', 'Implies', 'Iff'].includes(type)) {
      setSelectedPath([...selectedPath, 'left'])
    } else {
      setSelectedPath(null)
    }
  }

  const handleDelete = () => {
    if (selectedPath === null) return
    setFormula((prev) => setAt(prev, selectedPath, Hole()))
    setSelectedPath(null)
  }

  const handleClear = () => {
    setFormula(Hole())
    setSelectedPath(null)
  }

  const handleAddAtom = () => {
    const name = customAtom.trim()
    if (!name || !/^[a-zA-Z_]\w*$/.test(name)) return
    if (!atoms.includes(name)) setAtoms((prev) => [...prev, name])
    setCustomAtom('')
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 1500)
    })
  }

  const incomplete = hasHoles(formula)
  const wffResult = !incomplete ? checkWff(formula) : null
  const isWff = !incomplete && wffResult?.ok

  const formulaStr = isWff ? fmtStr(formula) : ''
  const latexStr = isWff ? toLatex(formula) : ''

  let statusClass = 'status-incomplete'
  let statusText = 'Incomplete — fill all slots'
  if (!incomplete) {
    if (isWff) { statusClass = 'status-ok'; statusText = 'Well-formed formula' }
    else { statusClass = 'status-error'; statusText = wffResult?.reason ?? 'Invalid formula' }
  }

  return (
    <div className="block-builder">

      {/* ── Left: formula area ── */}
      <div className="builder-main">
        <div className="formula-header">
          <h3>Formula</h3>
          <span className={`wff-status ${statusClass}`}>{statusText}</span>
        </div>

        {/* Clicking the canvas background deselects */}
        <div
          className="formula-canvas"
          onClick={() => setSelectedPath(null)}
        >
          <FormulaView
            node={formula}
            path={[]}
            selectedPath={selectedPath}
            onSelect={handleSelect}
          />
        </div>

        {isWff && (
          <div className="export-panel">
            <h4>Export</h4>
            <div className="export-row">
              <span className="export-label">Formula</span>
              <input
                className="export-input"
                type="text"
                readOnly
                value={formulaStr}
              />
              <button onClick={() => copyToClipboard(formulaStr, 'formula')}>
                {copied === 'formula' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="export-row">
              <span className="export-label">LaTeX</span>
              <input
                className="export-input"
                type="text"
                readOnly
                value={latexStr}
              />
              <button onClick={() => copyToClipboard(latexStr, 'latex')}>
                {copied === 'latex' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="export-row">
              <span className="export-label">JSON AST</span>
              <button onClick={() => copyToClipboard(JSON.stringify(formula, null, 2), 'json')}>
                {copied === 'json' ? 'Copied!' : 'Copy JSON'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: palette + actions ── */}
      <aside className="builder-sidebar">
        <Palette
          atoms={atoms}
          customAtom={customAtom}
          onCustomAtomChange={setCustomAtom}
          onAddAtom={handleAddAtom}
          onPaletteClick={handlePaletteClick}
          hasSelection={selectedPath !== null}
        />
        <div className="builder-actions">
          <button
            className="btn-delete"
            onClick={handleDelete}
            disabled={selectedPath === null}
          >
            Delete selected
          </button>
          <button className="btn-clear" onClick={handleClear}>
            Clear all
          </button>
        </div>
      </aside>
    </div>
  )
}
