/** Central asset registry: reuse existing art instead of generating replacements. */
export const WORLD_ART={
 exterior:'/world/factory-exterior.svg',
 interior:'/world/factory-interior.svg',
 minePlot:'/world/mine-plot.svg',
 mineBuilt:'/world/mine-built.svg'
} as const;
export type WorldArt=keyof typeof WORLD_ART;
export const ART_RULES='Keep original pixel-art assets at their native proportions; nearest-neighbour scaling; no blur or AI-style replacements.';
