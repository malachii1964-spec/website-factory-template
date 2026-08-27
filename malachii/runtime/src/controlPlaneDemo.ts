import { ControlPlaneRegistry, runControlPlane, type ControlObjectiveSpec, type ControlResourceDescriptor, type ControlTask, type ExecutionAdapter, type RuntimeManifest } from "./index.js";

const now=new Date("2026-08-15T23:30:00Z");
const objective:ControlObjectiveSpec={
  id:"demo-control-001",requestedOutcome:"Produce a verified reference build artifact",successCriteria:["research evidence collected","build completed","release gates pass"],constraints:["reference adapters only"],riskTier:"T2",qualityFloor:9,
  requiredCapabilities:["web.search","code.execute"],allowedDataScopes:["public","project"],budget:{maxCostIndexPerTask:5,maxLatencyMsPerTask:5000},
  releasePolicy:{externalPublish:false,requiredHardGates:["tests","truth_boundary"]},verification:{minEvidenceReceipts:4,requireIndependentVerification:true,minIndependentEvidenceSources:2},createdAt:now.toISOString()
};

const registry=new ControlPlaneRegistry();
const resources:ControlResourceDescriptor[]=[
  {id:"research-a",kind:"agent",provider:"reference",capabilities:["web.search"],scopes:["public"],allowedDataScopes:["public"],tags:["independent"],available:true,assurance:"A3_OBSERVED",trustDomain:"AGENT_MESSAGE",measurements:{quality:9.2,latencyMs:120,costIndex:1,successRate:.97,sampleSize:30},executionAdapterId:"ref-research-a"},
  {id:"research-b",kind:"agent",provider:"reference",capabilities:["web.search"],scopes:["public"],allowedDataScopes:["public"],tags:["independent"],available:true,assurance:"A3_OBSERVED",trustDomain:"AGENT_MESSAGE",measurements:{quality:9.1,latencyMs:110,costIndex:1.1,successRate:.96,sampleSize:28},executionAdapterId:"ref-research-b"},
  {id:"builder",kind:"execution_plane",provider:"reference",capabilities:["code.execute"],scopes:["project"],allowedDataScopes:["project"],tags:["builder"],available:true,assurance:"A3_OBSERVED",trustDomain:"TOOL_OUTPUT",measurements:{quality:9.4,latencyMs:200,costIndex:1.5,successRate:.98,sampleSize:50},executionAdapterId:"ref-builder"}
];
resources.forEach(r=>registry.register(r));

const tasks:ControlTask[]=[
  {id:"research",actionId:"demo-research",title:"collect evidence",capability:"web.search",scope:"public",dataScopes:["public"],impact:"read_only",dependsOn:[],required:true,independenceGroup:"research-verification"},
  {id:"verify",actionId:"demo-verify",title:"independently verify evidence",capability:"web.search",scope:"public",dataScopes:["public"],impact:"read_only",dependsOn:[],required:true,independenceGroup:"research-verification"},
  {id:"build",actionId:"demo-build",title:"build artifact",capability:"code.execute",scope:"project",dataScopes:["project"],impact:"reversible_local",dependsOn:["research","verify"],required:true}
];

const adapters:ExecutionAdapter[]=[
  {id:"ref-research-a",capabilities:["web.search"],async execute(){return {output:{mode:"REFERENCE_SIMULATION",finding:"synthetic evidence fixture"},evidenceIds:["ref-source-1","ref-source-2"]};}},
  {id:"ref-research-b",capabilities:["web.search"],async execute(){return {output:{mode:"REFERENCE_SIMULATION",finding:"alternate synthetic evidence fixture"},evidenceIds:["ref-source-3"]};}},
  {id:"ref-builder",capabilities:["code.execute"],async execute(){return {output:{mode:"REFERENCE_SIMULATION",artifact:"demo.zip"},evidenceIds:["build-test-1"]};}}
];

const manifest:RuntimeManifest={host:{id:"reference-demo"},capabilities:[
  {name:"web.search",evidence:[{id:"obs-web",kind:"observation",source:"reference-test",authenticity:"verified",directness:"direct",capability:"web.search",scope:["public"],observedSuccess:true,verifiedAt:now.toISOString()}]},
  {name:"code.execute",evidence:[{id:"obs-code",kind:"observation",source:"reference-test",authenticity:"verified",directness:"direct",capability:"code.execute",scope:["project"],observedSuccess:true,verifiedAt:now.toISOString()}]}
]};

const report=await runControlPlane(objective,tasks,{registry,getFreshManifest:()=>manifest,adapters,now:()=>now,evaluateSuccessCriteria:()=>({"research evidence collected":true,"build completed":true,"release gates pass":true}),evaluateQuality:()=>({accuracy:9.4,verification:9.4,completeness:9.4,intentAlignment:9.4,executionReadiness:9.4,structure:9.4,edgeCases:9.4}),evaluateHardGates:()=>({tests:true,truth_boundary:true})});
console.log(JSON.stringify({schema:"malachii.control-plane.demo.v1",truthBoundary:"REFERENCE_SIMULATION_ONLY: demonstrates control-plane mechanics with deterministic local adapters; it is not live web research or external execution.",report},null,2));
