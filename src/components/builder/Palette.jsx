const OPERATORS = [
  { type: 'Not',     label: '¬', title: 'Negation — unary' },
  { type: 'And',     label: '∧', title: 'Conjunction' },
  { type: 'Or',      label: '∨', title: 'Disjunction' },
  { type: 'Implies', label: '→', title: 'Implication' },
  { type: 'Iff',     label: '↔', title: 'Biconditional' },
]

const CONSTANTS = [
  { type: 'True',  label: '⊤', title: 'True' },
  { type: 'False', label: '⊥', title: 'False' },
]

export default function Palette({
  atoms,
  customAtom,
  onCustomAtomChange,
  onAddAtom,
  onPaletteClick,
  hasSelection,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onAddAtom()
  }

  return (
    <div className="palette">
      <h3 className="palette-title">Palette</h3>

      {!hasSelection && (
        <p className="palette-hint">Select a slot or block in the formula first.</p>
      )}

      <div className="palette-section">
        <span className="palette-label">Atoms</span>
        <div className="palette-items">
          {atoms.map((name) => (
            <button
              key={name}
              className="palette-btn palette-btn-atom"
              onClick={() => onPaletteClick('Atom', name)}
              disabled={!hasSelection}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="palette-add-atom">
          <input
            type="text"
            placeholder="New variable…"
            value={customAtom}
            onChange={(e) => onCustomAtomChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={16}
          />
          <button
            onClick={onAddAtom}
            disabled={!customAtom.trim()}
          >
            Add
          </button>
        </div>
      </div>

      <div className="palette-section">
        <span className="palette-label">Constants</span>
        <div className="palette-items">
          {CONSTANTS.map(({ type, label, title }) => (
            <button
              key={type}
              className="palette-btn palette-btn-const"
              onClick={() => onPaletteClick(type)}
              disabled={!hasSelection}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-section">
        <span className="palette-label">Operators</span>
        <div className="palette-items">
          {OPERATORS.map(({ type, label, title }) => (
            <button
              key={type}
              className={`palette-btn palette-btn-op palette-btn-${type.toLowerCase()}`}
              onClick={() => onPaletteClick(type)}
              disabled={!hasSelection}
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
