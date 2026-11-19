import { useState } from 'react';
type Unit={id:string;name:string;count:number;output:number;capacity:number;broken:number;image:string};
type Props={units:Unit[];running:boolean;onSelect:(id:string)=>void;onBuild:()=>void};
const COLS=8,ROWS=6,TILE_W=100,TILE_H=52,ORIGIN_X=500,ORIGIN_Y=72;
const point=(col:number,row:number)=>({x:ORIGIN_X+(col-row)*TILE_W/2,y:ORIGIN_Y+(col+row)*TILE_H/2});
const diamond=(col:number,row:number)=>{const p=point(col,row);return `${p.x},${p.y} ${p.x+50},${p.y+26} ${p.x},${p.y+52} ${p.x-50},${p.y+26}`;};
const placements=[[1,1],[3,1],[5,1],[7,1],[1,4],[3,4],[5,4],[7,4],[2,2],[4,2],[6,2]] as const;
export function IsometricFactory({units,running,onSelect,onBuild}:Props){
 const [zoom,setZoom]=useState(1);
 const [selected,setSelected]=useState<string|null>(null);
 const [offset,setOffset]=useState({x:0,y:0});
 const [drag,setDrag]=useState<{x:number;y:number;ox:number;oy:number}|null>(null);
 const visible=units.slice(0,placements.length);
 const selectedUnit=visible.find(m=>m.id===selected);
 const totalOutput=visible.reduce((sum,m)=>sum+(running?m.output:0),0);
 const faults=visible.reduce((sum,m)=>sum+m.broken,0);
 const beltRunning=running&&visible.some(m=>m.output>0&&m.broken<m.count);
 const tiles=Array.from({length:COLS*ROWS},(_,i)=>({col:i%COLS,row:Math.floor(i/COLS)}));
 const beltPath=[point(0,2),point(1,2),point(2,2),point(3,2),point(4,2),point(5,2),point(6,2),point(7,2)];
 const path=beltPath.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y+26}`).join(' ');
 return <section className="iso-panel" aria-label="Isometric factory prototype">
  <div className="iso-toolbar"><div><span className="eyebrow">FACTORY FLOOR · ISOMETRIC PROTOTYPE</span><h2>Your factory</h2><p>Drag to pan · zoom to explore · select machinery</p></div><div className="iso-controls"><button type="button" onClick={()=>setZoom(v=>Math.max(.65,+(v-.15).toFixed(2)))} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(v=>Math.min(1.6,+(v+.15).toFixed(2)))} aria-label="Zoom in">+</button><button type="button" onClick={()=>{setZoom(1);setOffset({x:0,y:0});}}>RESET</button></div></div>
  <div className="iso-viewport" onPointerDown={e=>{if((e.target as Element).closest('button'))return;e.currentTarget.setPointerCapture(e.pointerId);setDrag({x:e.clientX,y:e.clientY,ox:offset.x,oy:offset.y});}} onPointerMove={e=>{if(drag)setOffset({x:drag.ox+e.clientX-drag.x,y:drag.oy+e.clientY-drag.y});}} onPointerUp={()=>setDrag(null)} onPointerCancel={()=>setDrag(null)} style={{cursor:drag?'grabbing':'grab'}}>
   <div className="iso-world" style={{transform:`translate(calc(-50% + ${offset.x}px),calc(-50% + ${offset.y}px)) scale(${zoom})`}}>
    <svg className="iso-ground" viewBox="0 0 1000 520" role="img" aria-label="Isometric tiled industrial factory floor with conveyor route">
     <defs><linearGradient id="iso-slab" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#506e63"/><stop offset="1" stopColor="#283e3e"/></linearGradient><pattern id="iso-stripe" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M-5 5L5 -5M0 18L18 0M13 23L23 13" stroke="#d5a34c" strokeWidth="5"/></pattern></defs>
     <ellipse cx="500" cy="330" rx="405" ry="170" fill="#06181b" opacity=".55"/>
     {tiles.map(({col,row})=><g key={col+'-'+row}><polygon points={diamond(col,row)} transform="translate(0 14)" fill="#142d31" stroke="#0c2328" strokeWidth="2"/><polygon points={diamond(col,row)} fill={((col+row)%2===0)?'url(#iso-slab)':'#38574f'} stroke="#6a8677" strokeWidth="1.2"/><path d={`M${point(col,row).x-42} ${point(col,row).y+26}l42 21 42 -21`} fill="none" stroke="#789387" opacity=".16"/></g>)}
     <path d={path} fill="none" stroke="#142c30" strokeWidth="37" strokeLinejoin="round"/><path d={path} fill="none" stroke="#bc9556" strokeWidth="32" strokeLinejoin="round"/><path d={path} fill="none" stroke="#263c3e" strokeWidth="25" strokeLinejoin="round"/>
     <path d={path} fill="none" stroke="#78938a" strokeWidth="18" strokeDasharray="10 11" className={beltRunning?'iso-track-active':''}/>
     {beltPath.slice(1,-1).map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y+26})`}><ellipse rx="6" ry="4" fill="#e0a54f" opacity={beltRunning?.85:.35}/></g>)}
     <g opacity=".8"><path d="M240 210v-45m-9 10 9 -10 9 10" fill="none" stroke="#c2a56b" strokeWidth="4"/><path d="M680 350v-48m-9 10 9 -10 9 10" fill="none" stroke="#c2a56b" strokeWidth="4"/><rect x="420" y="408" width="75" height="21" rx="3" fill="#193439" stroke="#c2a56b"/><text x="457" y="422" textAnchor="middle" fill="#f0d5a2" fontSize="10" fontWeight="700">ORE & ORDER</text></g>
     <path d="M150 410l70 36 70 -36" fill="none" stroke="url(#iso-stripe)" strokeWidth="9" opacity=".8"/>
    </svg>
    {visible.map((m,i)=>{const [col,row]=placements[i];const p=point(col,row);const active=running&&m.broken<m.count&&m.output>0;return <button type="button" key={m.id} className={'iso-building '+(active?'is-working':'is-idle')+(selected===m.id?' is-selected':'')} style={{left:p.x,top:p.y+14}} onClick={()=>setSelected(v=>v===m.id?null:m.id)} aria-pressed={selected===m.id} aria-label={'Manage '+m.name}><span className="iso-building-shadow"/><span className="iso-building-roof"><img src={m.image} alt="" draggable={false}/><span className="iso-building-indicator"/></span><span className="iso-building-front"/><span className="iso-building-side"/><span className="iso-building-label"><b>{m.name}</b><small>{m.broken>=m.count?'BROKEN':!running?'PAUSED':m.output<=0?'NO INPUT':m.output.toFixed(2)+'/sec'}</small></span></button>})}
   </div>
  </div>
  <div className="iso-hud"><span><b>{visible.length}</b> MACHINE TYPES</span><span><b>{totalOutput.toFixed(2)}</b> UNITS/SEC</span><span className={faults?'iso-hud-warning':''}><b>{faults}</b> FAULTS</span></div>
  {selectedUnit&&<div className="iso-inspector"><img src={selectedUnit.image} alt=""/><div><strong>{selectedUnit.name}</strong><span>{selectedUnit.count} installed · {selectedUnit.output.toFixed(2)} units/sec · {selectedUnit.broken} faults</span><div className="iso-inspector-meter"><i style={{width:(selectedUnit.capacity>0?Math.min(100,Math.max(0,selectedUnit.output/selectedUnit.capacity*100)):0)+'%'}}/></div></div><button type="button" onClick={()=>onSelect(selectedUnit.id)}>MANAGE</button><button type="button" aria-label="Close machine details" onClick={()=>setSelected(null)}>×</button></div>}
  <div className="iso-footer"><span>Visual layout preview · conveyors do not yet represent physical item routing</span><button type="button" onClick={onBuild}>ALL MACHINES</button></div>
 </section>;
}
