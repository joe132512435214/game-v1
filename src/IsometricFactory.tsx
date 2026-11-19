import { useState } from 'react';
type Unit={id:string;name:string;count:number;output:number;capacity:number;broken:number;image:string};
type Props={units:Unit[];running:boolean;onSelect:(id:string)=>void;onBuild:()=>void};
export function IsometricFactory({units,running,onSelect,onBuild}:Props){
  const [zoom,setZoom]=useState(1);
  const visible=units.slice(0,8);
  return <section className="iso-panel" aria-label="Isometric factory prototype">
    <div className="iso-toolbar"><div><span className="eyebrow">FACTORY FLOOR · VISUAL PREVIEW</span><h2>Production in motion</h2><p>Live machine output · select a machine to manage it</p></div><div className="iso-controls"><button type="button" onClick={()=>setZoom(v=>Math.max(.7,Math.round((v-.15)*100)/100))} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button type="button" onClick={()=>setZoom(v=>Math.min(1.4,Math.round((v+.15)*100)/100))} aria-label="Zoom in">+</button></div></div>
    <div className="iso-viewport"><div className="iso-scene" style={{transform:`scale(${zoom})`}}><div className="iso-floor"/><div className={'iso-belt '+(running?'is-moving':'')} aria-hidden="true"><span/><span/><span/><span/><span/></div>
      {visible.map((m,i)=>{const working=m.count-m.broken;const active=running&&working>0&&m.output>0;const x=13+(i%4)*24;const y=25+Math.floor(i/4)*38;return <button key={m.id} type="button" className={'iso-unit '+(active?'is-working':'is-idle')} style={{left:x+'%',top:y+'%'}} onClick={()=>onSelect(m.id)} aria-label={'Manage '+m.name}>
        <span className="iso-machine-shadow"/><span className="iso-machine-body"><img src={m.image} alt="" draggable={false}/><span className="iso-machine-light"/></span><span className="iso-machine-label"><strong>{m.name}</strong><small>{m.broken>=m.count?'BROKEN':!running?'PAUSED':m.output<=0?'NO INPUT':m.output.toFixed(2)+'/sec'}</small></span>
      </button>})}
    </div></div>
    <div className="iso-footer"><span>{visible.length} machine types shown · {running?'Factory active':'Production paused'}</span><button type="button" onClick={onBuild}>MANAGE MACHINES</button></div>
  </section>;
}
