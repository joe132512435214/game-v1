import { useState } from 'react';
type Machine={id:string;name:string;count:number};
type Props={machines:Machine[];powered:boolean;onBuyMine:()=>void;onManage:()=>void};
const W=768,H=470;
export function StarterFactoryMap({machines,powered,onBuyMine,onManage}:Props){
 const [inside,setInside]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 const mine=machines.find(m=>m.id==='miner');
 const mineBuilt=(mine?.count||0)>0;
 const factoryMachines=machines.filter(m=>m.id!=='miner'&&m.count>0);
 const slots=[0,1,2];
 return <section className="starter-world" aria-label="Ore and Order starting factory map">
 <div className="starter-world-toolbar"><div><strong>YOUR STARTING FACTORY</strong><span>{inside?'Inside · Roof hidden':'Outside · Starter yard'}</span></div><div className="starter-world-actions"><button type="button" onClick={()=>setInside(v=>!v)}>{inside?'Go outside':'Enter factory'}</button><button type="button" onClick={onManage}>Manage machines</button></div></div>
 <svg className="starter-world-scene" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={inside?'Factory interior with an office, three machine spaces and mine input':'Factory yard with a small building, empty mine plot, car park and road'} shapeRendering="crispEdges">
 <defs><pattern id="sw-grass" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#6e9850"/><path d="M4 9l2-3 2 3M24 21l3-4 2 4" stroke="#4e793d" strokeWidth="2" fill="none"/></pattern><pattern id="sw-floor" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#888a91"/><path d="M0 0H32V32" stroke="#666b75" strokeWidth="2" fill="none"/></pattern><pattern id="sw-dirt" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#a6774e"/><path d="M8 10h7M21 24h5" stroke="#875c40" strokeWidth="3"/></pattern></defs>
 <rect width={W} height={H} fill="url(#sw-grass)"/>
 <rect x="0" y="401" width={W} height="69" fill="#626775"/><path d="M0 435H768" stroke="#e5b951" strokeWidth="4" strokeDasharray="22 18"/>
 <rect x="44" y="30" width="682" height="357" fill="none" stroke="#2b3d43" strokeWidth="8" strokeDasharray="26 7"/>
 <path d="M330 400V342H438V400" fill="#727780"/><path d="M347 378h73" stroke="#eee7cb" strokeWidth="5" strokeDasharray="15 10"/>
 <rect x="525" y="299" width="172" height="74" fill="#6d707d" stroke="#bbb9af" strokeWidth="4"/>
 {Array.from({length:3},(_,i)=><path key={i} d={`M${544+i*50} 306v58`} stroke="#e7e1d0" strokeWidth="3"/>)}
 <rect x="48" y="65" width="442" height="263" fill="#9d5140" stroke="#2c3547" strokeWidth="8"/>
 {inside?<g>
 <rect x="64" y="81" width="410" height="231" fill="url(#sw-floor)"/>
 <path d="M180 81v231" stroke="#343e50" strokeWidth="10"/><path d="M180 216v40" stroke="#d7ad50" strokeWidth="6" strokeDasharray="7 6"/>
 <rect x="71" y="89" width="100" height="112" fill="#a47d58" stroke="#403b43" strokeWidth="4"/>
 <path d="M71 125h100M71 160h100" stroke="#876a4e" strokeWidth="2"/>
 <rect x="88" y="116" width="63" height="24" fill="#744c35" stroke="#332c37" strokeWidth="4"/>
 <rect x="105" y="105" width="25" height="17" fill="#6ab0c8" stroke="#303b4e" strokeWidth="4"/>
 <rect x="99" y="149" width="24" height="23" fill="#394656"/>
 <text x="120" y="191" fontSize="11" textAnchor="middle" fill="#252c36" fontWeight="bold">OFFICE</text>
 <path d="M206 108H451" stroke="#424b5b" strokeWidth="19"/><path d="M206 108H451" stroke={powered&&mineBuilt?'#e8b444':'#6e737e'} strokeWidth="5" strokeDasharray="16 9"/>
 <rect x="443" y="91" width="29" height="34" fill="#3b4555" stroke="#e7b547" strokeWidth="4"/>
 {slots.map((i)=>{const x=212+i*84;const m=factoryMachines[i];return <g key={i} onClick={()=>setSelected(i)} style={{cursor:'pointer'}} role="button" aria-label={m?'Inspect '+m.name:'Empty machine position '+(i+1)} tabIndex={0}>
 <rect x={x} y="163" width="72" height="85" fill={m?'#657c83':'#757880'} stroke={selected===i?'#fff0a4':'#e7b547'} strokeWidth="4" strokeDasharray={m?'none':'9 5'}/>
 {m?<><rect x={x+11} y="180" width="50" height="46" fill="#3a5160" stroke="#1d2d3b" strokeWidth="4"/><circle cx={x+36} cy="202" r="13" fill="#b77e39" stroke="#e5bd67" strokeWidth="4"/></>:<text x={x+36} y="210" textAnchor="middle" fontSize="30" fill="#e6e0cf">+</text>}
 <text x={x+36} y="263" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2d3440">{m?m.name.slice(0,12):'EMPTY '+(i+1)}</text>
 </g>})}
 <rect x="317" y="305" width="46" height="18" fill="#3d444e" stroke="#d5ad4e" strokeWidth="3"/>
 <text x="338" y="291" fontSize="11" textAnchor="middle" fill="#30323b">ENTRANCE</text>
 </g>:<g>
 <path d="M55 150L260 47 481 150V205H55Z" fill="#344b68" stroke="#202e46" strokeWidth="8"/>
 <path d="M75 145L260 62 458 145" stroke="#8b9aa9" strokeWidth="6" fill="none"/>
 <rect x="100" y="208" width="90" height="48" fill={powered?'#e3b85d':'#344452'} stroke="#252f42" strokeWidth="7"/>
 <rect x="349" y="208" width="90" height="48" fill={powered?'#e3b85d':'#344452'} stroke="#252f42" strokeWidth="7"/>
 <rect x="211" y="220" width="104" height="108" fill="#333d4b" stroke="#d3a449" strokeWidth="8"/>
 <path d="M229 240h68" stroke="#7e8995" strokeWidth="6"/>
 <rect x="190" y="153" width="150" height="47" fill="#2d394b" stroke="#e6ae3f" strokeWidth="5"/>
 <text x="265" y="173" fontSize="16" textAnchor="middle" fill="#f3e4b8" fontWeight="bold">ORE &amp;</text><text x="265" y="191" fontSize="16" textAnchor="middle" fill="#f1b53c" fontWeight="bold">ORDER</text>
 </g>}
 <rect x="537" y="90" width="166" height="175" fill="url(#sw-dirt)" stroke="#6b543f" strokeWidth="6"/>
 <rect x="553" y="107" width="134" height="143" fill="none" stroke={mineBuilt?'#e5ad43':'#c3b18c'} strokeWidth="4" strokeDasharray={mineBuilt?'none':'10 6'}/>
 {mineBuilt?<g><path d="M564 216V156L620 116 676 156V216" fill="#5d4c43" stroke="#2d3440" strokeWidth="8"/><path d="M593 214v-52h55v52" fill="#252c34" stroke="#c8954c" strokeWidth="6"/><path d="M537 177H491" stroke="#424b5b" strokeWidth="19"/><path d="M537 177H491" stroke="#e3af43" strokeWidth="5" strokeDasharray="12 8"/></g>:<g><path d="M570 209L620 151 669 209" stroke="#d8c3a0" strokeWidth="4" strokeDasharray="9 7" fill="none"/><text x="620" y="190" textAnchor="middle" fill="#f4e3c3" fontSize="32">+</text></g>}
 <text x="620" y="239" textAnchor="middle" fontSize="12" fill="#2e3137" fontWeight="bold">{mineBuilt?'ROCKBREAKER MINE':'UNBUILT MINE PLOT'}</text>
 </svg>
 <div className="starter-world-footer"><div><strong>{mineBuilt?'Mine connected':'Mine awaiting construction'}</strong><span>{mineBuilt?'Ore can feed into the factory input conveyor.':'Purchase the Rockbreaker Mine to activate the material connection.'}</span></div><button type="button" onClick={mineBuilt?onManage:onBuyMine}>{mineBuilt?'View mine':'Build first mine'}</button></div>
 {selected!==null&&inside&&<div className="starter-world-selection"><span>Machine space {selected+1}: {factoryMachines[selected]?.name||'Empty'}</span><button type="button" onClick={onManage}>Manage</button><button type="button" onClick={()=>setSelected(null)} aria-label="Close selection">×</button></div>}
 </section>;
}
