#!/usr/bin/env python3
"""Check instructor-approved theorem use for assignment-local graph.yaml files.

The checked layout is assignments/<assignment-id>/policy.yaml alongside
assignments/<assignment-id>/<problem-dir>/graph.yaml. This verifies recorded
permission and exact theorem text, NOT proof validity, theorem hypotheses,
approval provenance, implicit named results, or quality of derivations.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

# Reuse canonical duplicate-key protection; this file is copied next to
# validate_graphs.py into private instructor workspaces.
if __package__:
    from .validate_graphs import UniqueKeyLoader
else:
    from validate_graphs import UniqueKeyLoader


HERE = Path(__file__).resolve()
if HERE.parent.name == "validation" and HERE.parent.parent.name == "core":
    ROOT = HERE.parents[2]
    POLICY_SCHEMA = ROOT / "core" / "schema" / "assignment-policy.schema.json"
    GRAPH_SCHEMA = ROOT / "core" / "schema" / "solution-graph.schema.json"
else:
    ROOT = HERE.parents[1]
    POLICY_SCHEMA = ROOT / "schema" / "assignment-policy.schema.json"
    GRAPH_SCHEMA = ROOT / "schema" / "solution-graph.schema.json"


def read_yaml(path: Path) -> tuple[object | None, list[str]]:
    try:
        return yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader), []
    except (OSError, yaml.YAMLError, ValueError) as exc:
        return None, [f"{path}: YAML read error: {exc}"]


def meaningful_evidence(value: str) -> bool:
    """Reject obvious placeholders, without pretending to verify provenance."""
    item = value.strip().lower()
    return bool(item) and item not in {"...", "tbd", "pending", "n/a", "unknown", "todo"} \
        and not item.startswith("replace_") \
        and "[conversation reference]" not in item


def compare_statement(statement: str) -> str:
    """Normalize formatting whitespace only, never mathematical notation."""
    return re.sub(r"\s+", " ", statement).strip()


def check_policy(policy: dict, folder: Path) -> list[str]:
    errors: list[str] = []
    if policy["assignment_id"] != folder.name:
        errors.append(
            f"policy.assignment_id {policy['assignment_id']!r} "
            f"does not match enclosing assignment folder {folder.name!r}"
        )
    items: dict[str, dict] = {}
    for decision in policy["decisions"]:
        item_id = decision["id"]
        if item_id in items:
            errors.append(f"duplicate policy decision ID {item_id!r}")
        items[item_id] = decision
        problems = decision["problems"]
        if "*" in problems and len(problems) != 1:
            errors.append(f"{item_id}: wildcard '*' must be the only problem scope")
        if not decision["statement"].strip():
            errors.append(f"{item_id}: theorem/step statement is blank")
        if not meaningful_evidence(decision["approval_evidence"]):
            errors.append(f"{item_id}: approval_evidence is empty or a placeholder")
    seen: set[tuple[str, str]] = set()
    for override in policy["problem_overrides"]:
        pair = (override["item_id"], override["problem_id"])
        if pair in seen:
            errors.append(f"duplicate problem override for {pair!r}")
        seen.add(pair)
        base = items.get(override["item_id"])
        if base is None:
            errors.append(f"{pair!r}: override does not reference a declared policy decision")
        elif override["problem_id"] not in base["problems"] and "*" not in base["problems"]:
            errors.append(f"{pair!r}: override is outside the approved base problem scope")
        if not meaningful_evidence(override["approval_evidence"]):
            errors.append(f"{pair!r}: override approval_evidence is empty or a placeholder")
    return errors


def effective_treatment(policy: dict, item_id: str, problem_dir: str) -> str | None:
    """Return only an explicit decision applicable to this problem directory."""
    base = next(
        (x for x in policy["decisions"] if x["id"] == item_id and x["kind"] == "theorem"),
        None,
    )
    if not base:
        return None
    if problem_dir not in base["problems"] and "*" not in base["problems"]:
        return None
    override = next(
        (x for x in policy["problem_overrides"]
         if x["item_id"] == item_id and x["problem_id"] == problem_dir),
        None,
    )
    return (override or base)["treatment"]


def check_graph_policy(
    graph: dict, policy: dict, graph_path: Path,
) -> list[str]:
    errors: list[str] = []
    problem_dir = graph_path.parent.name
    approved = {x["id"]: x for x in policy["decisions"] if x["kind"] == "theorem"}
    theorems = {x["id"]: x for x in graph["theorems"]}

    # Every theorem *listed* in graph YAML must have been explicitly
    # considered by the instructor for this assignment/problem, even if
    # no edge happens to use it yet.
    for theorem_id, theorem in theorems.items():
        choice = effective_treatment(policy, theorem_id, problem_dir)
        if choice is None:
            errors.append(
                f"theorem {theorem_id!r}: no assignment-policy theorem decision "
                f"covering problem folder {problem_dir!r}"
            )
            continue
        recorded = approved[theorem_id]["statement"]
        if compare_statement(recorded) != compare_statement(theorem["statement"]):
            errors.append(
                f"theorem {theorem_id!r}: graph theorem statement differs from "
                "the instructor-approved statement; seek approval for the change"
            )

    for edge in graph["edges"]:
        for theorem_id in edge.get("uses", []):
            if theorem_id not in theorems:
                # The structural validator reports unknown theorem IDs.
                continue
            choice = effective_treatment(policy, theorem_id, problem_dir)
            if choice is None:
                errors.append(
                    f"edge {edge['id']!r} cites {theorem_id!r}: no approval "
                    f"for problem {problem_dir!r}"
                )
            elif choice != "cite":
                errors.append(
                    f"edge {edge['id']!r} cites {theorem_id!r}: instructor "
                    f"treatment is {choice!r}, not 'cite'; "
                    "represent a derivation with graph nodes/edges, not an "
                    "unproved edges[].uses citation"
                )
    return errors


def validate_assignment_policy(
    root: Path, policy_schema: dict, graph_schema: dict,
) -> tuple[int, list[str]]:
    """Validate every assignment graph and assignment policy, strict on placement."""
    errors: list[str] = []
    assignments = root / "assignments"
    graphs = sorted(assignments.glob("**/graph.yaml")) if assignments.exists() else []
    policy_files = sorted(assignments.glob("**/policy.yaml")) if assignments.exists() else []
    expected_policies = {p for p in policy_files if
                         p.parent.parent == assignments}
    for path in policy_files:
        if path not in expected_policies:
            errors.append(
                f"{path.relative_to(root)}: policy must be at "
                "assignments/<assignment-id>/policy.yaml, not a separate folder"
            )
    for path in graphs:
        if path.parent.parent.parent != assignments:
            errors.append(
                f"{path.relative_to(root)}: graph must be at "
                "assignments/<assignment-id>/<problem-dir>/graph.yaml"
            )
    # Check file shapes before relying on any fields.
    parsed: dict[Path, dict] = {}
    for path in sorted(expected_policies):
        data, load_errors = read_yaml(path)
        errors.extend(load_errors)
        if load_errors:
            continue
        issues = list(Draft202012Validator(policy_schema).iter_errors(data))
        if issues:
            for error in issues:
                location = ".".join(str(p) for p in error.path) or "root"
                errors.append(f"{path.relative_to(root)}:{location}: {error.message}")
            continue
        errors.extend(
            f"{path.relative_to(root)}: {problem}"
            for problem in check_policy(data, path.parent)
        )
        parsed[path] = data

    for graph_path in graphs:
        if graph_path.parent.parent.parent != assignments:
            continue
        assignment_dir = graph_path.parent.parent
        policy_path = assignment_dir / "policy.yaml"
        if policy_path not in parsed:
            errors.append(
                f"{graph_path.relative_to(root)}: missing or invalid "
                f"assignment-local policy {policy_path.relative_to(root)}"
            )
            continue
        graph, load_errors = read_yaml(graph_path)
        errors.extend(load_errors)
        if load_errors:
            continue
        shape_errors = list(Draft202012Validator(graph_schema).iter_errors(graph))
        if shape_errors:
            for error in shape_errors:
                location = ".".join(str(p) for p in error.path) or "root"
                errors.append(f"{graph_path.relative_to(root)}:{location}: {error.message}")
            continue
        errors.extend(
            f"{graph_path.relative_to(root)}: {issue}"
            for issue in check_graph_policy(graph, parsed[policy_path], graph_path)
        )
    return len(graphs), errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=ROOT,
        help="instructor workspace or public repository root",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        policy_schema = json.loads(POLICY_SCHEMA.read_text(encoding="utf-8"))
        graph_schema = json.loads(GRAPH_SCHEMA.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(f"Cannot read validator schema: {exc}", file=sys.stderr)
        return 1

    count, errors = validate_assignment_policy(root, policy_schema, graph_schema)
    for error in errors:
        print(f"FAIL {error}")
    print(f"Assignment theorem-policy check: {count} graph(s), {len(errors)} issue(s)")
    if count == 0 and not errors:
        print("No assignment graphs found; synthetic examples are outside this gate.")
    if errors:
        print("Theorem permission or policy-file placement is not compliant.", file=sys.stderr)
    return int(bool(errors))


if __name__ == "__main__":
    raise SystemExit(main())
