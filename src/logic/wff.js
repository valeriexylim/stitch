// Well-formed formula checker.
//
// A formula is well-formed if:
//   - every node has the correct structure for its type
//   - no operands are null/undefined
//   - atom names are non-empty strings
//
// Returns: { ok: true } | { ok: false, reason: string, node }

export function checkWff(node) {
  if (node === null || node === undefined) {
    return { ok: false, reason: 'Formula is empty', node }
  }
  if (typeof node !== 'object' || typeof node.type !== 'string') {
    return { ok: false, reason: 'Invalid node structure', node }
  }

  switch (node.type) {
    case 'True':
    case 'False':
      return { ok: true }

    case 'Atom':
      if (typeof node.name !== 'string' || node.name.length === 0) {
        return { ok: false, reason: 'Atom has no name', node }
      }
      if (!/^[a-zA-Z_]\w*$/.test(node.name)) {
        return { ok: false, reason: `Invalid atom name: "${node.name}"`, node }
      }
      return { ok: true }

    case 'Not':
      if (!node.operand) {
        return { ok: false, reason: '¬ is missing its operand', node }
      }
      return checkWff(node.operand)

    case 'And':
    case 'Or':
    case 'Implies':
    case 'Iff': {
      const sym = { And: '∧', Or: '∨', Implies: '→', Iff: '↔' }[node.type]
      if (!node.left)  return { ok: false, reason: `${sym} is missing its left operand`, node }
      if (!node.right) return { ok: false, reason: `${sym} is missing its right operand`, node }
      const leftResult = checkWff(node.left)
      if (!leftResult.ok) return leftResult
      return checkWff(node.right)
    }

    default:
      return { ok: false, reason: `Unknown node type: "${node.type}"`, node }
  }
}

// Returns true if the formula is well-formed, false otherwise.
export function isWff(node) {
  return checkWff(node).ok
}
