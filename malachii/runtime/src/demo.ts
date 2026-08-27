import { EventLedger, IntelligenceRegistry, forgeObjective, route, scoreObjective, shipDecision, signCheckpoint } from "./index.js";

const objective="Build the strongest possible portable multi-model AI operating system";
const assessment=scoreObjective(objective);
const forge=forgeObjective("obj_demo",objective,assessment);
const registry=new IntelligenceRegistry();
registry.register({id:"model-a",provider:"generic",capabilities:["reasoning"],tags:["frontier"],measured:{quality:8.7,costIndex:2,sampleSize:10},available:true});
registry.register({id:"model-b",provider:"generic",capabilities:["reasoning"],tags:["critic"],measured:{quality:8.3,costIndex:1,sampleSize:10},available:true});
const plan=route(forge,registry);
const ledger=new EventLedger(); ledger.append("OBJECTIVE_RECEIVED",{objective}); ledger.append("FORGE_COMPLETED",{mode:forge.execution.mode});
const checkpoint=signCheckpoint(ledger.snapshot().length-1,ledger.rootHash(),"demo-secret");
const quality=shipDecision({accuracy:9,verification:8,completeness:8,intentAlignment:9,executionReadiness:8,structure:9,edgeCases:8},7,{runtime_claims_verified:true});
console.log(JSON.stringify({forge,plan,ledgerValid:ledger.verify(),checkpoint,quality},null,2));
