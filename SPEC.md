Product Requirements Document
Product: Visual Logic Learning Web App
MVP Focus: Propositional Logic and Natural Deduction Proofs
1. Product Goal

Build a beginner-friendly educational web app that helps students learn propositional logic by constructing, visualizing, simplifying, and validating logic formulas interactively.

The product should make abstract symbolic logic feel concrete and visual, similar in spirit to Scratch, where users can combine blocks and immediately see structure, meaning, and resulting transformations.

The MVP should prioritize:

clarity over completeness
correctness over cleverness
visual understanding over dense symbolic input
guided learning over advanced theorem-proving
2. Target Users

Primary users:

secondary school or university students learning introductory discrete mathematics
beginners who struggle to parse symbolic logic expressions
students who benefit from visual and stepwise explanations

Secondary users:

instructors who want a simple classroom demo tool
self-learners revising propositional logic
3. Core User Problem

Students often find propositional logic hard because formulas are symbolic, nested, and easy to misread. They may know the rules mechanically but cannot see how a formula is structured, how it transforms, or why a proof step is valid.

This product should help users:

build formulas visually
understand grouping and nesting
check whether formulas are well-formed
test satisfiability/validity
simplify formulas step by step
verify proofs line by line
4. Product Principles

The MVP must be:

visually intuitive
mathematically correct
responsive for classroom/demo use
constrained in scope
educational rather than research-grade

The UI should feel simple and approachable, not like a professional theorem prover.

5. MVP Scope

The MVP covers propositional logic only.

Included:

visual formula/block builder
well-formed formula validation
satisfiability and truth-table checking
formula simplification with step trace
proof checker for selected natural deduction rules
export to JSON and LaTeX

Excluded from MVP:

first-order logic
predicate logic
quantifiers
equality
proof search / automatic solving
collaborative editing
optimization of proofs
advanced theorem-prover features
6. Functional Requirements
6.1 Block Builder
Goal

Allow users to construct propositional logic formulas visually using blocks, nesting, and grouping.

Must Support

Atomic propositions:

P, Q, R, ...
user can rename variables freely, such as Rain, ExamPassed, x1

Connectives:

negation ¬
conjunction ∧
disjunction ∨
implication →
biconditional ↔

Constants:

⊤
⊥

Grouping:

parentheses or equivalent visual nesting
Required Behavior
users can add atomic variables
users can drag, drop, and combine blocks into compound formulas
users can nest expressions inside other expressions
the UI must visually show formula hierarchy clearly
malformed formulas must be detected immediately
the app must distinguish between complete and incomplete formulas
invalid states should be recoverable, not destructive
Feedback

The builder should provide immediate feedback for:

malformed formula
missing operand
incomplete connective
invalid nesting
successful well-formed formula
Export

Users can export the current formula as:

JSON AST
LaTeX string
Example User Stories
As a student, I can create P → Q visually without typing raw syntax.
As a student, I can build (P ∧ Q) → R by nesting blocks.
As a student, I can immediately see whether my formula is well-formed.
As a student, I can export my formula for notes or assignments.
Acceptance Criteria
user can create atomic, unary, and binary formulas
nested formulas render correctly
malformed expressions are flagged in real time
export output matches the currently displayed formula exactly
6.2 Validity / Satisfiability Checking
Goal

Let users evaluate formulas using truth tables and SAT-style satisfiability checking.

Required Methods
Truth table evaluation for small formulas
SAT checking via CNF conversion for larger formulas
Constraints
truth table mode allowed for formulas with up to 8 distinct variables
warn user when variable count exceeds 6
if variable count exceeds 8, disable truth-table generation and direct user to SAT mode
Output

Truth table mode should display:

all variable assignments
formula result for each row
clear indication of tautology / contradiction / contingent formula

SAT mode should display:

satisfiable or unsatisfiable result
optional satisfying assignment if available
Performance Requirements
truth table: under 1 second for 6 variables
truth table: under 5 seconds for 8 variables
SAT check: under 2 seconds for formulas with 20 variables under typical use
Acceptance Criteria
distinct variables are counted correctly
truth table results match formula semantics
SAT result matches truth-table result when both are available
user receives a clear warning when formula is too large for truth-table mode
6.3 Simplification Engine
Goal

Help users understand how formulas can be transformed into equivalent simpler forms.

Required Transformations

Ordered simplification pipeline:

biconditional elimination
(φ ↔ ψ) => ((φ → ψ) ∧ (ψ → φ))
implication elimination
(φ → ψ) => (¬φ ∨ ψ)
double negation
¬¬φ => φ
De Morgan’s laws
associativity / commutativity for flattening and normalization
idempotence
absorption
identity
annihilation

Optional:

distributivity, controlled by flag
stop output at NNF
stop output at CNF
Output

The simplifier must show:

original formula
each intermediate step
rule name applied at each step
location/subexpression affected
final output formula
UX Requirement

Users should be able to step through transformations one at a time, not only see the final answer.

Acceptance Criteria
each transformation preserves logical equivalence
each displayed step corresponds to an actual applied rule
user can choose simplification target: general simplified form, NNF, or CNF
distributivity is not applied unless explicitly enabled
6.4 Proof Checker
Goal

Allow users to write natural deduction proofs and receive validation feedback line by line.

Supported Rules in MVP

Conjunction:

∧I
∧E₁
∧E₂

Disjunction:

∨I₁
∨I₂
∨E

Negation:

¬I
¬E

Implication:

→I
→E

Biconditional:

↔I
↔E₁
↔E₂

Falsum:

⊥E

Reiteration:

Copy
Proof Representation

Each proof line must include:

line number
formula
rule
citations
scope depth

Subproofs:

indentation-based
assumptions explicitly marked
scope tracked using scope_depth

Premises:

explicitly marked
always in scope unless proof structure says otherwise
Validation Requirements

The checker must:

validate each line against its cited lines
check scope access rules
prevent citing lines from closed subproofs
verify discharged assumptions for →I, ¬I, and ∨E
detect circular reasoning
return clear line-specific error messages
Acceptance Criteria
invalid citations are flagged
misuse of scope is flagged
valid proofs pass fully
error messages identify the exact faulty line and reason
7. UX Requirements
Overall Experience

The app should feel like a learning tool, not a formal logic IDE.

UI Priorities
block-based and visual first
symbolic text is allowed, but not primary
formulas should render clearly with visible nesting
feedback must be immediate and readable
users should not need prior syntax expertise to begin
Suggested Main Screens
Builder screen
Create and edit formulas visually
Checker screen
Run truth table or SAT check
Simplifier screen
View step-by-step transformations
Proof checker screen
Enter proof lines and validate them
Nice-to-have but not required for MVP
side-by-side symbolic and visual view
tutorial mode
example exercises
animated transformations