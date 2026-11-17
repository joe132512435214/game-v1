# Ore & Order — Mandatory Art Direction

These rules apply to **every machine illustration, tier variant, animation frame, image asset, sprite, and machine-related UI graphic** in this repository. They override any generic art-generation style suggestions.

## Non-negotiable visual style
- Match the **original Ore & Order reference sheet** supplied by the project owner: Rockbreaker Mine, Copper Mine, Smelter, and Copper Smelter shown in Basic / Advanced / Master tiers.
- Use **genuine, crisp, intentionally gridded 2D pixel art** with consistent pixel scale, clean hard-edged outlines, and compact side-on machinery.
- Palette: **dark teal background, charcoal/steel-grey machinery, orange industrial lighting, yellow safety rails**, restrained copper highlights.
- Machines must have clear readable silhouettes, recognisable functional components, and believable mechanical connections.
- Basic, Advanced, and Master must remain **the same recognisable machine**, increasing in complexity and equipment rather than changing to an unrelated design.
- Design each machine **individually**, at high resolution suitable for its game card, with full equipment visible and ample safe margins. Preserve the original game's cohesive look.

## Explicitly prohibited
- No glossy 3D or pseudo-3D renders, photorealism, painterly concept art, cinematic lighting, soft anti-aliased illustration, or over-rendered metallic gradients.
- No generic futuristic factory posters, glossy industrial infographic panels, or art that looks from another game.
- No cropping gameplay sprites from labelled three-tier posters, no stretching tiny source images, and no mixed art styles.
- No changing the visual direction without explicit user approval.

## Workflow / release gates
1. Work on **one named machine at a time**. Produce Basic, Advanced, and Master as separate, usable game assets (a comparison preview is not a substitute).
2. Compare each tier against the **original reference** for palette, pixel scale, silhouette, positioning, and mechanical continuity.
3. Check actual game-card framing: machinery fully visible, no clipping, distortion, blurry scaling, overlapping labels, or unrelated machine.
4. Keep **only Basic playable** until upgrade gameplay is explicitly enabled; retain Advanced and Master assets for later.
5. Do not overwrite a good live asset with an unapproved or mismatched render. Do not merge or deploy until the new artwork passes the above checks.
6. When deploying, verify the GitHub commit, build, and Cloudflare live result separately. Never call an asset 'live' based only on a source commit.
7. When the user requests the entire collection, continue through the game's actual machine roster one machine at a time, not unrelated invented machines.

**Highest priority:** Pixel-art style fidelity to the original reference takes precedence over realism, complexity, speed, or novelty.
