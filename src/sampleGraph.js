export const sampleGraphYaml = String.raw`schema_version: "1.0"
problem:
  id: "LA_HW04_Q2"
  title: "Commuting square roots"
  statement: >-
    Let \(A,B\) be positive definite Hermitian matrices such that
    \(AB=BA\). Prove that \(\sqrt A\sqrt B=\sqrt B\sqrt A\).
  source: "Sample problem"

canonical_notation:
  A: "A positive definite Hermitian matrix"
  B: "A positive definite Hermitian matrix commuting with A"

theorems:
  - id: "THM_SIMULTANEOUS_DIAGONALIZATION"
    statement: >-
      Commuting normal matrices on a finite-dimensional complex inner-product
      space are simultaneously unitarily diagonalizable.
    hypotheses:
      - "The matrices are normal."
      - "The matrices commute."
    source: "Standard finite-dimensional spectral theorem"
  - id: "THM_POSITIVE_SQUARE_ROOT"
    statement: >-
      Every positive semidefinite Hermitian matrix has a unique positive
      semidefinite square root.
    hypotheses:
      - "The matrix is positive semidefinite and Hermitian."
    source: "Standard spectral theorem"

nodes:
  - id: "premise_positive_commuting"
    type: "premise"
    claim: '\(A\) and \(B\) are positive definite Hermitian matrices and \(AB=BA\).'
  - id: "simultaneous_diagonal_form"
    type: "milestone"
    claim: >-
      There is a unitary matrix \(U\) and positive diagonal matrices \(D_A,D_B\)
      such that \(A=UD_AU^*\) and \(B=UD_BU^*\).
  - id: "square_roots_same_basis"
    type: "milestone"
    claim: >-
      \(\sqrt A=U\sqrt{D_A}U^*\) and
      \(\sqrt B=U\sqrt{D_B}U^*\).
  - id: "goal_roots_commute"
    type: "goal"
    claim: '\(\sqrt A\sqrt B=\sqrt B\sqrt A\).'

edges:
  - id: "edge_simultaneous_diagonalization"
    from: ["premise_positive_commuting"]
    to: "simultaneous_diagonal_form"
    method: "Simultaneous unitary diagonalization"
    justification: >-
      Hermitian matrices are normal. Since A and B commute, simultaneous
      diagonalization applies; positivity makes all diagonal entries positive.
    uses: ["THM_SIMULTANEOUS_DIAGONALIZATION"]
  - id: "edge_identify_square_roots"
    from: ["simultaneous_diagonal_form"]
    to: "square_roots_same_basis"
    method: "Functional calculus"
    justification: >-
      Taking the positive square root of each positive diagonal entry produces
      the unique positive square roots of A and B.
    uses: ["THM_POSITIVE_SQUARE_ROOT"]
  - id: "edge_diagonal_roots_commute"
    from: ["square_roots_same_basis"]
    to: "goal_roots_commute"
    method: "Diagonal matrices commute"
    justification: >-
      The two square roots are diagonal in the same orthonormal basis, so their
      diagonal representatives commute; conjugating back preserves equality.

mistakes:
  - id: "mistake_product_rule"
    related_edges: ["edge_diagonal_roots_commute"]
    pattern: 'Claiming \(\sqrt{AB}=\sqrt A\sqrt B\) without first proving commutativity.'
    defect: "The displayed identity is not valid for arbitrary positive matrices and would be circular here."
    category: "invalid_inference"
`;
