// Evaluate a formula given a variable assignment.
// assignment: { [name: string]: boolean }
// Throws if a node type is unrecognised.

export function evaluate(node, assignment) {
  switch (node.type) {
    case 'Atom':
      return assignment[node.name] ?? false
    case 'True':
      return true
    case 'False':
      return false
    case 'Not':
      return !evaluate(node.operand, assignment)
    case 'And':
      return evaluate(node.left, assignment) && evaluate(node.right, assignment)
    case 'Or':
      return evaluate(node.left, assignment) || evaluate(node.right, assignment)
    case 'Implies':
      return !evaluate(node.left, assignment) || evaluate(node.right, assignment)
    case 'Iff':
      return evaluate(node.left, assignment) === evaluate(node.right, assignment)
    default:
      throw new Error(`evaluate: unknown node type "${node.type}"`)
  }
}
