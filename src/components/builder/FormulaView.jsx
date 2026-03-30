import { pathsEqual } from '../../logic/builder.js'

const BINARY_SYM = { And: '∧', Or: '∨', Implies: '→', Iff: '↔' }

// Renders a formula node as a nested block tree.
// path        : string[] — path from root to this node
// selectedPath: string[] | null — path of the currently selected node
// onSelect    : (path: string[]) => void
export default function FormulaView({ node, path, selectedPath, onSelect }) {
  const isSelected = selectedPath !== null && pathsEqual(path, selectedPath)
  const sel = isSelected ? ' fblock-selected' : ''
  const onClick = (e) => { e.stopPropagation(); onSelect(path) }

  if (!node || node.type === 'Hole') {
    return (
      <span className={`fblock fblock-hole${sel}`} onClick={onClick} title="Empty slot">
        slot
      </span>
    )
  }

  switch (node.type) {
    case 'Atom':
      return (
        <span className={`fblock fblock-atom${sel}`} onClick={onClick}>
          {node.name}
        </span>
      )

    case 'True':
      return (
        <span className={`fblock fblock-true${sel}`} onClick={onClick} title="True (⊤)">
          ⊤
        </span>
      )

    case 'False':
      return (
        <span className={`fblock fblock-false${sel}`} onClick={onClick} title="False (⊥)">
          ⊥
        </span>
      )

    case 'Not':
      return (
        <span className={`fblock fblock-not${sel}`} onClick={onClick} title="Negation (¬)">
          <span className="fblock-opsym">¬</span>
          <FormulaView
            node={node.operand}
            path={[...path, 'operand']}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        </span>
      )

    case 'And':
    case 'Or':
    case 'Implies':
    case 'Iff': {
      const typeClass = `fblock-${node.type.toLowerCase()}`
      const sym = BINARY_SYM[node.type]
      return (
        <span className={`fblock fblock-binary ${typeClass}${sel}`} onClick={onClick} title={node.type}>
          <FormulaView
            node={node.left}
            path={[...path, 'left']}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
          <span className="fblock-opsym">{sym}</span>
          <FormulaView
            node={node.right}
            path={[...path, 'right']}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        </span>
      )
    }

    default:
      return <span className="fblock fblock-unknown">?</span>
  }
}
