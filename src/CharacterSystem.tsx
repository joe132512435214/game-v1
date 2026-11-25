import { useState } from 'react';
/** One canonical appearance profile drives both world sprites and comic portraits. */
export type CharacterAppearance={
  name:string; skin:'light'|'tan'|'brown'|'deep'; hair:'short'|'swept'|'long'|'curly';
  hairColour:'brown'|'black'|'ginger'|'blonde'|'purple'; facialHair:'none'|'stubble'|'beard';
  top:'orange'|'blue'|'green'; headwear:'none'|'cap'|'hardhat'; glasses:boolean;
};
export const DEFAULT_CHARACTER:CharacterAppearance={name:'Factory Owner',skin:'tan',hair:'swept',hairColour:'brown',facialHair:'none',top:'orange',headwear:'none',glasses:false};
export const CHARACTER_KEY='ore-and-order-character-v1';
const skinColours={light:'#f2c8a6',tan:'#cf946d',brown:'#a86c4c',deep:'#68402f'};
const hairColours={brown:'#60402c',black:'#242832',ginger:'#c35c30',blonde:'#dfb963',purple:'#8c59ba'};
const tops={orange:'#dd923b',blue:'#537ea4',green:'#6c9c68'};
export function normaliseCharacter(value:unknown):CharacterAppearance{
 const v=(value&&typeof value==='object'?value:{}) as Record<string,unknown>;
 const choice=<T extends string>(key:string,options:readonly T[],fallback:T):T=>options.includes(v[key] as T)?v[key] as T:fallback;
 return {name:typeof v.name==='string'?v.name.trim().slice(0,24)||DEFAULT_CHARACTER.name:DEFAULT_CHARACTER.name,
 skin:choice('skin',['light','tan','brown','deep'],'tan'),hair:choice('hair',['short','swept','long','curly'],'swept'),
 hairColour:choice('hairColour',['brown','black','ginger','blonde','purple'],'brown'),
 facialHair:choice('facialHair',['none','stubble','beard'],'none'),top:choice('top',['orange','blue','green'],'orange'),
 headwear:choice('headwear',['none','cap','hardhat'],'none'),glasses:v.glasses===true};
}
export function readCharacter():CharacterAppearance|null{
 try{const saved=localStorage.getItem(CHARACTER_KEY);return saved?normaliseCharacter(JSON.parse(saved)):null;}catch{return null;}
}
export function saveCharacter(value:CharacterAppearance){
 try{localStorage.setItem(CHARACTER_KEY,JSON.stringify(normaliseCharacter(value)));return true;}
 catch(error){console.warn('Character could not be persisted; continuing without local storage.',error);return false;}
}
type Pose='front'|'side'|'reach';
export function CharacterArt({appearance,pose='front',size=160}:{
 appearance:CharacterAppearance;pose?:Pose;size?:number;world?:boolean;
}){
 const c=normaliseCharacter(appearance),skin=skinColours[c.skin],hair=hairColours[c.hairColour],shirt=tops[c.top];
 // Crisp vector primitives: all appearance layers use identical coordinates across poses.
 const side=pose!=='front';
 return <svg viewBox="0 0 80 96" width={size} height={size*1.2} shapeRendering="crispEdges" role="img" aria-label={c.name+' '+pose+' character'}>
 <g stroke="#252b36" strokeWidth="2" strokeLinejoin="round">
 <path fill="#343c4b" d="M23 73h15v17H20v-7zm20 0h15v17H42v-7z"/>
 <path fill="#242a35" d="M19 87h20v6H17zm22 0h21v6H40z"/>
 <path fill={shirt} d="M19 48h41l6 30H14z"/>
 <path fill="#d8c6a3" d="M29 49h6v29h-6zm16 0h6v29h-6z" stroke="none"/>
 <path fill={skin} d="M22 18h35v32H22z"/>
 {c.hair==='long'&&<path fill={hair} d="M18 17h11v37H17zm35 0h11v37H53z"/>}
 {c.hair==='curly'?<path fill={hair} d="M18 17v-8h8V5h27v5h8v13h-8v-5H26v5h-8z"/>:
 <path fill={hair} d={c.hair==='short'?'M20 22V12h7V8h29v15h-9v-5H28v5z':'M18 23V13h10V7h30v7h-8v5H31l-7 8z'}/>}
 {c.facialHair!=='none'&&<path fill={hair} d={c.facialHair==='beard'?'M28 38h25v12H28z':'M29 42h22v4H29z'} stroke="none"/>}
 {side?<><rect x="48" y="30" width="4" height="6" fill="#242a35" stroke="none"/><path d="M54 36h7v5h-7" fill={skin}/></>:<>
 <rect x="30" y="30" width="4" height="5" fill="#242a35" stroke="none"/><rect x="47" y="30" width="4" height="5" fill="#242a35" stroke="none"/>
 <path d="M35 43h12" stroke="#693f32" strokeWidth="2"/></>}
 {c.glasses&&<path d={side?'M44 30h13v9H44z':'M26 29h13v10H26zm15 0h13v10H41z'} fill="none" stroke="#283a47" strokeWidth="3"/>}
 {c.headwear!=='none'&&<path fill={c.headwear==='hardhat'?'#f5b833':'#394b65'} d="M19 16V9h7V5h28v4h7v9H19zm-3 0h48v5H16z"/>}
 {pose==='reach'?<><path fill={shirt} d="M58 52l12-16 6 5-12 25z"/><path fill={skin} d="M69 32h9v11h-9z"/></>:<><path fill={shirt} d="M19 51H9v22h11zm41 0h10v22H59z"/><path fill={skin} d="M9 72h11v9H9zm50 0h11v9H59z"/></>}
 </g></svg>;
}
const selectors:{key:keyof CharacterAppearance;label:string;values:string[]}[]=[
 {key:'skin',label:'Skin tone',values:['light','tan','brown','deep']},
 {key:'hair',label:'Hair style',values:['short','swept','long','curly']},
 {key:'hairColour',label:'Hair colour',values:['brown','black','ginger','blonde','purple']},
 {key:'facialHair',label:'Facial hair',values:['none','stubble','beard']},
 {key:'top',label:'Jacket',values:['orange','blue','green']},
 {key:'headwear',label:'Headwear',values:['none','cap','hardhat']}
];
export function CharacterCreator({initial=DEFAULT_CHARACTER,onDone}:{
 initial?:CharacterAppearance;onDone:(appearance:CharacterAppearance)=>void;
}){
 const [c,setC]=useState<CharacterAppearance>(normaliseCharacter(initial));
 const [pose,setPose]=useState<Pose>('front');
 return <section className="character-creator" aria-label="Create your factory owner" style={{padding:20,background:'#15242e',color:'#f4ebd6',border:'3px solid #d6a34c',borderRadius:12}}>
 <h2 style={{marginTop:0}}>CREATE YOUR FACTORY OWNER</h2>
 <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'start'}}>
 <div style={{background:'#2d3b48',padding:18,borderRadius:8,textAlign:'center'}}>
 <CharacterArt appearance={c} pose={pose} size={150}/><div style={{display:'flex',gap:8,justifyContent:'center'}}>
 {(['front','side','reach'] as const).map(p=><button type="button" key={p} aria-pressed={pose===p} onClick={()=>setPose(p)}>{p}</button>)}</div>
 <div style={{marginTop:8}}><small>World sprite</small><br/><CharacterArt appearance={c} pose="front" size={48} world/></div></div>
 <div style={{flex:'1 1 270px',display:'grid',gap:10}}>
 <label>Character name <input maxLength={24} value={c.name} onChange={e=>setC({...c,name:e.target.value})}/></label>
 {selectors.map(s=><label key={s.key} style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'center',flexWrap:'wrap'}}>{s.label}
 <select value={String(c[s.key])} onChange={e=>setC({...c,[s.key]:e.target.value})}>{s.values.map(v=><option key={v} value={v}>{v}</option>)}</select></label>)}
 <label><input type="checkbox" checked={c.glasses} onChange={e=>setC({...c,glasses:e.target.checked})}/> Glasses</label>
 <button type="button" onClick={()=>{const ready=normaliseCharacter(c);saveCharacter(ready);onDone(ready);}} style={{background:'#f1b83d',color:'#1c2430',padding:12,fontWeight:800}}>CONFIRM CHARACTER</button>
 </div></div></section>;
}
