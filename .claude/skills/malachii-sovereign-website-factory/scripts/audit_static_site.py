#!/usr/bin/env python3
from __future__ import annotations
import json, re, sys
from html.parser import HTMLParser
from pathlib import Path

class PageAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang=None; self.title_depth=0; self.title_text=""; self.charset=False; self.viewport=None; self.description=False
        self.mains=0; self.h1=0; self.images=[]; self.anchors=[]; self.inputs=[]; self.labels_for=set(); self.ids=set(); self.scripts=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=="html": self.lang=a.get("lang")
        elif tag=="title": self.title_depth += 1
        elif tag=="meta":
            if a.get("charset"): self.charset=True
            if a.get("name","").lower()=="viewport": self.viewport=a.get("content","")
            if a.get("name","").lower()=="description" and (a.get("content") or "").strip(): self.description=True
        elif tag=="main": self.mains += 1
        elif tag=="h1": self.h1 += 1
        elif tag=="img": self.images.append(a)
        elif tag=="a": self.anchors.append(a)
        elif tag=="input": self.inputs.append(a)
        elif tag=="label" and a.get("for"): self.labels_for.add(a["for"])
        elif tag=="script": self.scripts.append(a)
        if a.get("id"): self.ids.add(a["id"])
    def handle_endtag(self,tag):
        if tag=="title" and self.title_depth: self.title_depth -= 1
    def handle_data(self,data):
        if self.title_depth: self.title_text += data

def audit_page(path: Path):
    p=PageAudit(); text=path.read_text(encoding="utf-8",errors="replace"); p.feed(text)
    errors=[]; warnings=[]
    if not p.lang: errors.append("html element missing lang")
    if not p.charset: errors.append("missing meta charset")
    if not p.viewport: errors.append("missing viewport meta")
    elif re.search(r"user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\.0+)?(?:,|$)", p.viewport, re.I): errors.append("viewport disables/restricts zoom")
    if not p.title_text.strip(): errors.append("missing/non-empty title")
    if not p.description: warnings.append("missing meta description")
    if p.mains != 1: errors.append(f"expected exactly one main landmark; found {p.mains}")
    if p.h1 < 1: errors.append("missing h1")
    for i,img in enumerate(p.images,1):
        if "alt" not in img: errors.append(f"image {i} missing alt attribute")
        src=img.get("src","")
        if src.startswith("http://"): errors.append(f"image {i} uses insecure http source")
    skip=False
    for a in p.anchors:
        href=a.get("href","")
        if href.startswith("#") and href[1:] in p.ids and href[1:].lower().startswith("main"): skip=True
        if a.get("target")=="_blank" and "noopener" not in (a.get("rel","") or "").split(): warnings.append("target=_blank link lacks rel=noopener")
        if href.startswith("http://"): warnings.append("link uses insecure http URL")
    if not skip: warnings.append("no in-page skip link to main landmark detected")
    for i,inp in enumerate(p.inputs,1):
        typ=(inp.get("type") or "text").lower()
        if typ in {"hidden","submit","button","reset","image"}: continue
        iid=inp.get("id")
        named=bool(inp.get("aria-label") or inp.get("aria-labelledby") or (iid and iid in p.labels_for))
        if not named: errors.append(f"form input {i} lacks programmatic label")
    for i,s in enumerate(p.scripts,1):
        if (s.get("src") or "").startswith("http://"): errors.append(f"script {i} uses insecure http source")
    if re.search(r"on(?:click|load|error|mouseover|focus)\s*=", text, re.I): warnings.append("inline event handler detected; review CSP/maintainability")
    return {"page":str(path),"status":"PASS" if not errors else "FAIL","errors":errors,"warnings":warnings}

def audit(root: Path):
    html=sorted(root.rglob("*.html"))
    if not html: return {"status":"FAIL","errors":["no HTML files found"],"pages":[]}
    pages=[audit_page(p) for p in html]
    errors=[]
    if (root/"site-profile.json").exists():
        try:
            profile=json.loads((root/"site-profile.json").read_text())
            if profile.get("indexable"):
                if not (root/"robots.txt").exists(): errors.append("indexable site missing robots.txt")
                if not (root/"sitemap.xml").exists(): errors.append("indexable site missing sitemap.xml")
        except Exception as e: errors.append(f"invalid site-profile.json: {e}")
    css="\n".join(p.read_text(encoding="utf-8",errors="replace") for p in root.rglob("*.css"))
    if ("animation" in css or "transition" in css) and "prefers-reduced-motion" not in css:
        errors.append("motion/transition CSS present without prefers-reduced-motion handling")
    if re.search(r"outline\s*:\s*(?:0|none)",css,re.I) and ":focus" not in css and ":focus-visible" not in css:
        errors.append("outline removed without detectable focus replacement")
    status="PASS" if not errors and all(p["status"]=="PASS" for p in pages) else "FAIL"
    return {"status":status,"root":str(root),"errors":errors,"pages":pages,"scopeNote":"Structural static audit only; does not certify WCAG, Core Web Vitals, ASVS, legal compliance, or deployed behavior."}

def main():
    if len(sys.argv)!=2:
        print("usage: audit_static_site.py <site-root>",file=sys.stderr); return 2
    report=audit(Path(sys.argv[1]).resolve())
    print(json.dumps(report,indent=2))
    return 0 if report["status"]=="PASS" else 1

if __name__=="__main__": raise SystemExit(main())
