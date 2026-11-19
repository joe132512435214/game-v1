/** Central asset registry: reuse existing art instead of generating replacements. */
export const WORLD_ART={
 exterior:`${import.meta.env.BASE_URL}world/factory-exterior.svg`,
 interior:`${import.meta.env.BASE_URL}world/factory-interior.svg`,
 minePlot:`${import.meta.env.BASE_URL}world/mine-plot.svg`,
 mineBuilt:`${import.meta.env.BASE_URL}world/mine-built.svg`,
 starterMachines:`${import.meta.env.BASE_URL}world/starter-machines.png`
} as const;
export type WorldArt=keyof typeof WORLD_ART;
export const ART_RULES='Keep original pixel-art assets at their native proportions; nearest-neighbour scaling; no blur or AI-style replacements.';
