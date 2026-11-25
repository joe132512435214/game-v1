import {useEffect,useRef,useState} from 'react';
import {CharacterCreator,CharacterArt,readCharacter,type CharacterAppearance} from '../CharacterSystem';
import {ElliePortrait} from '../ElliePortrait';
import {WORLD_ART} from './assets';
import {BASIC_MACHINE_ART} from './basicMachineArt';
const STARTER_ART=[BASIC_MACHINE_ART.smelter,BASIC_MACHINE_ART.press,BASIC_MACHINE_ART.assembler] as const;
const STARTER_NAMES=['Smelter','Stamping press','Assembler'] as const;
import {WalkingSprite} from './WalkingSprite';
import {cameraFor,FACTORY_INTERIOR,movePlayer,STARTER_WORLD,withinReach,type Player,type Vector} from './engine';

const VIEW={x:768,y:470};
const DOOR_OUT={x:390,y:431};
const DOOR_IN={x:510,y:628};
const ELLIE={x:520,y:510};
type Scene='yard'|'factory';
export default function RebuildApp(){
 const [owner,setOwner]=useState<CharacterAppearance|null>(()=>readCharacter());
 const [scene,setScene]=useState<Scene>('yard');
 const [installedMachines,setInstalledMachines]=useState<number[]>([]);
 const machineBays=[{x:405,y:170},{x:575,y:170},{x:745,y:170}];
 const purchaseMachine=(index:number)=>{if(installedMachines.includes(index))return;setInstalledMachines(current=>[...current,index]);setObjective('Your machine is installed! Explore the factory or buy another machine.');setDialogue(null);};
 const [player,setPlayer]=useState<Player>({position:{x:430,y:550},facing:'down'});
 const nearMachineBay=scene==='factory'?machineBays.findIndex(b=>withinReach(player.position,{x:b.x+55,y:b.y+95},85)):-1;
 const [dialogue,setDialogue]=useState<string|null>(null);
 const [objective,setObjective]=useState('Speak to Ellie outside the factory');
 const [metEllie,setMetEllie]=useState(false);
 const [transitioning,setTransitioning]=useState(false);
 const [walkFrame,setWalkFrame]=useState(0);
 const [walking,setWalking]=useState(false);
 const walkDistance=useRef(0);
 const keys=useRef(new Set<string>());
 const joystick=useRef<Vector>({x:0,y:0});
 const [thumb,setThumb]=useState<Vector>({x:0,y:0});
 const stickRef=useRef<HTMLDivElement|null>(null);
 const pointer=useRef<number|null>(null);
 const sceneRef=useRef(scene);sceneRef.current=scene;
 const dialogueRef=useRef(dialogue);dialogueRef.current=dialogue;
 const world=scene==='yard'?STARTER_WORLD:FACTORY_INTERIOR;
 const camera=cameraFor(player.position,VIEW,world);
 const nearEllie=scene==='yard'&&withinReach(player.position,ELLIE,72);
 const nearDoor=withinReach(player.position,scene==='yard'?DOOR_OUT:DOOR_IN,65);
 const interact=()=>{
   if(dialogue){const spokeToEllie=dialogue.startsWith('Welcome to Ore & Order!');setDialogue(null);if(spokeToEllie){setMetEllie(true);setObjective('Head to the marked factory entrance');}return;}
   if(nearMachineBay>=0&&!installedMachines.includes(nearMachineBay)){purchaseMachine(nearMachineBay);return;}
   if(nearEllie){setDialogue("Welcome to Ore & Order! I'm Ellie. Follow the path to the factory door — we'll take a look inside together.");return;}
   if(nearDoor&&!transitioning){if(scene==='yard'&&!metEllie){setDialogue('Ellie is waiting nearby. Speak to her before going inside.');return;}
    setTransitioning(true);keys.current.clear();joystick.current={x:0,y:0};setThumb({x:0,y:0});
    const next=scene==='yard'?'factory':'yard';setScene(next);setPlayer({position:next==='factory'?{x:510,y:585}:{x:390,y:483},facing:next==='factory'?'up':'down'});
    setObjective(next==='factory'?'Explore the empty factory floor':'Explore the factory yard');
    window.setTimeout(()=>setTransitioning(false),450);
   }
 };
 const interactRef=useRef(interact);interactRef.current=interact;
 useEffect(()=>{
  const down=(e:KeyboardEvent)=>{if(/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName||''))return;
   const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){keys.current.add(k);e.preventDefault();}
   if(k==='e'&&!e.repeat){interactRef.current();e.preventDefault();}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
  const blur=()=>{keys.current.clear();joystick.current={x:0,y:0};setThumb({x:0,y:0});};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  let frame=0,last=performance.now();
  const tick=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;
   const k=keys.current;
   const x=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('arrowleft'));
   const y=Number(k.has('s')||k.has('arrowdown'))-Number(k.has('w')||k.has('arrowup'));
   const input=x||y?{x,y}:joystick.current;
   if(!dialogueRef.current&&(input.x||input.y))setPlayer(p=>{const next=movePlayer(p,input,dt,sceneRef.current==='yard'?STARTER_WORLD:FACTORY_INTERIOR);const moved=Math.hypot(next.position.x-p.position.x,next.position.y-p.position.y);if(moved>0.01){walkDistance.current+=moved;if(walkDistance.current>=16){walkDistance.current%=16;setWalkFrame(f=>(f+1)%4);}setWalking(true);}else{setWalking(false);walkDistance.current=0;}return next;});
   else {setWalking(false);walkDistance.current=0;}
   frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 const stickMove=(x:number,y:number)=>{const rect=stickRef.current?.getBoundingClientRect();if(!rect)return;const dx=x-rect.left-rect.width/2,dy=y-rect.top-rect.height/2;const d=Math.hypot(dx,dy),scale=d>40?40/d:1;const p={x:dx*scale,y:dy*scale};setThumb(p);joystick.current={x:p.x/40,y:p.y/40};};
 const stickStop=()=>{pointer.current=null;setThumb({x:0,y:0});joystick.current={x:0,y:0};};
 if(!owner)return <main style={{padding:24,background:'#172530',minHeight:'100vh',color:'#fff'}}><CharacterCreator onDone={setOwner}/></main>;
 return <main style={{background:'#15232b',color:'#f7ebd1',minHeight:'100vh',padding:16,fontFamily:'system-ui,sans-serif'}}>
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h1>ORE & ORDER <small style={{fontSize:12}}>2.0 · NEW PIXEL ART</small></h1><span>{owner.name} · {scene==='yard'?'Factory yard':'Factory interior'}</span></header>
 <p role="status">Objective: {objective}</p>
 <div style={{maxWidth:950,margin:'auto',position:'relative',border:'4px solid #a97e46',overflow:'hidden'}}>
 <svg viewBox="0 0 768 470" style={{display:'block',width:'100%',background:'#739456',imageRendering:'pixelated'}} shapeRendering="crispEdges" aria-label="Walkable factory world">
 <g transform={`translate(${-camera.x} ${-camera.y})`}>
 <rect width={world.width} height={world.height} fill={scene==='yard'?'#729551':'#797c84'}/>
 {scene==='yard'?<>
 <image href={WORLD_ART.grounds} x="0" y="0" width={world.width} height={world.height} preserveAspectRatio="none"/>
 <text x="861" y="360" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff1a1" stroke="#263037" strokeWidth="3" paintOrder="stroke">MINE · NOT BUILT</text>
 <text x="390" y="405" textAnchor="middle" fontSize="13" fill="#fff1a1" stroke="#243039" strokeWidth="3" paintOrder="stroke">ENTRANCE</text>
 <g transform={`translate(${ELLIE.x-15} ${ELLIE.y-58})`} shapeRendering="crispEdges"><ellipse cx="15" cy="56" rx="16" ry="5" fill="#1e2d2b" opacity=".35"/><rect x="5" y="37" width="9" height="17" fill="#29394a"/><rect x="17" y="37" width="9" height="17" fill="#29394a"/><rect x="3" y="51" width="13" height="5" fill="#2c2528"/><rect x="17" y="51" width="13" height="5" fill="#2c2528"/><rect x="3" y="20" width="24" height="22" fill="#dc8637"/><rect x="9" y="21" width="12" height="20" fill="#354856"/><rect x="-3" y="22" width="7" height="20" fill="#d68a43"/><rect x="27" y="22" width="7" height="20" fill="#d68a43"/><rect x="8" y="4" width="16" height="19" fill="#f0b88b"/><rect x="5" y="2" width="6" height="20" fill="#b7532d"/><rect x="21" y="2" width="6" height="20" fill="#b7532d"/><rect x="8" y="-2" width="16" height="8" fill="#d86e32"/><rect x="7" y="3" width="18" height="5" fill="#344554"/><rect x="11" y="12" width="3" height="3" fill="#29333c"/><rect x="19" y="12" width="3" height="3" fill="#29333c"/><text x="15" y="-11" textAnchor="middle" fontSize="13" fontWeight="bold" fill="white" stroke="#243039" strokeWidth="3" paintOrder="stroke">ELLIE</text></g>
 </>:<>
 <image href={WORLD_ART.interior} x="110" y="90" width="804" height="580" preserveAspectRatio="xMidYMid meet"/>
 {machineBays.map((bay,i)=><g key={i} transform={`translate(${bay.x} ${bay.y})`}>
 <rect width="110" height="104" rx="3" fill={installedMachines.includes(i)?'#253b3c':'#25323c'} fillOpacity={installedMachines.includes(i)?.65:.25} stroke={installedMachines.includes(i)?'#dfb75a':'#cba35d'} strokeWidth="3" strokeDasharray={installedMachines.includes(i)?'none':'8 5'}/>
 {installedMachines.includes(i)?<image href={STARTER_ART[i]} x="3" y="2" width="104" height="100" preserveAspectRatio="xMidYMid meet" style={{imageRendering:'pixelated'}}/>:<g><rect x="22" y="40" width="66" height="38" fill="#37464d" stroke="#c9a75c" strokeWidth="2" strokeDasharray="5 4"/><text x="55" y="60" textAnchor="middle" fontSize="10" fill="#f8e8bf">EMPTY BAY</text></g>}

 <text x="55" y="120" textAnchor="middle" fontSize="12" fill="#fff2d5">{STARTER_NAMES[i]} · {installedMachines.includes(i)?'BASIC':'E TO INSTALL'}</text>
 </g>)}
 <rect x="468" y="647" width="84" height="17" fill="#403b36" stroke="#f1c15e" strokeWidth="3"/><text x="510" y="632" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff1a1">EXIT</text>
 </>}
 <g transform={`translate(${player.position.x-16} ${player.position.y-40})`}><WalkingSprite appearance={owner} direction={player.facing} frame={walkFrame} moving={walking}/></g>
 </g></svg>
 {transitioning&&<div aria-live="polite" style={{position:'absolute',inset:0,background:'#0a1119',opacity:.8,display:'grid',placeItems:'center',color:'#fff4d0',fontWeight:800}}>Entering {scene==='factory'?'factory':'yard'}…</div>}
 {dialogue&&<div role="dialog" style={{position:'absolute',bottom:8,left:8,right:8,background:'#17232ff2',padding:12,display:'flex',alignItems:'center',gap:12,border:'2px solid #d6ad60'}}><ElliePortrait size={64}/><p style={{flex:1}}>{dialogue}</p><button onClick={interact}>Continue</button></div>}
 </div>
 <div style={{maxWidth:950,margin:'12px auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
 <div><div>WASD / arrows · E to interact</div><div>{nearEllie?'Ellie nearby':nearMachineBay>=0&&!installedMachines.includes(nearMachineBay)?'Machine bay ready · press E to install':nearDoor?'Entrance nearby':'Explore the yard'}</div></div>
 <button type="button" onClick={interact} disabled={transitioning||(!dialogue&&!nearEllie&&!nearDoor&&!(nearMachineBay>=0&&!installedMachines.includes(nearMachineBay)))}>Interact · E</button>
 <div ref={stickRef} aria-label="Mobile movement joystick" style={{touchAction:'none',width:100,height:100,border:'3px solid #d6ad60',borderRadius:'50%',position:'relative',background:'#2e3c47'}}
 onPointerDown={e=>{if(pointer.current!==null)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);stickMove(e.clientX,e.clientY);}}
 onPointerMove={e=>{if(pointer.current===e.pointerId)stickMove(e.clientX,e.clientY);}}
 onPointerUp={stickStop} onPointerCancel={stickStop} onLostPointerCapture={stickStop}>
 <div style={{position:'absolute',left:36,top:36,width:28,height:28,borderRadius:'50%',background:'#d6ad60',transform:`translate(${thumb.x}px,${thumb.y}px)`}}/></div>
 </div>

 <details><summary>Character preview</summary><CharacterArt appearance={owner} size={80}/></details>
 </main>;
}
