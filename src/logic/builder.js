// Builder helpers: manage a partial formula tree where empty slots are Holes.
// All operations are pure — they return new trees, never mutate.

import { Atom, True_, False_, Not, And, Or, Implies, Iff } from './ast.js'

// A Hole is an empty slot waiting to be filled.
export const Hole = () => ({ type: 'Hole' })

// Compare two path arrays for equality.
// Returns false for null/undefined — they are not valid paths.
export function pathsEqual(a, b) {
  if (!a || !b) return false
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}

// Read the node at the given path in the tree.
export function getAt(node, path) {
  if (path.length === 0) return node
  const [head, ...rest] = path
  return node ? getAt(node[head], rest) : undefined
}

// Return a new tree with `value` placed at `path`.
export function setAt(node, path, value) {
  if (path.length === 0) return value
  const [head, ...rest] = path
  return { ...node, [head]: setAt(node ? node[head] : undefined, rest, value) }
}

// True if the tree contains any Hole nodes.
export function hasHoles(node) {
  if (!node || node.type === 'Hole') return true
  switch (node.type) {
    case 'Atom': case 'True': case 'False': return false
    case 'Not': return hasHoles(node.operand)
    case 'And': case 'Or': case 'Implies': case 'Iff':
      return hasHoles(node.left) || hasHoles(node.right)
    default: return false
  }
}

// Create a fresh node of the given type with Holes for any required children.
export function createNode(type, name) {
  switch (type) {
    case 'Atom':    return Atom(name)
    case 'True':    return True_()
    case 'False':   return False_()
    case 'Not':     return Not(Hole())
    case 'And':     return And(Hole(), Hole())
    case 'Or':      return Or(Hole(), Hole())
    case 'Implies': return Implies(Hole(), Hole())
    case 'Iff':     return Iff(Hole(), Hole())
    default:        return Hole()
  }
}
