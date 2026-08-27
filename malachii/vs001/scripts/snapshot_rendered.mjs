import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
const BASE="http://127.0.0.1:3200";
const ROUTES=["/","/products","/about","/membership","/free-toolkit","/local-business","/legal/terms","/products/ai-workspace-notion-template"];
const OUT="/tmp/vs001-site";
const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const ctx=await b.newContext({viewport:{width:1440,height:900}});
for(const r of ROUTES){
  const p=await ctx.newPage();
  await p.goto(BASE+r,{waitUntil:"networkidle"});
  const html=await p.content();
  const rel = r==="/" ? "index.html" : (r.replace(/^\//,"")+".html");
  const f=join(OUT,rel);
  await mkdir(dirname(f),{recursive:true});
  await writeFile(f,html,"utf8");
  await p.close();
}
await b.close();
console.log("snapshotted", ROUTES.length);
