# Glyph Factory 3D Asset Gallery

This static surface prototypes the interaction language for the next visual direction of Glyph Factory.

- 16 interactive assets share one registry in `asset-registry.js`.
- Every asset points to the current Acts Engine v3 Aha moment where it first becomes meaningful.
- Six Flow Screens cover ACT I through ACT VI.
- The Three.js stage is procedural. No GLB files or baked screenshots are required.
- Click or press Enter/Space on the 3D stage to run the selected asset action. Drag to rotate.

Run `npm run verify:asset-gallery` to check registry integrity against `public/glyph-engine-v3.js`.

## Concept Atelier

Open [concepts/ui.html](concepts/ui.html) for 18 individual AI-generated concept sheets, each with three views of one asset. All 16 existing assets have polished directions; Semantic Compressor and Quiet Switch are two additional proposals. These drawings are modeling references, not newly implemented meshes.

The paired [concepts/ui.md](concepts/ui.md) explains the source HTML/Markdown pairs, game discoveries, art direction, and modeling handoff. Original PNGs, exact prompts, source registry snapshot, and a SHA-256 manifest are versioned in `concepts/v1/`. Run `node scripts/verify-concepts.mjs` to validate asset coverage and byte integrity. The concept atelier remains separate from the production player build.
