import { access, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ChromiumSnapshotAdapter, GovernedHttpAdapter, type ExecutionStep, type NetworkPolicy } from "./index.js";

const projectRoot=resolve(process.cwd(),"..");
const evidencePath=join(projectRoot,"evidence","RC15_HOST_INTEGRATION_PROBES.json");
await mkdir(join(projectRoot,"evidence"),{recursive:true});

const step=(id:string,capability:string,scope:string,input:unknown):ExecutionStep=>({id,actionId:`probe-${id}`,title:id,capability,scope,impact:"read_only",dependsOn:[],required:false,input});
const results:Record<string,unknown>={};

const externalPolicy:NetworkPolicy={allowedProtocols:["https:"],allowedHosts:["example.com"],denyPrivateNetworks:true,maxRedirects:2,maxResponseBytes:200_000,timeoutMs:5_000};
try{
  const r=await new GovernedHttpAdapter({id:"probe.external.http",policy:externalPolicy}).execute(step("external-internet","web.fetch","public",{url:"https://example.com/"}));
  results.externalInternet={status:"PASS",observed:true,evidenceIds:r.evidenceIds??[],note:"Observed governed external HTTPS fetch from this host."};
}catch(e){results.externalInternet={status:"UNVERIFIED",observed:false,error:e instanceof Error?e.message:String(e),note:"External Internet capability is not claimed from this host."};}

const chromiumPath="/usr/bin/chromium";
try{
  await access(chromiumPath);
  try{
    const adapter=new ChromiumSnapshotAdapter({id:"probe.chromium",chromiumPath,root:join(projectRoot,"state","rc15_chromium_probe"),allowNoSandbox:true,timeoutMs:8_000,maxOutputBytes:500_000});
    const r=await adapter.execute(step("chromium","browser.render_snapshot","local",{html:"<!doctype html><html><body><main id='probe'>MALACHII RC1.5</main></body></html>"}));
    results.chromium={status:"PASS",observed:true,evidenceIds:r.evidenceIds??[],note:"Observed local HTML snapshot rendering in this host."};
  }catch(e){results.chromium={status:"UNVERIFIED",observed:false,error:e instanceof Error?e.message:String(e),note:"Chromium adapter exists but successful Chromium runtime execution is not claimed in this host."};}
}catch(e){results.chromium={status:"UNAVAILABLE",observed:false,error:e instanceof Error?e.message:String(e),note:"Chromium executable not available in this host."};}

const output={schema:"malachii.rc15.host-integration-probes.v1",generatedAt:new Date().toISOString(),results};
await writeFile(evidencePath,JSON.stringify(output,null,2),{encoding:"utf8",mode:0o600});
console.log(JSON.stringify(output,null,2));
