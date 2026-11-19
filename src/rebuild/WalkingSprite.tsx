import type {CharacterAppearance} from '../CharacterSystem';
import type {Direction} from './engine';

const skin={light:'#f2c8a6',tan:'#cf946d',brown:'#a86c4c',deep:'#68402f'};
const hair={brown:'#60402c',black:'#242832',ginger:'#c35c30',blonde:'#dfb963',purple:'#8c59ba'};
const shirt={orange:'#dd923b',blue:'#537ea4',green:'#6c9c68'};
/** Four directional, four-phase pixel walk cycle. All colours/accessories come from the saved character. */
export function WalkingSprite({appearance,direction,frame=0,moving=false}:{
 appearance:CharacterAppearance;direction:Direction;frame?:number;moving?:boolean;
}){
 const c=appearance,face=direction==='down',back=direction==='up',side=!face&&!back;
 const phase=moving?Math.floor(frame)%4:0;
 const stride=[0,3,0,-3][phase],bounce=moving&&phase%2===1?-1:0;
 const left=side?-1:1;
 return <svg viewBox="0 0 32 44" width="32" height="44" shapeRendering="crispEdges" aria-label={c.name+' walking '+direction} role="img" style={{overflow:'visible',transform:direction==='left'?'scaleX(-1)':undefined}}>
 <ellipse cx="16" cy="42" rx="11" ry="3" fill="#17212b" opacity=".35"/>
 <g transform={`translate(0 ${bounce})`} stroke="#27303a" strokeWidth="1.5" strokeLinejoin="miter">
 <rect x={side?12:7} y={32+stride} width="7" height="8" fill="#39495a"/>
 <rect x={side?14:18} y={32-stride} width="7" height="8" fill="#39495a"/>
 <rect x="5" y="19" width="22" height="15" fill={shirt[c.top]}/>
 <rect x={side?22:2} y={20-stride/2} width="5" height="12" fill={shirt[c.top]}/>
 <rect x={side?4:25} y={20+stride/2} width="5" height="12" fill={shirt[c.top]}/>
 <rect x={side?22:2} y={30-stride/2} width="5" height="4" fill={skin[c.skin]}/>
 <rect x={side?4:25} y={30+stride/2} width="5" height="4" fill={skin[c.skin]}/>
 <rect x="8" y="5" width="16" height="16" fill={skin[c.skin]}/>
 {c.hair==='long'&&<><rect x="6" y="8" width="4" height="17" fill={hair[c.hairColour]}/><rect x="22" y="8" width="4" height="17" fill={hair[c.hairColour]}/></>}
 <path d={c.hair==='curly'?'M6 12V5h4V2h12v3h4v8h-5V9H11v4H6z':c.hair==='swept'?'M7 13V5h5V2h13v7h-8v3H9v3H7z':'M7 12V5h4V3h14v10h-4V9H11v4H7z'} fill={hair[c.hairColour]}/>
 {!back&&<>{side?<rect x="21" y="13" width="2" height="2" fill="#202631"/>:<><rect x="11" y="13" width="2" height="2" fill="#202631"/><rect x="19" y="13" width="2" height="2" fill="#202631"/></>}</>}
 {!back&&c.facialHair!=='none'&&<rect x={side?20:11} y={c.facialHair==='beard'?17:18} width={side?4:10} height={c.facialHair==='beard'?4:2} fill={hair[c.hairColour]}/>}
 {!back&&c.glasses&&<path d={side?'M18 12h7v5h-7z':'M9 12h6v5H9zm8 0h6v5h-6z'} fill="none" stroke="#293946" strokeWidth="1.5"/>}
 {c.headwear!=='none'&&<><path d="M6 8V4h4V1h12v3h4v4z" fill={c.headwear==='hardhat'?'#f5b833':'#394b65'}/><rect x={side?13:5} y="8" width={side?15:22} height="3" fill={c.headwear==='hardhat'?'#d9a12e':'#394b65'}/></>}
 </g>
 </svg>;
}
