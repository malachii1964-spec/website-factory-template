import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const BASE = "http://localhost:4399";
for (const [name, vp, mobile] of [["desktop",{width:1440,height:900},false],["mobile",{width:375,height:812},true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(BASE+"/", { waitUntil: "networkidle" });
  const r = await p.evaluate(() => {
    const out = {docWidth: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight};
    const svg = document.querySelector('svg.root-line');
    const wrap = svg.closest('div');
    const cs = getComputedStyle(wrap);
    const wb = wrap.getBoundingClientRect();
    out.wrap = {pos: cs.position, x: +wb.x.toFixed(1), w: +wb.width.toFixed(1), h: +wb.height.toFixed(1), overflow: getComputedStyle(svg).overflow};
    out.trunk = (() => { const t = svg.querySelector('[data-branch="trunk"]'); const bb=t.getBoundingClientRect(); return {x:+bb.x.toFixed(1), w:+bb.width.toFixed(1), y:+bb.y.toFixed(1), h:+bb.height.toFixed(1), dash:getComputedStyle(t).strokeDashoffset, anim:getComputedStyle(t).animationName, dur:getComputedStyle(t).animationDuration, tl:getComputedStyle(t).animationTimeline}; })();
    // season rule geometry
    const fig = [...document.querySelectorAll('figure')][0];
    const marker = fig.querySelector('.w-px.bg-ember');
    const firstLi = fig.querySelector('ul li');
    const labelSpan = firstLi.children[0];
    const trackSpan = firstLi.children[1];
    const barSpan = trackSpan.firstElementChild;
    const g = e => { const bb = e.getBoundingClientRect(); return {x:+bb.x.toFixed(1), w:+bb.width.toFixed(1), right:+bb.right.toFixed(1)}; };
    out.season = {marker: g(marker), label: g(labelSpan), track: g(trackSpan), firstBar: g(barSpan),
      markerLeftStyle: marker.style.left,
      expectedX: +(trackSpan.getBoundingClientRect().x + parseFloat(marker.style.left)/100*trackSpan.getBoundingClientRect().width).toFixed(1)};
    const sc = fig.querySelector('.overflow-x-auto');
    out.scroller = {clientW: sc.clientWidth, scrollW: sc.scrollWidth};
    return out;
  });
  console.log(name, JSON.stringify(r,null,1));
  await ctx.close();
}
await b.close();
