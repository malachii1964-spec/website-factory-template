import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, stat, lstat, realpath, access } from "node:fs/promises";
import { resolve, relative, dirname, basename, sep, join } from "node:path";
import { tmpdir } from "node:os";
import type { ExecutionAdapter, ExecutionAdapterResult, ExecutionStep } from "./executionPlane.js";
import { governedFetch, type NetworkPolicy, DEFAULT_PUBLIC_NETWORK_POLICY } from "./networkPolicy.js";

function hashText(s:string){return createHash("sha256").update(s).digest("hex");}
function under(root:string,target:string){const rel=relative(root,target);return rel===""||(!rel.startsWith(`..${sep}`)&&rel!==".."&&!rel.startsWith("/"));}
async function existingOrParentRealPath(target:string):Promise<string>{
  try{return await realpath(target);}catch(e){if((e as {code?:string}).code!=="ENOENT")throw e;return resolve(await realpath(dirname(target)),basename(target));}
}

export interface FilesystemAdapterOptions {id?:string;root:string;allowWrite?:boolean;maxReadBytes?:number;}
export class LocalFilesystemAdapter implements ExecutionAdapter {
  readonly id:string; readonly capabilities:string[]; readonly root:string; readonly allowWrite:boolean; readonly maxReadBytes:number;
  constructor(opts:FilesystemAdapterOptions){this.id=opts.id??"local.filesystem";this.root=resolve(opts.root);this.allowWrite=opts.allowWrite??false;this.maxReadBytes=opts.maxReadBytes??2_000_000;this.capabilities=["fs.read","fs.list","fs.stat","fs.hash",...(this.allowWrite?["fs.write","fs.mkdir"]:[])];}
  private async guarded(path:string,write=false):Promise<string>{
    const target=resolve(this.root,path);
    if(!under(this.root,target))throw new Error("filesystem_path_escape");
    const check=await existingOrParentRealPath(target);
    const realRoot=await realpath(this.root);
    if(!under(realRoot,check))throw new Error("filesystem_symlink_escape");
    if(write&&!this.allowWrite)throw new Error("filesystem_write_disabled");return target;
  }
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    const input=(step.input??{}) as Record<string,unknown>;const path=String(input.path??"");
    if(step.capability==="fs.read"){
      const target=await this.guarded(path);const st=await stat(target);if(st.size>this.maxReadBytes)throw new Error("filesystem_read_too_large");const body=String(await readFile(target,{encoding:"utf8"}));return {output:body,evidenceIds:[`fs:${hashText(body)}`]};
    }
    if(step.capability==="fs.list"){
      const target=await this.guarded(path);const names=(await readdir(target)).map(String).sort();const out=JSON.stringify(names);return {output:names,evidenceIds:[`fslist:${hashText(out)}`]};
    }
    if(step.capability==="fs.stat"){
      const target=await this.guarded(path);const st=await lstat(target);const out={size:st.size,isFile:st.isFile(),isDirectory:st.isDirectory(),isSymbolicLink:st.isSymbolicLink()};return {output:out,evidenceIds:[`fsstat:${hashText(JSON.stringify(out))}`]};
    }
    if(step.capability==="fs.hash"){
      const target=await this.guarded(path);const data=await readFile(target);const h=createHash("sha256").update(new Uint8Array(data)).digest("hex");return {output:h,evidenceIds:[`sha256:${h}`]};
    }
    if(step.capability==="fs.mkdir"){
      const target=await this.guarded(path,true);await mkdir(target,{recursive:true});return {output:{created:path},evidenceIds:[`mkdir:${hashText(target)}`]};
    }
    if(step.capability==="fs.write"){
      const target=await this.guarded(path,true);const content=String(input.content??"");await mkdir(dirname(target),{recursive:true});await writeFile(target,content,{encoding:"utf8",mode:0o600});return {output:{path,bytes:new TextEncoder().encode(content).byteLength},evidenceIds:[`fs:${hashText(content)}`]};
    }
    throw new Error("filesystem_capability_not_supported");
  }
}

export interface CommandAdapterOptions {id?:string;root:string;allowedCommands:string[];maxOutputBytes?:number;timeoutMs?:number;allowedEnvKeys?:string[];}
export class LocalCommandAdapter implements ExecutionAdapter {
  readonly id:string; readonly capabilities=["code.execute","command.execute"]; readonly root:string; private allowed:Set<string>;private maxOutput:number;private timeoutMs:number;private envKeys:Set<string>;
  constructor(opts:CommandAdapterOptions){this.id=opts.id??"local.command";this.root=resolve(opts.root);this.allowed=new Set(opts.allowedCommands);this.maxOutput=opts.maxOutputBytes??1_000_000;this.timeoutMs=opts.timeoutMs??30_000;this.envKeys=new Set(opts.allowedEnvKeys??[]);}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{
    const input=(step.input??{}) as Record<string,unknown>;const command=String(input.command??"");if(!this.allowed.has(command))throw new Error("command_not_allowlisted");
    const args=Array.isArray(input.args)?input.args.map(String):[];const cwd=resolve(this.root,String(input.cwd??"."));const rr=await realpath(this.root);const rc=await realpath(cwd);if(!under(rr,rc))throw new Error("command_cwd_escape");
    const requestedEnv=(input.env&&typeof input.env==="object"?input.env:{}) as Record<string,unknown>;const env:Record<string,string>={};if(process.env.PATH)env.PATH=process.env.PATH;for(const [k,v] of Object.entries(requestedEnv)){if(!this.envKeys.has(k))throw new Error(`command_env_denied:${k}`);env[k]=String(v);}
    const timeout=Math.min(Number(input.timeoutMs??this.timeoutMs),this.timeoutMs);const stdin=input.stdin===undefined?undefined:String(input.stdin);
    const result=await runProcess(command,args,{cwd,env,timeoutMs:timeout,maxOutputBytes:this.maxOutput,...(stdin!==undefined?{stdin}:{})});const combined=`${result.stdout}\n${result.stderr}\n${result.code}`;
    if(result.code!==0)throw new Error(`command_exit_${result.code}:${result.stderr.slice(0,500)}`);return {output:result,evidenceIds:[`process:${hashText(combined)}`]};
  }
}

async function runProcess(command:string,args:string[],opts:{cwd:string;env:Record<string,string>;timeoutMs:number;maxOutputBytes:number;stdin?:string}):Promise<{code:number;stdout:string;stderr:string}>{
  return new Promise((resolvePromise,reject)=>{
    const child=spawn(command,args,{cwd:opts.cwd,env:opts.env,stdio:["pipe","pipe","pipe"],shell:false});let stdout="",stderr="",bytes=0,done=false;
    const push=(kind:"out"|"err",chunk:any)=>{const text=String(chunk);bytes+=new TextEncoder().encode(text).byteLength;if(bytes>opts.maxOutputBytes){if(!done){done=true;child.kill("SIGKILL");reject(new Error("process_output_limit_exceeded"));}return;}if(kind==="out")stdout+=text;else stderr+=text;};
    child.stdout?.on("data",c=>push("out",c));child.stderr?.on("data",c=>push("err",c));
    const timer=setTimeout(()=>{if(!done){done=true;child.kill("SIGKILL");reject(new Error("process_timeout"));}},opts.timeoutMs);
    child.on("error",e=>{if(!done){done=true;clearTimeout(timer);reject(e);}});child.on("close",code=>{if(!done){done=true;clearTimeout(timer);resolvePromise({code:Number(code??-1),stdout,stderr});}});
    if(opts.stdin!==undefined){child.stdin?.write(opts.stdin);}child.stdin?.end();
  });
}

export interface HttpAdapterOptions {id?:string;policy?:NetworkPolicy;defaultHeaders?:Record<string,string>;}
export class GovernedHttpAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities=["web.fetch","http.request"];readonly policy:NetworkPolicy;readonly headers:Record<string,string>;
  constructor(opts:HttpAdapterOptions={}){this.id=opts.id??"network.http";this.policy=opts.policy??DEFAULT_PUBLIC_NETWORK_POLICY;this.headers={...(opts.defaultHeaders??{})};}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const input=(step.input??{}) as Record<string,unknown>;const url=String(input.url??"");const method=String(input.method??"GET").toUpperCase();if(!["GET","HEAD","POST"].includes(method))throw new Error("http_method_denied");const body=input.body===undefined?undefined:String(input.body);const extra=(input.headers&&typeof input.headers==="object"?input.headers:{}) as Record<string,unknown>;const headers={...this.headers,...Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,String(v)]))};const result=await governedFetch(url,{method,headers,...(body!==undefined?{body}:{})},this.policy);return {output:result,evidenceIds:[`http:${hashText(`${result.url}\n${result.status}\n${result.body}`)}`]};}
}

export interface ChromiumAdapterOptions {id?:string;chromiumPath?:string;root:string;allowNoSandbox?:boolean;timeoutMs?:number;maxOutputBytes?:number;}
/**
 * Governed snapshot renderer. It renders only local HTML/file content by default,
 * which avoids granting Chromium unrestricted network authority. Public pages
 * should first be fetched through GovernedHttpAdapter and supplied as html.
 */
export class ChromiumSnapshotAdapter implements ExecutionAdapter {
  readonly id:string;readonly capabilities=["browser.render_snapshot"];private chromium:string;private root:string;private allowNoSandbox:boolean;private timeoutMs:number;private maxOutput:number;
  constructor(opts:ChromiumAdapterOptions){this.id=opts.id??"browser.chromium.snapshot";this.chromium=opts.chromiumPath??"chromium";this.root=resolve(opts.root);this.allowNoSandbox=opts.allowNoSandbox??false;this.timeoutMs=opts.timeoutMs??25_000;this.maxOutput=opts.maxOutputBytes??2_000_000;}
  async execute(step:ExecutionStep):Promise<ExecutionAdapterResult>{const input=(step.input??{}) as Record<string,unknown>;const html=String(input.html??"");if(!html)throw new Error("browser_snapshot_html_required");await mkdir(this.root,{recursive:true});const name=`snapshot-${randomUUID()}.html`;const path=join(this.root,name);await writeFile(path,html,{encoding:"utf8",mode:0o600});const args=["--headless=new","--disable-gpu","--disable-background-networking","--disable-component-update","--disable-sync","--no-first-run","--disable-extensions","--dump-dom",`file://${path}`];if(this.allowNoSandbox)args.unshift("--no-sandbox");const result=await runProcess(this.chromium,args,{cwd:this.root,env:{PATH:process.env.PATH??""},timeoutMs:this.timeoutMs,maxOutputBytes:this.maxOutput});if(result.code!==0)throw new Error(`chromium_exit_${result.code}:${result.stderr.slice(0,500)}`);return {output:{dom:result.stdout,stderr:result.stderr},evidenceIds:[`browser:${hashText(result.stdout)}`]};}
}
