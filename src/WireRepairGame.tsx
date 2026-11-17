import {useState} from 'react';
import './WireRepairGame.css';

const wires=[
  {id:'red',label:'RED',colour:'#f06b63',symbol:'R'},
  {id:'blue',label:'BLUE',colour:'#68baff',symbol:'B'},
  {id:'yellow',label:'YELLOW',colour:'#ffd36c',symbol:'Y'},
  {id:'green',label:'GREEN',colour:'#83dca0',symbol:'G'}
] as const;
const destinationOrder=[2,0,3,1];
export function WireRepairGame({onComplete}:{onComplete:()=>void}){
  const [selected,setSelected]=useState<string|null>(null);
  const [connected,setConnected]=useState<string[]>([]);
  const [mistakes,setMistakes]=useState(0);
  const right=destinationOrder.map(i=>wires[i]);
  const pick=(id:string)=>{
    if(connected.includes(id))return;
    if(selected===id){setSelected(null);return;}
    setSelected(id);
  };
  const connect=(id:string)=>{
    if(!selected)return;
    if(id!==selected){setMistakes(m=>m+1);setSelected(null);return;}
    const next=[...connected,id];setConnected(next);setSelected(null);
    if(next.length===wires.length)onComplete();
  };
  return <div className="wirecut-overlay" role="dialog" aria-modal="true" aria-labelledby="wirecut-title">
    <section className="wirecut-panel">
      <div className="wirecut-header"><span>⚡ FACTORY EMERGENCY</span><span className="wirecut-alert">● GRID OFFLINE</span></div>
      <div className="wirecut-symbol" aria-hidden="true">⚡</div>
      <h2 id="wirecut-title">POWER CUT!</h2>
      <p className="wirecut-story">A junction box has shorted out. Production has stopped. Connect each coloured wire to its matching terminal to bring the factory back online.</p>
      <div className="wirecut-meter"><span>POWER RESTORATION</span><b>{connected.length}/4 CIRCUITS</b></div>
      <div className="wirecut-progress"><span style={{width:(connected.length/4*100)+'%'}}/></div>
      <div className="wirecut-board">
        <div className="wirecut-bank">
          <span className="wirecut-bank-label">LOOSE WIRES</span>
          {wires.map(w=><button key={w.id} type="button" disabled={connected.includes(w.id)} aria-pressed={selected===w.id} className={'wirecut-terminal'+(selected===w.id?' selected':'')+(connected.includes(w.id)?' connected':'')} style={{'--wire':w.colour} as React.CSSProperties} onClick={()=>pick(w.id)}><i/>{w.label}{connected.includes(w.id)?' ✓':''}</button>)}
        </div>
        <div className="wirecut-middle" aria-hidden="true">{wires.map(w=><div key={w.id} className={'wirecut-line'+(connected.includes(w.id)?' connected':'')} style={{'--wire':w.colour} as React.CSSProperties}><span/></div>)}</div>
        <div className="wirecut-bank">
          <span className="wirecut-bank-label">FUSE TERMINALS</span>
          {right.map(w=><button key={w.id} type="button" disabled={connected.includes(w.id)} className={'wirecut-terminal'+(connected.includes(w.id)?' connected':'')} style={{'--wire':w.colour} as React.CSSProperties} onClick={()=>connect(w.id)}><i/>{w.label}{connected.includes(w.id)?' ✓':''}</button>)}
        </div>
      </div>
      <p className="wirecut-instructions">{selected?'Now click the matching '+selected.toUpperCase()+' terminal on the right.':'Select a loose wire on the left, then its matching terminal on the right.'}</p>
      {mistakes>0&&<p className="wirecut-error" role="status">Wrong connection! Check the colours and try again. No penalty.</p>}
      <div className="wirecut-footer"><span>⚠ Production halted until all circuits are repaired</span><b>REWARD: +75 XP · +2 GEARS</b></div>
    </section>
  </div>;
}
