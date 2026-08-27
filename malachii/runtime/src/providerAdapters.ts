import { createHash } from "node:crypto";
import type { ExecutionAdapter, ExecutionAdapterResult, ExecutionStep } from "./executionPlane.js";
import { governedFetch, type NetworkPolicy, DEFAULT_PUBLIC_NETWORK_POLICY } from "./networkPolicy.js";

function hash(s:string){return createHash("sha256").update(s).digest("hex");}
export interface SecretProvider {get(name:string):string|undefined;}
export class EnvironmentSecretProvider implements SecretProvider {get(name:string){return process.env[name];}}

abstract class BaseModelAdapter implements ExecutionAdapter {
  abstract readonly id:string;readonly capabilities=["model.generate"];constructor(protected secrets:SecretProvider,protected policy:NetworkPolicy=DEFAULT_PUBLIC_NETWORK_POLICY){}
  protected input(step:ExecutionStep){const i=(step.input??{}) as Record<string,unknown>;const prompt=String(i.prompt??"");const model=String(i.model??"");if(!prompt)throw new Error("model_prompt_required");if(!model)throw new Error("model_name_required");return {i,prompt,model};}
  abstract execute(step:ExecutionStep):Promise<ExecutionAdapterResult>;
  protected evidence(provider:string,model:string,text:string){return [`model:${provider}:${model}:${hash(text)}`];}
}

export interface OpenAIAdapterOptions{secretName?:string;baseUrl?:string;policy?:NetworkPolicy;}
export class OpenAIResponsesAdapter extends BaseModelAdapter{
  readonly id="model.openai.responses";private secretName:string;private base:string;
  constructor(secrets:SecretProvider=new EnvironmentSecretProvider(),opts:OpenAIAdapterOptions={}){super(secrets,opts.policy);this.secretName=opts.secretName??"OPENAI_API_KEY";this.base=opts.baseUrl??"https://api.openai.com/v1/responses";}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const {prompt,model}=this.input(step);const key=this.secrets.get(this.secretName);if(!key)throw new Error("openai_api_key_unavailable");const r=await governedFetch(this.base,{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({model,input:prompt})},this.policy);if(r.status<200||r.status>=300)throw new Error(`openai_http_${r.status}`);const j=JSON.parse(r.body) as any;const text=typeof j.output_text==="string"?j.output_text:JSON.stringify(j.output??j);return {output:{provider:"openai",model,text,raw:j},evidenceIds:this.evidence("openai",model,text)};}
}

export interface AnthropicAdapterOptions{secretName?:string;baseUrl?:string;apiVersion?:string;policy?:NetworkPolicy;maxTokens?:number;}
export class AnthropicMessagesAdapter extends BaseModelAdapter{
  readonly id="model.anthropic.messages";private secretName:string;private base:string;private version:string;private maxTokens:number;
  constructor(secrets:SecretProvider=new EnvironmentSecretProvider(),opts:AnthropicAdapterOptions={}){super(secrets,opts.policy);this.secretName=opts.secretName??"ANTHROPIC_API_KEY";this.base=opts.baseUrl??"https://api.anthropic.com/v1/messages";this.version=opts.apiVersion??"2023-06-01";this.maxTokens=opts.maxTokens??2048;}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const {prompt,model}=this.input(step);const key=this.secrets.get(this.secretName);if(!key)throw new Error("anthropic_api_key_unavailable");const r=await governedFetch(this.base,{method:"POST",headers:{"x-api-key":key,"anthropic-version":this.version,"content-type":"application/json"},body:JSON.stringify({model,max_tokens:this.maxTokens,messages:[{role:"user",content:prompt}]})},this.policy);if(r.status<200||r.status>=300)throw new Error(`anthropic_http_${r.status}`);const j=JSON.parse(r.body) as any;const text=Array.isArray(j.content)?j.content.filter((x:any)=>x?.type==="text").map((x:any)=>String(x.text??"")).join("\n"):JSON.stringify(j);return {output:{provider:"anthropic",model,text,raw:j},evidenceIds:this.evidence("anthropic",model,text)};}
}

export interface GeminiAdapterOptions{secretName?:string;baseUrl?:string;policy?:NetworkPolicy;}
export class GeminiGenerateContentAdapter extends BaseModelAdapter{
  readonly id="model.google.generateContent";private secretName:string;private base:string;
  constructor(secrets:SecretProvider=new EnvironmentSecretProvider(),opts:GeminiAdapterOptions={}){super(secrets,opts.policy);this.secretName=opts.secretName??"GEMINI_API_KEY";this.base=opts.baseUrl??"https://generativelanguage.googleapis.com/v1beta";}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const {prompt,model}=this.input(step);const key=this.secrets.get(this.secretName);if(!key)throw new Error("gemini_api_key_unavailable");const url=`${this.base.replace(/\/$/,"")}/models/${encodeURIComponent(model)}:generateContent`;const r=await governedFetch(url,{method:"POST",headers:{"x-goog-api-key":key,"content-type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})},this.policy);if(r.status<200||r.status>=300)throw new Error(`gemini_http_${r.status}`);const j=JSON.parse(r.body) as any;const text=(j.candidates??[]).flatMap((c:any)=>c?.content?.parts??[]).map((p:any)=>p?.text??"").join("\n");return {output:{provider:"google",model,text,raw:j},evidenceIds:this.evidence("google",model,text)};}
}
