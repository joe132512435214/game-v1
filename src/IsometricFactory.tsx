import { useState } from 'react';
type Unit={id:string;name:string;count:number;output:number;capacity:number;broken:number;image:string};
type Props={units:Unit[];running:boolean;onSelect:(id:string)=>void;onBuild:()=>void};
export function IsometricFactory({units,running,onSelect,onBuild}:Props){
 const [selected,setSelected]=useState<string|null>(null);
 const [showAll,setShowAll]=useState(false);
 const visible=showAll?units:units.slice(0,5);
 const selectedUnit=units.find(m=>m.id===selected);
 const totalOutput=units.reduce((sum,m)=>sum+(running?m.output:0),0);
 const faults=units.reduce((sum,m)=>sum+m.broken,0);
 const active=running&&units.some(m=>m.output>0&&m.count>m.broken);
 return <section className="clicker-factory" aria-label="2D factory production floor">
  <div className="clicker-head"><div><span className="clicker-eyebrow">ORE & ORDER · FACTORY FLOOR</span><h2>Production line</h2><p>Watch your machines work. Tap any machine to manage it.</p></div><div className="clicker-summary"><span><b>{totalOutput.toFixed(2)}</b> units/sec</span><span className={faults?'clicker-alert':''}><b>{faults}</b> faults</span></div></div>
  <div className="clicker-stage">
   <div className="clicker-background" aria-hidden="true"><div className="clicker-beams"/><div className="clicker-pipes"/><div className="clicker-windows"/></div>
   <div className="clicker-line">{visible.map((m,i)=>{const working=running&&m.count>m.broken&&m.output>0;const status=m.broken>=m.count?'BROKEN':!running?'PAUSED':m.output<=0?'NO INPUT':'RUNNING';return <div className="clicker-station" key={m.id}>
     <button type="button" className={'clicker-machine '+(selected===m.id?'is-selected ':'')+(working?'is-active':'is-idle')} aria-pressed={selected===m.id} onClick={()=>setSelected(v=>v===m.id?null:m.id)} aria-label={'Inspect '+m.name}>
      <span className="clicker-machine-housing"><span className="clicker-machine-light"/><img src={m.image} alt="" draggable={false}/><span className="clicker-machine-feet"/></span>
      <span className="clicker-machine-title">{m.name}</span><span className="clicker-machine-status">{status} · {m.output.toFixed(2)}/sec</span><span className="clicker-machine-count">×{m.count} INSTALLED</span>
     </button>
     {i<visible.length-1&&<div className={'clicker-link '+(active?'is-moving':'')} aria-hidden="true"><span>▰</span><span>▰</span><span>▰</span></div>}
    </div>})}</div>
   {visible.length===0&&<div className="clicker-empty"><strong>Your factory is empty</strong><p>Buy your first machine to start production.</p><button type="button" onClick={onBuild}>BUY FIRST MACHINE</button></div>}
   <div className="clicker-floor" aria-hidden="true"/>
  </div>
  {selectedUnit&&<div className="clicker-inspector"><img src={selectedUnit.image} alt=""/><div className="clicker-inspector-details"><strong>{selectedUnit.name}</strong><span>{selectedUnit.count} installed · {selectedUnit.broken} broken · {selectedUnit.output.toFixed(2)} units/sec</span><div className="clicker-meter"><i style={{width:(selectedUnit.capacity>0?Math.min(100,Math.max(0,selectedUnit.output/selectedUnit.capacity*100)):0)+'%'}}/></div></div><button type="button" onClick={()=>onSelect(selectedUnit.id)}>MANAGE MACHINE</button><button type="button" aria-label="Close details" onClick={()=>setSelected(null)}>×</button></div>}
  <div className="clicker-bottom"><span>{units.length} machine types · Side-view preview · conveyor movement is illustrative</span><div>{units.length>5&&<button type="button" onClick={()=>setShowAll(v=>!v)}>{showAll?'SHOW LESS':'VIEW ALL MACHINES'}</button>}<button type="button" onClick={onBuild}>BUY / UPGRADE</button></div></div>
 </section>;
}
