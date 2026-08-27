import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { EventLedger, type LedgerEvent } from "./eventLedger.js";

/**
 * Durable append-only journal around EventLedger. The hash chain remains the
 * integrity mechanism; the JSONL journal provides restart durability.
 */
export class PersistentEventLedger extends EventLedger {
  readonly journalPath:string;
  constructor(journalPath:string){
    const path=resolve(journalPath);
    let seed:LedgerEvent[]=[];
    if (existsSync(path)) {
      const raw=readFileSync(path,"utf8").trim();
      if(raw) seed=raw.split(/\r?\n/).map(line=>JSON.parse(line) as LedgerEvent);
    }
    super(seed);
    if(!this.verify()) throw new Error("persistent_ledger_integrity_failure");
    mkdirSync(dirname(path),{recursive:true});
    this.journalPath=path;
  }
  override append(type:string,payload:unknown,now=new Date()):LedgerEvent{
    const event=super.append(type,payload,now);
    appendFileSync(this.journalPath,`${JSON.stringify(event)}\n`,{encoding:"utf8",mode:0o600});
    return event;
  }
}
