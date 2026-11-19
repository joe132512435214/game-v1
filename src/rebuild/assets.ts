/** Approved v2 pixel-art assets extracted from uploaded ZIP by Pages workflow. */
const v2=`${import.meta.env.BASE_URL}world/v2/`;
export const WORLD_ART={
 exterior:v2+'sprites/factory_exterior.png',
 interior:v2+'buildings/factory_interior_roofless.png',
 minePlot:v2+'buildings/mine_plot_empty.png',
 mineBuilt:v2+'sprites/mine_unbuilt.png',
 starterMachines:`${import.meta.env.BASE_URL}world/starter-machines.png`,
 grass:v2+'terrain/grass.png',
 dirt:v2+'terrain/dirt.png',
 concrete:v2+'terrain/concrete.png',
 road:v2+'terrain/road.png',
 tree:v2+'sprites/tree_broadleaf.png',
 pine:v2+'sprites/tree_pine.png',
 forklift:v2+'sprites/forklift.png',
 gate:v2+'sprites/factory_gate.png',
 crate:v2+'sprites/wooden_crate.png',
 fence:v2+'sprites/fence_straight.png',
 bench:v2+'sprites/bench.png',
 mineBlueprint:v2+'buildings/mine_blueprint_overlay.png'
} as const;
export type WorldArt=keyof typeof WORLD_ART;
export const ART_RULES='Use approved v2 art; preserve pixel edges; unbuilt mine first; roofless factory interior.';
