declare module "node:crypto" {
  // Ed25519 surface used by the v1.1 Super-User approval gate. Declared here to
  // match the package's existing hand-rolled shim style rather than introducing
  // a dependency on the full @types/node surface.
  export interface KeyObject { readonly __keyObject: unique symbol }
  export function generateKeyPairSync(type: "ed25519"): { publicKey: KeyObject; privateKey: KeyObject };
  export function createPublicKey(key: string | KeyObject): KeyObject;
  export function sign(algorithm: null, data: Uint8Array, key: KeyObject): { toString(encoding: string): string };
  export function verify(algorithm: null, data: Uint8Array, key: KeyObject, signature: Uint8Array): boolean;
  export function createHash(algorithm: string): { update(data: string | Uint8Array): any; digest(encoding: "hex"): string };
  export function createHmac(algorithm: string, key: string): { update(data: string | Uint8Array): any; digest(encoding: "hex"): string };
  export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
  export function randomUUID(): string;
}
declare module "node:test" {
  type TestFn = (name: string, fn: () => void | Promise<void>) => void;
  const test: TestFn;
  export default test;
}
declare module "node:assert/strict" {
  interface Assert {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    rejects(fn: () => Promise<unknown>, expected?: RegExp | object): Promise<void>;
  }
  const assert: Assert;
  export default assert;
}
declare module "node:fs/promises" {
  export function mkdir(path: string, options?: any): Promise<void>;
  export function readFile(path: string, options?: any): Promise<any>;
  export function writeFile(path: string, data: any, options?: any): Promise<void>;
  export function rename(oldPath: string, newPath: string): Promise<void>;
  export function rm(path: string, options?: any): Promise<void>;
  export function readdir(path: string, options?: any): Promise<any[]>;
  export function stat(path: string): Promise<any>;
  export function lstat(path: string): Promise<any>;
  export function realpath(path: string): Promise<string>;
  export function access(path: string): Promise<void>;
  export function mkdtemp(prefix: string): Promise<string>;
}
declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, options?: any): void;
  export function appendFileSync(path: string, data: string, options?: any): void;
  export function mkdirSync(path: string, options?: any): void;
}
declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string): string;
  export function relative(from: string, to: string): string;
  export function isAbsolute(path: string): boolean;
  export const sep: string;
}
declare module "node:child_process" {
  export interface ChildProcessLike {
    stdout?: { on(event: string, fn: (chunk: any) => void): void };
    stderr?: { on(event: string, fn: (chunk: any) => void): void };
    stdin?: { write(data: string): void; end(): void };
    on(event: string, fn: (...args: any[]) => void): void;
    kill(signal?: string): boolean;
  }
  export function spawn(command: string, args?: string[], options?: any): ChildProcessLike;
}
declare module "node:dns/promises" {
  export function lookup(hostname: string, options?: any): Promise<any>;
}
declare module "node:os" {
  export function tmpdir(): string;
}
declare module "node:http" {
  export function createServer(handler: (req: any, res: any) => void): any;
}
declare const process: {
  env: Record<string,string|undefined>;
  argv: string[];
  execPath: string;
  cwd(): string;
  platform: string;
  on(event:string,fn:(...args:any[])=>void):void;
  exit(code?:number):never;
};
