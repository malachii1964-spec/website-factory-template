import test from "node:test";
import assert from "node:assert/strict";
import { authorize, candidateHostFromEnv, createConfidence, createOverride, effectiveAssurance, mayDirectPolicy, redeemAuthorization, type RuntimeManifest } from "../src/index.js";

const now=new Date("2026-08-15T08:00:00Z");
const observed:RuntimeManifest={host:{id:"test"},capabilities:[{name:"filesystem.write",evidence:[{id:"e1",kind:"observation",source:"probe",authenticity:"verified",directness:"direct",capability:"filesystem.write",scope:["project"],observedSuccess:true,verifiedAt:now.toISOString(),expiresAt:"2026-08-15T09:00:00Z"}]}]};

test("env host hint does not grant capability",()=>{ const h=candidateHostFromEnv({MALACHII_HOST:"anthropic"}); assert.equal(h.id,"unverified-host"); });
test("hint-only evidence cannot execute",()=>{ const m:RuntimeManifest={host:{id:"x"},capabilities:[{name:"filesystem.write",evidence:[{id:"h",kind:"hint",source:"env",authenticity:"unknown",directness:"indirect",capability:"filesystem.write",scope:["project"],verifiedAt:now.toISOString()}]}]}; assert.equal(effectiveAssurance(m.capabilities[0]!,"project",now),"A1_HINTED"); assert.equal(authorize(m,{capability:"filesystem.write",scope:"project",impact:"reversible_local"},now).decision,"deny"); });
test("observed side effect still requires approval",()=>{ assert.equal(authorize(observed,{capability:"filesystem.write",scope:"project",impact:"external_side_effect"},now).decision,"require_approval"); });
test("observed with approval permits",()=>{ assert.equal(authorize(observed,{capability:"filesystem.write",scope:"project",impact:"external_side_effect",approvalId:"ok"},now).decision,"permit"); });
test("expired evidence fails closed",()=>{ assert.equal(effectiveAssurance(observed.capabilities[0]!,"project",new Date("2026-08-15T10:00:00Z")),"A0_UNKNOWN"); });
test("TOCTOU redemption rechecks fresh manifest",()=>{ const fresh:RuntimeManifest={host:{id:"test"},capabilities:[]}; assert.equal(redeemAuthorization(fresh,{capability:"filesystem.write",scope:"project",impact:"external_side_effect",approvalId:"ok"},now).decision,"deny"); });
test("external content cannot direct policy",()=>{ assert.equal(mayDirectPolicy("UNTRUSTED_EXTERNAL_CONTENT"),false); assert.equal(mayDirectPolicy("SUPER_USER_INSTRUCTION"),true); });
test("confidence override does not mutate derived",()=>{ const c=createConfidence(.82,{x:.7},["e"]); const o=createOverride("super-user","force route",{value:.95}); assert.equal(c.derived,.82); assert.equal(o.value,.95); });
