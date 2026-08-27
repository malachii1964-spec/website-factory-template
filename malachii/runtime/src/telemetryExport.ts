import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { governedFetch, type NetworkPolicy, DEFAULT_PUBLIC_NETWORK_POLICY } from "./networkPolicy.js";

export interface TelemetryRecord {name:string;timestamp:string;attributes:Record<string,string|number|boolean|undefined>;}
export interface StructuredTelemetrySink {emit(record:TelemetryRecord):void|Promise<void>;}
export class JsonlTelemetrySink implements StructuredTelemetrySink {
  readonly path:string;constructor(path:string){this.path=resolve(path);mkdirSync(dirname(this.path),{recursive:true});}
  emit(record:TelemetryRecord):void{appendFileSync(this.path,`${JSON.stringify({name:record.name,timestamp:record.timestamp,attributes:redact(record.attributes)})}\n`,{encoding:"utf8",mode:0o600});}
}
function redact(attrs:Record<string,string|number|boolean|undefined>){const out:Record<string,string|number|boolean|undefined>={};for(const[k,v]of Object.entries(attrs)){out[k]=/prompt|response|secret|token|authorization|api[_-]?key/i.test(k)?"[REDACTED]":v;}return out;}

/** Minimal OTLP/HTTP JSON exporter hook. Internal ledger remains authoritative. */
export class OtlpHttpTelemetrySink implements StructuredTelemetrySink {
  constructor(private endpoint:string,private policy:NetworkPolicy=DEFAULT_PUBLIC_NETWORK_POLICY,private headers:Record<string,string>={}){}
  async emit(record:TelemetryRecord):Promise<void>{const body=JSON.stringify({resourceSpans:[{resource:{attributes:[{key:"service.name",value:{stringValue:"malachii"}}]},scopeSpans:[{scope:{name:"malachii"},spans:[{traceId:"00000000000000000000000000000000",spanId:"0000000000000000",name:record.name,kind:1,startTimeUnixNano:"0",endTimeUnixNano:"0",attributes:Object.entries(redact(record.attributes)).filter(([,v])=>v!==undefined).map(([key,v])=>({key,value:typeof v==="number"?{doubleValue:v}:typeof v==="boolean"?{boolValue:v}:{stringValue:String(v)}}))}]}]}]});const r=await governedFetch(this.endpoint,{method:"POST",headers:{"content-type":"application/json",...this.headers},body},this.policy);if(r.status<200||r.status>=300)throw new Error(`otlp_http_${r.status}`);}
}
