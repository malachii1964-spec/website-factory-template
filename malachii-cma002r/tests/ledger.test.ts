import test from "node:test";
import assert from "node:assert/strict";
import { EventLedger, signCheckpoint, verifyCheckpoint } from "../src/index.js";

test("ledger verifies and detects mutation",()=>{ const l=new EventLedger(); l.append("A",{x:1}); l.append("B",{y:2}); assert.equal(l.verify(),true); const snap=l.snapshot().map(e=>({...e})); (snap[0] as any).payload={x:9}; assert.equal(l.verify(snap),false); });
test("checkpoint signature verifies",()=>{ const l=new EventLedger(); l.append("A",{}); const c=signCheckpoint(0,l.rootHash(),"secret"); assert.equal(verifyCheckpoint(c,"secret"),true); assert.equal(verifyCheckpoint(c,"wrong"),false); });
