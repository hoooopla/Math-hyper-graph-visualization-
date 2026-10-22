# Contributing

Open small pull requests for frontend improvements, validator changes,
documentation, or GPT Work workflow refinements.

Read `core/SCHEMA.md` and the JSON Schema before altering the proof
format; schema changes must be explicitly versioned and synchronized with
viewer and validator. Keep the instructor's mandatory theorem-permission
checkpoint in `workflow/` intact.

## Checks

```sh
npm run check
python -m pip install -r requirements.txt
python core/validation/validate_graphs.py
node scripts/create-instructor-workspace.mjs ./my-instructor-workspace
python my-instructor-workspace/scripts/validate_graphs.py
```

GitHub CI has separate jobs for website tests/build, graph validation
and generated workspace validation. The Pages workflow publishes only
`dist/`.

**Review standard:** Structural validation does not establish
mathematical correctness. Do not overwrite instructor-approved graphs
or merge mathematical changes without instructor approval. Do not
include real student documents or grades in this public repository.
