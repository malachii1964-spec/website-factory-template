# Pack — Immersive 3D

## Activate when

3D materially improves product understanding, spatial navigation, data comprehension, story, or distinctive brand experience. “It looks futuristic” alone is insufficient.

## Contract

- user value and location in the journey;
- direct Three.js versus React Three Fiber decision;
- one scene/canvas lifecycle owner;
- asset/model/texture/lighting/post-processing/particle budgets;
- target devices and frame-time/memory measures;
- input model for pointer/touch/keyboard;
- poster, semantic explanation, reduced-motion/static, unsupported/context-loss fallbacks;
- loading/error/cleanup behavior and analytics question.

## Implementation rules

- critical content and CTA are DOM, not canvas-only;
- lazy-load after baseline, near viewport or intent;
- reuse/instance/merge, compress assets, cap/adapt DPR and effects;
- avoid React state in frame loops; pause hidden/background work; demand-render when possible;
- explicit disposal for geometry, material, texture, render target, controls/listeners;
- no unbounded physics/particles or permanent GPU loop on invisible routes;
- test context loss and repeated route cycles.

## Exit evidence

Baseline works without 3D; target-device profile meets budget or degrades predictably; reduced/unsupported modes work; input and semantic alternatives work; memory/resource cleanup is stable; asset license/provenance is approved.

