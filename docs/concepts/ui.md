# Glyph Factory — concept atelier

Designer review material · 2026-09-18 · version 1

## Deliverable and scope

18 AI-generated 2D concept sheets: all 16 existing gallery assets receive a polished modeling direction, plus two proposed late-game machines. Each image contains one asset identity in front, right-side, and rear three-quarter views. These are illustrative turnarounds, not orthographic CAD, finished meshes, GLB exports, or screenshots of implemented game art. A modeler must reconcile any cross-view discrepancies before building geometry.

The matching visual document is [ui.html](ui.html). Originals and exact generation prompts live in [v1/](v1/); [manifest.json](v1/manifest.json) records provenance, source mapping, sizes and SHA-256 hashes. Original PNGs are retained without recompression.

## Existing HTML / Markdown pairs examined

No tracked files named `ui.html` or `ui.md` existed in the fetched repository branches at the start of this work. This pair is newly authored, not a recovered historical document.

| Existing HTML | Corresponding Markdown / data | What it establishes |
| --- | --- | --- |
| `docs/index.html` | `docs/README.md`, `docs/asset-registry.js` | 16 procedural 3D assets, six world states, specialist roles and interactions |
| `public/intent.html` | `docs/design/aha-moments-internal.zh-CN.md`, `docs/development/aha-spoiler-boundary.md` | Discovery must happen through action; internal Aha explanations stay outside the player UI |
| `public/preview.html` | `docs/superpowers/specs/2026-09-16-acts-engine-v3-design.md` | Six-act internal review and progression intent |
| `public/play.html` | `README.md`, `docs/development/player-language-policy.zh-CN.md` | Player economy and world-language boundary; current engine/controller remain the behavior authority |

Gallery source: `feat/3d-asset-gallery` at `d164ffde13e024ebaa3bae178b0533d1628a0cc0`. Engine Aha IDs and titles were read directly from `public/glyph-engine-v3.js`. The gallery is a procedural Three.js prototype; its canvas fallback is a simplified drawing, not an equivalent 3D model.

## What the project is really asking its art to do

Glyph Factory begins as manual glyph production, selling and automation. Its deeper structure repeatedly changes the player's verb: operate → compose → interpret → influence → delegate → compress → stop. This makes a machine's input, transformation and output more important than ornament.

1. **Automation, A01–A02.** Builder and Lever transfer visible labor from the player into the workshop. The hand, grip, pivot and footplate need readable affordances.
2. **Relations and meaning, A03–A11.** Glyph Cube, Connector, Crank and Stamp Machine make combinations physical. Magnifier distinguishes interpretation from counting. Conveyor expresses readership feedback rather than one-way shipping; Annotation Flag brings outside context back into the world.
3. **City and world, A12–A15.** Navigator looks outward; Cartographer organizes what was discovered. Projector Beacon makes concept effects spatial. Their telescope, map and projected globe must not collapse into the same generic glowing orb.
4. **Delegated judgment, A16–A21.** Tower expansion should visibly build structure; Archivist transforms stored records into reusable memory. Human-readable joints, records and access points ground the abstract system.
5. **Machine language, A22–A24.** Insight Crystal represents an unfamiliar glyph; Illuminator reveals its structure. The proposed Semantic Compressor adds a wide-to-narrow silhouette for concentration of meaning, rather than another tower promising more output.
6. **Noise and silence, A25–A28.** The proposed Quiet Switch gives deliberate stopping its own calm affordance. Its disconnected contacts and unlit lamp communicate rest. It is not a larger upgrade or an emergency alarm.

## Shared art direction

- Ivory enamel and paper provide broad quiet surfaces; satin brass identifies moving joints; charcoal gives mechanical depth.
- Amber indicates early manual energy, cyan relations and observation, sage feedback and mapping, violet machine language. Color supports silhouette; it must not be the only way to identify an asset.
- Workers use roughly 2.7-head proportions, simple faces, sturdy boots, and attached tools. Rectangular Builder, vertical Archivist, slim Navigator, loop-equipped Connector, triangular Illuminator and wide-scroll Cartographer remain distinguishable at thumbnail scale.
- Machines expose a small number of meaningful mechanisms. Improve chamfers, material separation, contact shadows, support geometry and service access instead of adding arbitrary gears.
- Glow remains subordinate to shape. Transparent optics and holograms must still be readable against the gallery's dark background.
- A warm paper sheet and repeated three-view layout make the drawings useful for comparison and modeling. Rear views show where straps, shafts, cables and supporting braces actually attach.

## New concepts — proposals, not implemented game objects

| ID | Name | Internal mapping | Modeling and interaction proposal |
| --- | --- | --- | --- |
| `semantic-compressor` | Semantic Compressor / 语义压缩机 | A24, revisited A27 | Broad intake, three shrinking square frames, narrow violet output; frames compress toward output, meaning density increases as volume falls |
| `quiet-switch` | Quiet Switch / 静默总闸 | A28 | One weighted disconnect bridge with visible open contacts; the operator opens it once, machine movement and light settle |

These proposals do not change progression, cost, save state or the existing 16-entry interactive registry. Adding playable meshes and mechanics is a subsequent implementation step.

## UI behavior

`ui.html` is a standalone art review page with no third-party dependency. It has a large readable opening sheet, asset navigation, a searchable 18-sheet collection, category filters, and direct original PNG links. Hash navigation identifies a sheet. Selection and filtering are keyboard operable; no asset is auto-rotated or animated. At narrow widths the page uses one column and preserves access to the full image.

The existing gallery links to the atelier; each existing asset offers its matching sheet from the stage. The atelier is explicitly labeled **designer review / spoilers**. It is not added to the production player's allowlisted `dist/` build.

## Modeling handoff

Use the PNG as visual direction and the registry as the behavior contract. Establish scale from the existing procedural asset, place the pivot at the functional hinge/shaft, and keep animation parts separate. Retain one broad primary shape, one recognizable tool/mechanism and restrained emissive areas. Test each asset at a small on-screen size, front and back, with glow disabled. For transparent or asymmetric components, agree a final model topology rather than treating generated pixels as exact engineering dimensions.

## Provenance and revision policy

Generated with the built-in image-gen tool from repository-informed written prompts. No existing raster artwork was edited. The source mesh descriptions informed the concepts; these are new illustrations. The exact per-asset prompt is preserved. Version 1 originals are immutable: future approved changes receive a new version directory, never silently replace historical images. SHA-256 hashes verify delivery bytes, not authorship or visual consistency.
