import { randomUUID, createHash } from "node:crypto";
import type { ExecutionAdapter, ExecutionAdapterResult, ExecutionStep } from "./executionPlane.js";
import type { ControlResourceDescriptor } from "./controlPlane.js";
import { governedFetch, type NetworkPolicy, DEFAULT_PUBLIC_NETWORK_POLICY } from "./networkPolicy.js";

function h(s:string){return createHash("sha256").update(s).digest("hex");}
function json(raw:string):any{try{return JSON.parse(raw);}catch{throw new Error("protocol_invalid_json");}}

export interface McpHttpOptions {id?:string;endpoint:string;policy?:NetworkPolicy;authorization?:string;clientName?:string;clientVersion?:string;}
/** MCP 2026-07-28 stateless Streamable HTTP client for discovery and tool calls. */
export class Mcp20260728HttpAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities=["mcp.invoke"];private endpoint:string;private policy:NetworkPolicy;private auth:string|undefined;private clientName:string;private clientVersion:string;
  constructor(opts:McpHttpOptions){this.id=opts.id??"mcp.http.2026-07-28";this.endpoint=opts.endpoint;this.policy=opts.policy??DEFAULT_PUBLIC_NETWORK_POLICY;this.auth=opts.authorization;this.clientName=opts.clientName??"malachii";this.clientVersion=opts.clientVersion??"3.3-rc1.5";}
  private async rpc(method:string,params:Record<string,unknown>={},name?:string):Promise<any>{
    const headers:Record<string,string>={"content-type":"application/json","MCP-Protocol-Version":"2026-07-28","Mcp-Method":method,...(name?{"Mcp-Name":name}:{}),...(this.auth?{authorization:this.auth}:{})};
    const body=JSON.stringify({jsonrpc:"2.0",id:randomUUID(),method,params:{...params,_meta:{"io.modelcontextprotocol/clientInfo":{name:this.clientName,version:this.clientVersion}}}});
    const r=await governedFetch(this.endpoint,{method:"POST",headers,body},this.policy);if(r.status<200||r.status>=300)throw new Error(`mcp_http_${r.status}`);const payload=json(r.body);if(payload.error)throw new Error(`mcp_rpc_error:${JSON.stringify(payload.error)}`);return payload.result;
  }
  async discoverTools():Promise<any>{return this.rpc("tools/list");}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const input=(step.input??{}) as Record<string,unknown>;const name=String(input.toolName??input.name??"");if(!name)throw new Error("mcp_tool_name_required");const args=(input.arguments&&typeof input.arguments==="object"?input.arguments:{}) as Record<string,unknown>;const result=await this.rpc("tools/call",{name,arguments:args},name);return {output:result,evidenceIds:[`mcp:${h(JSON.stringify(result))}`]};}
}

export interface A2AHttpOptions {id?:string;baseUrl:string;policy?:NetworkPolicy;authorization?:string;protocolVersion?:string;}
export interface A2AAgentCard {name:string;description:string;version:string;skills:Array<{id:string;name:string;description:string;tags:string[];inputModes?:string[];outputModes?:string[]}>;supportedInterfaces:Array<{url?:string;protocolBinding?:string;protocolVersion:string}>;capabilities:Record<string,unknown>;signatures?:Array<Record<string,unknown>>;}
/** A2A 1.0 HTTP+JSON/REST client. Internal thoughts are neither requested nor required. */
export class A2A10HttpAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities=["a2a.delegate"];private base:string;private policy:NetworkPolicy;private auth:string|undefined;private version:string;
  constructor(opts:A2AHttpOptions){this.id=opts.id??"a2a.http.1.0";this.base=opts.baseUrl.replace(/\/$/,"");this.policy=opts.policy??DEFAULT_PUBLIC_NETWORK_POLICY;this.auth=opts.authorization;this.version=opts.protocolVersion??"1.0";}
  private headers():Record<string,string>{return {"content-type":"application/a2a+json","A2A-Version":this.version,...(this.auth?{authorization:this.auth}:{})};}
  async discover():Promise<A2AAgentCard>{const r=await governedFetch(`${this.base}/.well-known/agent-card.json`,{method:"GET",headers:this.headers()},this.policy);if(r.status!==200)throw new Error(`a2a_agent_card_http_${r.status}`);const card=json(r.body) as A2AAgentCard;if(!card.name||!Array.isArray(card.skills)||!Array.isArray(card.supportedInterfaces))throw new Error("a2a_agent_card_invalid");return card;}
  async send(text:string,taskId?:string):Promise<any>{const message={messageId:randomUUID(),role:"ROLE_USER",parts:[{text}],...(taskId?{taskId}:{})};const r=await governedFetch(`${this.base}/message:send`,{method:"POST",headers:this.headers(),body:JSON.stringify({message,configuration:{acceptedOutputModes:["text/plain","application/json"]}})},this.policy);if(r.status<200||r.status>=300)throw new Error(`a2a_http_${r.status}`);return json(r.body);}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const input=(step.input??{}) as Record<string,unknown>;const prompt=String(input.prompt??input.text??"");if(!prompt)throw new Error("a2a_prompt_required");const result=await this.send(prompt,input.taskId?String(input.taskId):undefined);return {output:result,evidenceIds:[`a2a:${h(JSON.stringify(result))}`]};}
  async discoveredResources(provider="a2a-remote"):Promise<ControlResourceDescriptor[]>{const card=await this.discover();return card.skills.map(skill=>({id:`a2a:${card.name}:${skill.id}`,kind:"agent",provider,capabilities:[`a2a.skill.${skill.id}`,"a2a.delegate"],scopes:["*"],allowedDataScopes:["public"],tags:["remote","a2a",...skill.tags],available:true,assurance:card.signatures?.length?"A2_AUTHENTICATED_DECLARATION":"A1_HINTED",trustDomain:"AGENT_MESSAGE",measurements:{sampleSize:0},executionAdapterId:this.id}));}
}
