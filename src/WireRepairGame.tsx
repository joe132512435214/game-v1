import {useState, type CSSProperties} from 'react';
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
  const [justConnected,setJustConnected]=useState<string|null>(null);
  const [completed,setCompleted]=useState(false);
  const right=destinationOrder.map(i=>wires[i]);
  const circuitY=(index:number)=>116+index*62;
  const destinationY=(id:string)=>circuitY(right.findIndex(w=>w.id===id));
  const pick=(id:string)=>{
    if(connected.includes(id))return;
    if(selected===id){setSelected(null);return;}
    setSelected(id);
  };
  const connect=(id:string)=>{
    if(!selected)return;
    if(id!==selected){setMistakes(m=>m+1);setSelected(null);return;}
    const next=[...connected,id];setConnected(next);setSelected(null);setJustConnected(id);
    if(next.length===wires.length)setCompleted(true);
  };
  return <div className="wirecut-overlay" role="dialog" aria-modal="true" aria-labelledby="wirecut-title">
    <section className={"wirecut-panel"+(completed?" wirecut-finished":"") }>
      <div className="wirecut-header"><span>⚡ FACTORY EMERGENCY</span><span className={completed?"wirecut-online":"wirecut-alert"}>{completed?"● GRID RESTORED":"● GRID OFFLINE"}</span></div>
      <div className="wirecut-warning-strip" aria-hidden="true"><span>HIGH VOLTAGE</span><span className="wirecut-spark">⚡</span><span>MANUAL RESET</span></div>
      <h2 id="wirecut-title">{completed?"POWER RESTORED!":"POWER CUT!"}</h2>
      <p className="wirecut-story">{completed?"Every circuit is live. Nice work, engineer! The factory is ready to restart.":"A junction box has shorted out. Production has stopped. Connect each coloured wire to its matching terminal to bring the factory back online."}</p>
      <div className="wirecut-meter"><span>POWER RESTORATION</span><b>{connected.length}/4 CIRCUITS</b></div>
      <div className="wirecut-progress"><span style={{width:(connected.length/4*100)+'%'}}/></div>
      <div className={"wirecut-board"+(completed?" wirecut-board-complete":"")}>
        <div className="wirecut-board-top"><span>JUNCTION BOX / J-04</span><span className={completed?'online':'offline'}>{completed?'● ONLINE':'● NO POWER'}</span></div>
        <svg className="wirecut-cable-layer" viewBox="0 0 640 365" preserveAspectRatio="none" aria-hidden="true">
          <defs><filter id="wirecut-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          {wires.map((w,i)=>{
            const active=connected.includes(w.id);
            const preview=selected===w.id;
            const y1=circuitY(i),y2=destinationY(w.id);
            const d=`M 150 ${y1} C 292 ${y1}, 348 ${y2}, 490 ${y2}`;
            return <g key={w.id} className={active?"wirecut-wire-energized":preview?"wirecut-wire-preview":"wirecut-wire-idle"} style={{'--wire':w.colour} as CSSProperties}>
              <path d={d} stroke="#031012" strokeWidth="15" fill="none" strokeLinecap="round"/>
              <path d={d} stroke={active||preview?w.colour:"#335057"} strokeWidth={active?7:preview?5:3} strokeDasharray={active?undefined:preview?"9 7":"2 15"} fill="none" strokeLinecap="round" className={active?"wirecut-live-path":preview?"wirecut-preview-path":""} filter={active?"url(#wirecut-glow)":undefined}/>
              {active&&<circle r="6" fill="#fff3c0" className="wirecut-energy-pulse"><animateMotion dur="1.5s" repeatCount="indefinite" path={d}/></circle>}
            </g>;
          })}
        </svg>
        <div className="wirecut-bank">
          <span className="wirecut-bank-label">LOOSE WIRES</span>
          {wires.map(w=><button key={w.id} type="button" disabled={completed||connected.includes(w.id)} aria-pressed={selected===w.id} className={'wirecut-terminal'+(selected===w.id?' selected':'')+(connected.includes(w.id)?' connected':'')} style={{'--wire':w.colour} as CSSProperties} onClick={()=>pick(w.id)}><i/>{w.label}{connected.includes(w.id)?' ✓':''}</button>)}
        </div>
        <div className="wirecut-middle" aria-hidden="true"><span className="wirecut-core">⚡<small>MAIN<br/>BUS</small></span></div>
        <div className="wirecut-bank">
          <span className="wirecut-bank-label">FUSE TERMINALS</span>
          {right.map(w=><button key={w.id} type="button" disabled={connected.includes(w.id)} className={'wirecut-terminal'+(connected.includes(w.id)?' connected':'')} style={{'--wire':w.colour} as CSSProperties} onClick={()=>connect(w.id)}><i/>{w.label}{connected.includes(w.id)?' ✓':''}</button>)}
        </div>
      </div>
      <p className="wirecut-instructions">{completed?"All circuits connected. Restore power to restart production.":selected?'Now click the matching '+selected.toUpperCase()+' terminal on the right.':'Select a loose wire on the left, then its matching terminal on the right.'}</p>
      {mistakes>0&&<p className="wirecut-error" role="status">Wrong connection! Check the colours and try again. No penalty.</p>}
      {justConnected&&!completed&&<div className="wirecut-feedback" key={connected.length} role="status">⚡ CIRCUIT {connected.length} CONNECTED! +{Math.round(connected.length/4*100)}% POWER</div>}
      {completed&&<button className="wirecut-restore-button" type="button" onClick={onComplete}>⚡ RESTORE FACTORY POWER</button>}
      <div className="wirecut-footer"><span>⚠ Production halted until all circuits are repaired</span><b>REWARD: +75 XP · +2 GEARS</b></div>
    </section>
  </div>;
}
