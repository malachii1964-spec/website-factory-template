import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, rename, readdir, rm } from "node:fs/promises";
import { resolve, join, dirname, relative, sep } from "node:path";

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj=value as Record<string,unknown>;
  return `{${Object.keys(obj).sort().map(k=>`${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function safeSegment(value:string):string {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value==="." || value==="..") throw new Error("invalid_state_key_segment");
  return value;
}

function contained(root:string,target:string):boolean {
  const rel=relative(root,target);
  return rel==="" || (!rel.startsWith(`..${sep}`) && rel!==".." && !rel.startsWith("/"));
}

export interface StateEnvelope<T=unknown> {
  namespace:string;
  id:string;
  revision:number;
  updatedAt:string;
  checksum:string;
  value:T;
}

export interface StateStore {
  put<T>(namespace:string,id:string,value:T,expectedRevision?:number):Promise<StateEnvelope<T>>;
  get<T>(namespace:string,id:string):Promise<StateEnvelope<T>|undefined>;
  list<T>(namespace:string):Promise<StateEnvelope<T>[]>;
  delete(namespace:string,id:string,expectedRevision?:number):Promise<boolean>;
}

/**
 * Dependency-free durable store for the portable runtime.
 * Each object is checksum-protected and replaced atomically via rename.
 * This is a single-node durability primitive, NOT distributed consensus.
 */
export class AtomicFileStateStore implements StateStore {
  readonly root:string;
  constructor(root:string){ this.root=resolve(root); }

  private path(namespace:string,id:string):string {
    const p=resolve(this.root,safeSegment(namespace),`${safeSegment(id)}.json`);
    if (!contained(this.root,p)) throw new Error("state_path_escape");
    return p;
  }

  async put<T>(namespace:string,id:string,value:T,expectedRevision?:number):Promise<StateEnvelope<T>> {
    const current=await this.get<T>(namespace,id);
    if (expectedRevision!==undefined && (current?.revision ?? 0)!==expectedRevision) throw new Error("state_revision_conflict");
    const revision=(current?.revision ?? 0)+1;
    const updatedAt=new Date().toISOString();
    const checksum=sha256(canonical(value));
    const envelope:StateEnvelope<T>={namespace,id,revision,updatedAt,checksum,value};
    const target=this.path(namespace,id);
    await mkdir(dirname(target),{recursive:true});
    const temp=`${target}.${randomUUID()}.tmp`;
    await writeFile(temp,JSON.stringify(envelope,null,2),{encoding:"utf8",mode:0o600});
    await rename(temp,target);
    return envelope;
  }

  async get<T>(namespace:string,id:string):Promise<StateEnvelope<T>|undefined> {
    const target=this.path(namespace,id);
    try {
      const raw=await readFile(target,{encoding:"utf8"});
      const parsed=JSON.parse(String(raw)) as StateEnvelope<T>;
      if (parsed.namespace!==namespace || parsed.id!==id) throw new Error("state_identity_mismatch");
      if (parsed.checksum!==sha256(canonical(parsed.value))) throw new Error("state_checksum_mismatch");
      return parsed;
    } catch (error) {
      if ((error as {code?:string}).code==="ENOENT") return undefined;
      throw error;
    }
  }

  async list<T>(namespace:string):Promise<StateEnvelope<T>[]> {
    const dir=resolve(this.root,safeSegment(namespace));
    if (!contained(this.root,dir)) throw new Error("state_path_escape");
    try {
      const names=(await readdir(dir)).filter(x=>String(x).endsWith(".json")).map(String).sort();
      const out:StateEnvelope<T>[]=[];
      for (const name of names) {
        const id=name.slice(0,-5);
        const value=await this.get<T>(namespace,id);
        if (value) out.push(value);
      }
      return out;
    } catch (error) {
      if ((error as {code?:string}).code==="ENOENT") return [];
      throw error;
    }
  }

  async delete(namespace:string,id:string,expectedRevision?:number):Promise<boolean> {
    const current=await this.get(namespace,id);
    if (!current) return false;
    if (expectedRevision!==undefined && current.revision!==expectedRevision) throw new Error("state_revision_conflict");
    await rm(this.path(namespace,id));
    return true;
  }
}

export interface BlobReceipt { hash:string; size:number; path:string; }

/** Content-addressed evidence/artifact storage. */
export class ContentAddressedStore {
  readonly root:string;
  constructor(root:string){this.root=resolve(root);}
  async put(content:string|Uint8Array):Promise<BlobReceipt>{
    const bytes=typeof content==="string" ? new TextEncoder().encode(content) : content;
    const hash=sha256(bytes);
    const dir=join(this.root,hash.slice(0,2));
    const path=join(dir,hash);
    await mkdir(dir,{recursive:true});
    try { await readFile(path); }
    catch (error) {
      if ((error as {code?:string}).code!=="ENOENT") throw error;
      const temp=`${path}.${randomUUID()}.tmp`;
      await writeFile(temp,bytes,{mode:0o600}); await rename(temp,path);
    }
    return {hash,size:bytes.byteLength,path};
  }
  async get(hash:string):Promise<Uint8Array|undefined>{
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("invalid_blob_hash");
    const path=join(this.root,hash.slice(0,2),hash);
    try { const data=await readFile(path); return new Uint8Array(data); }
    catch(error){ if((error as {code?:string}).code==="ENOENT")return undefined; throw error; }
  }
}
