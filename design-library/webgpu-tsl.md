# REFERENCE: HIGH-END VISUAL TECH (WebGPU / TSL / R3F)
Load ONLY when the winning concept genuinely calls for 3D, shaders, or immersive motion. Design Discipline outranks everything here — an effect that doesn't serve the concept gets cut, no matter how impressive.

## STACK
- React + TypeScript (Vite or Next.js) · Framer Motion for UI interaction
- Three.js WebGPURenderer via React Three Fiber for 3D scenes
- TSL (Three Shading Language) node materials — write once, compiles to WGSL (WebGPU) and falls back to GLSL (WebGL) automatically
- Post-processing through the node pipeline, not legacy EffectComposer

## NON-NEGOTIABLE RULES
1. WebGPU is an ENHANCEMENT, never the baseline. Feature-detect; WebGL fallback always; the page's core purpose must survive total graphics failure (semantic HTML underneath).
2. Every shader traces to the material/sensation brief. "Living soil" justifies organic noise displacement; nothing justifies decoration.
3. Subtle beats loud. Heavy bloom, constant particles, and permanent morphing read as AI gloss — the exact look the factory exists to avoid.
4. prefers-reduced-motion always respected: static or near-static alternative required.
5. Budget for mid-range phones: test first-frame shader compile cost; lazy-load heavy scenes; cap particle counts on mobile.
6. Shadows are deliberate: one well-tuned directional light for most scenes (tight frustum, tune normalBias first). CSM (CSMShadowNode on WebGPU) only for large spatial scenes. Pure graphic/emissive concepts may correctly have NO shadows.

## TECHNIQUE MAP (concept → tool)
- Organic/living surfaces → TSL noise (mx_noise_float) driving positionNode + roughnessNode
- Luxury materials → MeshPhysicalNodeMaterial: transmission, thickness, fresnel edge emission
- Physical micro-interaction → cursor/scroll-driven uniforms with smoothstep falloff; spring physics, never linear
- Depth/cinema → layered parallax, controlled DoF, ONE restrained post effect maximum
- Dense fields (only if the signature interaction demands it) → GPU compute particles, instanced, mobile-capped

## VALIDATION EXTRAS FOR VISUAL-TIER BUILDS
- Test on: Chrome desktop, Safari (macOS + iOS), one Android device — shadows and samplers behave differently per platform
- Verify WebGL fallback path actually renders, not just "doesn't crash"
- Measure: first contentful paint, first-frame time with shaders, memory on mobile
- Confirm reduced-motion path and keyboard navigation still work inside/around the canvas
