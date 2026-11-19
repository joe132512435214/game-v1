/** Standalone, deterministic movement and collision core for Ore & Order 2.0. */
export type Vector={x:number;y:number};
export type Rectangle={x:number;y:number;width:number;height:number};
export type Direction='up'|'down'|'left'|'right';
export type Player={position:Vector;facing:Direction};
export type World={width:number;height:number;obstacles:Rectangle[]};
export const PLAYER_RADIUS=9;
export const PLAYER_SPEED=130;
export function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n));}
export function overlapsCircleRect(p:Vector,r:number,b:Rectangle){
 const x=clamp(p.x,b.x,b.x+b.width),y=clamp(p.y,b.y,b.y+b.height);
 return (p.x-x)**2+(p.y-y)**2<r*r;
}
export function walkable(p:Vector,w:World,r=PLAYER_RADIUS){
 return p.x>=r&&p.y>=r&&p.x<=w.width-r&&p.y<=w.height-r&&!w.obstacles.some(b=>overlapsCircleRect(p,r,b));
}
export function movePlayer(player:Player,input:Vector,dt:number,world:World):Player{
 const length=Math.hypot(input.x,input.y);
 if(length<0.001||dt<=0)return player;
 const delta=PLAYER_SPEED*Math.min(dt,0.05)*Math.min(1,length);
 const dx=input.x/length*delta,dy=input.y/length*delta;
 let position={...player.position};
 // Axis-separated resolution lets players slide along walls.
 if(walkable({...position,x:position.x+dx},world))position.x+=dx;
 if(walkable({...position,y:position.y+dy},world))position.y+=dy;
 const facing:Direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
 return {...player,position,facing};
}
export function cameraFor(player:Vector,viewport:Vector,world:World):Vector{
 return {x:clamp(player.x-viewport.x/2,0,Math.max(0,world.width-viewport.x)),
 y:clamp(player.y-viewport.y/2,0,Math.max(0,world.height-viewport.y))};
}
export function withinReach(a:Vector,b:Vector,distance=55){return Math.hypot(a.x-b.x,a.y-b.y)<=distance;}
export const STARTER_WORLD:World={width:1024,height:768,obstacles:[
 {x:100,y:90,width:570,height:330}, // factory footprint, entrance handled by a separate scene
 {x:760,y:150,width:175,height:190}, // mine plot
 {x:20,y:20,width:984,height:16},
 {x:20,y:20,width:16,height:680},
 {x:988,y:20,width:16,height:680}
]};
export const FACTORY_INTERIOR:World={width:1024,height:768,obstacles:[
 {x:110,y:90,width:804,height:20},{x:110,y:90,width:20,height:580},
 {x:894,y:90,width:20,height:580},{x:110,y:650,width:804,height:20},
 {x:290,y:110,width:20,height:290}, // office wall
 {x:130,y:125,width:125,height:95}, // office desk
 {x:380,y:160,width:150,height:130}, // machine bay one
 {x:550,y:160,width:150,height:130}, // machine bay two
 {x:720,y:160,width:150,height:130} // machine bay three
]};
