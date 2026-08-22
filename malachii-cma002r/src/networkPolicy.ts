import { lookup } from "node:dns/promises";

export interface NetworkPolicy {
  allowedProtocols:string[];
  allowedHosts:string[];
  denyPrivateNetworks:boolean;
  maxRedirects:number;
  maxResponseBytes:number;
  timeoutMs:number;
}

export const DEFAULT_PUBLIC_NETWORK_POLICY:NetworkPolicy={
  allowedProtocols:["https:"],
  allowedHosts:["*"],
  denyPrivateNetworks:true,
  maxRedirects:4,
  maxResponseBytes:2_000_000,
  timeoutMs:15_000
};

function hostMatches(host:string,patterns:string[]):boolean{
  const h=host.toLowerCase();
  return patterns.some(raw=>{
    const p=raw.toLowerCase();
    if(p==="*")return true;
    if(p.startsWith("*.")){const suffix=p.slice(1);return h.endsWith(suffix) && h.length>suffix.length;}
    return h===p;
  });
}

function isPrivateV4(ip:string):boolean{
  const p=ip.split(".").map(Number); if(p.length!==4||p.some(n=>!Number.isFinite(n)))return false;
  const [a,b]=p as [number,number,number,number];
  return a===10 || a===127 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || a===0 || a>=224;
}
function isPrivateV6(ip:string):boolean{
  const x=ip.toLowerCase();
  return x==="::1" || x==="::" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb") || x.startsWith("ff");
}
export function isPrivateAddress(ip:string):boolean{return ip.includes(":")?isPrivateV6(ip):isPrivateV4(ip);}

export async function assertUrlAllowed(raw:string,policy:NetworkPolicy):Promise<URL>{
  const url=new URL(raw);
  if(!policy.allowedProtocols.includes(url.protocol))throw new Error("network_protocol_denied");
  if(url.username||url.password)throw new Error("network_userinfo_denied");
  if(!hostMatches(url.hostname,policy.allowedHosts))throw new Error("network_host_denied");
  if(policy.denyPrivateNetworks){
    const addresses=await lookup(url.hostname,{all:true,verbatim:true});
    if(addresses.some((x:{address:string})=>isPrivateAddress(x.address)))throw new Error("network_private_address_denied");
  }
  return url;
}

export interface GovernedFetchResult {url:string;status:number;headers:Record<string,string>;body:string;bytes:number;redirects:string[];}

export async function governedFetch(raw:string,init:RequestInit={},policy:NetworkPolicy=DEFAULT_PUBLIC_NETWORK_POLICY):Promise<GovernedFetchResult>{
  let current=raw; const redirects:string[]=[];
  for(let i=0;i<=policy.maxRedirects;i++){
    const url=await assertUrlAllowed(current,policy);
    const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),policy.timeoutMs);
    try{
      const response=await fetch(url,{...init,redirect:"manual",signal:controller.signal});
      if(response.status>=300&&response.status<400){
        const loc=response.headers.get("location"); if(!loc)throw new Error("network_redirect_without_location");
        const next=new URL(loc,url).toString(); await assertUrlAllowed(next,policy); redirects.push(next); current=next; continue;
      }
      const reader=response.body?.getReader(); const chunks:Uint8Array[]=[];let total=0;
      if(reader){for(;;){const {done,value}=await reader.read();if(done)break;if(value){total+=value.byteLength;if(total>policy.maxResponseBytes){try{await reader.cancel();}catch{}throw new Error("network_response_too_large");}chunks.push(value);}}}
      const merged=new Uint8Array(total);let off=0;for(const c of chunks){merged.set(c,off);off+=c.length;}
      const headers:Record<string,string>={};response.headers.forEach((v,k)=>{headers[k]=v;});
      return {url:url.toString(),status:response.status,headers,body:new TextDecoder().decode(merged),bytes:total,redirects};
    } finally {clearTimeout(timer);}
  }
  throw new Error("network_redirect_limit_exceeded");
}
