import { useEffect, useRef, useState } from 'react';
type Machine={id:string;name:string;count:number};
type Props={machines:Machine[];powered:boolean;onBuyMine:()=>void;onManage:()=>void};
const W=768,H=470;
export function StarterFactoryMap({machines,powered,onBuyMine,onManage}:Props){
 const [inside,setInside]=useState(false);
 const [selected,setSelected]=useState<number|null>(null);
 const [player,setPlayer]=useState({x:315,y:350});
 const [facing,setFacing]=useState<'up'|'down'|'left'|'right'>('down');
 const keys=useRef(new Set<string>());
 const joystick=useRef({x:0,y:0});
 const joystickPointer=useRef<number|null>(null);
 const [stick,setStick]=useState({x:0,y:0});
 const joystickBase=useRef<HTMLDivElement|null>(null);
 const updateStick=(clientX:number,clientY:number)=>{
   const bounds=joystickBase.current?.getBoundingClientRect();
   if(!bounds)return;
   const radius=42;
   const x=clientX-(bounds.left+bounds.width/2);
   const y=clientY-(bounds.top+bounds.height/2);
   const length=Math.hypot(x,y);
   const scale=length>radius?radius/length:1;
   const offset={x:x*scale,y:y*scale};
   setStick(offset);
   joystick.current={x:offset.x/radius,y:offset.y/radius};
 };
 const releaseStick=()=>{joystickPointer.current=null;joystick.current={x:0,y:0};setStick({x:0,y:0});};

 const insideRef=useRef(inside);
 insideRef.current=inside;
 const walkable=(x:number,y:number,interior:boolean)=>{
   const radius=8;
   const overlaps=(left:number,top:number,right:number,bottom:number)=>
     x+radius>left&&x-radius<right&&y+radius>top&&y-radius<bottom;
   if(x<radius||x>W-radius||y<radius||y>H-radius)return false;
   if(!interior){
     // Building occupies the upper-left yard. Only its doorway is a portal.
     if(overlaps(48,65,490,328))return false;
     if(overlaps(537,90,703,265))return false;
     // Yard fence is solid, except for the vehicle gate at the bottom.
     if(overlaps(40,25,730,48))return false;
     if(overlaps(34,30,54,386)||overlaps(716,30,736,386))return false;
     if(overlaps(40,378,330,398)||overlaps(438,378,730,398))return false;
     return true;
   }
   if(x<75+radius||x>463-radius||y<92+radius||y>304-radius)return false;
   // Office partition has a gap between y=211 and 259.
   if(overlaps(171,81,190,211)||overlaps(171,259,190,312))return false;
   if(overlaps(86,104,157,180))return false;
   if(overlaps(194,91,462,132))return false;
   for(let i=0;i<3;i++){
     const sx=212+i*84;
     if(factoryMachines[i]&&overlaps(sx,163,sx+72,248))return false;
   }
   return true;
 };
 const walkableRef=useRef(walkable);
 walkableRef.current=walkable;
 const factoryDoorInside=(x:number,y:number)=>x>=307&&x<=368&&y>=285;
 useEffect(()=>{
   const down=(e:KeyboardEvent)=>{
     if(e.altKey||e.ctrlKey||e.metaKey||/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName||''))return;
     const k=e.key.toLowerCase();
     if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.current.add(k);if(e.key.startsWith('Arrow'))e.preventDefault();}
   };
   const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
   const blur=()=>{keys.current.clear();releaseStick();};
   window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
   return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
   const timer=window.setInterval(()=>{
     const k=keys.current;
     let dx=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('arrowleft'));
     let dy=Number(k.has('s')||k.has('arrowdown'))-Number(k.has('w')||k.has('arrowup'));
     // Analogue thumbstick permits variable speed and diagonals; keyboard stays full speed.
     if(!dx&&!dy){dx=joystick.current.x;dy=joystick.current.y;}
     if(!dx&&!dy)return;
     const length=Math.hypot(dx,dy);
     const speed=3*Math.min(1,length);
     dx=dx/length*speed;dy=dy/length*speed;
     setFacing(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
     setPlayer(prev=>{
       // Door portals are checked before walls so they can actually be reached.
       // Crossing the front doorstep from below triggers entry.
       if(!insideRef.current&&dy<0&&prev.x>=307&&prev.x<=322&&prev.y>=328&&prev.y<=341){
         insideRef.current=true;setInside(true);return{x:338,y:278};
       }
       if(insideRef.current&&dy>0&&factoryDoorInside(prev.x,prev.y)){
         insideRef.current=false;setInside(false);return{x:315,y:350};
       }
       let x=prev.x,y=prev.y;
       // Resolve each axis separately: the player slides along walls rather than sticking.
       if(walkableRef.current(x+dx,y,insideRef.current))x+=dx;
       if(walkableRef.current(x,y+dy,insideRef.current))y+=dy;
       return x===prev.x&&y===prev.y?prev:{x,y};
     });
   },33);
   return()=>window.clearInterval(timer);
 },[]);
 const toggleInterior=()=>{
   const next=!inside;insideRef.current=next;setInside(next);
   setPlayer(next?{x:338,y:278}:{x:315,y:350});
 };

 const mine=machines.find(m=>m.id==='miner');
 const mineBuilt=(mine?.count||0)>0;
 const factoryMachines=machines.filter(m=>m.id!=='miner'&&m.count>0);
 const slots=[0,1,2];
 return <section className="starter-world" aria-label="Ore and Order starting factory map">
 <div className="starter-world-toolbar"><div><strong>YOUR STARTING FACTORY</strong><span>{inside?'Inside · Roof hidden':'Outside · Starter yard'}</span></div><div className="starter-world-actions"><button type="button" onClick={toggleInterior}>{inside?'Go outside':'Enter factory'}</button><button type="button" onClick={onManage}>Manage machines</button></div></div>
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
 <g transform={`translate(${player.x} ${player.y})`} aria-label="Player character">
 <ellipse cx="0" cy="3" rx="12" ry="5" fill="#263b34" opacity=".35"/>
 <rect x="-8" y="-27" width="16" height="12" fill="#e6b08b" stroke="#293543" strokeWidth="2"/>
 <path d="M-9 -23v-9h18v9h-5v-3h-9v3z" fill="#633f2b" stroke="#293543" strokeWidth="2"/>
 {facing!=='up'&&<><rect x={facing==='left'?-5:-4} y="-21" width="3" height="3" fill="#293543"/>{facing==='down'&&<rect x="3" y="-21" width="3" height="3" fill="#293543"/>}</>}
 <rect x="-10" y="-13" width="20" height="15" fill="#d18a3a" stroke="#293543" strokeWidth="2"/>
 <rect x="-9" y="1" width="7" height="8" fill="#39495a"/><rect x="2" y="1" width="7" height="8" fill="#39495a"/>
 </g>
 </svg>
 <div className="starter-world-controls"><span>PC: WASD / arrow keys · Mobile: drag the joystick · Walk to the entrance</span>
 <div ref={joystickBase} className="starter-world-joystick" role="group" aria-label="Movement joystick"
 onPointerDown={e=>{if(joystickPointer.current!==null)return;e.preventDefault();joystickPointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);updateStick(e.clientX,e.clientY);}}
 onPointerMove={e=>{if(joystickPointer.current===e.pointerId){e.preventDefault();updateStick(e.clientX,e.clientY);}}}
 onPointerUp={e=>{if(joystickPointer.current===e.pointerId)releaseStick();}}
 onPointerCancel={e=>{if(joystickPointer.current===e.pointerId)releaseStick();}}
 onLostPointerCapture={e=>{if(joystickPointer.current===e.pointerId)releaseStick();}}>
 <div className="starter-world-joystick-ring"/>
 <div className="starter-world-joystick-knob" style={{transform:`translate(${stick.x}px,${stick.y}px)`}}/>
 </div></div>
 <div className="starter-world-footer"><div><strong>{mineBuilt?'Mine connected':'Mine awaiting construction'}</strong><span>{mineBuilt?'Ore can feed into the factory input conveyor.':'Purchase the Rockbreaker Mine to activate the material connection.'}</span></div><button type="button" onClick={mineBuilt?onManage:onBuyMine}>{mineBuilt?'View mine':'Build first mine'}</button></div>
 {selected!==null&&inside&&<div className="starter-world-selection"><span>Machine space {selected+1}: {factoryMachines[selected]?.name||'Empty'}</span><button type="button" onClick={onManage}>Manage</button><button type="button" onClick={()=>setSelected(null)} aria-label="Close selection">×</button></div>}
 </section>;
}
