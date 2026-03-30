// Serialize an AST node to a display string or LaTeX.
// Parentheses are added only where needed based on operator precedence.

// Precedence levels (higher = tighter binding)
const PREC = { Iff: 1, Implies: 2, Or: 3, And: 4, Not: 5 }

function needsParens(child, parentType, side) {
  const cp = PREC[child.type]
  const pp = PREC[parentType]
  if (cp === undefined) return false // atom/constant never needs parens
  if (cp < pp) return true
  // Same precedence: right operand of right-associative Implies needs parens
  // if it's also an Implies (it doesn't, but left operand does).
  // e.g. (P → Q) → R  — left side needs parens
  if (cp === pp && parentType === 'Implies' && side === 'left') return true
  return false
}

// ---- Unicode display string ----

const SYMS = {
  Not: '¬', And: '∧', Or: '∨', Implies: '→', Iff: '↔',
  True: '⊤', False: '⊥',
}

export function toString(node) {
  return toStr(node, null, null)
}

function toStr(node, parentType, side) {
  if (!node) return '?'
  let s
  switch (node.type) {
    case 'Atom':    s = node.name; break
    case 'True':    s = SYMS.True; break
    case 'False':   s = SYMS.False; break
    case 'Not':     s = SYMS.Not + toStr(node.operand, 'Not', 'right'); break
    case 'And':
    case 'Or':
    case 'Implies':
    case 'Iff':
      s = toStr(node.left, node.type, 'left')
        + ' ' + SYMS[node.type] + ' '
        + toStr(node.right, node.type, 'right')
      break
    default: s = '?'
  }
  if (parentType && needsParens(node, parentType, side)) {
    return '(' + s + ')'
  }
  return s
}

// ---- LaTeX string ----

const LATEX = {
  Not: '\\lnot ', And: ' \\land ', Or: ' \\lor ',
  Implies: ' \\rightarrow ', Iff: ' \\leftrightarrow ',
  True: '\\top', False: '\\bot',
}

export function toLatex(node) {
  return toLatexStr(node, null, null)
}

function toLatexStr(node, parentType, side) {
  if (!node) return '{?}'
  let s
  switch (node.type) {
    case 'Atom':    s = node.name; break
    case 'True':    s = LATEX.True; break
    case 'False':   s = LATEX.False; break
    case 'Not':     s = LATEX.Not + toLatexStr(node.operand, 'Not', 'right'); break
    case 'And':
    case 'Or':
    case 'Implies':
    case 'Iff':
      s = toLatexStr(node.left, node.type, 'left')
        + LATEX[node.type]
        + toLatexStr(node.right, node.type, 'right')
      break
    default: s = '{?}'
  }
  if (parentType && needsParens(node, parentType, side)) {
    return '(' + s + ')'
  }
  return s
}
