/** Central asset registry: legacy references remain only until the approved v2 files are installed. */
export const WORLD_ART={
 exterior:`${import.meta.env.BASE_URL}world/factory-exterior.svg`,
 interior:`${import.meta.env.BASE_URL}world/factory-interior.svg`,
 minePlot:`${import.meta.env.BASE_URL}world/mine-plot.svg`,
 mineBuilt:`${import.meta.env.BASE_URL}world/mine-built.svg`,
 starterMachines:`${import.meta.env.BASE_URL}world/starter-machines.png`
} as const;
export type WorldArt=keyof typeof WORLD_ART;
export const ART_RULES='Only the approved newer graphics may replace these temporary assets.';
