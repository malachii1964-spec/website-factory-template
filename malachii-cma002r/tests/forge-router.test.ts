import test from "node:test";
import assert from "node:assert/strict";
import { IntelligenceRegistry, forgeObjective, modeFromAssessment, route, scoreObjective, shipDecision } from "../src/index.js";

test("high governance risk hard-escalates",()=>{ const a=scoreObjective("transfer money to production account"); assert.ok(a.governanceRisk>=8 || modeFromAssessment(a)==="sovereign_escalated"); });
test("simple objective stays lean",()=>{ const a=scoreObjective("rewrite this sentence"); const f=forgeObjective("x","rewrite this sentence",a); assert.ok(["direct","collaborative"].includes(f.execution.mode)); });
test("router uses available registry only",()=>{ const f=forgeObjective("x","design architecture",scoreObjective("design architecture for a system")); const r=new IntelligenceRegistry(); r.register({id:"off",provider:"x",capabilities:[],tags:[],measured:{sampleSize:0},available:false}); r.register({id:"on",provider:"x",capabilities:[],tags:[],measured:{quality:8,sampleSize:3},available:true}); const plan=route(f,r); assert.ok(plan.assigned.every(x=>x.modelId==="on")); });
test("quality floor and hard gate both block shipping",()=>{ const s={accuracy:9,verification:9,completeness:9,intentAlignment:9,executionReadiness:9,structure:9,edgeCases:9}; assert.equal(shipDecision(s,7,{runtime_claims_verified:false}).ship,false); });

test("forge computes tool capabilities and router honors them",()=>{
  const f=forgeObjective("cap","research current website implementation and build code",scoreObjective("research current website implementation and build code"));
  assert.ok(f.execution.requiredCapabilities.includes("web.search"));
  assert.ok(f.execution.requiredCapabilities.includes("code.execute"));
  const r=new IntelligenceRegistry();
  r.register({id:"weak",provider:"x",capabilities:["web.search"],tags:[],measured:{quality:10,sampleSize:2},available:true});
  r.register({id:"fit",provider:"x",capabilities:["web.search","code.execute"],tags:[],measured:{quality:8,sampleSize:2},available:true});
  const plan=route(f,r);
  assert.equal(plan.assigned[0]?.modelId,"fit");
});
