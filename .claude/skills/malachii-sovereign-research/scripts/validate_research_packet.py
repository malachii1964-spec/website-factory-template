#!/usr/bin/env python3
"""Dependency-free semantic validator for MALACHII research packets."""
from __future__ import annotations
import json
import sys
from datetime import datetime
from pathlib import Path

DIMS = [
    "accuracy", "verification", "completeness", "intent_alignment",
    "execution_readiness", "structure", "edge_cases"
]
VALID_STATUS = {"verified", "supported", "disputed", "inference", "unverified"}
VALID_IMPORTANCE = {"critical", "material", "supporting"}
VALID_SOURCE_CLASSES = {"primary", "independent_secondary", "specialist", "community", "user_provided"}


def _iso(value: str) -> bool:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except Exception:
        return False


def validate_packet(packet: dict) -> list[str]:
    errors: list[str] = []
    required = ["schema_version", "skill", "objective", "research_mode", "generated_at", "sources", "claims", "contradictions", "limitations", "deliverable", "quality"]
    for key in required:
        if key not in packet:
            errors.append(f"missing top-level field: {key}")
    if errors:
        return errors

    if packet["schema_version"] != "1.0":
        errors.append("schema_version must be 1.0")
    if packet["skill"] != "malachii-sovereign-research":
        errors.append("skill must be malachii-sovereign-research")
    if packet["research_mode"] not in {"live_research", "source_bounded"}:
        errors.append("invalid research_mode")
    if not isinstance(packet["generated_at"], str) or not _iso(packet["generated_at"]):
        errors.append("generated_at must be ISO-8601")

    objective = packet["objective"]
    if not isinstance(objective, dict):
        errors.append("objective must be an object")
        return errors
    for k in ["raw", "normalized", "freshness_required", "success_criteria"]:
        if k not in objective:
            errors.append(f"objective missing: {k}")
    freshness_required = objective.get("freshness_required") is True

    sources = packet["sources"]
    if not isinstance(sources, list):
        errors.append("sources must be an array")
        return errors
    source_map: dict[str, dict] = {}
    for i, src in enumerate(sources):
        if not isinstance(src, dict):
            errors.append(f"source[{i}] must be object")
            continue
        sid = src.get("id")
        if not sid or not isinstance(sid, str):
            errors.append(f"source[{i}] missing id")
            continue
        if sid in source_map:
            errors.append(f"duplicate source id: {sid}")
        source_map[sid] = src
        if src.get("source_class") not in VALID_SOURCE_CLASSES:
            errors.append(f"{sid}: invalid source_class")
        if src.get("authority") not in {"high", "medium", "low"}:
            errors.append(f"{sid}: invalid authority")
        if not _iso(str(src.get("accessed_at", ""))):
            errors.append(f"{sid}: accessed_at must be ISO-8601")

    claims = packet["claims"]
    if not isinstance(claims, list) or not claims:
        errors.append("claims must be a non-empty array")
        return errors
    claim_ids: set[str] = set()
    critical_unverified = False
    disputed_claims: set[str] = set()
    for i, claim in enumerate(claims):
        if not isinstance(claim, dict):
            errors.append(f"claim[{i}] must be object")
            continue
        cid = claim.get("id")
        if not cid or not isinstance(cid, str):
            errors.append(f"claim[{i}] missing id")
            continue
        if cid in claim_ids:
            errors.append(f"duplicate claim id: {cid}")
        claim_ids.add(cid)
        status = claim.get("status")
        importance = claim.get("importance")
        if status not in VALID_STATUS:
            errors.append(f"{cid}: invalid status")
        if importance not in VALID_IMPORTANCE:
            errors.append(f"{cid}: invalid importance")
        evidence = claim.get("evidence", [])
        if not isinstance(evidence, list):
            errors.append(f"{cid}: evidence must be array")
            evidence = []
        for sid in evidence:
            if sid not in source_map:
                errors.append(f"{cid}: unknown evidence source {sid}")
        if importance in {"critical", "material"} and status in {"verified", "supported", "inference", "disputed"} and not evidence:
            errors.append(f"{cid}: material claim status {status} requires evidence")
        if importance == "critical" and status == "unverified":
            critical_unverified = True
        if status == "verified":
            ev_sources = [source_map[s] for s in evidence if s in source_map]
            has_primary = any(s.get("source_class") == "primary" and s.get("authority") in {"high", "medium"} for s in ev_sources)
            lineages = {s.get("lineage_id", s.get("id")) for s in ev_sources if s.get("source_class") != "user_provided" and s.get("authority") in {"high", "medium"}}
            if not has_primary and len(lineages) < 2:
                errors.append(f"{cid}: verified claim needs authoritative primary evidence or two independent credible lineages")
        if status == "disputed":
            disputed_claims.add(cid)

    contradictions = packet["contradictions"]
    if not isinstance(contradictions, list):
        errors.append("contradictions must be array")
        contradictions = []
    contradiction_map: dict[str, list[dict]] = {}
    for c in contradictions:
        if not isinstance(c, dict):
            errors.append("contradiction entry must be object")
            continue
        cid = c.get("claim_id")
        contradiction_map.setdefault(cid, []).append(c)
        if cid not in claim_ids:
            errors.append(f"contradiction references unknown claim: {cid}")
        sids = c.get("source_ids", [])
        if not isinstance(sids, list) or len(sids) < 2:
            errors.append(f"{cid}: contradiction needs at least two source_ids")
        for sid in sids:
            if sid not in source_map:
                errors.append(f"{cid}: contradiction references unknown source {sid}")
        if c.get("resolution") not in {"resolved", "unresolved"}:
            errors.append(f"{cid}: invalid contradiction resolution")
    for cid in disputed_claims:
        if cid not in contradiction_map:
            errors.append(f"{cid}: disputed claim requires contradiction entry")

    quality = packet["quality"]
    if not isinstance(quality, dict):
        errors.append("quality must be object")
        return errors
    values = []
    for d in DIMS:
        v = quality.get(d)
        if not isinstance(v, (int, float)) or isinstance(v, bool) or not (1 <= v <= 10):
            errors.append(f"quality.{d} must be numeric 1..10")
        else:
            values.append(float(v))
    if values:
        floor = min(values)
        if quality.get("floor") != floor:
            errors.append(f"quality.floor must equal minimum dimension ({floor:g})")
    decision = quality.get("ship_decision")
    if decision not in {"ship", "dont_ship"}:
        errors.append("quality.ship_decision invalid")
    if decision == "ship":
        if values and min(values) < 9:
            errors.append("ship requires all seven quality dimensions >= 9")
        if critical_unverified:
            errors.append("ship forbidden with critical unverified claim")
        if freshness_required and packet["research_mode"] != "live_research":
            errors.append("ship forbidden: freshness-required objective lacks live research")
        critical_claim_ids = {c.get("id") for c in claims if c.get("importance") == "critical"}
        for c in contradictions:
            if c.get("claim_id") in critical_claim_ids and c.get("resolution") == "unresolved":
                errors.append("ship forbidden with unresolved critical contradiction")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_research_packet.py <packet.json>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    try:
        packet = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"INVALID: cannot read JSON: {exc}", file=sys.stderr)
        return 2
    errors = validate_packet(packet)
    if errors:
        print("NOT RELEASE-QUALIFIED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("VALID: research packet satisfies structural Sovereign Research gates")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
