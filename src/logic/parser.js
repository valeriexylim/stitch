// Recursive descent parser: string → AST
//
// Accepted syntax:
//   Atoms       : identifiers starting with a letter, e.g. P, Q, Rain, x1
//   Constants   : T or ⊤  (true),  F or ⊥  (false)
//   Negation    : ¬φ  ~φ  !φ
//   Conjunction : φ ∧ ψ   φ & ψ   φ && ψ
//   Disjunction : φ ∨ ψ   φ | ψ   φ || ψ
//   Implication : φ → ψ   φ -> ψ
//   Biconditional: φ ↔ ψ  φ <-> ψ
//   Grouping    : ( φ )
//
// Precedence (loosest → tightest):
//   ↔  →  ∨  ∧  ¬  atom/paren

import { Atom, True_, False_, Not, And, Or, Implies, Iff } from './ast.js'

export class ParseError extends Error {
  constructor(message, pos) {
    super(message)
    this.name = 'ParseError'
    this.pos = pos
  }
}

class Lexer {
  constructor(input) {
    this.input = input
    this.pos = 0
  }

  skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++
    }
  }

  peek() {
    this.skipWhitespace()
    if (this.pos >= this.input.length) return { type: 'EOF', pos: this.pos }
    const pos = this.pos
    const ch = this.input[this.pos]

    // Two-char ASCII operators first
    if (this.input.startsWith('<->', this.pos)) return { type: 'IFF', pos }
    if (this.input.startsWith('->', this.pos))  return { type: 'IMPLIES', pos }
    if (this.input.startsWith('&&', this.pos))  return { type: 'AND', pos }
    if (this.input.startsWith('||', this.pos))  return { type: 'OR', pos }

    // Unicode operators
    if (ch === '¬' || ch === '~' || ch === '!') return { type: 'NOT', pos }
    if (ch === '∧' || ch === '&')               return { type: 'AND', pos }
    if (ch === '∨' || ch === '|')               return { type: 'OR', pos }
    if (ch === '→')                              return { type: 'IMPLIES', pos }
    if (ch === '↔')                              return { type: 'IFF', pos }
    if (ch === '⊤')                              return { type: 'TRUE', pos }
    if (ch === '⊥')                              return { type: 'FALSE', pos }
    if (ch === '(')                              return { type: 'LPAREN', pos }
    if (ch === ')')                              return { type: 'RPAREN', pos }

    // Identifiers and reserved words
    if (/[a-zA-Z_]/.test(ch)) {
      let end = this.pos
      while (end < this.input.length && /[\w]/.test(this.input[end])) end++
      const word = this.input.slice(this.pos, end)
      if (word === 'T') return { type: 'TRUE', pos, len: word.length }
      if (word === 'F') return { type: 'FALSE', pos, len: word.length }
      return { type: 'ATOM', value: word, pos, len: word.length }
    }

    return { type: 'UNKNOWN', ch, pos }
  }

  consume() {
    this.skipWhitespace()
    const tok = this.peek()
    switch (tok.type) {
      case 'IFF':     this.pos += this.input.startsWith('<->', this.pos) ? 3 : 1; break
      case 'IMPLIES': this.pos += this.input.startsWith('->', this.pos)  ? 2 : 1; break
      case 'AND':     this.pos += this.input.startsWith('&&', this.pos)  ? 2 : 1; break
      case 'OR':      this.pos += this.input.startsWith('||', this.pos)  ? 2 : 1; break
      case 'ATOM': case 'TRUE': case 'FALSE':
        this.pos += tok.len ?? 1; break
      default:
        this.pos += 1; break
    }
    return tok
  }
}

// parse(input: string) → AST node
// Throws ParseError on invalid input.
export function parse(input) {
  const lexer = new Lexer(input.trim())
  const node = parseIff(lexer)
  const next = lexer.peek()
  if (next.type !== 'EOF') {
    throw new ParseError(`Unexpected token at position ${next.pos}: "${input[next.pos]}"`, next.pos)
  }
  return node
}

function parseIff(lexer) {
  let left = parseImplies(lexer)
  while (lexer.peek().type === 'IFF') {
    lexer.consume()
    const right = parseImplies(lexer)
    left = Iff(left, right)
  }
  return left
}

function parseImplies(lexer) {
  const left = parseOr(lexer)
  if (lexer.peek().type === 'IMPLIES') {
    lexer.consume()
    const right = parseImplies(lexer) // right-associative
    return Implies(left, right)
  }
  return left
}

function parseOr(lexer) {
  let left = parseAnd(lexer)
  while (lexer.peek().type === 'OR') {
    lexer.consume()
    const right = parseAnd(lexer)
    left = Or(left, right)
  }
  return left
}

function parseAnd(lexer) {
  let left = parseNot(lexer)
  while (lexer.peek().type === 'AND') {
    lexer.consume()
    const right = parseNot(lexer)
    left = And(left, right)
  }
  return left
}

function parseNot(lexer) {
  if (lexer.peek().type === 'NOT') {
    const { pos } = lexer.consume()
    const operand = parseNot(lexer)
    return Not(operand)
  }
  return parseAtom(lexer)
}

function parseAtom(lexer) {
  const tok = lexer.peek()

  if (tok.type === 'TRUE')   { lexer.consume(); return True_() }
  if (tok.type === 'FALSE')  { lexer.consume(); return False_() }
  if (tok.type === 'ATOM')   { lexer.consume(); return Atom(tok.value) }

  if (tok.type === 'LPAREN') {
    lexer.consume()
    const inner = parseIff(lexer)
    const close = lexer.peek()
    if (close.type !== 'RPAREN') {
      throw new ParseError(`Expected ')' at position ${close.pos}`, close.pos)
    }
    lexer.consume()
    return inner
  }

  if (tok.type === 'EOF') {
    throw new ParseError('Unexpected end of input: expected a formula', tok.pos)
  }

  throw new ParseError(
    `Unexpected token at position ${tok.pos}: "${tok.ch ?? tok.value ?? '?'}"`,
    tok.pos
  )
}
