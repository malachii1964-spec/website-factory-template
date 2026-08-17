#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path

QUALITY_KEYS = ["accuracy","verification","completeness","intentAlignment","executionReadiness","structure","edgeCases"]
EXECUTION_RANK = {"spec_only":0,"source_build":1,"preview_verified":2,"deployed_verified":3}
EVIDENCE_RANK = {"none":0,"designed":1,"structurally_checked":2,"lab_measured":3,"deployed_measured":4,"field_measured":5,"independently_verified":6}

class ValidationError(Exception): pass

def require(cond: bool, msg: str):
    if not cond: raise ValidationError(msg)

def status_pass(v):
    return isinstance(v, dict) and v.get("status") == "PASS"

def evidence_at_least(v, level):
    if not isinstance(v, dict): return False
    return EVIDENCE_RANK.get(v.get("evidenceLevel", "none"), -1) >= EVIDENCE_RANK[level]

def validate(data: dict) -> list[str]:
    errors=[]
    try:
        require(data.get("schema") == "malachii.website-build-packet.v1", "invalid schema")
        for k in ["objective","executionState","releaseStage","site","research","artifacts","verification","quality","limitations"]:
            require(k in data, f"missing required field: {k}")
        state=data["executionState"]; stage=data["releaseStage"]
        require(state in EXECUTION_RANK, "invalid executionState")
        require(stage in {"BUILD_ARTIFACT","LAUNCH_CANDIDATE","PRODUCTION_VERIFIED","NOT_RELEASE_QUALIFIED"}, "invalid releaseStage")
        q=data["quality"]
        vals=[]
        for k in QUALITY_KEYS:
            require(k in q, f"missing quality dimension: {k}")
            v=q[k]; require(isinstance(v,(int,float)) and not isinstance(v,bool) and 1 <= v <= 10, f"quality {k} must be 1..10")
            vals.append(float(v))
        require("floor" in q, "missing quality floor")
        require(abs(float(q["floor"])-min(vals)) < 1e-9, "quality.floor must equal minimum dimension")
        research=data["research"]
        require(isinstance(research.get("packetRefs",[]), list), "research.packetRefs must be array")
        if research.get("freshEvidenceRequired"):
            require(bool(research.get("packetRefs")), "fresh evidence required but no Research Packet reference supplied")
        v=data["verification"]
        if stage != "NOT_RELEASE_QUALIFIED":
            require(min(vals) >= 9, "promoted release requires all seven quality dimensions >= 9")
            require(status_pass(v.get("build")), "promoted release requires build PASS")
            require(status_pass(v.get("staticAudit")), "promoted release requires staticAudit PASS")
        if stage == "BUILD_ARTIFACT":
            require(EXECUTION_RANK[state] >= EXECUTION_RANK["source_build"], "BUILD_ARTIFACT requires source_build or stronger execution state")
            require(evidence_at_least(v.get("staticAudit"), "structurally_checked"), "BUILD_ARTIFACT static audit evidence too weak")
        if stage == "LAUNCH_CANDIDATE":
            require(EXECUTION_RANK[state] >= EXECUTION_RANK["preview_verified"], "LAUNCH_CANDIDATE requires preview_verified or deployed_verified")
            require(status_pass(v.get("accessibility")) and evidence_at_least(v.get("accessibility"), "structurally_checked"), "LAUNCH_CANDIDATE requires accessibility structural evidence")
            require(status_pass(v.get("security")) and evidence_at_least(v.get("security"), "structurally_checked"), "LAUNCH_CANDIDATE requires security structural evidence")
            require(status_pass(v.get("performance")) and evidence_at_least(v.get("performance"), "lab_measured"), "LAUNCH_CANDIDATE requires lab performance evidence")
        if stage == "PRODUCTION_VERIFIED":
            require(state == "deployed_verified", "PRODUCTION_VERIFIED requires deployed_verified")
            require(status_pass(v.get("accessibility")) and evidence_at_least(v.get("accessibility"), "deployed_measured"), "PRODUCTION_VERIFIED accessibility evidence too weak")
            require(status_pass(v.get("performance")) and v.get("performance",{}).get("fieldMeasured") is True and evidence_at_least(v.get("performance"), "field_measured"), "PRODUCTION_VERIFIED requires field-measured performance")
            require(status_pass(v.get("security")) and evidence_at_least(v.get("security"), "deployed_measured"), "PRODUCTION_VERIFIED requires deployed security evidence")
            if data.get("site",{}).get("indexable"):
                require(status_pass(v.get("seo")) and evidence_at_least(v.get("seo"), "deployed_measured"), "PRODUCTION_VERIFIED indexable site requires deployed SEO evidence")
        perf=v.get("performance",{})
        targets=perf.get("targets",{}) if isinstance(perf,dict) else {}
        if targets:
            require(float(targets.get("lcpSeconds",99)) <= 2.5, "LCP target must be <=2.5s")
            require(float(targets.get("inpMilliseconds",9999)) <= 200, "INP target must be <=200ms")
            require(float(targets.get("cls",99)) <= 0.1, "CLS target must be <=0.1")
        acc=v.get("accessibility",{})
        if isinstance(acc,dict) and acc:
            require(acc.get("target") == "WCAG_2.2_AA", "default accessibility target must be WCAG_2.2_AA")
        sec=v.get("security",{})
        if isinstance(sec,dict) and sec:
            require(sec.get("baseline") == "OWASP_ASVS_5.0", "security baseline must be OWASP_ASVS_5.0")
    except (ValidationError, ValueError, TypeError) as e:
        errors.append(str(e))
    return errors

def main():
    if len(sys.argv)!=2:
        print("usage: validate_website_packet.py <website-build-packet.json>", file=sys.stderr); return 2
    p=Path(sys.argv[1])
    try: data=json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"INVALID: cannot parse JSON: {e}"); return 1
    errors=validate(data)
    if errors:
        for e in errors: print(f"ERROR: {e}")
        print("INVALID: website build packet failed Sovereign Website gates")
        return 1
    print("VALID: website build packet satisfies structural Sovereign Website gates")
    return 0

if __name__ == "__main__": raise SystemExit(main())
