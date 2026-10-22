#!/usr/bin/env python3
"""Validate canonical v1.0 solution-hypergraph YAML files (structure and references)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator


# The canonical validator also runs from instructor-owned "scripts/" folders.
HERE = Path(__file__).resolve()
if HERE.parent.name == "validation" and HERE.parent.parent.name == "core":
    ROOT = HERE.parents[2]
    SCHEMA = ROOT / "core" / "schema" / "solution-graph.schema.json"
else:
    ROOT = HERE.parents[1]
    SCHEMA = ROOT / "schema" / "solution-graph.schema.json"
LEGACY_INLINE = re.compile(r"\\\(|\\\)")


class UniqueKeyLoader(yaml.SafeLoader):
    """Avoid silently overwriting mathematical content via duplicate YAML keys."""


def unique_mapping(loader: UniqueKeyLoader, node: yaml.MappingNode) -> dict:
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=True)
        if key in result:
            raise ValueError(f"duplicate YAML key: {key!r}")
        result[key] = loader.construct_object(value_node, deep=True)
    return result


UniqueKeyLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping
)


def texts(value, path="root"):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, list):
        for i, child in enumerate(value):
            yield from texts(child, f"{path}[{i}]")
    elif isinstance(value, dict):
        for key, child in value.items():
            yield from texts(child, f"{path}.{key}")


def validate(path: Path, schema: dict) -> list[str]:
    problems = []
    try:
        graph = yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    except (yaml.YAMLError, ValueError) as exc:
        return [f"YAML: {exc}"]
    if not isinstance(graph, dict):
        return ["root must be a mapping"]
    for err in sorted(Draft202012Validator(schema).iter_errors(graph), key=str):
        where = ".".join(map(str, err.path)) or "root"
        problems.append(f"{where}: {err.message}")
    if problems:
        return problems

    for where, value in texts(graph):
        if LEGACY_INLINE.search(value):
            problems.append(f"{where}: legacy \\(...\\) math; use $...$")

    tables = {
        "node": graph["nodes"],
        "edge": graph["edges"],
        "theorem": graph["theorems"],
        "mistake": graph["mistakes"],
    }
    ids = {}
    for name, items in tables.items():
        seen = set()
        for item in items:
            if item["id"] in seen:
                problems.append(f"duplicate {name} ID {item['id']!r}")
            seen.add(item["id"])
        ids[name] = seen

    for edge in graph["edges"]:
        for source in edge["from"]:
            if source not in ids["node"]:
                problems.append(f"{edge['id']}: unknown premise {source!r}")
        if edge["to"] not in ids["node"]:
            problems.append(f"{edge['id']}: unknown conclusion {edge['to']!r}")
        for theorem_id in edge.get("uses", []):
            if theorem_id not in ids["theorem"]:
                problems.append(f"{edge['id']}: unknown theorem {theorem_id!r}")
    for mistake in graph["mistakes"]:
        for edge_id in mistake["related_edges"]:
            if edge_id not in ids["edge"]:
                problems.append(f"{mistake['id']}: unknown edge {edge_id!r}")

    # Reachability uses AND semantics: ALL premises of an inference are required.
    reachable = {n["id"] for n in graph["nodes"] if n["type"] == "premise"}
    changed = True
    while changed:
        changed = False
        for edge in graph["edges"]:
            if all(source in reachable for source in edge["from"]):
                if edge["to"] not in reachable:
                    reachable.add(edge["to"])
                    changed = True
    for node in graph["nodes"]:
        if node["type"] == "goal" and node["id"] not in reachable:
            problems.append(f"goal {node['id']!r} is not derivable from premises")
    return problems


def main() -> int:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    files = sorted(ROOT.glob("**/graph.yaml"))
    if not files:
        print("No graph.yaml files found", file=sys.stderr)
        return 1
    failed = 0
    for path in files:
        problems = validate(path, schema)
        relative = path.relative_to(ROOT)
        print(f"{'FAIL' if problems else 'OK  '} {relative}")
        for error in problems:
            print(f"  - {error}")
        failed += bool(problems)
    print(f"Validated {len(files)} graph(s); failures: {failed}")
    return int(bool(failed))


if __name__ == "__main__":
    raise SystemExit(main())
