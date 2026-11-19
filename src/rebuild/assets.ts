/** New-generation Ore & Order pixel-art pack. No legacy texture references. */
const root=`${import.meta.env.BASE_URL}world/v2/`;
export const WORLD_ART={
 exterior:root+'sprites/factory_exterior.png',
 interior:root+'buildings/factory_interior_roofless.png',
 minePlot:root+'buildings/mine_plot_empty.png',
 mineUnbuilt:root+'sprites/mine_unbuilt.png',
 mineBlueprint:root+'buildings/mine_blueprint_overlay.png',
 grass:root+'terrain/grass.png',
 gravel:root+'terrain/gravel.png',
 concrete:root+'terrain/concrete.png',
 fence:root+'sprites/fence_straight.png',
 tree:root+'sprites/tree_broadleaf.png',
 forklift:root+'sprites/forklift.png',
 gate:root+'sprites/factory_gate.png',
 lightOff:root+'variants/lamp_off.png',
} as const;
export type WorldArt=keyof typeof WORLD_ART;
export const ART_RULES='Only approved new-generation pixel art; native proportions; nearest-neighbour scaling; mine initially unbuilt.';
