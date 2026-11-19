import {useEffect,useRef,useState} from 'react';
import {CharacterCreator,CharacterArt,readCharacter,type CharacterAppearance} from '../CharacterSystem';
import {ElliePortrait} from '../ElliePortrait';
import {WORLD_ART} from './assets';
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
 const [player,setPlayer]=useState<Player>({position:{x:430,y:550},facing:'down'});
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
 <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><h1>ORE & ORDER <small style={{fontSize:12}}>2.0 · FOUNDATION</small></h1><span>{owner.name} · {scene==='yard'?'Factory yard':'Factory interior'}</span></header>
 <p role="status">Objective: {objective}</p>
 <div style={{maxWidth:950,margin:'auto',position:'relative',border:'4px solid #a97e46',overflow:'hidden'}}>
 <svg viewBox="0 0 768 470" style={{display:'block',width:'100%',background:'#739456',imageRendering:'pixelated'}} shapeRendering="crispEdges" aria-label="Walkable factory world">
 <g transform={`translate(${-camera.x} ${-camera.y})`}>
 <rect width={world.width} height={world.height} fill={scene==='yard'?'#729551':'#797c84'}/>
 {scene==='yard'?<>
 <image href={WORLD_ART.exterior} x="100" y="90" width="570" height="330" preserveAspectRatio="none"/>
 <image href={WORLD_ART.minePlot} x="760" y="150" width="175" height="190"/>
 <path d="M390 420V480" stroke="#d6b768" strokeWidth="45"/><rect x="365" y="414" width="50" height="12" fill="#483d36" stroke="#f1c15e" strokeWidth="3"/><text x="390" y="405" textAnchor="middle" fontSize="13" fill="#fff1a1">ENTRANCE</text>
 <g transform={`translate(${ELLIE.x} ${ELLIE.y})`}><rect x="-10" y="-28" width="20" height="24" fill="#df8738"/><rect x="-7" y="-42" width="14" height="15" fill="#f0b68d"/><text y="-48" textAnchor="middle" fontSize="13" fill="white">ELLIE</text></g>
 </>:<>
 <image href={WORLD_ART.interior} x="110" y="90" width="804" height="580" preserveAspectRatio="none"/>
 {[380,550,720].map(x=><rect key={x} x={x} y="160" width="150" height="130" fill="#555b65" stroke="#d9b05a" strokeWidth="5" strokeDasharray="12 8"/>)}
 <rect x="130" y="125" width="125" height="95" fill="#816247"/><rect x="468" y="647" width="84" height="17" fill="#403b36" stroke="#f1c15e" strokeWidth="3"/><text x="510" y="632" textAnchor="middle" fontSize="13" fill="#fff1a1">EXIT</text>
 </>}
 <g transform={`translate(${player.position.x-16} ${player.position.y-40})`}><WalkingSprite appearance={owner} direction={player.facing} frame={walkFrame} moving={walking}/></g>
 </g></svg>
 {transitioning&&<div aria-live="polite" style={{position:'absolute',inset:0,background:'#0a1119',opacity:.8,display:'grid',placeItems:'center',color:'#fff4d0',fontWeight:800}}>Entering {scene==='factory'?'factory':'yard'}…</div>}
 {dialogue&&<div role="dialog" style={{position:'absolute',bottom:8,left:8,right:8,background:'#17232ff2',padding:12,display:'flex',alignItems:'center',gap:12,border:'2px solid #d6ad60'}}><ElliePortrait size={64}/><p style={{flex:1}}>{dialogue}</p><button onClick={interact}>Continue</button></div>}
 </div>
 <div style={{maxWidth:950,margin:'12px auto',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
 <div><div>WASD / arrows · E to interact</div><div>{nearEllie?'Ellie nearby':nearDoor?'Entrance nearby':'Explore the yard'}</div></div>
 <button type="button" onClick={interact} disabled={transitioning||(!dialogue&&!nearEllie&&!nearDoor)}>Interact · E</button>
 <div ref={stickRef} aria-label="Mobile movement joystick" style={{touchAction:'none',width:100,height:100,border:'3px solid #d6ad60',borderRadius:'50%',position:'relative',background:'#2e3c47'}}
 onPointerDown={e=>{if(pointer.current!==null)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);stickMove(e.clientX,e.clientY);}}
 onPointerMove={e=>{if(pointer.current===e.pointerId)stickMove(e.clientX,e.clientY);}}
 onPointerUp={stickStop} onPointerCancel={stickStop} onLostPointerCapture={stickStop}>
 <div style={{position:'absolute',left:36,top:36,width:28,height:28,borderRadius:'50%',background:'#d6ad60',transform:`translate(${thumb.x}px,${thumb.y}px)`}}/></div>
 </div>
 <details><summary>Character preview</summary><CharacterArt appearance={owner} size={80}/></details>
 </main>;
}
