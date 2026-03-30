// AST node constructors for propositional logic formulas.
// All nodes are plain immutable objects identified by `type`.

export const Atom = (name) => ({ type: 'Atom', name })
export const True_ = () => ({ type: 'True' })
export const False_ = () => ({ type: 'False' })
export const Not = (operand) => ({ type: 'Not', operand })
export const And = (left, right) => ({ type: 'And', left, right })
export const Or = (left, right) => ({ type: 'Or', left, right })
export const Implies = (left, right) => ({ type: 'Implies', left, right })
export const Iff = (left, right) => ({ type: 'Iff', left, right })

// Enumerate all variables (atom names) in a formula, in order of first appearance.
export function variables(node) {
  const seen = new Set()
  const result = []
  function walk(n) {
    if (!n) return
    switch (n.type) {
      case 'Atom':
        if (!seen.has(n.name)) { seen.add(n.name); result.push(n.name) }
        break
      case 'Not': walk(n.operand); break
      case 'And': case 'Or': case 'Implies': case 'Iff':
        walk(n.left); walk(n.right); break
      // True / False have no variables
    }
  }
  walk(node)
  return result
}

// Deep structural equality check.
// Returns false for null/undefined — they are not valid formulas.
export function equals(a, b) {
  if (!a || !b) return false
  if (a === b) return true
  if (a.type !== b.type) return false
  switch (a.type) {
    case 'Atom': return a.name === b.name
    case 'True': case 'False': return true
    case 'Not': return equals(a.operand, b.operand)
    case 'And': case 'Or': case 'Implies': case 'Iff':
      return equals(a.left, b.left) && equals(a.right, b.right)
    default: return false
  }
}
