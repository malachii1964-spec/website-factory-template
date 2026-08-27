import copy
import json
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from validate_research_packet import validate_packet

BASE = json.loads((ROOT / "assets" / "example-research-packet.json").read_text())

class ValidatorTests(unittest.TestCase):
    def pkt(self):
        return copy.deepcopy(BASE)

    def test_valid_packet(self):
        self.assertEqual(validate_packet(self.pkt()), [])

    def test_unknown_evidence_rejected(self):
        p = self.pkt(); p["claims"][0]["evidence"] = ["src_missing"]
        self.assertTrue(any("unknown evidence" in e for e in validate_packet(p)))

    def test_critical_unverified_blocks_ship(self):
        p = self.pkt(); p["claims"][0]["status"] = "unverified"; p["claims"][0]["evidence"] = []
        self.assertTrue(any("critical unverified" in e for e in validate_packet(p)))

    def test_freshness_requires_live_research(self):
        p = self.pkt(); p["research_mode"] = "source_bounded"
        self.assertTrue(any("freshness-required" in e for e in validate_packet(p)))

    def test_floor_must_be_minimum(self):
        p = self.pkt(); p["quality"]["edge_cases"] = 8; p["quality"]["floor"] = 9
        self.assertTrue(any("floor must equal" in e for e in validate_packet(p)))

    def test_ship_requires_floor_nine(self):
        p = self.pkt(); p["quality"]["edge_cases"] = 8; p["quality"]["floor"] = 8
        self.assertTrue(any("ship requires" in e for e in validate_packet(p)))

    def test_disputed_requires_contradiction_entry(self):
        p = self.pkt(); p["claims"][0]["status"] = "disputed"
        self.assertTrue(any("disputed claim requires" in e for e in validate_packet(p)))

    def test_unresolved_critical_contradiction_blocks_ship(self):
        p = self.pkt()
        p["sources"].append({"id":"src_second","title":"Second","source_class":"independent_secondary","authority":"high","accessed_at":"2026-08-15T12:00:00Z","lineage_id":"second"})
        p["claims"][0]["status"] = "disputed"
        p["claims"][0]["evidence"] = ["src_official_docs", "src_second"]
        p["contradictions"] = [{"claim_id":"clm_feature_y","source_ids":["src_official_docs","src_second"],"resolution":"unresolved","explanation":"Material conflict."}]
        self.assertTrue(any("unresolved critical contradiction" in e for e in validate_packet(p)))

    def test_verified_without_primary_needs_independence(self):
        p = self.pkt(); p["sources"][0]["source_class"] = "specialist"
        self.assertTrue(any("two independent" in e for e in validate_packet(p)))

    def test_two_independent_sources_can_verify(self):
        p = self.pkt(); p["sources"][0].update({"source_class":"independent_secondary","lineage_id":"a"})
        p["sources"].append({"id":"src_b","title":"B","source_class":"specialist","authority":"medium","accessed_at":"2026-08-15T12:00:00Z","lineage_id":"b"})
        p["claims"][0]["evidence"] = ["src_official_docs", "src_b"]
        self.assertEqual(validate_packet(p), [])

    def test_duplicate_source_rejected(self):
        p = self.pkt(); p["sources"].append(copy.deepcopy(p["sources"][0]))
        self.assertTrue(any("duplicate source" in e for e in validate_packet(p)))

    def test_duplicate_claim_rejected(self):
        p = self.pkt(); p["claims"].append(copy.deepcopy(p["claims"][0]))
        self.assertTrue(any("duplicate claim" in e for e in validate_packet(p)))

    def test_inference_needs_evidence_when_material(self):
        p = self.pkt(); p["claims"][0]["status"] = "inference"; p["claims"][0]["evidence"] = []
        self.assertTrue(any("requires evidence" in e for e in validate_packet(p)))

    def test_bad_access_timestamp_rejected(self):
        p = self.pkt(); p["sources"][0]["accessed_at"] = "yesterday"
        self.assertTrue(any("ISO-8601" in e for e in validate_packet(p)))

    def test_bad_quality_score_rejected(self):
        p = self.pkt(); p["quality"]["accuracy"] = 11
        self.assertTrue(any("quality.accuracy" in e for e in validate_packet(p)))

if __name__ == "__main__":
    unittest.main()
