"""Regression tests: scoped instructor permission, not mathematics or grades."""
from __future__ import annotations

import copy
import json
import tempfile
import unittest
from pathlib import Path

import yaml

from core.validation.validate_policies import validate_assignment_policy


ROOT = Path(__file__).resolve().parents[1]
POLICY_SCHEMA = json.loads(
    (ROOT / "core/schema/assignment-policy.schema.json").read_text(encoding="utf-8")
)
GRAPH_SCHEMA = json.loads(
    (ROOT / "core/schema/solution-graph.schema.json").read_text(encoding="utf-8")
)


class AssignmentPolicyTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.graph = {
            "schema_version": "1.0",
            "problem": {"id": "P01", "statement": "Prove the result."},
            "canonical_notation": {},
            "theorems": [
                {"id": "THM_A", "statement": "Every object has property A."}
            ],
            "nodes": [
                {"id": "N0", "type": "premise", "assertion": "The assumptions hold."},
                {"id": "N1", "type": "goal", "assertion": "Property A holds."},
            ],
            "edges": [
                {"id": "E_A", "from": ["N0"], "to": "N1",
                 "method": "Apply theorem A", "justification": "By theorem A.",
                 "uses": ["THM_A"]}
            ],
            "mistakes": [],
        }
        self.policy = {
            "assignment_id": "HW01",
            "decisions": [{
                "id": "THM_A",
                "kind": "theorem",
                "statement": "Every object has property A.",
                "treatment": "cite",
                "problems": ["P01"],
                "approval_evidence": "Instructor response approving HW01 P01 theorem A.",
            }],
            "problem_overrides": [],
        }
        self.put_graph("HW01", "P01", self.graph)
        self.put_policy("HW01", self.policy)

    def write(self, relative: str, data: dict):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")

    def put_policy(self, assignment: str, data: dict):
        self.write(f"assignments/{assignment}/policy.yaml", data)

    def put_graph(self, assignment: str, problem: str, data: dict):
        self.write(f"assignments/{assignment}/{problem}/graph.yaml", data)

    def check(self) -> tuple[int, str]:
        n, errors = validate_assignment_policy(self.root, POLICY_SCHEMA, GRAPH_SCHEMA)
        return n, "\n".join(errors)

    def test_allowed_citation_in_same_assignment_folder(self):
        count, errors = self.check()
        self.assertEqual(count, 1)
        self.assertEqual(errors, "")

    def test_wildcard_approval_for_same_assignment(self):
        self.policy["decisions"][0]["problems"] = ["*"]
        self.put_policy("HW01", self.policy)
        self.put_graph("HW01", "P02", self.graph)
        self.assertEqual(self.check(), (2, ""))

    def test_new_problem_scope_is_not_automatically_allowed(self):
        self.put_graph("HW01", "P02", self.graph)
        count, errors = self.check()
        self.assertEqual(count, 2)
        self.assertIn("covering problem folder 'P02'", errors)
        self.assertIn("edge 'E_A' cites 'THM_A': no approval", errors)

    def test_previous_assignment_is_never_permission_for_next(self):
        self.put_graph("HW02", "P01", self.graph)
        count, errors = self.check()
        self.assertEqual(count, 2)
        self.assertIn("HW02/P01/graph.yaml: missing or invalid", errors)

    def test_policy_must_be_sibling_of_problem_folders(self):
        source = self.root / "assignments/HW01/policy.yaml"
        destination = self.root / "assignments/HW01/policies/policy.yaml"
        destination.parent.mkdir(parents=True)
        source.rename(destination)
        _, errors = self.check()
        self.assertIn("not a separate folder", errors)
        self.assertIn("missing or invalid", errors)

    def test_missing_policy_fails_closed(self):
        (self.root / "assignments/HW01/policy.yaml").unlink()
        _, errors = self.check()
        self.assertIn("missing or invalid", errors)

    def test_treatment_derive_cannot_be_cited(self):
        self.policy["decisions"][0]["treatment"] = "derive"
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("treatment is 'derive', not 'cite'", errors)

    def test_treatment_exclude_cannot_be_cited(self):
        self.policy["decisions"][0]["treatment"] = "exclude"
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("treatment is 'exclude', not 'cite'", errors)

    def test_derived_theorem_can_be_listed_but_not_directly_cited(self):
        self.policy["decisions"][0]["treatment"] = "derive"
        self.graph["edges"][0].pop("uses")
        self.put_policy("HW01", self.policy)
        self.put_graph("HW01", "P01", self.graph)
        self.assertEqual(self.check(), (1, ""))
        # The validator cannot prove that a graph actually derives the theorem.

    def test_all_listed_theorems_need_approval_even_without_uses(self):
        self.graph["edges"][0].pop("uses")
        self.graph["theorems"].append({"id": "THM_B", "statement": "A different result."})
        self.put_graph("HW01", "P01", self.graph)
        _, errors = self.check()
        self.assertIn("theorem 'THM_B': no assignment-policy", errors)

    def test_statement_change_requires_fresh_approval(self):
        self.graph["theorems"][0]["statement"] = "A strictly stronger statement."
        self.put_graph("HW01", "P01", self.graph)
        _, errors = self.check()
        self.assertIn("statement differs", errors)

    def test_insignificant_whitespace_does_not_force_reapproval(self):
        self.graph["theorems"][0]["statement"] = "Every  object\nhas property A."
        self.put_graph("HW01", "P01", self.graph)
        self.assertEqual(self.check(), (1, ""))

    def test_valid_explicit_override_takes_precedence(self):
        self.policy["decisions"][0]["problems"] = ["P01", "P02"]
        self.policy["problem_overrides"] = [{
            "problem_id": "P02", "item_id": "THM_A",
            "treatment": "derive",
            "approval_evidence": "Instructor specifically required a derivation in P02.",
        }]
        self.put_policy("HW01", self.policy)
        self.put_graph("HW01", "P02", self.graph)
        count, errors = self.check()
        self.assertEqual(count, 2)
        self.assertIn("HW01/P02/graph.yaml", errors)
        self.assertIn("treatment is 'derive'", errors)
        self.assertNotIn("HW01/P01/graph.yaml", errors)

    def test_override_can_permit_citation_when_base_requires_derivation(self):
        self.policy["decisions"][0]["treatment"] = "derive"
        self.policy["problem_overrides"] = [{
            "problem_id": "P01", "item_id": "THM_A",
            "treatment": "cite",
            "approval_evidence": "Instructor explicitly approved direct citation for P01.",
        }]
        self.put_policy("HW01", self.policy)
        self.assertEqual(self.check(), (1, ""))

    def test_out_of_scope_override_is_rejected(self):
        self.policy["problem_overrides"] = [{
            "problem_id": "P02", "item_id": "THM_A",
            "treatment": "cite",
            "approval_evidence": "Instructor said to cite it in P02.",
        }]
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("outside the approved base problem scope", errors)

    def test_duplicate_decision_and_override_detected(self):
        self.policy["decisions"].append(copy.deepcopy(self.policy["decisions"][0]))
        override = {
            "problem_id": "P01", "item_id": "THM_A", "treatment": "cite",
            "approval_evidence": "Instructor said yes for this assignment.",
        }
        self.policy["problem_overrides"] = [override, copy.deepcopy(override)]
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("duplicate policy decision ID", errors)
        self.assertIn("duplicate problem override", errors)

    def test_policy_assignment_id_must_match_actual_folder(self):
        self.policy["assignment_id"] = "HW02"
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("does not match enclosing assignment folder", errors)

    def test_placeholder_evidence_is_rejected(self):
        self.policy["decisions"][0]["approval_evidence"] = "[conversation reference]"
        self.put_policy("HW01", self.policy)
        _, errors = self.check()
        self.assertIn("placeholder", errors)

    def test_malformed_or_duplicated_yaml_is_rejected(self):
        path = self.root / "assignments/HW01/policy.yaml"
        path.write_text("assignment_id: HW01\nassignment_id: HW02\n", encoding="utf-8")
        _, errors = self.check()
        self.assertIn("duplicate YAML key", errors)

    def test_step_decisions_do_not_automatically_become_graph_citations(self):
        self.policy["decisions"].append({
            "id": "STEP_DETAIL", "kind": "step",
            "statement": "Give a justification for the limiting step.",
            "treatment": "derive", "problems": ["P01"],
            "approval_evidence": "Instructor required an explicit argument.",
        })
        self.put_policy("HW01", self.policy)
        self.assertEqual(self.check(), (1, ""))

    def test_graph_with_no_theorems_can_have_empty_approved_inventory(self):
        self.graph["theorems"] = []
        self.graph["edges"][0].pop("uses")
        self.policy["decisions"] = []
        self.put_graph("HW01", "P01", self.graph)
        self.put_policy("HW01", self.policy)
        self.assertEqual(self.check(), (1, ""))

    def test_only_synthetic_example_without_assignment_is_outside_policy_gate(self):
        (self.root / "assignments/HW01/P01/graph.yaml").unlink()
        (self.root / "assignments/HW01/policy.yaml").unlink()
        self.assertEqual(self.check(), (0, ""))


if __name__ == "__main__":
    unittest.main()
