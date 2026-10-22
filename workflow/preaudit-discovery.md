# GPT Work — Optional pre-audit discovery from student submissions

**Purpose:** Use a batch of student answers to discover mathematical
approaches, candidate theorem uses, useful intermediate assertions and
recurring reasoning patterns **before** the assignment-wide instructor
Cite / Derive / Exclude checkpoint. This is **graph-discovery research**,
not student homework auditing. Do not assign grades, correctness labels,
student-level findings, rankings or penalties; never output a verdict
about any individual submission.

## When to run

Run this stage **only when the instructor explicitly opts in** and
provides or authorizes access to a set of submissions. Without submissions
or opt-in, skip the stage and use the normal early checkpoint. Never read
private student repositories/accounts opportunistically.

Before processing, verify that the instructor is authorized to upload or
process these submissions under institutional policy, and consider
de-identification first. Work inside the **instructor-owned private**
workspace or authorized input context; **never** transfer individual
submissions, names, student IDs or source files to the public Proof Atlas
repo or website. Do not assert that a platform automatically anonymizes
the files. The public viewer currently accepts graph YAML, not a batch of
student PDFs.

## Ordered process — before theorem permission questions

1. **Anchor to the problem first.** Read the assignment/problem PDF,
   extract the exact mathematical statements and notation, and
   independently sketch the main natural proof strategies *before
   reading student answers*. This avoids copying frequent but invalid
   student arguments into the canonical graph.
2. **Build a private coverage register.** Determine the intended input
   set and problem IDs. Use locally assigned aliases (`S001`, `S002`,
   ...), **not** student names or university identifiers. Keep any mapping
   of aliases to original filenames exclusively in an ignored
   `private/` location when retention is necessary; do not include
   identifying filenames in `discovery.md` or a PR. Deduplicate duplicate
   uploads without losing a count of files received. Record which
   submission/problem sections were actually opened, readable, partly
   readable, missing, skipped or not accessible; do not silently interpret
   missing sections as mathematical mistakes.
3. **Breadth-first preview:** For every accessible submission and
   applicable problem, extract a **short mathematical signature**, not a
   line-by-line transcription: proposed strategy, key construction or
   intermediate statement, apparent named theorem uses, distinctive
   reasoning patterns and transcription uncertainty. Batch the work if
   needed; after each batch update the coverage register. If resource
   limits prevent full coverage, prioritize diverse or underrepresented
   pages, **report the exact unreviewed remainder**, and do not claim
   comprehensive screening. Never invent text from an illegible scan.
4. **Cluster by mathematics, not author or visual style.** Normalize
   notation and identify semantically equivalent routes; count evidence
   only from actually examined items. Seek atypical solutions, alternative
   theorems and unusual intermediate claims. Keep small pseudonymous
   source anchors such as `S014 / P02 / p.3` in a private discovery
   report when needed for later instructor inspection; do not paste
   original full student arguments.
5. **Targeted deep look:** Revisit representative examples for each
   cluster, every distinct outlier, uncertain transcription, and any
   method/theorem not covered by the independent preliminary plan. Try
   to reconstruct and **independently assess the mathematical inference**;
   distinguish a plausible valid approach, a potential counterexample,
   an invalid general inference pattern, and genuinely unresolved
   questions. **These are assessments of mathematical *candidates*, not
   judgments or grades for the originating student.** Common mistakes
   are *candidate patterns* only, pending independent validation.
6. **Consolidate, do not auto-approve.** Combine independent approaches
   and discovery candidates into an assignment-wide list of distinct
   strategies, possible milestones/edges, theorem or course-dependent
   justification needs, potential recurring mistake patterns and
   unresolved mathematical issues. Verify mathematical theorem
   statements and hypotheses before including them in the instructor
   policy table. Popularity is not proof; rare correct solutions must
   remain possible, and obviously inapplicable theorem invocations do
   not become allowed merely because several students used them.
7. **Produce a bounded discovery report.** Use the
   `templates/discovery-report.template.md` headings and write, if
   authorized, a **de-identified**
   `assignments/<assignment-id>/discovery.md` in the *private*
   instructor repository. Include coverage counts by problem and
   batch; cluster summaries, unique/outlier signatures, candidate
   theorem/step uses, proposed mistake families, explicit evidence
   anchors, unreadable/uncertain items and limitations. Cite source
   aliases and page locations only where available; never invent
   counts, aliases or page numbers. Do not include student-level
   judgments. The report is **not** canonical `graph.yaml` and is
   never a verified solution.
8. **One early instructor checkpoint.** Merge discovery findings with
   the independent preliminary theorem inventory. Deduplicate across
   problems and clusters. Present one instructor table:
   candidate ID, *precise theorem/step*, proposed role, affected
   problems, required mathematical hypotheses/applicability, source
   (independent / preview / both), prior same-assignment authorization
   if any, and unapproved **Cite / Derive / Exclude** suggestion.
   Also flag important ambiguous mathematical candidates separately.
   **Stop for explicit instructor choices before complete graph
   generation.** Never treat prior assignments as automatic permission.

## After the checkpoint

Follow `prompts/assignment-policy.md`,
`prompts/generate-solution-graph.md`, and
`prompts/verify-solution-graph.md`:

- Store only explicitly approved decisions in this assignment's
  `policy.yaml`, including problem-specific exceptions.
- Independently construct and adversarially verify every proposed graph
  node, theorem application, AND-edge and complete proof path. The
  discovery report suggests candidates; it **does not automatically add
  graph nodes, edges, mistakes or theorem permissions**.
- Request instructor decisions only for genuinely **new or changed**
  later dependencies. Do not assume all future methods have been
  enumerated; a later audit can still uncover new mathematics.
- Preserve approved graph IDs and reviewed content. Never merge
  mathematical changes without instructor approval.

## Scope, privacy and limitations

- **Opt-in:** If no student material is supplied, do not request it
  automatically. Keep the standard graph-only workflow available.
- **No student audit:** Do not issue per-student correctness conclusions,
  grades, matched path verdicts or disciplinary accusations.
- **Data minimization:** Exclude personally identifying filenames,
  names, IDs and verbatim identifying remarks from outputs and PRs.
  Retain a source-to-alias mapping only if necessary, in ignored
  `private/` storage outside committed artifacts. Prefer aggregate
  examples; redact sensitive information even in a private report.
- **Honest coverage:** Distinguish received, examined, incomplete,
  unreadable and unreviewed work. Large or handwritten PDFs may
  require multiple batches; missing pages or illegibility cannot
  justify mathematical conclusions. Do not state `all submissions
  screened` unless the register supports that claim.
- **Independent verification:** Neither the number of students using
  an argument nor the structural validator establishes its validity.
- **Permission and technical access:** If batch input, PDF reading,
  private storage or connector access is unavailable, state precisely
  what could not be read or stored. Do not invent successful processing.
