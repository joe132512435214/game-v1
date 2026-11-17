import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Factory, Cog, Pause, Play, RotateCcw, Wrench, Store, Truck, Users, AlertTriangle,
  CheckCircle2, ArrowUpRight, Zap, Boxes, CircleDollarSign, FlaskConical, ShieldCheck, TrendingUp, Cpu, HeartHandshake, GraduationCap, Sprout, LifeBuoy, Heart, Gem, Layers, Cable, CircuitBoard, Construction, Fan, Package
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

type MachineId = 'miner' | 'smelter' | 'press' | 'assembler' | 'copperMiner' | 'copperSmelter' | 'wiremill' | 'circuitpress' | 'beamMill' | 'coilWinder' | 'motorworks';
type StockId = 'ore' | 'ingot' | 'plate' | 'parts' | 'copperOre' | 'copperIngot' | 'wire' | 'circuits' | 'beams' | 'coils' | 'motors';
type Page = 'factory' | 'staff' | 'warehouse' | 'research' | 'store' | 'capital' | 'extras';
type CapitalId = 'powerGrid' | 'miningNetwork' | 'freightNetwork' | 'safetySystems';
type CharityId = 'apprenticeships' | 'community' | 'environment' | 'relief';
type CharityDonation = {cause:CharityId;amount:number;rep:number;at:number};
type BoostId = 'production' | 'dispatch' | 'protection';
type StockFlowMode = 'balanced' | 'stockpile' | 'feed';
type IntermediateStock = 'ingot' | 'wire';
type FreightRoute='iron'|'copper';
type VehicleTier=0|1|2|3;
type FactoryTheme='workshop'|'ocean'|'violet'|'copper';
const FACTORY_THEMES:{id:FactoryTheme;name:string;colours:string[];cost:number}[]=[
 {id:'workshop',name:'Workshop Green',colours:['#171f1b','#304b37','#d3a36c'],cost:0},
 {id:'ocean',name:'Ocean Blue',colours:['#101c2c','#243e59','#8ac9ee'],cost:2},
 {id:'violet',name:'Midnight Violet',colours:['#211a30','#44345b','#d3b5f5'],cost:2},
 {id:'copper',name:'Copper Works',colours:['#2b1c18','#55372b','#efba83'],cost:2}
];
const QC_COOLDOWN=180;
const qcTokenReward=(correct:number)=>correct===10?2:correct>=7?1:0;
function normaliseStyle(saved:any){
 const unlockedThemes:FactoryTheme[]=['workshop',...FACTORY_THEMES.filter(t=>t.id!=='workshop'&&Array.isArray(saved.unlockedThemes)&&saved.unlockedThemes.includes(t.id)).map(t=>t.id)];
 const theme:FactoryTheme=unlockedThemes.includes(saved.theme)?saved.theme:'workshop';
 return {styleTokens:Math.max(0,Math.floor(Number(saved.styleTokens)||0)),unlockedThemes,theme,
   qcReadyAt:Math.max(0,Number(saved.qcReadyAt)||0),qcSession:null as string|null};
}
function buyFactoryTheme(s:GameState,id:FactoryTheme):GameState{
 const theme=FACTORY_THEMES.find(t=>t.id===id);if(!theme)return s;
 if(s.unlockedThemes.includes(id))return {...s,theme:id};
 if(s.styleTokens<theme.cost)return s;
 return {...s,styleTokens:s.styleTokens-theme.cost,unlockedThemes:[...s.unlockedThemes,id],theme:id};
}
function startQualityControl(s:GameState,id:string):GameState{
 if(s.miner===0||s.qcSession||s.contractClock<s.qcReadyAt||s.powerShortage||s.powerCutEvent||s.breakdownEvent||s.cyberAttackEvent||s.writeOffEvent)return s;
 return {...s,qcSession:id,qcReadyAt:s.contractClock+QC_COOLDOWN};
}
function finishQualityControl(s:GameState,id:string,correct:number):GameState{
 if(s.qcSession!==id)return s;
 const score=Math.max(0,Math.min(10,Math.floor(correct)));
 return {...s,qcSession:null,styleTokens:s.styleTokens+qcTokenReward(score)};
}
type QCItem={id:number;defect:'crack'|'bolt'|null};
type QCRound={index:number;correct:number;mistakes:number;done:boolean};
function judgeQuality(round:QCRound,item:QCItem,reject:boolean|null):QCRound{
 if(round.done||item.id!==round.index)return round;
 const correct=reject!==null&&reject===Boolean(item.defect);
 const next={index:round.index+1,correct:round.correct+(correct?1:0),mistakes:round.mistakes+(correct?0:1),done:false};
 next.done=next.index>=10||next.mistakes>=3;return next;
}
function QualityControlGame({session,playing,onFinish,onClose}:{session:string;playing:boolean;onFinish:(id:string,correct:number)=>void;onClose:()=>void}){
 const [items]=useState<QCItem[]>(()=>Array.from({length:10},(_,id)=>({id,defect:Math.random()<.5?null:Math.random()<.5?'crack':'bolt'})));
 const [round,setRound]=useState<QCRound>({index:0,correct:0,mistakes:0,done:false});
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const remaining=useRef(2500);
 const pick=(reject:boolean|null)=>{
   if(!playing||round.done)return;
   if(timer.current)clearTimeout(timer.current);
   setRound(v=>judgeQuality(v,items[round.index],reject));
 };
 useEffect(()=>{remaining.current=2500;},[round.index]);
 useEffect(()=>{
   if(round.done||!playing)return;
   const started=Date.now();
   timer.current=setTimeout(()=>setRound(v=>judgeQuality(v,items[round.index],null)),remaining.current);
   return()=>{if(timer.current)clearTimeout(timer.current);remaining.current=Math.max(0,remaining.current-(Date.now()-started));};
 },[round.index,round.done,playing,items]);
 useEffect(()=>{if(round.done)onFinish(session,round.correct);},[round.done,round.correct,session,onFinish]);
 const item=items[Math.min(9,round.index)];
 return <section className="qc-game" aria-label="Quality Control mini-game">
   <div className="qc-game-heading"><div><span className="eyebrow">QUALITY CONTROL</span><h2>{round.done?'Shift complete':'Inspect the next plate'}</h2></div><button type="button" className="secondary-button" onClick={onClose}>{round.done?'BACK TO THEMES':'LEAVE SHIFT'}</button></div>
   {round.done?<div className="qc-result" role="status"><b>{round.correct}/10 correct</b><h3>{qcTokenReward(round.correct)?'Nice work! +'+qcTokenReward(round.correct)+' Style Token'+(qcTokenReward(round.correct)>1?'s':''):'No tokens this time'}</h3><p>{round.mistakes>=3?'Three mistakes ended this shift. ':''}Get at least 7 correct to earn a token. A perfect shift earns 2.</p></div>:<>
    <p>Keep good plates. Reject plates with a crack or a missing corner bolt. You have 2.5 seconds per plate; three mistakes end the shift.</p>
    <div className="qc-score"><span>PLATE {round.index+1}/10</span><span>{round.correct} CORRECT</span><span>{3-round.mistakes} LIVES</span></div>
    <div className="qc-conveyor"><svg viewBox="0 0 240 160" role="img" aria-label="Inspect this plate visually: check for cracks and all four corner bolts"><rect x="40" y="20" width="160" height="120" rx="12" fill="#aab8bd" stroke="#344750" strokeWidth="6"/><rect x="58" y="38" width="124" height="84" rx="5" fill="#72868d"/>{[[56,36],[184,36],[56,124],[184,124]].map(([x,y],i)=>item.defect==='bolt'&&i===3?<circle key={i} cx={x} cy={y} r="7" fill="#253238"/>:<g key={i}><circle cx={x} cy={y} r="7" fill="#dbe7e9" stroke="#344750" strokeWidth="2"/><path d={'M'+(x-4)+' '+y+'h8'} stroke="#344750" strokeWidth="2"/></g>)}{item.defect==='crack'&&<path d="M105 20l14 27-15 15 28 21-14 19 24 38" fill="none" stroke="#2f1917" strokeWidth="6"/>}</svg><span className="qc-accessible-defect">{item.defect==='crack'?'Crack through the plate':item.defect==='bolt'?'Bottom-right bolt is missing':'All bolts present; no cracks'}</span></div>
    <div className="qc-actions"><button type="button" disabled={!playing} className="qc-reject" onClick={()=>pick(true)}>✕ REJECT</button><button type="button" disabled={!playing} className="qc-keep" onClick={()=>pick(false)}>✓ KEEP</button></div>
    <p role="status">{playing?'Factory production continues while you play.':'Shift paused with your factory. Resume the factory to continue.'}</p>
   </>}
 </section>;
}

type GameState = {
  styleTokens:number; unlockedThemes:FactoryTheme[]; theme:FactoryTheme; qcReadyAt:number; qcSession:string|null;
  qualityInspectors:number;
  flowMode:Record<IntermediateStock,StockFlowMode>; freightTier:VehicleTier; drivers:number; driverAssignments:Record<FreightRoute,number>; oreAtMine:number; copperAtMine:number; drones:number; droneAssignments:Record<FreightRoute,number>; freightRouteLevels:Record<FreightRoute,number>; freightBoostSeconds:Record<FreightRoute,number>; freightBoostReadyAt:Record<FreightRoute,number>; freightLastMined:Record<FreightRoute,number>; freightLastDelivered:Record<FreightRoute,number>; cash:number; gears:number; starterPowerCredit:number; powerShortage:boolean; gearShipmentProgress:number; ore:number; beams:number; coils:number; motors:number; ingot:number; plate:number; parts:number; copperOre:number; copperIngot:number; wire:number; circuits:number;
  miner:number; smelter:number; press:number; assembler:number; copperMiner:number; copperSmelter:number; wiremill:number; circuitpress:number; beamMill:number; coilWinder:number; motorworks:number;
  tier_miner:number; tier_smelter:number; tier_press:number; tier_assembler:number; tier_copperMiner:number; tier_copperSmelter:number; tier_wiremill:number; tier_circuitpress:number; tier_beamMill:number; tier_coilWinder:number; tier_motorworks:number;
  level:number; experience:number; sold:number; xpMigrationVersion:number; salesXpProgress:number; autoSalesXpProgress:number; mechanics:number; salespeople:number; reputation:number; acceptedContracts:string[]; contractsCompleted:string[]; repeatContractRounds:number[]; contractClock:number; nextContractOfferAt:number; contractAlert?:ContractAlert; repeatNextAt:number[]; repeatDeadline:number[]; repeatOffers:(RepeatOrder|null)[]; contractHistory:StockId[]; storyNextAt:Record<string,number>;
  lastOutput:Record<MachineId,number>; visualProgress:Record<MachineId,number>; overclocked:Record<MachineId,boolean>; unitPenalties:Record<MachineId,number[]>; pendingReplacement:Record<MachineId,number>; writeOffEvent:{id:MachineId;unit:number;oldLevel:number}|null; nextWriteOffAt:number;
  broken:Record<MachineId,number>; unitFaults:Record<MachineId,number[]>; mechanicAssignments:Record<MachineId,number>; breakdownEvent:MachineId|null; powerCutEvent:boolean; powerCutSeen:boolean; cyberAttackEvent:boolean; cyberAttackSeen:boolean; cybersecuritySpecialists:number;
  salesTarget:StockId; autoSell:boolean; salesAssignments:Record<StockId,number>; boostSeconds:Record<BoostId,number>; capitalLevels:Record<CapitalId,number>; capitalSpent:number; charityTotal:number; charityCount:number; charityMilestonesClaimed:number; charityHistory:CharityDonation[]; missionsClaimed:number[]; researched:string[];
};
const SAVE_KEY = 'ironworks-tycoon-save-v2';
const fresh:GameState = {
  styleTokens:0,unlockedThemes:['workshop'],theme:'workshop',qcReadyAt:0,qcSession:null,qualityInspectors:0,
  flowMode:{ingot:'balanced',wire:'balanced'},freightTier:0,drivers:0,driverAssignments:{iron:0,copper:0},oreAtMine:0,copperAtMine:0,drones:0,droneAssignments:{iron:0,copper:0},freightRouteLevels:{iron:0,copper:0},freightBoostSeconds:{iron:0,copper:0},freightBoostReadyAt:{iron:0,copper:0},freightLastMined:{iron:0,copper:0},freightLastDelivered:{iron:0,copper:0},cash:0,gears:0,starterPowerCredit:15,powerShortage:false,gearShipmentProgress:0,ore:0,beams:0,coils:0,motors:0,ingot:0,plate:0,parts:0,copperOre:0,copperIngot:0,wire:0,circuits:0,
  miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0,
  tier_miner:0,tier_smelter:0,tier_press:0,tier_assembler:0,tier_copperMiner:0,tier_copperSmelter:0,tier_wiremill:0,tier_circuitpress:0,tier_beamMill:0,tier_coilWinder:0,tier_motorworks:0,
  level:1,experience:0,sold:0,xpMigrationVersion:1,salesXpProgress:0,autoSalesXpProgress:0,mechanics:0,salespeople:0,
  lastOutput:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0},visualProgress:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0},
  overclocked:{miner:false,smelter:false,press:false,assembler:false,copperMiner:false,copperSmelter:false,wiremill:false,circuitpress:false,beamMill:false,coilWinder:false,motorworks:false},
  unitPenalties:{miner:[],smelter:[],press:[],assembler:[],copperMiner:[],copperSmelter:[],wiremill:[],circuitpress:[],beamMill:[],coilWinder:[],motorworks:[]},pendingReplacement:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0},writeOffEvent:null,nextWriteOffAt:900,
  broken:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0},unitFaults:{miner:[],smelter:[],press:[],assembler:[],copperMiner:[],copperSmelter:[],wiremill:[],circuitpress:[],beamMill:[],coilWinder:[],motorworks:[]},
  mechanicAssignments:{miner:0,smelter:0,press:0,assembler:0,copperMiner:0,copperSmelter:0,wiremill:0,circuitpress:0,beamMill:0,coilWinder:0,motorworks:0},breakdownEvent:null,powerCutEvent:false,powerCutSeen:false,cyberAttackEvent:false,cyberAttackSeen:false,cybersecuritySpecialists:0,
  salesTarget:'parts',autoSell:false,salesAssignments:{ore:0,ingot:0,plate:0,parts:0,copperOre:0,copperIngot:0,wire:0,circuits:0,beams:0,coils:0,motors:0},boostSeconds:{production:0,dispatch:0,protection:0},capitalLevels:{powerGrid:0,miningNetwork:0,freightNetwork:0,safetySystems:0},capitalSpent:0,charityTotal:0,charityCount:0,charityMilestonesClaimed:0,charityHistory:[],missionsClaimed:[],researched:[],reputation:0,acceptedContracts:[],contractsCompleted:[],repeatContractRounds:[0,0,0],contractClock:0,nextContractOfferAt:180,repeatNextAt:[180,360,540],repeatDeadline:[0,0,0],repeatOffers:[null,null,null],contractHistory:[],storyNextAt:{}
};
const machines:{id:MachineId;name:string;short:string;cost:number;desc:string;input:string;output:string;rate:number}[]=[
  {id:'miner',name:'Rockbreaker Mine',short:'EXTRACT',cost:50,desc:'Breaks rock into raw ore.',input:'Raw ore',output:'Raw ore',rate:.22},
  {id:'smelter',name:'Blast Furnace',short:'SMELT',cost:180,desc:'Melts ore into iron ingots.',input:'Raw ore',output:'Iron ingots',rate:.16},
  {id:'press',name:'Stamping Press',short:'PRESS',cost:600,desc:'Shapes ingots into metal plates.',input:'Iron ingots',output:'Metal plates',rate:.09},
  {id:'assembler',name:'Mech Assembly',short:'ASSEMBLE',cost:1600,desc:'Builds finished precision parts.',input:'Metal plates',output:'Precision parts',rate:.055},
  {id:'copperMiner',name:'Copper Excavator',short:'COPPER MINE',cost:1100,desc:'Extracts copper ore for the electrical production line.',input:'Copper seam',output:'Copper ore',rate:.26},
  {id:'copperSmelter',name:'Copper Foundry',short:'COPPER SMELT',cost:2500,desc:'Refines copper ore into conductive ingots.',input:'Copper ore',output:'Copper ingots',rate:.18},
  {id:'wiremill',name:'Wire Drawing Mill',short:'WIRE DRAW',cost:6000,desc:'Draws copper ingots into fine electrical wire.',input:'Copper ingots',output:'Copper wire',rate:.12},
  {id:'circuitpress',name:'Circuit Board Line',short:'CIRCUITS',cost:12000,desc:'Builds circuit boards from precision electrical wire.',input:'Copper wire',output:'Circuit boards',rate:.07},
  {id:'beamMill',name:'Beam Rolling Mill',short:'STEEL BEAMS',cost:2500,desc:'Rolls iron ingots into structural steel beams.',input:'Iron ingots',output:'Steel beams',rate:.075},
  {id:'coilWinder',name:'Coil Winding Machine',short:'COPPER COILS',cost:8000,desc:'Winds copper wire into precision electrical coils.',input:'Copper wire',output:'Copper coils',rate:.065},
  {id:'motorworks',name:'Electric Motor Works',short:'MOTOR WORKS',cost:120000,desc:'Heavy-duty assembly line. Each motor uses 2 Copper Coils and 1 Circuit Board. Uses substantial electricity.',input:'2 Copper Coils + 1 Circuit Board',output:'Electric Motors',rate:.04}
];
const goods:{id:StockId;name:string;emoji:string;price:number;detail:string}[]=[
  {id:'ore',name:'Raw Ore',emoji:'🪨',price:5,detail:'Fresh from the mine'},
  {id:'ingot',name:'Iron Ingots',emoji:'🧱',price:14,detail:'Smelted and ready'},
  {id:'plate',name:'Metal Plates',emoji:'🔩',price:36,detail:'Pressed steel stock'},
  {id:'parts',name:'Precision Parts',emoji:'🧰',price:105,detail:'Premium finished goods'},
  {id:'copperOre',name:'Copper Ore',emoji:'🟠',price:6,detail:'Raw copper from the new excavation line'},
  {id:'copperIngot',name:'Copper Ingots',emoji:'🟤',price:18,detail:'Refined conductive metal'},
  {id:'wire',name:'Copper Wire',emoji:'🧵',price:48,detail:'Drawn wire for electrical manufacturing'},
  {id:'circuits',name:'Circuit Boards',emoji:'🟩',price:140,detail:'High-value electrical components'},
  {id:'beams',name:'Steel Beams',emoji:'🏗️',price:85,detail:'Structural steel for major construction projects'},
  {id:'coils',name:'Copper Coils',emoji:'🌀',price:110,detail:'Wound electrical coils for motors and generators'},
  {id:'motors',name:'Electric Motors',emoji:'⚙️',price:4200,detail:'Flagship high-power industrial electric motors'}
];
const contracts:{id:string;name:string;detail:string;good:StockId;qty:number;reward:number;rep:number;xp:number;minRep:number}[]=[
  {id:'first-ore',name:'First Ore Delivery',detail:'A nearby foundry advances your first machine purchase, then pays the balance when you deliver five raw ore.',good:'ore',qty:5,reward:85,rep:5,xp:25,minRep:0},
  {id:'foundry-batch',name:'Foundry Batch',detail:'Supply a run of iron ingots.',good:'ingot',qty:8,reward:180,rep:7,xp:35,minRep:5},
  {id:'steel-plates',name:'Steel Plate Consignment',detail:'A construction firm needs steel plates.',good:'plate',qty:6,reward:360,rep:10,xp:45,minRep:12},
  {id:'precision-order',name:'Precision Components',detail:'A machinery customer wants precision parts.',good:'parts',qty:4,reward:650,rep:15,xp:60,minRep:22},
  {id:'copper-delivery',name:'Copper Ore Delivery',detail:'An electrical foundry needs copper.',good:'copperOre',qty:10,reward:700,rep:12,xp:50,minRep:25},
  {id:'wire-contract',name:'Electrical Wire Contract',detail:'Wire for a regional infrastructure project.',good:'wire',qty:6,reward:1100,rep:20,xp:65,minRep:40},
  {id:'circuit-contract',name:'Circuit Board Supply',detail:'A technology manufacturer needs circuits.',good:'circuits',qty:4,reward:1800,rep:30,xp:80,minRep:60},
  {id:'structural-steel',name:'Construction Steel Order',detail:'A building contractor needs a shipment of Steel Beams for a major project.',good:'beams',qty:10,reward:1120,rep:12,xp:55,minRep:18},
  {id:'generator-coils',name:'Generator Coil Order',detail:'An energy equipment firm needs Copper Coils for electric motors.',good:'coils',qty:8,reward:1440,rep:18,xp:75,minRep:50},
  {id:'motor-fleet',name:'Industrial Motor Fleet',detail:'An electrification programme needs six industrial electric motors for heavy machinery.',good:'motors',qty:6,reward:32000,rep:55,xp:220,minRep:190}
];
const contractProducer:Record<StockId,MachineId>={ore:'miner',ingot:'smelter',plate:'press',parts:'assembler',copperOre:'copperMiner',copperIngot:'copperSmelter',wire:'wiremill',circuits:'circuitpress',beams:'beamMill',coils:'coilWinder',motors:'motorworks'};
type OrderLine={good:StockId;qty:number};
type ContractDifficulty='easy'|'standard'|'hard'|'rush';
type ContractAlert={id:string;tone:'good'|'bad';message:string};
type RepeatOrder={id:string;slot:number;round:number;name:string;detail:string;good:StockId;qty:number;items:OrderLine[];reward:number;rep:number;xp:number;kind:string;due:number;difficulty?:ContractDifficulty;issuedAt?:number;expiresAt?:number;estimatedSeconds?:number;latePenalized?:boolean};
const CONTRACT_TERMS={
  easy:{label:'EASY',premium:1.2,work:100,slack:2.7,minimum:480,grace:420,floor:.65,rep:2},
  standard:{label:'STANDARD',premium:1.5,work:180,slack:2,minimum:360,grace:300,floor:.55,rep:3},
  hard:{label:'HARD',premium:1.9,work:300,slack:1.55,minimum:300,grace:240,floor:.45,rep:5},
  rush:{label:'RUSH',premium:2.3,work:65,slack:1.3,minimum:120,grace:150,floor:.35,rep:4}
} as const;
const contractWait=(slot:number,round:number)=>240+slot*45+(round%4)*30;
const orderDifficulty=(o:RepeatOrder):ContractDifficulty=>o.difficulty&&o.difficulty in CONTRACT_TERMS?o.difficulty:'standard';
const orderExpiry=(o:RepeatOrder)=>o.expiresAt??o.due+CONTRACT_TERMS[orderDifficulty(o)].grace;
const orderPayout=(o:RepeatOrder,clock:number)=>{
  if(clock>=orderExpiry(o))return 0;
  if(clock<=o.due)return o.reward;
  const terms=CONTRACT_TERMS[orderDifficulty(o)];
  const late=Math.min(1,(clock-o.due)/Math.max(1,orderExpiry(o)-o.due));
  return Math.max(1,Math.floor(o.reward*(1-(1-terms.floor)*late)));
};
function generateRepeatOrders(s:GameState):RepeatOrder[]{
  return (s.repeatOffers||[]).filter((o):o is RepeatOrder=>!!o&&s.contractClock<orderExpiry(o));
}
const contractRecipes:Partial<Record<StockId,OrderLine[]>>={
  ingot:[{good:'ore',qty:1}],plate:[{good:'ingot',qty:1}],parts:[{good:'plate',qty:1}],
  copperIngot:[{good:'copperOre',qty:1}],wire:[{good:'copperIngot',qty:1}],
  circuits:[{good:'wire',qty:1}],beams:[{good:'ingot',qty:1}],coils:[{good:'wire',qty:1}],
  motors:[{good:'coils',qty:2},{good:'circuits',qty:1}]
};
// Serial planning is deliberately conservative: stock is allocated once, then
// every input and working producer is checked, including freight and flow modes.
function estimateContractSeconds(s:GameState,items:OrderLine[],commitments=true):number{
  const stock=Object.fromEntries(goods.map(g=>[g.id,Math.max(0,s[g.id])])) as Record<StockId,number>;
  let seconds=0;
  const make=(id:StockId,qty:number):boolean=>{
    const used=Math.min(stock[id],qty);stock[id]-=used;const missing=qty-used;
    if(missing<=1e-7)return true;
    const machine=contractProducer[id];
    let rate=machineCapacity(s,machine,1,false);
    if(id==='ore'||id==='copperOre'){
      const route=id==='ore'?'iron':'copper';
      const freight=freightThroughput(s,route)/(s.freightBoostSeconds[route]>0?2:1);
      rate=Math.min(rate,freight);
    }
    if(rate<=0)return false;
    for(const line of contractRecipes[id]||[]){
      if((line.good==='ingot'||line.good==='wire')&&s.flowMode[line.good]==='stockpile'){
        if(stock[line.good]+1e-7<missing*line.qty)return false;
      }
      if(!make(line.good,missing*line.qty))return false;
    }
    // Shared ingot/wire lines must share their upstream output.
    if(id==='plate'||id==='beams')rate*=s.flowMode.ingot==='balanced'?.45:1;
    if(id==='circuits'||id==='coils')rate*=s.flowMode.wire==='balanced'?.45:1;
    seconds+=missing/rate;
    return true;
  };
  if(commitments){
    const promised=generateRepeatOrders(s).flatMap(o=>o.items);
    const story=contracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.reputation>=c.minRep&&s[contractProducer[c.good]]>0).map(c=>({good:c.good,qty:c.qty}));
    for(const line of [...promised,...story])if(!make(line.good,line.qty))return Infinity;
  }
  for(const line of items)if(!make(line.good,line.qty))return Infinity;
  return Math.ceil(seconds);
}
type ContractBrief={client:string;title:string;reason:string};
const contractBriefs:Record<StockId,ContractBrief[]>={
  ore:[{client:'Northbank Foundry',title:'Furnace feedstock',reason:'Keep our iron furnace supplied for the next casting shift.'},{client:'Stonebridge Metals',title:'Trial smelting batch',reason:'Our metallurgist needs raw ore to test a fresh casting recipe.'},{client:'Railhead Smelting',title:'Weekend furnace stock',reason:'Replenish our raw-material bunker before the weekend shift.'}],
  ingot:[{client:'Pennyworth Toolmakers',title:'Tool-steel blanks',reason:'Iron ingots are needed for a run of workshop tools.'},{client:'Northern Forge',title:'Forge replenishment',reason:'Restock our forge with iron ingots for the next forging run.'},{client:'Anchor Castings',title:'Replacement casting stock',reason:'We need iron ingots to cast replacement pump housings.'}],
  plate:[{client:'Harbour Fabrication',title:'Dockside repair panels',reason:'Metal plates will patch worn loading-bay panels.'},{client:'Cedar Enclosures',title:'Cabinet production run',reason:'Supply metal plates for a batch of industrial equipment cabinets.'},{client:'Midtown Coachworks',title:'Vehicle body panels',reason:'Our repair shop needs metal plates for replacement bodywork.'}],
  parts:[{client:'Regional Repairs',title:'Workshop spares',reason:'Precision parts will repair our customers’ worn machinery.'},{client:'Atlas Machinery',title:'Assembly-line components',reason:'We need precision parts to finish a machinery assembly run.'},{client:'Harbour Maintenance',title:'Crane service kit',reason:'Deliver precision parts for scheduled cargo-crane servicing.'}],
  copperOre:[{client:'Redbank Refinery',title:'Copper refining batch',reason:'Our refinery needs copper ore for its next refining run.'},{client:'Coppergate Smelting',title:'Foundry raw materials',reason:'Replenish copper ore before we fire the next furnace batch.'},{client:'Conductive Metals Lab',title:'Copper ore sampling',reason:'Supply copper ore for a pilot refining trial.'}],
  copperIngot:[{client:'Westbank Cable',title:'Conductor feedstock',reason:'Copper ingots will feed our electrical cable production line.'},{client:'Orchard Metalworks',title:'Copper casting stock',reason:'We need copper ingots to cast conductive fittings.'},{client:'Northline Busbars',title:'Power distribution stock',reason:'Supply copper ingots for industrial busbar manufacturing.'}],
  wire:[{client:'Townline Electrical',title:'Workshop rewiring',reason:'Copper wire is needed to rewire a factory workshop.'},{client:'Signal & Switch',title:'Control cabinet wiring',reason:'Supply copper wire for our next control-cabinet batch.'},{client:'Harbour Electrics',title:'Dockside cable repairs',reason:'Replace damaged copper wiring in dockside equipment.'}],
  circuits:[{client:'Switchboard Controls',title:'Control board assembly',reason:'Circuit boards will finish a batch of machine controllers.'},{client:'Precision Automation',title:'Sensor controller repair',reason:'Replace failed circuit boards in our automation controllers.'},{client:'Northbank Instruments',title:'Instrument electronics',reason:'Supply circuit boards for industrial measuring instruments.'}],
  beams:[{client:'Municipal Works',title:'Walkway support steel',reason:'Steel beams will support a new maintenance walkway.'},{client:'Harbour Construction',title:'Warehouse framework',reason:'Supply steel beams for a warehouse extension.'},{client:'Stonebridge Builders',title:'Loading platform supports',reason:'Steel beams are needed for replacement loading-platform supports.'}],
  coils:[{client:'Field & Rotor',title:'Generator winding kits',reason:'Copper coils are needed to rebuild industrial generators.'},{client:'Northern Electromagnets',title:'Magnet winding batch',reason:'Supply copper coils for industrial lifting magnets.'},{client:'Pump & Drive Services',title:'Motor rewinding stock',reason:'Replace worn copper coils during a motor overhaul.'}],
  motors:[{client:'Harbour Handling',title:'Conveyor drive replacement',reason:'Electric motors will replace failed warehouse conveyor drives.'},{client:'Civic Waterworks',title:'Pump drive upgrade',reason:'Supply electric motors for a pumping-station upgrade.'},{client:'Atlas Automation',title:'New production-cell drives',reason:'Our new automated production cells need electric motors.'}]
};
function issueRepeatOrder(s:GameState,slot:number):RepeatOrder|null{
  if(!s.contractsCompleted.includes('first-ore')||s.powerShortage)return null;
  const available=goods.filter(g=>s[contractProducer[g.id]]>0&&
    !((g.id==='ingot'||g.id==='wire')&&s.flowMode[g.id]==='feed')&&
    Number.isFinite(estimateContractSeconds(s,[{good:g.id,qty:2}],false)));
  if(!available.length)return null;
  const round=s.repeatContractRounds[slot]||0;
  const occupied=generateRepeatOrders(s).flatMap(o=>o.items.map(line=>line.good));
  const recent=s.contractHistory.slice(-2);
  const preferred=available.filter(g=>!occupied.includes(g.id)&&!recent.includes(g.id));
  const pool=preferred.length?preferred:available.filter(g=>!occupied.includes(g.id));
  const choices=pool.length?pool:available;
  const seed=round*7+slot*3+Math.floor(s.contractClock/180);
  const first=choices[seed%choices.length];
  const cycle:ContractDifficulty[]=['easy','standard','easy','hard','standard','rush'];
  const difficulty=cycle[(round+slot*2)%cycle.length];const terms=CONTRACT_TERMS[difficulty];
  const variation=[.7,1,1.3,.85,1.15][seed%5];
  const quantity=(g:typeof goods[number],fraction:number)=>{
    const empty={...s,[g.id]:0};
    const perUnit=Math.max(1,estimateContractSeconds(empty,[{good:g.id,qty:1}],false));
    return Math.max(2,Math.min(250,Math.floor(terms.work*variation*fraction/perUnit)));
  };
  const items:OrderLine[]=[{good:first.id,qty:quantity(first,1)}];
  const family:StockId[]= ['ingot','plate','parts','beams'].includes(first.id)?['ingot','plate','parts','beams']:
    ['copperIngot','wire','circuits','coils','motors'].includes(first.id)?['copperIngot','wire','circuits','coils','motors']:[];
  const others=available.filter(g=>g.id!==first.id&&family.includes(g.id));
  if(others.length&&(difficulty==='hard'||(difficulty==='standard'&&seed%3===0))){
    const second=others[seed%others.length];items.push({good:second.id,qty:quantity(second,.55)});
  }
  // Reduce oversized batches if a finite upstream buffer is the only supply.
  while(!Number.isFinite(estimateContractSeconds(s,items,false))&&items.some(line=>line.qty>2)){
    items.forEach(line=>{line.qty=Math.max(2,Math.floor(line.qty*.7));});
  }
  const estimated=estimateContractSeconds(s,items);
  if(!Number.isFinite(estimated)||estimated>1800)return null;
  const duration=Math.max(terms.minimum,Math.ceil(estimated*terms.slack+45));
  const brief=contractBriefs[first.id][(round+slot)%contractBriefs[first.id].length];
  const list=items.map(line=>line.qty+' '+goods.find(g=>g.id===line.good)!.name.toLowerCase()).join(' and ');
  const detail=brief.reason+' Requested: '+list+'. '+(items.length>1?'Send both materials together as one shipment. ':'')+
    (difficulty==='rush'?'Our line is waiting: a rush premium is included.':difficulty==='easy'?'Flexible delivery window; a smaller, lower-paying job.':difficulty==='hard'?'A larger commitment with a higher payout and tighter schedule.':'A regular supply order with a balanced delivery window.');
  return {id:slot+'-'+round,slot,round,name:brief.client+' · '+brief.title,detail,good:first.id,qty:items[0].qty,items,
    reward:Math.ceil(items.reduce((v,line)=>v+line.qty*goods.find(g=>g.id===line.good)!.price,0)*terms.premium),
    rep:terms.rep,xp:Math.round(15+items.length*7+terms.work/12),kind:terms.label+' CONTRACT',difficulty,
    issuedAt:s.contractClock,estimatedSeconds:estimated,due:s.contractClock+duration,expiresAt:s.contractClock+duration+terms.grace};
}
const orderReady=(s:GameState,order:RepeatOrder)=>order.items.every(line=>s[line.good]+1e-7>=line.qty);
function updateContractOffers(s:GameState):GameState{
  const n={...s,repeatOffers:[...s.repeatOffers],repeatNextAt:[...s.repeatNextAt],repeatContractRounds:[...s.repeatContractRounds],contractHistory:[...s.contractHistory]};
  const slots=n.experience>=500?3:n.experience>=150?2:1;
  let lateCount=0,expiredCount=0;
  for(let slot=0;slot<3;slot++){
    const active=n.repeatOffers[slot];
    if(active){
      if(n.contractClock>active.due&&!active.latePenalized){
        n.repeatOffers[slot]={...active,latePenalized:true};n.reputation=Math.max(0,n.reputation-2);lateCount++;
      }
      if(n.contractClock>=orderExpiry(active)){
        n.repeatOffers[slot]=null;n.reputation=Math.max(0,n.reputation-1);expiredCount++;
        n.repeatContractRounds[slot]++;n.repeatNextAt[slot]=n.contractClock+contractWait(slot,n.repeatContractRounds[slot]);
      }
    }else if(slot<slots&&n.contractClock>=n.repeatNextAt[slot]&&n.contractClock>=n.nextContractOfferAt){
      const offer=issueRepeatOrder(n,slot);
      if(offer){n.repeatOffers[slot]=offer;n.contractHistory=[...n.contractHistory,...offer.items.map(line=>line.good)].slice(-6);n.nextContractOfferAt=n.contractClock+150+(n.repeatContractRounds[slot]%3)*30;}
      else n.repeatNextAt[slot]=n.contractClock+45;
    }
  }
  if(expiredCount||lateCount)n.contractAlert={id:'deadline-'+n.contractClock,tone:'bad',message:expiredCount?expiredCount+' order'+(expiredCount>1?'s':'')+' expired · −3 REP total each':lateCount+' order'+(lateCount>1?'s':'')+' late · −2 REP each; payout falling'};
  return n;
}
function deliverRepeatOrder(s:GameState,order:RepeatOrder):GameState{
  const current=s.repeatOffers[order.slot];
  if(!current||current.id!==order.id||s.contractClock>=orderExpiry(current)||!orderReady(s,current))return s;
  const late=s.contractClock>current.due;const payout=orderPayout(current,s.contractClock);
  const n={...s,cash:s.cash+payout,reputation:Math.max(0,s.reputation+(late?(current.latePenalized?0:-2):current.rep)),experience:s.experience+current.xp,
    repeatOffers:s.repeatOffers.map((o,i)=>i===order.slot?null:o),repeatContractRounds:s.repeatContractRounds.map((r,i)=>i===order.slot?r+1:r),
    repeatNextAt:s.repeatNextAt.map((at,i)=>i===order.slot?s.contractClock+contractWait(i,s.repeatContractRounds[i]):at),
    contractAlert:{id:'delivered-'+current.id+'-'+s.contractClock,tone:late?'bad' as const:'good' as const,message:late?'Late delivery · '+payout+' RVT; −2 REP total':'Delivered · +'+payout+' RVT · +'+current.rep+' REP'}};
  for(const line of current.items)n[line.good]-=line.qty;
  return n;
}

function closeRepeatOrder(s:GameState,order:RepeatOrder):GameState{
  const current=s.repeatOffers[order.slot];if(!current||current.id!==order.id)return s;
  const late=s.contractClock>current.due;
  const expired=s.contractClock>=orderExpiry(current);
  const penalty=expired?(current.latePenalized?1:3):late?(current.latePenalized?0:2):1;
  return {...s,reputation:Math.max(0,s.reputation-penalty),repeatOffers:s.repeatOffers.map((o,i)=>i===order.slot?null:o),
    repeatContractRounds:s.repeatContractRounds.map((r,i)=>i===order.slot?r+1:r),
    repeatNextAt:s.repeatNextAt.map((at,i)=>i===order.slot?s.contractClock+contractWait(i,s.repeatContractRounds[i]):at),
    contractAlert:{id:'declined-'+current.id+'-'+s.contractClock,tone:'bad',message:expired?'Expired order closed · −3 REP total':late?'Late order closed · −2 REP total':'Order declined · −1 REP'}};
}
const contractStockTarget=(state:GameState,id:StockId)=>{
  const repeat=(state.repeatOffers||[]).filter((o):o is RepeatOrder=>!!o&&state.contractClock<orderExpiry(o))
    .flatMap(o=>o.items.filter(line=>line.good===id).map(line=>line.qty)).reduce((sum,qty)=>sum+qty,0);
  const story=Math.max(0,...contracts.filter(c=>c.good===id&&!state.contractsCompleted.includes(c.id)
    &&state.reputation>=c.minRep&&state[contractProducer[id]]>0).map(c=>c.qty));
  return repeat+story;
};
// Offer a reminder only for complete units not promised to customer orders.
function stockSaleReminder(state:GameState){
  const multiplier=state.researched.includes('market-intelligence')?1.2:1;
  const items=goods.map(g=>({good:g.id,qty:Math.floor(Math.max(0,state[g.id]-contractStockTarget(state,g.id))),price:g.price}))
    .filter(item=>item.qty>0);
  return {items,units:items.reduce((sum,item)=>sum+item.qty,0),value:Math.floor(items.reduce((sum,item)=>sum+item.qty*item.price*multiplier,0))};
}
function sellSurplusStock(state:GameState):GameState{
  const batch=stockSaleReminder(state);
  if(!batch.units)return state;
  const multiplier=state.researched.includes('market-intelligence')?1.2:1;
  const revenue=batch.items.reduce((sum,item)=>sum+item.qty*item.price*multiplier,0);
  const progress=state.salesXpProgress+revenue;
  const xp=Math.floor((progress+1e-8)/25);
  const gearGain=shipmentGearGain(state,batch.items.reduce((sum,item)=>sum+finishedGearUnits(item.good,item.qty),0));
  const next={...state,cash:state.cash+revenue,sold:state.sold+revenue,
    experience:state.experience+xp,salesXpProgress:progress-xp*25,
    gears:state.gears+gearGain.earned,gearShipmentProgress:gearGain.remainder};
  for(const item of batch.items)next[item.good]-=item.qty;
  return next;
}
const downstreamMaterialAvailable=(state:GameState,id:IntermediateStock,amount:number,made:number)=>{
  const mode=state.flowMode[id]||'balanced';
  if(mode==='stockpile')return 0;
  if(mode==='feed')return amount;
  // In Split mode, save 55% of newly made material while filling a contract
  // or a two-unit warehouse buffer. The other 45% keeps the line moving.
  const target=Math.max(2,contractStockTarget(state,id));
  const surplus=Math.max(0,amount-target);
  return Math.min(amount,surplus+Math.min(made*.45,amount));
};
// Two lines share the same input fairly according to installed productive capacity.
// When one line is slower, its unused allocation flows to the other line.
const splitMachineSupply=(available:number,firstDemand:number,secondDemand:number):[number,number]=>{
  if(available<=0)return [0,0];
  const a=Math.max(0,firstDemand),b=Math.max(0,secondDemand);
  if(a+b<=available)return [a,b];
  if(a+b<=0)return [0,0];
  const first=Math.min(a,available*a/(a+b));
  const second=Math.min(b,available-first);
  return [first,second];
};
const OVERCLOCK_OUTPUT=1.5;
const OVERCLOCK_ELECTRICITY=3;
const MACHINE_BASE_RATE:Record<MachineId,number>={
  miner:.35,smelter:.22,press:.12,assembler:.07,copperMiner:.26,
  copperSmelter:.18,wiremill:.12,circuitpress:.07,beamMill:.075,
  coilWinder:.065,motorworks:.04
};
const machineCapacity=(state:GameState,id:MachineId,speed:number,boosted:boolean)=>{
  const staff=state.unitFaults[id]||[];
  const effectiveUnits=staff.slice(0,state[id]).reduce((total,fault,index)=>
    total+(fault>0?0:1+Math.max(0,state[`tier_${id}`]-(state.unitPenalties[id]?.[index]||0))*.25),0);
  const research=(state.researched.includes('efficient-extraction')?1.15:1)*
    (state.researched.includes('precision-tooling')?1.3:1)*
    (state.researched.includes('smart-robotics')?1.2:1);
  const mine=(id==='miner'||id==='copperMiner')?1+state.capitalLevels.miningNetwork*.06:1;
  return effectiveUnits*MACHINE_BASE_RATE[id]*research*speed*(boosted?1.3:1)*(state.qualityInspectors>0&&['press','assembler','beamMill','wiremill','circuitpress','coilWinder','motorworks'].includes(id)?1+Math.min(2,state.qualityInspectors)*.08:1)*
    (state.overclocked[id]?OVERCLOCK_OUTPUT:1)*mine;
};
function loadGame():GameState{
  try{
    const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    const completed=Array.isArray(saved.contractsCompleted)?saved.contractsCompleted:[];
    const shouldRecoverPowerCut=completed.includes('first-ore')&&!saved.powerCutSeen&&!saved.powerCutEvent;
    const shouldRecoverCyberAttack=Number(saved.assembler)>0&&!saved.cyberAttackSeen&&!saved.cyberAttackEvent;
    const missionXp:Record<number,number>={1:10,2:15,3:15,4:20,5:20,6:25,7:20,8:25,9:30,10:35,11:40,12:45,13:50,14:60};
    const legacyXpFromContracts=completed.reduce((total:string|number,id:string)=>Number(total)+(contracts.find(c=>c.id===id)?.xp||0),0);
    const legacyXpFromMissions=(Array.isArray(saved.missionsClaimed)?saved.missionsClaimed:[]).reduce((total:number,id:number)=>total+(missionXp[id]||0),0);
    const migratedExperience=saved.experience!==undefined?Math.max(0,Number(saved.experience)||0):Math.max(legacyXpFromContracts+legacyXpFromMissions,Number(saved.assembler)>0?270:Number(saved.press)>0?165:Number(saved.smelter)>0?60:Number(saved.miner)>0?25:0);
    const legacyShipmentXp=saved.xpMigrationVersion===undefined?Math.floor(Math.max(0,Number(saved.sold)||0)/500):0;
    return {...fresh,...saved,...normaliseStyle(saved),
      qualityInspectors:Math.max(0,Math.min(2,Math.floor(Number(saved.qualityInspectors)||0))),
      freightTier:Math.max(0,Math.min(3,Math.floor(Number(saved.freightTier)||0))) as VehicleTier,
      drivers:saved.drivers!==undefined?Math.max(0,Math.floor(Number(saved.drivers)||0)):(Number(saved.copperMiner)>0?2:Number(saved.miner)>0||(completed.includes('first-ore')||saved.acceptedContracts?.includes('first-ore'))?1:0),
      driverAssignments:{
        iron:saved.driverAssignments?Math.max(0,Math.floor(Number(saved.driverAssignments.iron)||0)):(Number(saved.miner)>0||(completed.includes('first-ore')||saved.acceptedContracts?.includes('first-ore'))?1:0),
        copper:saved.driverAssignments?Math.max(0,Math.floor(Number(saved.driverAssignments.copper)||0)):(Number(saved.copperMiner)>0?1:0)
      },
      drones:Math.max(0,Math.min(20,Math.floor(Number(saved.drones)||0))),
      droneAssignments:{
        iron:Math.max(0,Math.floor(Number(saved.droneAssignments?.iron)||0)),
        copper:Math.max(0,Math.floor(Number(saved.droneAssignments?.copper)||0))
      },
      freightRouteLevels:{iron:Math.max(0,Math.min(5,Math.floor(Number(saved.freightRouteLevels?.iron)||0))),copper:Math.max(0,Math.min(5,Math.floor(Number(saved.freightRouteLevels?.copper)||0)))},
      freightBoostSeconds:{iron:Math.max(0,Math.floor(Number(saved.freightBoostSeconds?.iron)||0)),copper:Math.max(0,Math.floor(Number(saved.freightBoostSeconds?.copper)||0))},
      freightBoostReadyAt:{iron:Math.max(0,Math.floor(Number(saved.freightBoostReadyAt?.iron)||0)),copper:Math.max(0,Math.floor(Number(saved.freightBoostReadyAt?.copper)||0))},
      freightLastMined:{iron:Math.max(0,Number(saved.freightLastMined?.iron)||0),copper:Math.max(0,Number(saved.freightLastMined?.copper)||0)},
      freightLastDelivered:{iron:Math.max(0,Number(saved.freightLastDelivered?.iron)||0),copper:Math.max(0,Number(saved.freightLastDelivered?.copper)||0)},
      oreAtMine:Math.max(0,Number(saved.oreAtMine)||0),
      copperAtMine:Math.max(0,Number(saved.copperAtMine)||0),
      capitalLevels:{powerGrid:Math.max(0,Math.min(6,Math.floor(Number(saved.capitalLevels?.powerGrid)||0))),miningNetwork:Math.max(0,Math.min(6,Math.floor(Number(saved.capitalLevels?.miningNetwork)||0))),freightNetwork:Math.max(0,Math.min(6,Math.floor(Number(saved.capitalLevels?.freightNetwork)||0))),safetySystems:Math.max(0,Math.min(6,Math.floor(Number(saved.capitalLevels?.safetySystems)||0)))},capitalSpent:Math.max(0,Number(saved.capitalSpent)||0),
      charityTotal:Math.max(0,Number(saved.charityTotal)||0),
      charityCount:Math.max(0,Math.floor(Number(saved.charityCount)||0)),
      charityMilestonesClaimed:Math.floor(Math.max(0,Number(saved.charityTotal)||0)/100000),
      charityHistory:Array.isArray(saved.charityHistory)?saved.charityHistory.filter((entry:any)=>entry&&['apprenticeships','community','environment','relief'].includes(entry.cause)&&Number(entry.amount)>0).slice(-5).map((entry:any)=>({cause:entry.cause,amount:Math.max(0,Math.floor(Number(entry.amount)||0)),rep:Math.max(0,Math.floor(Number(entry.rep)||0)),at:Math.max(0,Math.floor(Number(entry.at)||0))})):[],
      flowMode:{ingot:['balanced','stockpile','feed'].includes(saved.flowMode?.ingot)?saved.flowMode.ingot:'balanced',wire:['balanced','stockpile','feed'].includes(saved.flowMode?.wire)?saved.flowMode.wire:'balanced'},starterPowerCredit:Math.max(0,Number(saved.starterPowerCredit??15)||0),powerShortage:Boolean(saved.powerShortage),xpMigrationVersion:1,gearShipmentProgress:Math.max(0,Number(saved.gearShipmentProgress)||0)%GEARS_PER_FINISHED_UNITS,salesXpProgress:Math.max(0,Number(saved.salesXpProgress)||0)%25,autoSalesXpProgress:Math.max(0,Number(saved.autoSalesXpProgress)||0)%60,lastOutput:{...fresh.lastOutput,...saved.lastOutput},visualProgress:{...fresh.visualProgress,...saved.visualProgress},overclocked:Object.fromEntries(machines.map(m=>[m.id,Boolean(saved.overclocked?.[m.id])])) as Record<MachineId,boolean>,unitPenalties:Object.fromEntries(machines.map(m=>[m.id,Array.from({length:Math.max(0,Number(saved[m.id])||0)},(_,i)=>Math.max(0,Number(saved.unitPenalties?.[m.id]?.[i])||0))])) as Record<MachineId,number[]>,pendingReplacement:{...fresh.pendingReplacement,...saved.pendingReplacement},writeOffEvent:saved.writeOffEvent??null,nextWriteOffAt:Math.max(900,Number(saved.nextWriteOffAt)||900),broken:{...fresh.broken,...saved.broken},unitFaults:Object.fromEntries(machines.map(m=>[m.id,Array.from({length:Math.max(0,Number(saved[m.id])||0)},(_,i)=>Math.max(0,Number(saved.unitFaults?.[m.id]?.[i]??(i===0?saved.broken?.[m.id]:0))||0))])) as Record<MachineId,number[]>,mechanicAssignments:{...fresh.mechanicAssignments,...saved.mechanicAssignments},breakdownEvent:saved.breakdownEvent??null,powerCutEvent:shouldRecoverPowerCut?true:(saved.powerCutEvent??false),powerCutSeen:shouldRecoverPowerCut?true:(saved.powerCutSeen??false),cyberAttackEvent:shouldRecoverCyberAttack?true:(saved.cyberAttackEvent??false),cyberAttackSeen:shouldRecoverCyberAttack?true:(saved.cyberAttackSeen??false),cybersecuritySpecialists:Math.max(0,Number(saved.cybersecuritySpecialists)||0),researched:Array.isArray(saved.researched)?saved.researched:[],acceptedContracts:Array.isArray(saved.acceptedContracts)?saved.acceptedContracts:[],contractsCompleted:completed,repeatOffers:Array.from({length:3},(_,i)=>saved.repeatOffers?.[i]&&Array.isArray(saved.repeatOffers[i].items)?saved.repeatOffers[i]:null),contractHistory:Array.isArray(saved.contractHistory)?saved.contractHistory.slice(-6):[],storyNextAt:saved.storyNextAt&&typeof saved.storyNextAt==='object'?saved.storyNextAt:{},boostSeconds:{production:Math.max(0,Math.floor(Number(saved.boostSeconds?.production)||0)),dispatch:Math.max(0,Math.floor(Number(saved.boostSeconds?.dispatch)||0)),protection:Math.max(0,Math.floor(Number(saved.boostSeconds?.protection)||0))},salesAssignments:goods.reduce((result,g)=>({...result,[g.id]:Math.max(0,Math.floor(Number(saved.salesAssignments?.[g.id]??(!saved.salesAssignments&&saved.salesTarget===g.id?saved.salespeople:0))||0))}),{...fresh.salesAssignments}),repeatContractRounds:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatContractRounds?.[i])||0))),contractClock:Math.max(0,Math.floor(Number(saved.contractClock)||0)),nextContractOfferAt:Math.max(0,Number(saved.nextContractOfferAt??((Number(saved.contractClock)||0)+120))||0),contractAlert:undefined,repeatNextAt:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatNextAt?.[i]??(180+i*180))||0))),repeatDeadline:Array.from({length:3},(_,i)=>Math.max(0,Math.floor(Number(saved.repeatDeadline?.[i])||0))),experience:migratedExperience+legacyShipmentXp,reputation:Math.max(0,Number(saved.reputation)||0)+(saved.charityMilestonesClaimed===undefined?Math.floor(Math.max(0,Number(saved.charityTotal)||0)/100000)*200:0)};
  }catch{return fresh;}
}
const fmt=(n:number)=>Math.floor(n).toLocaleString();
const machineCost=(m:typeof machines[number],s:GameState)=>Math.floor(m.cost*Math.pow(1.48,s[m.id]));
const mechanicCost=(s:GameState)=>Math.floor(900*Math.pow(2,s.mechanics));
const salesCost=(s:GameState)=>s.salespeople===0?150:Math.floor(1350*Math.pow(2,s.salespeople-1));
const SALES_UNITS_PER_SECOND=.35;
const FIRST_SALES_WAGE=12;
const salesWages=(count:number)=>count>0?FIRST_SALES_WAGE+Math.max(0,count-1)*36:0;
const CAPITAL_PROJECTS:{id:CapitalId;name:string;subtitle:string;description:string;effect:string;base:number;growth:number;max:number;icon:string}[]=[
  {id:'powerGrid',name:'Modernise the Power Grid',subtitle:'ENERGY INFRASTRUCTURE',description:'Install transformers, waste-heat recovery and more efficient electrical systems.',effect:'8% less electricity per level',base:900,growth:2.35,max:6,icon:'⚡'},
  {id:'miningNetwork',name:'Expand Mining Operations',subtitle:'RESOURCE SECURITY',description:'Upgrade drilling systems and secure new iron and copper extraction sites.',effect:'6% faster ore extraction per level',base:1800,growth:2.4,max:6,icon:'⛏️'},
  {id:'freightNetwork',name:'Build a Freight Network',subtitle:'LOGISTICS & DELIVERY',description:'Invest in depots, loading equipment and delivery vehicles for your sales team.',effect:'10% faster automatic dispatch per level',base:3500,growth:2.5,max:6,icon:'🚚'},
  {id:'safetySystems',name:'Industrial Safety Programme',subtitle:'FACTORY RELIABILITY',description:'Install sensors, safety controls and inspection equipment to prevent failures.',effect:'10% lower breakdown risk per level',base:2500,growth:2.45,max:6,icon:'🛡️'}
];
const capitalPrice=(v:GameState,id:CapitalId)=>{
  const project=CAPITAL_PROJECTS.find(p=>p.id===id)!;
  return Math.floor(project.base*Math.pow(project.growth,v.capitalLevels[id]));
};
const CHARITY_CAUSES:{id:CharityId;name:string;tag:string;description:string}[]=[
  {id:'apprenticeships',name:'Future Engineers',tag:'SKILLS & TRAINING',description:'Support apprenticeships and technical education in nearby towns.'},
  {id:'community',name:'Factory Town Fund',tag:'LOCAL COMMUNITY',description:'Help fund local services, facilities and neighbourhood projects.'},
  {id:'environment',name:'Clean Industry Fund',tag:'ENVIRONMENT',description:'Back river clean-ups, tree planting and greener industrial practices.'},
  {id:'relief',name:'Emergency Relief',tag:'COMMUNITY SUPPORT',description:'Help neighbouring communities recover after unexpected emergencies.'}
];
const CHARITY_AMOUNT_OPTIONS=[500,2500,10000,50000,100000,250000] as const;
const CHARITY_MILESTONE_RVT=100000;
const CHARITY_MILESTONE_REP=200;
const charityMilestoneReward=(currentTotal:number,amount:number)=>
  (Math.floor((currentTotal+amount)/CHARITY_MILESTONE_RVT)-Math.floor(currentTotal/CHARITY_MILESTONE_RVT))*CHARITY_MILESTONE_REP;
const powerCostMultiplier=(v:GameState)=>Math.max(.52,1-v.capitalLevels.powerGrid*.08);
const WAGES={mechanic:24,sales:36,cyber:60,driver:8,quality:28} as const;
const QA_HIRE_COST=750;
const QA_TRIGGER_CONTRACT='steel-plates';
const qaComplaintPending=(v:GameState)=>v.contractsCompleted.includes(QA_TRIGGER_CONTRACT)&&v.qualityInspectors===0;
const FREIGHT_TIERS=[
 {name:'Small Vans',capacity:.75,cost:0,description:'Starter vans can comfortably collect from one basic mine.'},
 {name:'Small Lorries',capacity:1.8,cost:6500,description:'Move 2.4 times as much ore per driver.'},
 {name:'Medium Lorries',capacity:4,cost:35000,description:'Move much larger loads between mines and the factory.'},
 {name:'Large Lorries',capacity:9,cost:175000,description:'High-volume transport for industrial mining operations.'}
] as const;
const DRONE_UNLOCK_TIER=3;
const DRONE_PRICE=95000;
const DRONE_CAPACITY=7;
const DRONE_RUNNING_COST=75; // RVT/min per active drone, battery charging and servicing
const MAX_DRONES=20;
const droneUnlocked=(v:GameState)=>v.freightTier>=DRONE_UNLOCK_TIER;
const droneRunningCount=(v:GameState)=>droneUnlocked(v)?Math.min(v.drones,v.droneAssignments.iron+v.droneAssignments.copper):0;
const driverHireCost=(v:GameState)=>Math.floor(150*Math.pow(1.7,v.drivers));
const MAX_FREIGHT_ROUTE_LEVEL=5;
const freightRouteUpgradeCost=(v:GameState,route:FreightRoute)=>Math.floor(350*Math.pow(2.7,v.freightRouteLevels[route]));
const FREIGHT_BOOST_DURATION=60;
const FREIGHT_BOOST_COOLDOWN=240;
const freightBoostCost=(v:GameState,route:FreightRoute)=>Math.floor(75+v.freightRouteLevels[route]*90+v.freightTier*130);
const freightThroughput=(v:GameState,route:FreightRoute)=>
  (v.driverAssignments[route]*FREIGHT_TIERS[v.freightTier].capacity+(droneUnlocked(v)?v.droneAssignments[route]*DRONE_CAPACITY:0))*
  (1+v.freightRouteLevels[route]*.2)*(v.freightBoostSeconds[route]>0?2:1);
// Mine-site stock is a small loading buffer, not an unlimited second warehouse.
// If the vans cannot collect quickly enough, miners automatically slow down.
const MINE_BUFFER_SECONDS=30;
const mineDelivery=(waiting:number,productionCapacity:number,haulCapacity:number)=>{
  const backlog=Math.max(0,waiting);
  const freight=Math.max(0,haulCapacity);
  const buffer=Math.max(1,freight*MINE_BUFFER_SECONDS);
  const made=Math.min(productionCapacity,Math.max(0,buffer-backlog)+freight);
  const delivered=Math.min(backlog+made,freight);
  return {made,delivered,waiting:Math.max(0,backlog+made-delivered)};
};

const payrollPerMinute=(v:GameState)=>v.mechanics*WAGES.mechanic+salesWages(v.salespeople)+v.cybersecuritySpecialists*WAGES.cyber+v.qualityInspectors*WAGES.quality+v.drivers*WAGES.driver+droneRunningCount(v)*DRONE_RUNNING_COST;
const ELECTRICITY_PER_MINUTE:Record<MachineId,number>={
  miner:6,smelter:12,press:16,assembler:22,
  copperMiner:8,copperSmelter:14,wiremill:18,circuitpress:28,
  beamMill:20,coilWinder:24,motorworks:600
};
const electricitySpeedFactor=(speed:number)=>speed===2?1.5:1;
const machinePowerFactor=(v:GameState,id:MachineId)=>v.overclocked[id]?OVERCLOCK_ELECTRICITY:1;
const electricityCostPerMinute=(s:GameState,speed:number)=>machines.reduce((sum,m)=>
  sum+(s.lastOutput[m.id]>0?workingUnits(s,m.id)*ELECTRICITY_PER_MINUTE[m.id]*electricitySpeedFactor(speed)*machinePowerFactor(s,m.id)*powerCostMultiplier(s):0),0);

const REPAIR_COSTS:Record<MachineId,number>={miner:40,smelter:65,press:90,assembler:130,copperMiner:85,copperSmelter:155,wiremill:230,circuitpress:340,beamMill:185,coilWinder:285,motorworks:2200};
const repairCostFor=(id:MachineId,level:number)=>REPAIR_COSTS[id]+level*15;
const MAX_MACHINE_UNITS=5;
const GEARS_PER_FINISHED_UNITS=12;
const finishedGearUnits=(id:StockId,amount:number)=>(id==='parts'||id==='circuits'||id==='beams'||id==='coils'||id==='motors')?amount:0;
const shipmentGearGain=(state:GameState,amount:number)=>{
  const whole=Math.floor((state.gearShipmentProgress+amount+1e-8)/GEARS_PER_FINISHED_UNITS);
  return {earned:whole,remainder:state.gearShipmentProgress+amount-whole*GEARS_PER_FINISHED_UNITS};
};
const FACTORY_STAGES=[
  {number:1,name:'First Workshop',xp:0,rep:0,detail:'Mine ore and smelt your first iron ingots.'},
  {number:2,name:'Steel Manufacturing',xp:150,rep:8,detail:'Build precision parts and branch out into structural steel.'},
  {number:3,name:'Copper Expansion',xp:200,rep:20,detail:'Launch the electrical line and supply conductive metals.'},
  {number:4,name:'Industrial Electronics',xp:500,rep:50,detail:'Turn copper wire into circuit boards and wound coils.'},
  {number:5,name:'National Manufacturer',xp:1600,rep:125,detail:'Establish a national supplier network and build industrial electric motors.'},
  {number:6,name:'Multinational Manufacturer',xp:6500,rep:350,detail:'Operate a diversified industrial group supplying customers worldwide.'}
] as const;
const machineStage:Record<MachineId,number>={miner:1,smelter:1,press:2,assembler:2,beamMill:2,copperMiner:3,copperSmelter:3,wiremill:3,circuitpress:4,coilWinder:4,motorworks:5};

const faultCount=(v:GameState,id:MachineId)=>v.unitFaults[id].slice(0,v[id]).filter(f=>f>0).length;
const workingUnits=(v:GameState,id:MachineId)=>Math.max(0,v[id]-faultCount(v,id));
const firstFault=(v:GameState,id:MachineId)=>v.unitFaults[id].findIndex((f,i)=>i<v[id]&&f>0);
const repairUnit=(v:GameState,id:MachineId,index:number)=>({...v,unitFaults:{...v.unitFaults,[id]:v.unitFaults[id].map((f,i)=>i===index?0:f)},broken:{...v.broken,[id]:0}});

const BOOSTS:{id:BoostId;name:string;subtitle:string;description:string;cost:number;duration:number}[]=[
  {id:'production',name:'Production Overdrive',subtitle:'+30% FACTORY OUTPUT',description:'Increase working machine output by 30% for three minutes. Buying again extends the timer, not the power.',cost:350,duration:180},
  {id:'dispatch',name:'Express Dispatch',subtitle:'+30% AUTOMATIC SALES',description:'Salespeople ship 30% more stock for three minutes. Buying again extends the timer, not the power.',cost:250,duration:180},
  {id:'protection',name:'Machine Insurance',subtitle:'50% LESS BREAKDOWN RISK',description:'Halve random breakdown risk for three minutes. Existing faults still need repairs. Extra purchases extend the timer.',cost:300,duration:180}
];
const boostClock=(seconds:number)=>`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;

// Pixel art comes from the supplied ZIP. Never redraw old machine photos in
// a canvas: that kept the previous artwork and its smoke effects visible.
// The uploaded GIF contains six different machines; each uses its own still.
const selectedStillMachines:MachineId[]=['miner','smelter','press','assembler','copperMiner','copperSmelter'];
const pixelMachineArt=(id:MachineId)=>({
  icon:selectedStillMachines.includes(id)?'/machines/pixel/'+id+'-still.webp':'/machines/pixel/'+id+'-icon.png'
});
// Products have their own flat, recognisable icons. Never reuse machine photos
// as item artwork: an ingot should look like a material, not a blast furnace.
function ProductIcon({id,size=36}:{id:StockId;size?:number}){
 const Icon=({ore:Gem,ingot:Layers,plate:Layers,parts:Package,copperOre:Gem,
   copperIngot:Layers,wire:Cable,circuits:CircuitBoard,beams:Construction,
   coils:Cable,motors:Fan} as Record<StockId,typeof Gem>)[id];
 return <span className={'product-item-icon product-item-'+id} role="img"
   aria-label={goods.find(g=>g.id===id)?.name||'Product'}
   style={{width:size,height:size}}><Icon size={Math.max(17,Math.round(size*.57))} strokeWidth={2.25}/></span>;
}
function MachineIcon({id,size=36}:{id:MachineId;size?:number}){
  if(id==='motorworks')return <span className="motor-icon" role="img" aria-label="Electric Motor Works" style={{width:size,height:size}}><Cog size={Math.max(17,Math.round(size*.7))}/></span>;
  return <img className="pixel-machine-icon" src={pixelMachineArt(id).icon} alt={machines.find(m=>m.id===id)?.name||'Machine'} width={size} height={size}/>;
}

function MachineArt({id,active,broken,lights,cycleSeconds,progress}:{id:MachineId;active:boolean;broken:boolean;lights:('on'|'off'|'empty')[];cycleSeconds:number;progress:number}){
 const sprite=pixelMachineArt(id);
 const spriteReady=id!=='motorworks';
 const safeCycle=cycleSeconds>0?cycleSeconds:8;
 const electrical=['copperMiner','copperSmelter','wiremill','circuitpress','coilWinder','motorworks'].includes(id);
 const copper=electrical?'#bd8054':'#bd985e';
 const steel=electrical?'#78877e':'#819187';
 
 
 const bolt=(x:number,y:number)=><circle cx={x} cy={y} r="2.3" fill="#d7c9a8" stroke="#39453b" strokeWidth="1"/>;
 return <div className={'machine-art art-'+id+(electrical?' art-electrical':'')+(active?' running':'')+(broken?' broken':'')+(spriteReady?' art-sprite-ready':'')} style={{'--machine-cycle':safeCycle+'s','--machine-offset':'-'+(Math.max(0,Math.min(1,progress))*safeCycle)+'s'} as CSSProperties}>
  {spriteReady&&<img className="machine-still-image" src={sprite.icon} alt={machines.find(m=>m.id===id)?.name+' pixel artwork'}/>}

  <div className="art-backdrop"/>
  <svg viewBox="0 0 320 210" role="img" aria-label={machines.find(m=>m.id===id)?.name+' detailed industrial machine illustration'}>
   <defs>
    <linearGradient id={'body-'+id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d3d9c9"/><stop offset=".42" stopColor={steel}/><stop offset="1" stopColor="#303d36"/></linearGradient>
    <linearGradient id={'copper-'+id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f0c28a"/><stop offset=".5" stopColor={copper}/><stop offset="1" stopColor="#704a35"/></linearGradient>
    <linearGradient id={'dark-'+id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#59685d"/><stop offset="1" stopColor="#202a25"/></linearGradient>
    <linearGradient id={'glass-'+id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f4e3b5"/><stop offset="1" stopColor="#b4b18b"/></linearGradient>
    <radialGradient id={'glow-'+id}><stop stopColor="#f3c879" stopOpacity=".8"/><stop offset="1" stopColor="#f3c879" stopOpacity="0"/></radialGradient>
    <filter id={'shadow-'+id} x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur in="SourceAlpha" stdDeviation="3"/><feOffset dy="4"/><feComponentTransfer><feFuncA type="linear" slope=".45"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   </defs>
   <ellipse cx="160" cy="184" rx="122" ry="14" fill="#08110d" opacity=".72"/>
   <path d="M35 164l25-12h199l27 12-24 15H58z" fill="#26332c" stroke="#101a14" strokeWidth="3"/>
   <path d="M48 161h224v13H48z" fill="#59685a" stroke="#26372e" strokeWidth="3"/>
   <path d="M57 174h206" stroke="#b4a17a" strokeWidth="2" strokeDasharray="10 8" opacity=".7"/>
   <g filter={'url(#shadow-'+id+')'} stroke="#26372e" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
    {id==='motorworks'&&<g className="motor-works-asset">
     <path d="M65 85L95 61h133l24 24v81H65z" fill="#566d61"/><path d="M89 72h142v19H89z" fill="#cfab74"/><path d="M87 102h147v50H87z" fill="#273c33" stroke="#acbfa7" strokeWidth="4"/>
     <g className="motor-rotor"><circle cx="160" cy="126" r="34" fill="#a8734d" stroke="#edc08c" strokeWidth="8"/><circle cx="160" cy="126" r="21" fill="#435749" stroke="#c48a5a" strokeWidth="7"/><circle cx="160" cy="126" r="10" fill="#e5cba0"/><path d="M160 100v52M134 126h52M142 108l36 36M178 108l-36 36" stroke="#ebba79" strokeWidth="5"/></g>
     <path d="M58 155h205v17H58z" fill="#bea06a"/><path d="M80 168h165" stroke="#3a4739" strokeWidth="4" strokeDasharray="11 6"/>
     <rect x="205" y="95" width="26" height="34" rx="3" fill="#3c5647" stroke="#d5aa70"/><circle cx="217" cy="106" r="5" fill="#a3e6ae"/>
    </g>}
    {id==='miner'&&<g>
      <path d="M68 87l18-37 103-8 35 30v82H68z" fill={'url(#body-'+id+')'}/>
      <path d="M86 51l14-23 80-4 27 24-18 14-91 5z" fill="#d0b477"/>
      <path d="M94 69l92-8 22 17v58H94z" fill={'url(#dark-'+id+')'}/>
      <path d="M109 82h79v42h-79z" fill="#1d2b24" stroke="#9caa91"/>
      <path d="M117 89h63v29h-63z" fill="#82917d"/><path d="M124 95h49v17h-49z" fill="#394d40"/>
      <path d="M74 84L44 65l-18 17 31 27 18-8z" fill="#a6b19a"/><g className="moving-part"><path d="M35 76l-13 22 20 17 17-22z" fill="#d2a66f"/><path d="M28 98l-13 21 21 16 17-22z" fill="#748579"/><path d="M21 119l-7 15 18 11 11-16z" fill="#c0a06d"/></g>
      <path d="M205 87h26v67h-26z" fill="#68796e"/><path d="M211 97h14v42h-14z" fill="#28372e"/>
      <path d="M84 139h116v13H84z" fill="#c08b57"/><path d="M98 151h86v7H98z" fill="#303d34"/>
      {bolt(83,91)}{bolt(194,77)}{bolt(83,145)}{bolt(217,145)}
      <path d="M116 31l12-12h43l13 11" fill="none" stroke="#d9c18b" strokeWidth="6"/>
      <path d="M235 91l19 8v42l-19 8" fill="none" stroke="#a0ad96" strokeWidth="7"/>
    </g>}
    {id==='smelter'&&<g>
      <path d="M79 62h163v99H79z" fill="#985d45"/><path d="M91 73h139v78H91z" fill="#4b3a31"/>
      <path d="M104 87h113v62H104z" fill="#1d2520"/><path d="M116 100h89v49h-89z" fill="#a95e3d"/>
      <path d="M129 139q-19-28 2-49 4 17 16 22 3-24 19-34 24 36-1 61z" fill="#e8753f" stroke="#f6c17c" strokeWidth="3" className="furnace-flame"/>
      <path d="M144 141q-8-15 6-27 1 11 9 13 8-12 11-18 11 24-3 32z" fill="#ffe29a" stroke="#fff0bd" strokeWidth="2" className="furnace-flame"/>
      <path d="M95 62V34h31v28m74 0V27h32v35" fill="#b17b57"/><path d="M102 35h17M201 29h18" stroke="#d9b184" strokeWidth="5"/>
      <path d="M71 82h10v68H71zm160 0h10v68h-10z" fill="#d0a06f"/>
      <path d="M82 156h160v9H82z" fill="#d7b179"/>
      <path d="M111 73h92" stroke="#d7b179" strokeWidth="4"/>{bolt(88,77)}{bolt(232,77)}{bolt(88,145)}{bolt(232,145)}
      <path d="M245 70h17v28h-17" fill="none" stroke="#8d9b8c" strokeWidth="6"/>
    </g>}
    {id==='press'&&<g>
      <path d="M73 42h174v121H73z" fill={'url(#body-'+id+')'}/><path d="M88 54h145v15H88z" fill="#d7d9c9"/>
      <path d="M93 69h20v79H93zm115 0h20v79h-20z" fill="#43574b"/>
      <path d="M115 73h92v17h-92z" fill="#25362d"/><g className="press-ram"><path d="M132 85h59v53h-59z" fill={'url(#copper-'+id+')'}/><path d="M121 134h81v12h-81z" fill="#d8bd81"/><path d="M139 94h45v29h-45z" fill="#8e6849"/></g>
      <path d="M85 150h150v12H85z" fill="#8a9a8a"/><path d="M103 160h113v6H103z" fill="#25352d"/>
      <path d="M75 37h170v12H75z" fill="#bdc5b4"/><path d="M87 27h146v10H87z" fill="#b17d50"/>
      <path d="M122 20h70v9h-70z" fill="#d2b67e"/><path d="M150 18v10" stroke="#34453a" strokeWidth="5"/>
      <path d="M111 91h-16m130 0h-16" stroke="#e2c68e" strokeWidth="4"/>
      {bolt(83,48)}{bolt(237,48)}{bolt(83,153)}{bolt(237,153)}
      <path d="M65 78h9v62h-9zm174 0h9v62h-9z" fill="#d09a64"/>
    </g>}
    {id==='assembler'&&<g>
      <path d="M59 128h198v27H59z" fill="#53685b"/><path d="M72 119h171v10H72z" fill="#c49b64"/>
      <path d="M88 110V74h76v36z" fill="#44594b"/><path d="M98 82h57v23H98z" fill="#202c25"/>
      <path d="M111 88h31v12h-31z" fill="#d1b27a"/><circle cx="127" cy="94" r="6" fill="#536e5a"/>
      <path d="M163 66l21-23 19 8-10 26-19 13z" fill="#9aa99a"/><g className="robot-arm"><path d="M187 54l16-31 22 8-7 34-19 8z" fill="#d0a36a"/><circle cx="200" cy="53" r="11" fill="#e2c68e"/><path d="M214 34l15-11 15 11-12 18z" fill="#8e9e90"/><path d="M229 49l10 10-10 12-11-9z" fill="#d0a36a"/></g>
      <path d="M69 65h29v12H69z" fill="#c08a57"/><path d="M81 76v41" stroke="#b9c5b3" strokeWidth="6"/>
      <path d="M105 119h8v-9h12v9h8v-9h12v9h8" fill="none" stroke="#d6b87e" strokeWidth="4"/>
      <path d="M62 155v-26h12v26m162 0v-26h12v26" fill="#29382f"/>
      {bolt(76,136)}{bolt(242,136)}{bolt(92,116)}{bolt(157,116)}
    </g>}
    {id==='copperMiner'&&<g>
      <path d="M67 88l18-35 104-6 36 31v79H67z" fill={'url(#copper-'+id+')'}/>
      <path d="M88 54l14-23 80-4 27 24-18 14-91 5z" fill="#e1b17c"/>
      <path d="M94 73l92-8 22 17v57H94z" fill={'url(#dark-'+id+')'}/>
      <path d="M109 85h79v41h-79z" fill="#28352d" stroke="#d5a16c"/><path d="M119 94h58v24h-58z" fill="#bd8054"/>
      <g className="moving-part"><path d="M68 76L42 58 24 80l31 27 18-8z" fill="#d49a68"/><path d="M35 94l-17 23 20 16 18-23z" fill="#8f674a"/></g>
      <path d="M204 91h28v63h-28z" fill="#7f7760"/><circle cx="218" cy="110" r="13" fill="#dba16c"/><circle cx="218" cy="110" r="6" fill="#614735"/>
      <path d="M83 140h116v13H83z" fill="#c18456"/>{bolt(84,92)}{bolt(194,79)}{bolt(84,145)}{bolt(218,145)}
      <path d="M112 35h64" stroke="#f0c18c" strokeWidth="5"/>
    </g>}
    {id==='copperSmelter'&&<g>
      <path d="M79 62h163v99H79z" fill="#986349"/><path d="M91 73h139v78H91z" fill="#48372e"/>
      <path d="M104 87h113v62H104z" fill="#1d2520"/><path d="M116 100h89v49h-89z" fill="#ad613f"/>
      <path d="M129 139q-19-28 2-49 4 17 16 22 3-24 19-34 24 36-1 61z" fill="#e78c4c" stroke="#f5ca8a" strokeWidth="3" className="furnace-flame"/>
      <path d="M144 141q-8-15 6-27 1 11 9 13 8-12 11-18 11 24-3 32z" fill="#ffe1a0" className="furnace-flame"/>
      <path d="M95 62V34h31v28m74 0V27h32v35" fill="#c18a60"/><path d="M102 35h17m82-6h18" stroke="#e2b789" strokeWidth="5"/>
      <path d="M71 82h10v68H71zm160 0h10v68h-10z" fill="#d4a071"/><path d="M82 156h160v9H82z" fill="#d7b179"/>
      {bolt(88,77)}{bolt(232,77)}{bolt(88,145)}{bolt(232,145)}
    </g>}
    {id==='wiremill'&&<g>
      <path d="M53 76h216v84H53z" fill="#66776c"/><path d="M65 87h192v59H65z" fill="#26352d"/>
      <path d="M71 95h48v43H71z" fill="#9b7653"/><path d="M203 95h48v43h-48z" fill="#9b7653"/>
      <circle cx="94" cy="116" r="26" fill="#26342d" stroke="#d0a06e" strokeWidth="8"/><circle cx="94" cy="116" r="10" fill="#d9c08d"/>
      <circle cx="226" cy="116" r="26" fill="#26342d" stroke="#d0a06e" strokeWidth="8"/><circle cx="226" cy="116" r="10" fill="#d9c08d"/>
      <g className="wire-spool"><path d="M119 107Q160 58 201 107M119 124Q160 171 201 124" fill="none" stroke="#e3b77f" strokeWidth="5"/><path d="M119 115h82" stroke="#c6d0b8" strokeWidth="3"/></g>
      <path d="M74 151h174" stroke="#c1c9b9" strokeWidth="5"/><path d="M78 75h166" stroke="#d6b486" strokeWidth="5"/>
      {bolt(63,84)}{bolt(260,84)}{bolt(63,152)}{bolt(260,152)}
    </g>}
    {id==='circuitpress'&&<g>
      <path d="M58 39h204v122H58z" fill="#617267"/><path d="M72 53h176v91H72z" fill="#27352d"/>
      <path d="M85 66h150v63H85z" fill="#355d47" stroke="#a0b194"/>
      <path d="M98 79h124v38H98z" fill="#172b22"/>
      <path d="M108 87h20v20h-20zm35 0h20v20h-20zm35 0h20v20h-20z" fill="#d0bd87" stroke="#283a30" strokeWidth="2"/>
      <path d="M118 77v-8m35 8v-8m35 8v-8M118 109v11m35-11v11m35-11v11" stroke="#d0a16c" strokeWidth="3"/>
      <path d="M98 126h124" stroke="#d0a16c" strokeWidth="3" strokeDasharray="5 4"/>
      <path d="M73 42h175v9H73z" fill="#c5cbbb"/><path d="M91 31h138v11H91z" fill="#b97c52"/>
      <path d="M87 150h146v10H87z" fill="#c18b5f"/>{bolt(67,48)}{bolt(251,48)}{bolt(67,151)}{bolt(251,151)}
      <path d="M263 66h15v47h-15" fill="none" stroke="#d2a36f" strokeWidth="6"/>
    </g>}
    {id==='beamMill'&&<g>
 <path d="M55 77h210v80H55z" fill="#5d6d64"/><path d="M64 89h192v51H64z" fill="#26362e"/><path d="M66 71l22-25h148l20 25-13 16H79z" fill="#cbb993"/>
 <path d="M77 85h17v65H77zm149 0h17v65h-17z" fill="#b5c4ab"/>
 <g className="roller-top"><circle cx="137" cy="99" r="25" fill="#526157" stroke="#dbc99f" strokeWidth="6"/><circle cx="137" cy="99" r="9" fill="#293d32"/><path d="M137 78v9m20 12h-9m-11 20v-9m-20-11h9" stroke="#e7d1a2" strokeWidth="4"/></g>
 <g className="roller-bottom"><circle cx="137" cy="143" r="22" fill="#4f5e54" stroke="#a9b5a4" strokeWidth="6"/><circle cx="137" cy="143" r="8" fill="#293d32"/><path d="M137 124v10m18 9h-10m-8 18v-10m-18-8h10" stroke="#ddd0a2" strokeWidth="4"/></g>
 <g className="rolling-beam"><path d="M153 113h109v10H153z" fill="#e8a45e"/><path d="M153 123h109v7H153z" fill="#9a6644"/><path d="M174 113v-7h55v7m-55 17v8h55v-8" fill="none" stroke="#f3cb8c" strokeWidth="5"/></g>
 <path d="M60 159h203v10H60z" fill="#b88b5c"/><path d="M72 170h180" stroke="#f2c37d" strokeWidth="4" strokeDasharray="10 8"/>{bolt(75,80)}{bolt(244,80)}{bolt(77,157)}{bolt(244,157)}
</g>}
{id==='coilWinder'&&<g>
 <path d="M56 78h207v81H56z" fill="#687a6e"/><path d="M67 89h185v55H67z" fill="#2c3c32"/><path d="M75 66h38v17H75zm128 0h42v17h-42z" fill="#cd9869"/>
 <g className="coil-feed"><circle cx="93" cy="105" r="27" fill="#46594e" stroke="#cc9b69" strokeWidth="7"/><circle cx="93" cy="105" r="13" fill="#222e27" stroke="#e4bd85" strokeWidth="5"/><path d="M72 105h42m-21-21v42" stroke="#edce97" strokeWidth="4"/></g>
 <path d="M116 105h34" stroke="#e7b276" strokeWidth="6"/>
 <g className="coil-spindle"><rect x="139" y="96" width="83" height="29" rx="8" fill="#a36e48" stroke="#e3bc83" strokeWidth="6"/><path d="M151 98v24m9-26v28m9-28v28m9-28v28m9-28v28m9-28v28m9-26v24" stroke="#f3c589" strokeWidth="5"/><circle cx="141" cy="110" r="10" fill="#3e4c40" stroke="#d7b180" strokeWidth="4"/><circle cx="222" cy="110" r="10" fill="#3e4c40" stroke="#d7b180" strokeWidth="4"/></g>
 <g className="coil-guide"><path d="M184 82l22-24h16l4 26-20 19" fill="none" stroke="#d8b079" strokeWidth="10"/><circle cx="204" cy="102" r="7" fill="#e9d1a0"/></g>
 <path d="M58 155h205v13H58z" fill="#b18457"/><path d="M70 170h179" stroke="#e0a975" strokeWidth="4" strokeDasharray="8 7"/>{bolt(67,89)}{bolt(252,89)}{bolt(67,155)}{bolt(252,155)}
</g>}
<g fill="#d5c18b" stroke="#29372f" strokeWidth="1.5"><circle cx="48" cy="167" r="5"/><circle cx="272" cy="167" r="5"/></g>
   </g>
   
 {(id==='smelter'||id==='copperSmelter')&&<g className="molten-flow" fill="none" stroke="#ffb35b" strokeWidth="7" strokeLinecap="round"><path d="M241 113q18 2 22 20l12 12"/><path d="M272 146l9 8" stroke="#ffe0a3" strokeWidth="3"/></g>}
 {(id==='miner'||id==='copperMiner')&&<g className="crusher-dust" fill="#d4b28a"><circle cx="38" cy="131" r="7"/><circle cx="51" cy="137" r="5"/><circle cx="23" cy="141" r="4"/></g>}
 {id==='press'&&<g className="stamp-sparks" stroke="#f7bd62" strokeWidth="3" strokeLinecap="round"><path d="M105 137l-13-9m118 9 13-9m-66 15v11m-39-5-8 6"/></g>}
 {id==='assembler'&&<g className="assembly-parts"><path d="M141 121h26v13h-26z" fill="#d2ad72" stroke="#344d3a" strokeWidth="3"/><path d="M143 118h21" stroke="#e9d39c" strokeWidth="4"/></g>}
 {id==='circuitpress'&&<g className="circuit-head"><path d="M161 55h17v28h-17z" fill="#c7a476" stroke="#263e32" strokeWidth="3"/><path d="M166 83h7v18h-7z" fill="#e5c589"/><circle cx="169" cy="106" r="5" fill="#8fe4ca"/></g>}
 {(id==='wiremill'||id==='coilWinder')&&<g className="coil-spark" fill="#f9c67d"><path d="M259 79l5-11 3 12 11 5-12 4-5 12-3-12-12-5z"/></g>}
 {active&&<g className="sparkles" fill="#f4d28f" stroke="#f4d28f"><path d="M42 39v-12m-6 6h12"/><path d="M279 83V71m-6 6h12"/><circle cx="291" cy="126" r="2.5"/></g>}
   {broken&&<path d="M151 27l-10 20h12l-7 18 22-26h-13l8-12z" fill="#d47b55" stroke="#ffe0aa" strokeWidth="2"/>}
  </svg>
  <div className={'living-conveyor'+(active?' is-moving':'')} aria-hidden="true"><div className="living-conveyor-belt"/>{active&&<span className={'living-conveyor-product product-'+id} style={{'--product-offset':'-'+(Math.max(0,Math.min(1,progress))*safeCycle)+'s'} as CSSProperties}><i/><i/></span>}</div>
  <div className="machine-art-floor"/><div className="art-cycle-hud"><span>{active?'PRODUCING':broken?'REPAIR REQUIRED':'STANDBY'}</span><b>{active?'1 UNIT / '+cycleSeconds.toFixed(1)+'s':'MACHINE STOPPED'}</b><i className="art-cycle-track"><i style={{width:(progress*100)+'%'}}/></i></div><span className="art-lamp" role="group" aria-label="Individual machine status lights">{lights.map((light,i)=><i key={i} className={"unit-light "+light} title={"Unit "+(i+1)+": "+(light==="on"?"running":light==="off"?"stopped":"not purchased")}/>)}</span>
  {broken&&<span className="broken-stamp"><AlertTriangle size={14}/> BROKEN</span>}{active&&<span className="art-status-dot"/>}
 </div>;
}

export default function App(){
  const [s,setS]=useState<GameState>(loadGame);
  const [qcView,setQcView]=useState<string|null>(null);
  const [page,setPage]=useState<Page>('factory');
  useEffect(()=>{if(page!=='extras'&&qcView){setQcView(null);setS(v=>({...v,qcSession:null}));}},[page,qcView]);
  const [staffTab,setStaffTab]=useState<'maintenance'|'dispatch'|'haulage'>('maintenance');
  const [factoryView,setFactoryView]=useState<'overview'|'equipment'>('overview');
  const [running,setRunning]=useState(true);
  const [speed,setSpeed]=useState(1);
  const [notice,setNotice]=useState('');
  const [stockPromptDismissedUntil,setStockPromptDismissedUntil]=useState(0);
  const [rewardSplash,setRewardSplash]=useState<{id:number;title:string;detail:string;cash?:number;xp?:number;rep?:number;kind:'shipment'|'contract'|'upgrade'}|null>(null);
  const celebrate=(title:string,detail:string,kind:'shipment'|'contract'|'upgrade',values:{cash?:number;xp?:number;rep?:number}={})=>{
    setRewardSplash({id:Date.now()+Math.random(),title,detail,kind,...values});
  };
  useEffect(()=>{
    if(!rewardSplash)return;
    const dismiss=window.setTimeout(()=>setRewardSplash(current=>current?.id===rewardSplash.id?null:current),3800);
    return()=>window.clearTimeout(dismiss);
  },[rewardSplash]);
  const [contractToast,setContractToast]=useState<ContractAlert|null>(null);
  const lastContractAlert=useRef(s.contractAlert?.id);
  useEffect(()=>{
    if(s.contractAlert&&lastContractAlert.current!==s.contractAlert.id){
      lastContractAlert.current=s.contractAlert.id;setContractToast(s.contractAlert);
    }
  },[s.contractAlert]);
  useEffect(()=>{
    if(!contractToast)return;
    const timeout=window.setTimeout(()=>setContractToast(null),4200);
    return()=>window.clearTimeout(timeout);
  },[contractToast]);
  const [showReset,setShowReset]=useState(false);
  
  const [inboxOpen,setInboxOpen]=useState(false);
  const [expandedMail,setExpandedMail]=useState<string|null>(null);
  const [charityCause,setCharityCause]=useState<CharityId>('apprenticeships');
  const [charityAmount,setCharityAmount]=useState<number>(10000);
  const [charityConfirmation,setCharityConfirmation]=useState(false);
  useEffect(()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(s));},[s]);
  useEffect(()=>{
    if(!running)return;
    const timer=window.setInterval(()=>{setS(v=>{
      let n={...v,visualProgress:{...v.visualProgress},broken:{...v.broken},unitPenalties:{...v.unitPenalties},unitFaults:Object.fromEntries(machines.map(m=>[m.id,[...v.unitFaults[m.id]]])) as Record<MachineId,number[]>};
      if(n.breakdownEvent||n.powerCutEvent||n.cyberAttackEvent||n.writeOffEvent)return {...n,freightLastMined:{iron:0,copper:0},freightLastDelivered:{iron:0,copper:0}};
      n.contractClock++;
      n=updateContractOffers(n);
      const boostActive={production:n.boostSeconds.production>0,dispatch:n.boostSeconds.dispatch>0,protection:n.boostSeconds.protection>0};
      n.boostSeconds={production:Math.max(0,n.boostSeconds.production-1),dispatch:Math.max(0,n.boostSeconds.dispatch-1),protection:Math.max(0,n.boostSeconds.protection-1)};
      const wages=payrollPerMinute(n)/60;
      const payrollFunded=n.cash+1e-8>=wages;
      if(payrollFunded)n.cash=Math.max(0,n.cash-wages);
      const multiplier=speed;
      const reliabilityBonus=(n.researched.includes('reinforced-bearings')?.35:0)+(n.researched.includes('predictive-maintenance')?.2:0);
      let destroyedUnit=false;
      for(const m of machines){
        // Insurance reduces new breakdown risk rather than making machinery invulnerable.
        for(let i=0;i<n[m.id];i++){
          if(n.unitFaults[m.id][i]>0)continue;
          if(Math.random()>=.00022*(boostActive.protection?.5:1)*(speed===2?2:1)*(1-reliabilityBonus)*Math.max(.4,1-n.capitalLevels.safetySystems*.1))continue;
          // Catastrophic failures are rare and limited to established factories.
          // Protect the only ore mine and enforce a long cooldown between losses.
          const eligible=n.contractClock>=n.nextWriteOffAt&&n.experience>=500&&n.reputation>=50&&
            !(m.id==='miner'&&n.miner===1)&&n.cash>=machineCost(m,n)*.35;
          if(eligible&&Math.random()<.04){
            const oldLevel=Math.max(1,n[`tier_${m.id}`]-(n.unitPenalties[m.id][i]||0)+1);
            n[m.id]--;
            n.unitFaults[m.id].splice(i,1);
            n.unitPenalties[m.id]=[...n.unitPenalties[m.id]];
            n.unitPenalties[m.id].splice(i,1);
            n.pendingReplacement={...n.pendingReplacement,[m.id]:(n.pendingReplacement[m.id]||0)+1};
            n.cash+=Math.ceil(m.cost*.08);
            n.writeOffEvent={id:m.id,unit:i+1,oldLevel};
            n.nextWriteOffAt=n.contractClock+900;
            destroyedUnit=true;
          }else{
            n.unitFaults[m.id][i]=24;
            if(!n.breakdownEvent)n.breakdownEvent=m.id;
          }
          break;
        }
        if(destroyedUnit||n.breakdownEvent)break;
      }
      if(n.breakdownEvent||destroyedUnit)return n;
      machines.forEach(m=>{
        const assigned=n.mechanicAssignments[m.id]||0;
        if(payrollFunded&&assigned>0){
          const i=firstFault(n,m.id);
          if(i>=0)n.unitFaults[m.id][i]=Math.max(0,n.unitFaults[m.id][i]-assigned*multiplier);
        }
      });
      const rate=(id:MachineId)=>machineCapacity(n,id,multiplier,boostActive.production);
      // Ore can pile up temporarily, but mines throttle rather than creating
      // unlimited stranded inventory when transport cannot keep up.
      const ironFreight=mineDelivery(n.oreAtMine,rate('miner'),
        freightThroughput(n,'iron')*(payrollFunded?1:0));
      const oreMade=ironFreight.made;
      const hauledOre=ironFreight.delivered;
      const ingotsMade=Math.min(Math.max(0,n.ore+hauledOre-contractStockTarget(n,'ore')),rate('smelter'));
      const availableIngots=downstreamMaterialAvailable(n,'ingot',n.ingot+ingotsMade,ingotsMade);
      const [platesMade,beamsMade]=splitMachineSupply(availableIngots,rate('press'),rate('beamMill'));
      const partsMade=Math.min(Math.max(0,n.plate+platesMade-contractStockTarget(n,'plate')),rate('assembler'));
      const copperFreight=mineDelivery(n.copperAtMine,rate('copperMiner'),
        freightThroughput(n,'copper')*(payrollFunded?1:0));
      const copperOreMade=copperFreight.made;
      const hauledCopper=copperFreight.delivered;
      const copperIngotsMade=Math.min(Math.max(0,n.copperOre+hauledCopper-contractStockTarget(n,'copperOre')),rate('copperSmelter'));
      const wireMade=Math.min(Math.max(0,n.copperIngot+copperIngotsMade-contractStockTarget(n,'copperIngot')),rate('wiremill'));
      const availableWire=downstreamMaterialAvailable(n,'wire',n.wire+wireMade,wireMade);
      const [circuitsMade,coilsMade]=splitMachineSupply(availableWire,rate('circuitpress'),rate('coilWinder'));
      // Motor assembly uses two coils and one circuit board, including goods
      // finished earlier in this tick. Protect material reserved by open orders.
      const freeCoils=Math.max(0,n.coils+coilsMade-contractStockTarget(n,'coils'));
      const freeCircuits=Math.max(0,n.circuits+circuitsMade-contractStockTarget(n,'circuits'));
      const motorsMade=Math.min(rate('motorworks'),freeCoils/2,freeCircuits);
      // Electricity is metered per working machine that actually makes output.
      // A paused, broken or input-starved machine uses no electricity.
      const proposedOutput:Record<MachineId,number>={
        miner:oreMade,smelter:ingotsMade,press:platesMade,assembler:partsMade,
        copperMiner:copperOreMade,copperSmelter:copperIngotsMade,wiremill:wireMade,
        circuitpress:circuitsMade,beamMill:beamsMade,coilWinder:coilsMade,motorworks:motorsMade
      };
      const powerBill=machines.reduce((sum,m)=>sum+(proposedOutput[m.id]>1e-8
        ?workingUnits(n,m.id)*ELECTRICITY_PER_MINUTE[m.id]*electricitySpeedFactor(speed)*machinePowerFactor(n,m.id)*powerCostMultiplier(n)/60:0),0);
      const powerFunded=n.cash+n.starterPowerCredit+1e-8>=powerBill;
      if(powerFunded){
        const creditUsed=Math.min(n.starterPowerCredit,powerBill);
        n.starterPowerCredit=Math.max(0,n.starterPowerCredit-creditUsed);
        n.cash=Math.max(0,n.cash-(powerBill-creditUsed));
        n.powerShortage=false;
      }else{
        n.powerShortage=powerBill>0;
      }
      if(powerFunded){
      n.freightLastMined={iron:oreMade,copper:copperOreMade};
      n.freightLastDelivered={iron:hauledOre,copper:hauledCopper};
      n.oreAtMine=ironFreight.waiting;
      n.ore=Math.max(0,n.ore+hauledOre-ingotsMade);
      n.ingot=Math.max(0,n.ingot+ingotsMade-platesMade-beamsMade);
      n.beams+=beamsMade;
      n.plate=Math.max(0,n.plate+platesMade-partsMade);
      n.parts+=partsMade;
      n.copperAtMine=copperFreight.waiting;
      n.copperOre=Math.max(0,n.copperOre+hauledCopper-copperIngotsMade);
      n.copperIngot=Math.max(0,n.copperIngot+copperIngotsMade-wireMade);
      n.wire=Math.max(0,n.wire+wireMade-circuitsMade-coilsMade);
      n.coils=Math.max(0,n.coils+coilsMade-2*motorsMade);
      n.circuits=Math.max(0,n.circuits+circuitsMade-motorsMade);
      n.motors+=motorsMade;
      // Each visual cycle represents one unit actually produced by a single working machine.
      n.lastOutput={
        miner:oreMade,smelter:ingotsMade,press:platesMade,assembler:partsMade,
        copperMiner:copperOreMade,copperSmelter:copperIngotsMade,wiremill:wireMade,
        circuitpress:circuitsMade,beamMill:beamsMade,coilWinder:coilsMade,motorworks:motorsMade
      };
      machines.forEach(m=>{
        const units=workingUnits(n,m.id);
        if(units>0&&n.lastOutput[m.id]>0){
          n.visualProgress[m.id]=(n.visualProgress[m.id]+n.lastOutput[m.id]/units)%1;
        }
      });
      }else{
        // Suspend production; staff can still sell warehouse inventory to restore power.
        n.lastOutput={...fresh.lastOutput};
        n.freightLastMined={iron:0,copper:0};
        n.freightLastDelivered={iron:0,copper:0};
      }
      if(payrollFunded&&n.autoSell&&n.salespeople>0){
        let activeSellers=0;
        const saleBonus=n.researched.includes('market-intelligence')?1.2:1;
        goods.forEach(item=>{
          const count=Math.min(n.salespeople,Math.max(0,n.salesAssignments[item.id]||0));
          if(count<=0)return;
          // Automatic sales must not take goods reserved for active customer contracts.
          const manualFlow=(item.id==='ingot'||item.id==='wire')&&n.flowMode[item.id]==='feed';
          const stockFloor=manualFlow?0:contractStockTarget(n,item.id);
          const warehouseBuffer=(item.id==='ingot'||item.id==='wire')&&n.flowMode[item.id]==='balanced'?2:0;
          const availableToSell=Math.max(0,n[item.id]-Math.max(stockFloor,warehouseBuffer));
          const amount=Math.min(availableToSell,count*SALES_UNITS_PER_SECOND*(n.researched.includes('dispatch-systems')?1.25:1)*(1+n.capitalLevels.freightNetwork*.1)*multiplier*(boostActive.dispatch?1.3:1));
          if(amount<=0)return;
          const revenue=amount*item.price*saleBonus;
          const total=n.salesXpProgress+revenue;
          const shipmentXp=Math.floor((total+1e-8)/25);
          n.salesXpProgress=total-shipmentXp*25;
          n[item.id]-=amount;n.cash+=revenue;n.sold+=revenue;
          n.experience+=shipmentXp;
          const reward=shipmentGearGain(n,finishedGearUnits(item.id,amount));
          n.gears+=reward.earned;n.gearShipmentProgress=reward.remainder;
          activeSellers+=count;
        });
        const totalStaffXp=n.autoSalesXpProgress+activeSellers;
        const staffXp=Math.floor(totalStaffXp/60);
        n.autoSalesXpProgress=totalStaffXp-staffXp*60;
        n.experience+=staffXp;
      }
      // Count a full 60 seconds of actual boosted transport before expiring it.
      n.freightBoostSeconds={iron:Math.max(0,n.freightBoostSeconds.iron-1),copper:Math.max(0,n.freightBoostSeconds.copper-1)};
      return n;
    });},1000);
    return()=>window.clearInterval(timer);
  },[running,speed]);
  const machineCount=machines.reduce((sum,m)=>sum+s[m.id],0);
  const saleReminder=stockSaleReminder(s);
  const showStockReminder=page!=='warehouse'&&s.contractsCompleted.includes('first-ore')&&
    !s.powerCutEvent&&!s.breakdownEvent&&!s.cyberAttackEvent&&!s.writeOffEvent&&
    s.contractClock>=stockPromptDismissedUntil&&saleReminder.value>=(s.cash<30?10:50);
  const stockValue=goods.reduce((sum,g)=>sum+s[g.id]*g.price,0);
  const brokenCount=machines.reduce((sum,m)=>sum+faultCount(s,m.id),0);
  const assignedTotal=machines.reduce((sum,m)=>sum+s.mechanicAssignments[m.id],0);
  const unassigned=s.mechanics-assignedTotal;
  const assignedSales=goods.reduce((sum,g)=>sum+(s.salesAssignments[g.id]||0),0);
  const unassignedSales=Math.max(0,s.salespeople-assignedSales);
  const availableDrivers=Math.max(0,s.drivers-s.driverAssignments.iron-s.driverAssignments.copper);
  const availableDrones=Math.max(0,s.drones-s.droneAssignments.iron-s.droneAssignments.copper);
  const currentFreight=FREIGHT_TIERS[s.freightTier];
  const hireDriver=()=>{
    const price=driverHireCost(s);
    if(s.cash<price){setNotice('Hire a driver requires '+fmt(price)+' RVT. Ship a small load first.');return;}
    setS(v=>v.cash<driverHireCost(v)?v:{...v,cash:v.cash-driverHireCost(v),drivers:v.drivers+1});
    setNotice('Driver recruited · +'+WAGES.driver+' RVT/min payroll. Assign them to iron or copper haulage.');
  };
  const fireDriver=()=>{
    if(s.drivers<=0)return;
    setS(v=>{
      if(v.drivers<=0)return v;
      const drivers=v.drivers-1,iron=Math.min(v.driverAssignments.iron,drivers);
      return {...v,drivers,driverAssignments:{iron,copper:Math.min(v.driverAssignments.copper,drivers-iron)}};
    });
    setNotice('Driver dismissed. Freight capacity and payroll have been updated.');
  };
  const assignDriver=(route:FreightRoute,amount:number)=>{
    setS(v=>{
      const other=v.driverAssignments[route==='iron'?'copper':'iron'];
      return {...v,driverAssignments:{...v.driverAssignments,[route]:Math.max(0,Math.min(amount,v.drivers-other))}};
    });
  };
  const upgradeFreightRoute=(route:FreightRoute)=>{
    const cost=freightRouteUpgradeCost(s,route);
    if(s.freightRouteLevels[route]>=MAX_FREIGHT_ROUTE_LEVEL||s.cash<cost)return;
    setS(v=>v.freightRouteLevels[route]>=MAX_FREIGHT_ROUTE_LEVEL||v.cash<freightRouteUpgradeCost(v,route)?v:{
      ...v,cash:v.cash-freightRouteUpgradeCost(v,route),
      freightRouteLevels:{...v.freightRouteLevels,[route]:v.freightRouteLevels[route]+1}
    });
    setNotice((route==='iron'?'Iron':'Copper')+' transport route upgraded · permanent +20% capacity.');
  };
  const boostFreightRoute=(route:FreightRoute)=>{
    if(s.freightBoostSeconds[route]>0||s.contractClock<s.freightBoostReadyAt[route])return;
    const cost=freightBoostCost(s,route);
    if(s.cash<cost){setNotice('Freight boost requires '+fmt(cost)+' RVT.');return;}
    setS(v=>v.cash<freightBoostCost(v,route)||v.freightBoostSeconds[route]>0||v.contractClock<v.freightBoostReadyAt[route]?v:{
      ...v,cash:v.cash-freightBoostCost(v,route),
      freightBoostSeconds:{...v.freightBoostSeconds,[route]:FREIGHT_BOOST_DURATION},
      freightBoostReadyAt:{...v.freightBoostReadyAt,[route]:v.contractClock+FREIGHT_BOOST_COOLDOWN}
    });
    setNotice((route==='iron'?'Iron':'Copper')+' freight rush activated · 2× transport for 60 seconds!');
  };
  const buyDrone=()=>{
    if(!droneUnlocked(s)){setNotice('Drones unlock once you have Large Lorries.');return;}
    if(s.drones>=MAX_DRONES){setNotice('Drone hangar is full.');return;}
    if(s.cash<DRONE_PRICE){setNotice('You need '+fmt(DRONE_PRICE)+' RVT for another drone.');return;}
    setS(v=>!droneUnlocked(v)||v.drones>=MAX_DRONES||v.cash<DRONE_PRICE?v:{...v,cash:v.cash-DRONE_PRICE,drones:v.drones+1});
    setNotice('Freight drone purchased. Assign it to an ore route to start automatic deliveries.');
  };
  const assignDrone=(route:FreightRoute,amount:number)=>{
    setS(v=>{
      const other=v.droneAssignments[route==='iron'?'copper':'iron'];
      return {...v,droneAssignments:{...v.droneAssignments,[route]:Math.max(0,Math.min(amount,v.drones-other))}};
    });
  };
  const upgradeFreight=()=>{
    if(s.freightTier>=3)return;
    const next=(s.freightTier+1) as VehicleTier,upgrade=FREIGHT_TIERS[next];
    if(s.cash<upgrade.cost){setNotice('Vehicle fleet upgrade needs '+fmt(upgrade.cost)+' RVT.');return;}
    setS(v=>v.freightTier>=3||v.cash<FREIGHT_TIERS[v.freightTier+1].cost?v:{
      ...v,cash:v.cash-FREIGHT_TIERS[v.freightTier+1].cost,freightTier:(v.freightTier+1) as VehicleTier
    });
    setNotice('Fleet upgraded to '+upgrade.name+' · '+upgrade.capacity.toFixed(1)+' ore/sec per driver.');
  };
  const payroll=payrollPerMinute(s);
  const payrollFunded=s.cash+1e-8>=payroll/60;
  const economyActive=running&&!s.breakdownEvent&&!s.powerCutEvent&&!s.cyberAttackEvent&&!s.writeOffEvent;
  const machinesWorking=economyActive&&!s.powerShortage?machines.reduce((sum,m)=>sum+(s.lastOutput[m.id]>0?workingUnits(s,m.id):0),0):0;
  const autoIncomePerMinute=economyActive&&payrollFunded&&s.autoSell?goods.reduce((sum,item)=>{
    const assigned=Math.min(s.salespeople,Math.max(0,s.salesAssignments[item.id]||0));
    // Estimate the next minute from the current one-second dispatch rate.
    const manualFlow=(item.id==='ingot'||item.id==='wire')&&s.flowMode[item.id]==='feed';
    const stockFloor=manualFlow?0:contractStockTarget(s,item.id);
    const warehouseBuffer=(item.id==='ingot'||item.id==='wire')&&s.flowMode[item.id]==='balanced'?2:0;
    const amount=Math.min(Math.max(0,s[item.id]-Math.max(stockFloor,warehouseBuffer)),assigned*SALES_UNITS_PER_SECOND*(s.researched.includes('dispatch-systems')?1.25:1)*(1+s.capitalLevels.freightNetwork*.1)*speed*(s.boostSeconds.dispatch>0?2:1));
    return sum+amount*item.price*(s.researched.includes('market-intelligence')?1.2:1)*60;
  },0):0;
  const wagesPerMinute=economyActive&&payrollFunded?payroll:0;
  const powerPerMinute=economyActive&&!s.powerShortage?electricityCostPerMinute(s,speed):0;
  const netPerMinute=autoIncomePerMinute-wagesPerMinute-powerPerMinute;
  const moneyPerMinute=(amount:number)=>Math.abs(amount).toFixed(1);
  const progressionLevel=Math.max(1,Math.floor((1+Math.sqrt(1+4*s.experience/75))/2));
  const reputationUnlock:Record<MachineId,number>={miner:0,smelter:2,press:8,assembler:18,copperMiner:20,copperSmelter:35,wiremill:50,circuitpress:60,beamMill:18,coilWinder:50,motorworks:190};
  const machineTypesOwned=machines.filter(m=>s[m.id]>0).length;
  const companyRanks=[
    {name:'WORKSHOP',rep:0,xp:0,sales:0,machines:0},
    {name:'LOCAL MANUFACTURER',rep:15,xp:150,sales:500,machines:2},
    {name:'REGIONAL SUPPLIER',rep:55,xp:550,sales:5000,machines:4},
    {name:'INDUSTRIAL CORPORATION',rep:125,xp:1600,sales:20000,machines:6},
    {name:'NATIONAL MANUFACTURER',rep:220,xp:3500,sales:65000,machines:8},
    {name:'MULTINATIONAL MANUFACTURER',rep:350,xp:6500,sales:150000,machines:10}
  ];
  const rankUnlocked=(rank:typeof companyRanks[number])=>s.reputation>=rank.rep&&s.experience>=rank.xp&&s.sold>=rank.sales&&machineTypesOwned>=rank.machines;
  const currentRank=[...companyRanks].reverse().find(rankUnlocked)||companyRanks[0];
  const companyRank=currentRank.name;
  
  const unlockAt:Record<MachineId,number>={miner:0,smelter:25,press:150,assembler:200,copperMiner:200,copperSmelter:350,wiremill:500,circuitpress:700,beamMill:260,coilWinder:650,motorworks:3500};
  // Keep the floor focused: show every machine already owned and just the next milestone.
  const stageReached=(stage:number)=>{
    const goal=FACTORY_STAGES[stage-1];
    if(s.experience<goal.xp||s.reputation<goal.rep)return false;
    return stage===5?rankUnlocked(companyRanks[3]):stage===6?rankUnlocked(companyRanks[5]):true;
  };
  const currentStage=[...FACTORY_STAGES].reverse().find(stage=>stageReached(stage.number))||FACTORY_STAGES[0];
  const nextMachine=machines.filter(m=>s[m.id]===0).sort((a,b)=>unlockAt[a.id]-unlockAt[b.id])[0];
  const visibleMachines=machines.filter(m=>s[m.id]>0||(s.pendingReplacement[m.id]||0)>0||m.id===nextMachine?.id||(m.id==='beamMill'&&s.smelter>0)||(m.id==='coilWinder'&&s.wiremill>0));
  const visibleGoods=goods.filter((g)=>{
    const producer=contractProducer;
    return s[g.id]>=1||s[producer[g.id]]>0||(s.pendingReplacement[producer[g.id]]||0)>0||producer[g.id]===nextMachine?.id||(producer[g.id]==='beamMill'&&s.smelter>0)||(producer[g.id]==='coilWinder'&&s.wiremill>0);
  });
  const achievements=[
    {name:'First Foundations',detail:'Build your first machine',done:machineCount>=1,icon:'🏗️'},
    {name:'Hot Metal',detail:'Unlock the Blast Furnace',done:s.sold>=150,icon:'🔥'},
    {name:'Precision Work',detail:'Build the Stamping Press',done:s.press>0,icon:'🔩'},
    {name:'Full Production',detail:'Build the Mech Assembly',done:s.assembler>0,icon:'🦾'},
    {name:'First Shipment',detail:'Ship 1,000 Rivets worth of goods',done:s.sold>=1000,icon:'🚚'},
    {name:'Growing Crew',detail:'Hire your first team member',done:s.mechanics+s.salespeople>0,icon:'👷'},
    {name:'A New Metal',detail:'Build the Copper Excavator',done:s.copperMiner>0,icon:'🟠'},
    {name:'Going Electric',detail:'Build the Circuit Board Line',done:s.circuitpress>0,icon:'🟩'}
  ];
  const missions=[
    {id:1,title:'Make your first shipment',detail:'Ship any goods from the Warehouse.',progress:Math.min(1,s.sold),target:1,done:s.sold>=1,rivets:40,gears:0,xp:10},
    {id:2,title:'Bring the heat',detail:'Build your first Blast Furnace.',progress:s.smelter>0?1:0,target:1,done:s.smelter>0,rivets:60,gears:0,xp:15},
    {id:3,title:'Build your maintenance crew',detail:'Hire your first mechanic in Staff.',progress:Math.min(1,s.mechanics),target:1,done:s.mechanics>0,rivets:80,gears:0,xp:15},
    {id:4,title:'Become a serious supplier',detail:'Ship 1,000 Rivets worth of goods in total.',progress:Math.min(1000,s.sold),target:1000,done:s.sold>=1000,rivets:100,gears:2,xp:20},
    {id:5,title:'Shape the steel',detail:'Build your first Stamping Press.',progress:s.press>0?1:0,target:1,done:s.press>0,rivets:120,gears:0,xp:20},
    {id:6,title:'Assemble the future',detail:'Build your first Mech Assembly.',progress:s.assembler>0?1:0,target:1,done:s.assembler>0,rivets:150,gears:3,xp:25},
    {id:7,title:'Double your extraction',detail:'Build a second Rockbreaker Mine.',progress:Math.min(2,s.miner),target:2,done:s.miner>=2,rivets:180,gears:2,xp:20},
    {id:8,title:'Take sales off the floor',detail:'Hire your first sales representative.',progress:Math.min(1,s.salespeople),target:1,done:s.salespeople>0,rivets:200,gears:2,xp:25},
    {id:9,title:'Work smarter, not harder',detail:'Research Efficient Extraction.',progress:s.researched.includes('efficient-extraction')?1:0,target:1,done:s.researched.includes('efficient-extraction'),rivets:250,gears:3,xp:30},
    {id:10,title:'Become a regional supplier',detail:'Reach 10,000 Rivets in lifetime shipments.',progress:Math.min(10000,s.sold),target:10000,done:s.sold>=10000,rivets:350,gears:5,xp:35},
    {id:11,title:'Scale up the press room',detail:'Build a second Stamping Press.',progress:Math.min(2,s.press),target:2,done:s.press>=2,rivets:450,gears:6,xp:40},
    {id:12,title:'A new metal to master',detail:'Build your first Copper Excavator.',progress:s.copperMiner>0?1:0,target:1,done:s.copperMiner>0,rivets:550,gears:5,xp:45},
    {id:13,title:'Power the future',detail:'Build your first Wire Drawing Mill.',progress:s.wiremill>0?1:0,target:1,done:s.wiremill>0,rivets:700,gears:8,xp:50},
    {id:14,title:'Electronics manufacturer',detail:'Build your first Circuit Board Line.',progress:s.circuitpress>0?1:0,target:1,done:s.circuitpress>0,rivets:900,gears:12,xp:60}
  ];
  const activeMission=missions.find(m=>!s.missionsClaimed.includes(m.id));
  const visibleContracts=contracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.contractClock>=(s.storyNextAt[c.id]||0)&&(c.id==='first-ore'||(s.reputation>=c.minRep&&s[contractProducer[c.good]]>0&&Number.isFinite(estimateContractSeconds(s,[{good:c.good,qty:c.qty}],false)))));
  const repeatOrders=generateRepeatOrders(s);
  const qualityMail=qaComplaintPending(s)?[{key:'quality-complaint',title:'Quality complaint · action required',from:'Construction Accounts',detail:'The last steel plate consignment had inconsistent finishing. Please appoint a Quality Assurance inspector before we accept another precision order.',good:'plate' as StockId,qty:0,items:[] as OrderLine[],kind:'CUSTOMER COMPLAINT',due:0}]:[];
  const incomingMailRaw=[...qualityMail,...visibleContracts.map(c=>({key:'story-'+c.id,title:c.name,from:'Contract Office',detail:c.detail,good:c.good,qty:c.qty,items:[{good:c.good,qty:c.qty}],kind:'STORY ORDER',due:0})),...repeatOrders.map(o=>({key:'repeat-'+o.id,title:o.name,from:o.name,detail:o.detail,good:o.good,qty:o.qty,items:o.items,kind:o.kind,due:o.due}))];
  // Stable keys prevent duplicate entries for the same offer across refreshes.
  const incomingMail=Array.from(new Map(incomingMailRaw.map(mail=>[mail.key,mail])).values());
  const nextMailWait=!s.contractsCompleted.includes('first-ore')?Infinity:s.repeatNextAt.slice(0,s.experience>=500?3:s.experience>=150?2:1).map((at,i)=>repeatOrders.some(o=>o.slot===i)?Infinity:Math.max(0,Math.max(at,s.nextContractOfferAt)-s.contractClock)).reduce((a,b)=>Math.min(a,b),Infinity);
  // Repeat orders update the inbox counter without forcing the dropdown open.
  // Players choose when to review work instead of being interrupted by every new offer.
  const readyOrders=visibleContracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.reputation>=c.minRep&&s[c.good]>=c.qty).length+repeatOrders.filter(c=>orderReady(s,c)).length;
  const activeOrders=visibleContracts.filter(c=>!s.contractsCompleted.includes(c.id)&&s.reputation>=c.minRep&&s[c.good]<c.qty).length+repeatOrders.filter(c=>!orderReady(s,c)).length;
  const capacityOf=(id:MachineId)=>machineCapacity(s,id,speed,s.boostSeconds.production>0);
  const upstreamAdvice:Partial<Record<MachineId,string>>={
    smelter:'Rockbreaker Mine',press:'Blast Furnace',beamMill:'Blast Furnace',
    assembler:'Stamping Press',copperSmelter:'Copper Excavator',
    wiremill:'Copper Foundry',circuitpress:'Wire Drawing Mill',coilWinder:'Wire Drawing Mill',
    motorworks:'Coil Winding Machine + Circuit Board Line'
  };
  const completedOrders=s.contractsCompleted.length;
  const deliveryCandidates=[
    ...visibleContracts.filter(c=>s.reputation>=c.minRep).map(c=>({key:'story-'+c.id,name:c.name,items:[{good:c.good,qty:c.qty}],reward:c.reward,due:0})),
    ...repeatOrders.map(o=>({key:'repeat-'+o.id,name:o.name,items:o.items,reward:orderPayout(o,s.contractClock),due:o.due}))
  ];
  const orderCompletion=(order:typeof deliveryCandidates[number])=>
    order.items.reduce((total,line)=>total+Math.min(1,Math.max(0,s[line.good]/line.qty)),0)/order.items.length;
  const focusDelivery=[...deliveryCandidates].sort((a,b)=>orderCompletion(b)-orderCompletion(a))[0]||null;

  const noticeTitle=notice.toLowerCase().includes('contract fulfilled')||notice.toLowerCase().includes('delivery signed off')?'Order complete · lovely stuff':notice.toLowerCase().includes('contract accepted')||notice.toLowerCase().includes('order accepted')?'New order · no pressure (some pressure)':notice.toLowerCase().includes('not enough')||notice.toLowerCase().includes('need ')||notice.toLowerCase().includes('no full units')?'Small snag · the numbers say no':notice.toLowerCase().includes('repaired')?'Back in business':notice.toLowerCase().includes('shipped')?'Out the loading bay':notice.toLowerCase().includes('built')?'Fresh machinery':notice.toLowerCase().includes('mission complete')?'Milestone smashed':'Workshop update';
  const noticeKind=notice.toLowerCase().includes('contract')||notice.toLowerCase().includes('order accepted')||notice.toLowerCase().includes('delivery signed off')?'ORDER DESK':notice.toLowerCase().includes('not enough')||notice.toLowerCase().includes('need ')?'QUICK HEADS-UP':'FACTORY NOTICE';
  useEffect(()=>{
    const next=missions.find(m=>!s.missionsClaimed.includes(m.id));
    if(next&&next.done){
      setS(v=>v.missionsClaimed.includes(next.id)?v:{...v,missionsClaimed:[...v.missionsClaimed,next.id],cash:v.cash+next.rivets,gears:v.gears+next.gears,experience:v.experience+next.xp});
      setNotice('Mission complete: '+next.title+' · +'+next.rivets+' Rivets · +'+next.xp+' XP'+(next.gears?' · +'+next.gears+' Gears':''));
    }
  },[s]);
  const saleMultiplier=s.researched.includes('market-intelligence')?1.2:1;
  const rateFor=(m:typeof machines[number])=>economyActive?s.lastOutput[m.id]:0;
  const resolvePowerCut=(hireMechanic:boolean)=>{
    if(!s.powerCutEvent)return;
    const cost=hireMechanic?60:40;
    if(s.cash<cost&&hireMechanic){setNotice('Hiring a mechanic requires '+cost+' RVT.');return;}
    setS(v=>{
      if(!v.powerCutEvent||(hireMechanic&&v.cash<cost))return v;
      return {...v,cash:Math.max(0,v.cash-(hireMechanic?cost:(v.cash>=40?40:0))),
        ...(hireMechanic?{mechanics:v.mechanics+1,mechanicAssignments:{...v.mechanicAssignments,miner:v.mechanicAssignments.miner+1}}:{}),
        broken:{...v.broken,miner:0},
        unitFaults:{...v.unitFaults,miner:v.unitFaults.miner.map(()=>0)},
        powerCutEvent:false};
    });
    setNotice(hireMechanic?'Mechanic hired on a first-day discount. The Rockbreaker Mine is repaired and back online.':s.cash<40?'Emergency safety reset completed free of charge. Your mine is back online.':'One-off emergency repair complete. The Rockbreaker Mine is back online.');
  };
  const cybersecurityCost=(state:GameState)=>Math.floor(2250*Math.pow(2.1,state.cybersecuritySpecialists));
  const hireCybersecuritySpecialist=()=>{
    const cost=cybersecurityCost(s);
    if(s.cash<cost){setNotice('Not enough Rivets. Ship existing stock from the Warehouse to fund the security hire.');return;}
    setS(v=>({...v,cash:v.cash-cost,cybersecuritySpecialists:v.cybersecuritySpecialists+1,cyberAttackEvent:false}));
    setNotice('Cybersecurity specialist hired. The breach is contained and a permanent factory firewall is now active.');
  };
  const emergencyCyberRecovery=()=>{
    const freeFallback=s.cash<120;
    setS(v=>v.cyberAttackEvent?{...v,cash:Math.max(0,v.cash-(v.cash>=120?120:0)),cyberAttackEvent:false}:v);
    setNotice(freeFallback?'Emergency manual reboot completed free of charge. The factory is running, but you still need permanent cyber protection.':'External response team restored the production network. The breach is contained, but you have no in-house cyber protection.');
  };
  const resolveBreakdown=(useMechanic:boolean)=>{
    const id=s.breakdownEvent;
    if(!id)return;
    if(useMechanic&&s.mechanicAssignments[id]>0){setS(v=>({...repairUnit(v,id,firstFault(v,id)),breakdownEvent:null}));setNotice(machines.find(m=>m.id===id)!.name+' repaired by your assigned mechanic. Production is back online.');return;}
    const cost=repairCostFor(id,s[`tier_${id}`]);
    if(s.cash>=cost){setS(v=>({...repairUnit(v,id,firstFault(v,id)),cash:v.cash-cost,breakdownEvent:null}));setNotice('Emergency repair complete · '+cost+' RVT spent. Production is back online.');return;}
    setS(v=>({...v,breakdownEvent:null}));setNotice('Emergency stop cleared. The machine remains broken until you assign a mechanic or save '+cost+' RVT for repairs.');
  };
  const buyMachine=(m:typeof machines[number])=>{
    if(m.id==='miner'&&s.miner===0&&!s.acceptedContracts.includes('first-ore')){setNotice('Accept your First Ore Delivery contract to receive the machine advance.');return;}
    if(s[m.id]>=MAX_MACHINE_UNITS){setNotice('Maximum of five units reached for '+m.name+'.');return;}
    if(s[m.id]===0&&!(s.pendingReplacement[m.id]>0)&&(!stageReached(machineStage[m.id])||s.experience<unlockAt[m.id]||s.reputation<reputationUnlock[m.id])){setNotice('This machine type is not unlocked yet.');return;}
    const cost=machineCost(m,s);
    if(s.cash<cost){setNotice('Not enough Rivets. Ship some stock to raise funds.');return;}
    setS(v=>{
      if(v[m.id]>=MAX_MACHINE_UNITS||v.cash<cost)return v;
      const replaceLost=(v.pendingReplacement[m.id]||0)>0;
      const levelLoss=replaceLost?Math.min(5,v[`tier_${m.id}`]):0;
      return {...v,cash:v.cash-cost,[m.id]:v[m.id]+1,
        unitFaults:{...v.unitFaults,[m.id]:[...v.unitFaults[m.id],0]},
        unitPenalties:{...v.unitPenalties,[m.id]:[...v.unitPenalties[m.id],levelLoss]},
        pendingReplacement:replaceLost?{...v.pendingReplacement,[m.id]:v.pendingReplacement[m.id]-1}:v.pendingReplacement,
        ...(m.id==='assembler'&&!v.cyberAttackSeen?{cyberAttackSeen:true,cyberAttackEvent:true}:{})};
    });
    setNotice(m.id==='assembler'&&!s.cyberAttackSeen?'Mech Assembly commissioned. Security breach detected — the factory network is locked down.':m.name+' unit '+(s[m.id]+1)+' built'+((s.pendingReplacement[m.id]||0)>0?' as a replacement at up to 5 levels below the old equipment.':'.'));
    celebrate('New machine online!',m.name+' · unit '+(s[m.id]+1),'upgrade');
  };
  const upgradeMachine=(m:typeof machines[number])=>{
    const cost=(s[`tier_${m.id}`]+1)*3;
    if(s.gears<cost){setNotice('You need '+cost+' Gears for this upgrade.');return;}
    setS(v=>({...v,gears:v.gears-cost,[`tier_${m.id}`]:v[`tier_${m.id}`]+1}));
    setNotice(m.name+' upgraded. Output increased by 25%.');
    celebrate('Production upgraded!',m.name+' · +25% output','upgrade');
  };
  const sellStock=(id:StockId)=>{
    const item=goods.find(g=>g.id===id)!;const amount=Math.floor(s[id]);
    if(amount<1){setNotice('There are no full units ready to ship.');return;}
    const revenue=amount*item.price*saleMultiplier;
    setS(v=>{const total=v.salesXpProgress+revenue;const shipmentXp=Math.floor((total+1e-8)/25);return {...v,[id]:v[id]-amount,cash:v.cash+revenue,sold:v.sold+revenue,salesXpProgress:total-shipmentXp*25,experience:v.experience+shipmentXp,gears:v.gears+shipmentGearGain(v,finishedGearUnits(id,amount)).earned,gearShipmentProgress:shipmentGearGain(v,finishedGearUnits(id,amount)).remainder};});
    const shipmentXp=Math.floor((s.salesXpProgress+revenue+1e-8)/25);
    setNotice('Shipped '+fmt(amount)+' '+item.name+' for '+fmt(revenue)+' Rivets.'+(shipmentXp>0?' · +'+shipmentXp+' XP from shipments.':''));
    celebrate('Shipment dispatched!',fmt(amount)+' '+item.name,'shipment',{cash:revenue,xp:shipmentXp});
  };
  const shipSurplus=()=>{
    if(!stockSaleReminder(s).units){setNotice('No spare full units to sell. Your contract stock is being kept safe.');return;}
    // Recalculate against the latest state, so changing orders and repeated taps
    // cannot sell reserved goods or award the same shipment twice.
    setS(v=>sellSurplusStock(v));
    setNotice('Surplus stock shipped. Goods reserved for current contracts stayed in the Warehouse.');
  };
  const shipAllStock=()=>{
    const items=goods.map(g=>({item:g,amount:Math.max(0,Math.floor(s[g.id]))})).filter(x=>x.amount>0);
    if(!items.length){setNotice('There are no full units ready to ship.');return;}
    const revenue=items.reduce((total,{item,amount})=>total+amount*item.price*saleMultiplier,0);
    const totalUnits=items.reduce((total,{amount})=>total+amount,0);
    const earnedXp=Math.floor((s.salesXpProgress+revenue+1e-8)/25);
    setS(v=>{
      const shipped=goods.map(g=>({item:g,amount:Math.max(0,Math.floor(v[g.id]))}));
      const actualRevenue=shipped.reduce((total,{item,amount})=>total+amount*item.price*(v.researched.includes('market-intelligence')?1.2:1),0);
      if(actualRevenue<=0)return v;
      const progress=v.salesXpProgress+actualRevenue;
      const xp=Math.floor((progress+1e-8)/25);
      const next={...v,cash:v.cash+actualRevenue,sold:v.sold+actualRevenue,salesXpProgress:progress-xp*25,experience:v.experience+xp,gears:v.gears+shipmentGearGain(v,shipped.reduce((total,{item,amount})=>total+finishedGearUnits(item.id,amount),0)).earned,gearShipmentProgress:shipmentGearGain(v,shipped.reduce((total,{item,amount})=>total+finishedGearUnits(item.id,amount),0)).remainder};
      shipped.forEach(({item,amount})=>{next[item.id]-=amount;});
      return next;
    });
    setNotice('Shipped '+fmt(totalUnits)+' units across '+items.length+' products for '+fmt(revenue)+' Rivets · +'+earnedXp+' XP.');
    celebrate('Warehouse cleared!',fmt(totalUnits)+' units · '+items.length+' product types','shipment',{cash:revenue,xp:earnedXp});
  };
  const completeContract=(contract:typeof contracts[number])=>{
    if(s.contractsCompleted.includes(contract.id))return;
    if(contract.id==='first-ore'&&!s.acceptedContracts.includes('first-ore')){setNotice('Accept the opening contract before delivering goods.');return;}
    if(s.reputation<contract.minRep){setNotice('Your company needs '+contract.minRep+' reputation.');return;}
    if(contract.id==='precision-order'&&qaComplaintPending(s)){setNotice('Customer requires a Quality Assurance inspector before accepting precision parts. See Staff.');return;}
    if(s[contract.good]<contract.qty){setNotice('You need '+contract.qty+' units in stock.');return;}
    setS(v=>({...v,[contract.good]:v[contract.good]-contract.qty,cash:v.cash+contract.reward,reputation:v.reputation+contract.rep,experience:v.experience+contract.xp,contractsCompleted:[...v.contractsCompleted,contract.id],contractAlert:{id:'story-'+contract.id,tone:'good',message:'Delivered · +'+contract.reward+' RVT · +'+contract.rep+' REP'},...(contract.id==='first-ore'&&!v.powerCutSeen?{powerCutSeen:true,powerCutEvent:true,broken:{...v.broken,miner:Math.max(v.broken.miner,30)},unitFaults:{...v.unitFaults,miner:v.unitFaults.miner.map((fault,i)=>i===0?Math.max(fault,30):fault)}}:{})}));
    if(contract.id==='first-ore')setNotice('DELIVERY SIGNED OFF · +'+contract.xp+' XP — then the lights go out. The Rockbreaker Mine has lost power.');
  };
  const completeRepeatOrder=(order:RepeatOrder)=>{
    const current=s.repeatOffers[order.slot];
    if(!current||current.id!==order.id||s.contractClock>=orderExpiry(current)){setNotice('This order has expired.');return;}
    if(!orderReady(s,current)){setNotice('Not enough stock to complete all items on this order.');return;}
    setS(v=>deliverRepeatOrder(v,order));
  };
  const declineRepeatOrder=(order:RepeatOrder)=>{
    setS(v=>closeRepeatOrder(v,order));setExpandedMail(null);
  };
  const declineStoryOrder=(contract:typeof contracts[number])=>{
    if(contract.id==='first-ore'){setNotice('The opening order starts your factory and cannot be declined.');return;}
    setS(v=>v.contractsCompleted.includes(contract.id)?v:{...v,reputation:Math.max(0,v.reputation-1),
      storyNextAt:{...v.storyNextAt,[contract.id]:v.contractClock+300},contractAlert:{id:'declined-story-'+contract.id+'-'+v.contractClock,tone:'bad',message:'Order declined · −1 REP'}});
    setExpandedMail(null);
  };
  const hireQualityInspector=()=>{setS(v=>v.qualityInspectors>=2||!v.contractsCompleted.includes(QA_TRIGGER_CONTRACT)||v.cash<QA_HIRE_COST?v:{...v,cash:v.cash-QA_HIRE_COST,qualityInspectors:v.qualityInspectors+1});setNotice('Quality inspector recruited · +8% finished-goods output; +28 RVT/min payroll.');};
  const fireQualityInspector=()=>{setS(v=>v.qualityInspectors===0?v:{...v,qualityInspectors:v.qualityInspectors-1});setNotice('Quality inspector dismissed · −28 RVT/min payroll. Precision orders require at least one inspector.');};
  const hire=(role:'mechanic'|'sales')=>{
    const cost=role==='mechanic'?mechanicCost(s):salesCost(s);
    if(s.cash<cost){setNotice('You need '+fmt(cost)+' Rivets to hire this person.');return;}
    setS(v=>{
      const currentCost=role==='mechanic'?mechanicCost(v):salesCost(v);
      if(v.cash<currentCost)return v;
      const firstSales=role==='sales'&&v.salespeople===0;
      const starterProduct=goods.find(g=>v[contractProducer[g.id]]>0)?.id;
      return {...v,cash:v.cash-currentCost,[role==='mechanic'?'mechanics':'salespeople']:v[role==='mechanic'?'mechanics':'salespeople']+1,
        ...(firstSales&&starterProduct?{autoSell:true,salesAssignments:{...fresh.salesAssignments,[starterProduct]:1}}:{})};
    });
    setNotice(role==='mechanic'?'Mechanic hired. Assign them to a machine below.':s.salespeople===0?'First salesperson hired · automatic sales enabled for your first installed product. Contract stock stays protected.':'Sales representative hired. Assign them to a product below.');
  };
  const fire=(role:'mechanic'|'sales'|'cyber')=>{
    const key=role==='mechanic'?'mechanics':role==='sales'?'salespeople':'cybersecuritySpecialists';
    if(s[key]<=0){setNotice('No staff in this role to dismiss.');return;}
    setS(v=>{
      if(v[key]<=0)return v;
      const next={...v,[key]:v[key]-1};
      if(role==='mechanic'){
        const assignments={...v.mechanicAssignments};
        let excess=Math.max(0,machines.reduce((sum,m)=>sum+assignments[m.id],0)-next.mechanics);
        for(const m of [...machines].reverse()){if(excess<=0)break;const removed=Math.min(excess,assignments[m.id]);assignments[m.id]-=removed;excess-=removed;}
        next.mechanicAssignments=assignments;
      }
      if(role==='sales'){
        const assignments={...v.salesAssignments};
        let excess=Math.max(0,goods.reduce((sum,g)=>sum+assignments[g.id],0)-next.salespeople);
        for(const g of [...goods].reverse()){if(excess<=0)break;const removed=Math.min(excess,assignments[g.id]);assignments[g.id]-=removed;excess-=removed;}
        next.salesAssignments=assignments;
      }
      return next;
    });
    setNotice('Employee dismissed. Payroll reduced by '+(role==='mechanic'?WAGES.mechanic:role==='sales'?salesWages(s.salespeople)-salesWages(s.salespeople-1):WAGES.cyber)+' RVT per minute.');
  };
  const assignSales=(id:StockId,count:number)=>{
    setS(v=>{
      const used=goods.reduce((sum,g)=>sum+(g.id===id?0:v.salesAssignments[g.id]||0),0);
      return {...v,salesAssignments:{...v.salesAssignments,[id]:Math.max(0,Math.min(count,v.salespeople-used))}};
    });
  };
  const assignMechanic=(id:MachineId,count:number)=>{
    const used=machines.reduce((sum,m)=>sum+(m.id===id?0:s.mechanicAssignments[m.id]),0);
    const allowed=Math.max(0,Math.min(s.mechanics-used,count));
    setS(v=>({...v,mechanicAssignments:{...v.mechanicAssignments,[id]:allowed}}));
  };
  const technologies=[
    {id:'efficient-extraction',tier:1,name:'Efficient Extraction',branch:'PRODUCTION',cost:2,icon:Zap,detail:'Optimised drills and furnace timing increase all machine output by 15%.',effect:'+15% production',requires:[] as string[]},
    {id:'reinforced-bearings',tier:1,name:'Reinforced Bearings',branch:'MAINTENANCE',cost:3,icon:ShieldCheck,detail:'Hard-wearing components reduce machine breakdown chance by 35%.',effect:'35% fewer breakdowns',requires:['efficient-extraction']},
    {id:'market-intelligence',tier:1,name:'Market Intelligence',branch:'COMMERCE',cost:4,icon:TrendingUp,detail:'Better pricing data and smarter contracts increase every sale value by 20%.',effect:'+20% sale value',requires:['efficient-extraction']},
    {id:'precision-tooling',tier:2,name:'Precision Tooling',branch:'ADVANCED PRODUCTION',cost:6,icon:Cpu,detail:'High-tolerance tooling pushes every production line another 30% faster.',effect:'+30% production',requires:['reinforced-bearings','market-intelligence']},
    {id:'dispatch-systems',tier:2,name:'Dispatch Systems',branch:'LOGISTICS',cost:8,icon:Truck,detail:'Better routing and order handling allow sales representatives to sell goods 25% faster.',effect:'+25% automatic sales speed',requires:['market-intelligence']},
    {id:'predictive-maintenance',tier:3,name:'Predictive Maintenance',branch:'INDUSTRIAL SYSTEMS',cost:12,icon:ShieldCheck,detail:'Condition monitoring further reduces breakdown risk by 20 percentage points.',effect:'Additional 20% fewer breakdowns',requires:['precision-tooling']},
    {id:'smart-robotics',tier:3,name:'Smart Robotics',branch:'AUTOMATION',cost:15,icon:Factory,detail:'Factory-wide robotic control boosts all production by another 20%.',effect:'+20% production',requires:['precision-tooling','dispatch-systems']}
  ];
  const researchTierNames:Record<number,string>={1:'Workshop Fundamentals',2:'Industrial Engineering',3:'Advanced Automation'};
  const researchTierUnlocked=(tier:number,done:string[])=>tier===1||(tier===2?done.includes('efficient-extraction'):done.includes('precision-tooling'));
  const researchTech=(id:string)=>{
    const tech=technologies.find(t=>t.id===id);
    if(!tech||s.researched.includes(id))return;
    if(!researchTierUnlocked(tech.tier,s.researched)){setNotice('Research the preceding tier first.');return;}
    if(!tech.requires.every(req=>s.researched.includes(req))){setNotice('Complete the prerequisite research first.');return;}
    if(s.gears<tech.cost){setNotice('You need '+tech.cost+' Gears to fund this research.');return;}
    setS(v=>v.researched.includes(id)?v:{...v,gears:v.gears-tech.cost,researched:[...v.researched,id]});
    setNotice(tech.name+' researched · '+tech.effect+'.');
  };
  const donateToCharity=()=>{
    const amount=charityAmount;
    const cause=CHARITY_CAUSES.find(c=>c.id===charityCause)!;
    setCharityConfirmation(false);
    if(s.cash<amount){setNotice('Not enough Rivets for this donation. Keep enough cash for machinery and electricity.');return;}
    const reward=charityMilestoneReward(s.charityTotal,amount);
    setS(v=>{
      if(v.cash<amount)return v;
      const bonus=charityMilestoneReward(v.charityTotal,amount);
      const entry:CharityDonation={cause:charityCause,amount,rep:bonus,at:v.contractClock};
      return {...v,cash:v.cash-amount,reputation:v.reputation+bonus,charityTotal:v.charityTotal+amount,
        charityCount:v.charityCount+1,charityMilestonesClaimed:Math.floor((v.charityTotal+amount)/CHARITY_MILESTONE_RVT),
        charityHistory:[...v.charityHistory,entry].slice(-5)};
    });
    setNotice('Donated '+fmt(amount)+' RVT to '+cause.name+'.'+(reward>0?' Community milestone reached: +'+reward+' REP.':' Your gift counts towards the next 100,000 RVT milestone.'));
  };
  const buyCapital=(id:CapitalId)=>{
    const project=CAPITAL_PROJECTS.find(p=>p.id===id)!;
    const cost=capitalPrice(s,id);
    if(s.capitalLevels[id]>=project.max){setNotice(project.name+' is fully upgraded.');return;}
    if(s.cash<cost){setNotice('Need '+fmt(cost-s.cash)+' more Rivets to fund '+project.name+'.');return;}
    setS(v=>{
      if(v.capitalLevels[id]>=project.max||v.cash<capitalPrice(v,id))return v;
      const price=capitalPrice(v,id);
      return {...v,cash:v.cash-price,capitalSpent:v.capitalSpent+price,capitalLevels:{...v.capitalLevels,[id]:v.capitalLevels[id]+1}};
    });
    setNotice(project.name+' improved to level '+(s.capitalLevels[id]+1)+'. '+project.effect+'.');
  };
  const buyBoost=(id:BoostId)=>{
    const offer=BOOSTS.find(b=>b.id===id);
    if(!offer)return;
    if(s.boostSeconds[id]>360){setNotice('Maximum 9 minutes banked for this boost. Let the timer run down first.');return;}
    if(s.cash<offer.cost){setNotice('You need '+fmt(offer.cost)+' Rivets for '+offer.name+'.');return;}
    setS(v=>v.boostSeconds[id]>360||v.cash<offer.cost?v:{...v,cash:v.cash-offer.cost,boostSeconds:{...v.boostSeconds,[id]:v.boostSeconds[id]+offer.duration}});
    setNotice(offer.name+' · +'+boostClock(offer.duration)+' added to the timer. Power does not multiply.');
  };
  const reset=()=>{setStockPromptDismissedUntil(0);setQcView(null);setS(v=>({...fresh,styleTokens:v.styleTokens,unlockedThemes:v.unlockedThemes,theme:v.theme,qcReadyAt:Math.max(0,v.qcReadyAt-v.contractClock)}));setRunning(true);setSpeed(1);setShowReset(false);setNotice('A fresh factory. Let’s get to work!');};
  return <div className="game" data-theme={s.theme}>
    {contractToast&&<div className={'contract-mini-toast '+contractToast.tone} role="status" aria-live="polite"><span aria-hidden="true">{contractToast.tone==='good'?'✓':'!'}</span><p>{contractToast.message}</p><button type="button" aria-label="Dismiss contract notification" onClick={()=>setContractToast(null)}>×</button></div>}
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Factory size={23}/></span><span><b>ORE &amp; ORDER</b><small>FACTORY TYCOON · v1.1</small></span></div>
      <div className="wallet">
        <div className="wallet-cash"><span className="coin-symbol">R</span><span><small>RIVETS</small><b>{fmt(s.cash)} <i>RVT</i></b></span></div>
        <div className="wallet-gears"><Cog size={18}/><span><small>GEARS</small><b>{fmt(s.gears)}</b></span></div>
        <div className="wallet-reputation" title="Earn reputation by fulfilling contracts. Late, expired and declined orders reduce it." aria-label={'Reputation: '+fmt(s.reputation)}><ShieldCheck size={18}/><span><small>REPUTATION</small><b>{fmt(s.reputation)} <i>REP</i></b></span></div>
      </div>
      <div className="top-controls"><span className="online"><i/> {s.cyberAttackEvent?'SECURITY LOCKDOWN':running?'RUNNING':'PAUSED'}</span><button className="round-btn" onClick={()=>setRunning(!running)} aria-label={running?'Pause':'Resume'}>{running?<Pause size={16}/>:<Play size={16}/>}</button><button className="round-btn" onClick={()=>setShowReset(true)} aria-label="Reset game"><RotateCcw size={16}/></button></div>
    </header>
    <main>
      <nav className="main-nav" aria-label="Main menu">
        <button className={page==='factory'?'active':''} onClick={()=>setPage('factory')}><Factory size={16}/> Factory</button>
        <button className={page==='staff'?'active':''} onClick={()=>setPage('staff')}><Users size={16}/> Staff <span>{s.mechanics+s.salespeople+s.cybersecuritySpecialists+s.drivers+s.qualityInspectors}</span></button>
        <button className={page==='warehouse'?'active':''} onClick={()=>setPage('warehouse')}><Boxes size={16}/> Warehouse</button>
        <button className={page==='research'?'active':''} onClick={()=>setPage('research')}><FlaskConical size={16}/> Research <span>{s.researched.filter(id=>technologies.some(t=>t.id===id)).length}/{technologies.length}</span></button>
        <button className={page==='store'?'active':''} onClick={()=>setPage('store')}><Zap size={16}/> Boost Store</button>
        <button className={page==='capital'?'active':''} onClick={()=>setPage('capital')}><TrendingUp size={16}/> Capital Projects</button>
        <button className={page==='extras'?'active':''} onClick={()=>setPage('extras')}><Gem size={16}/> Quality & Themes <span>{s.styleTokens}</span></button>
      </nav>
      <aside className="mail-dock">
        <button className="mail-trigger" onClick={()=>setInboxOpen(v=>!v)} aria-expanded={inboxOpen}><span>✉</span><b>ORDER INBOX</b><em>{incomingMail.length}</em><small>{inboxOpen?'▲':'▼'}</small></button>
        {inboxOpen&&<div className="mail-dropdown"><div className="mail-heading"><strong>ORDERS</strong><small>{incomingMail.length} available</small></div>
          {incomingMail.map(mail=>{const expanded=expandedMail===mail.key;const order=repeatOrders.find(o=>'repeat-'+o.id===mail.key);const story=contracts.find(c=>'story-'+c.id===mail.key);const isQualityMail=mail.key==='quality-complaint';return <div className="mail-message" key={mail.key}>
            <button className="mail-subject" aria-expanded={expanded} onClick={()=>setExpandedMail(expanded?null:mail.key)}><span aria-hidden="true">✉</span><span><b>{mail.title}</b><small>{isQualityMail?'Customer complaint · quality check needed':mail.items.map(line=>line.qty+' × '+(goods.find(g=>g.id===line.good)?.name||line.good)).join(' · ')}</small><small>{isQualityMail?'ACTION REQUIRED':fmt(order?orderPayout(order,s.contractClock):story?.reward??0)+' RVT'}{order?' · '+(s.contractClock>order.due?'Late · expires '+boostClock(Math.max(0,orderExpiry(order)-s.contractClock)):boostClock(Math.max(0,order.due-s.contractClock))+' left'):''}</small></span><span aria-hidden="true">{expanded?'−':'+'}</span></button>
            {expanded&&<div className="mail-body">{isQualityMail?<><strong>From: Construction Accounts</strong><p>We have reviewed your steel plate consignment and the finish is not consistent enough. Before our next precision order, please hire a Quality Assurance inspector to check production.</p><p>No fine or reputation loss. Hiring an inspector improves finished-goods output by 8% and costs 28 RVT/min in wages.</p><button className="primary-button" onClick={()=>{setPage('staff');setInboxOpen(false);setExpandedMail(null);}}>OPEN STAFF · QUALITY ASSURANCE</button></>:<><strong>Order details</strong><div className="mail-order-lines">{mail.items.map(line=><div className="mail-order-line" key={line.good}><ProductIcon id={line.good} size={25}/><b>{line.qty} × {goods.find(g=>g.id===line.good)?.name}</b><small>Available: {fmt(s[line.good])}/{line.qty}</small></div>)}</div>{order?<div className={'contract-terms difficulty-'+orderDifficulty(order)}><b>{CONTRACT_TERMS[orderDifficulty(order)].label} · {s.contractClock>order.due?'LATE DELIVERY':'ON-TIME WINDOW'}</b><strong>{fmt(orderPayout(order,s.contractClock))} RVT <small>{s.contractClock>order.due?'current reduced payout':'on-time payout'}</small></strong><span>{s.contractClock>order.due?'Late by '+boostClock(s.contractClock-order.due)+' · −2 REP total':boostClock(Math.max(0,order.due-s.contractClock))+' until deadline'}</span><span>Expires in {boostClock(Math.max(0,orderExpiry(order)-s.contractClock))}</span><small>Decline −1 REP · Late −2 REP · Expired −3 REP</small></div>:<small>No deadline</small>}<small>Reward: {fmt(order?orderPayout(order,s.contractClock):story?.reward??0)} RVT · +{order?.xp??story?.xp??0} XP · +{order?(s.contractClock>order.due?0:order.rep):story?.rep??0} REP</small>
              {story?.id==='first-ore'&&!s.acceptedContracts.includes('first-ore')&&<button className="secondary-button" onClick={()=>{setS(v=>v.acceptedContracts.includes('first-ore')?v:{...v,acceptedContracts:[...v.acceptedContracts,'first-ore'],cash:v.cash+65,drivers:Math.max(1,v.drivers),driverAssignments:{...v.driverAssignments,iron:Math.max(1,v.driverAssignments.iron)}});setNotice('Opening order accepted · 65 RVT equipment advance + starter delivery van and driver included.')}}>ACCEPT OPENING ORDER · +65 RVT</button>}
              <button className="primary-button" disabled={!mail.items.every(line=>s[line.good]>=line.qty)||!!(story?.id==='precision-order'&&qaComplaintPending(s))||!!(story&&s.reputation<story.minRep)||!!(story?.id==='first-ore'&&!s.acceptedContracts.includes('first-ore'))} onClick={()=>{if(order)completeRepeatOrder(order);else if(story)completeContract(story);setExpandedMail(null)}}>{story?.id==='precision-order'&&qaComplaintPending(s)?'QA INSPECTOR REQUIRED':mail.items.every(line=>s[line.good]>=line.qty)?order&&s.contractClock>order.due?'DELIVER LATE · '+fmt(orderPayout(order,s.contractClock))+' RVT':'FULFIL ORDER':'AWAITING PRODUCTS'}</button>
              {(order||(story&&story.id!=='first-ore'))&&<button className="decline-contract" onClick={()=>{if(order)declineRepeatOrder(order);else if(story)declineStoryOrder(story)}}>{order&&s.contractClock>order.due?'CLOSE LATE ORDER · −2 REP TOTAL':'DECLINE CONTRACT · −1 REP'}</button>}</>}</div>}
          </div>})}
          {incomingMail.length===0&&<p className="mail-empty">No orders right now.</p>}
          {Number.isFinite(nextMailWait)&&<div className="mail-next">Next offer check in {boostClock(nextMailWait)}</div>}
        </div>}
      </aside>
      <section className="cashflow-strip" aria-label="Estimated factory cash flow per minute">
        <div className="cashflow-stat cashflow-income"><small>+ AUTOMATIC INCOME / MIN</small><b>+{moneyPerMinute(autoIncomePerMinute)} <i>RVT</i></b></div>
        <div className="cashflow-stat cashflow-expense"><small>− STAFF WAGES / MIN</small><b>−{moneyPerMinute(wagesPerMinute)} <i>RVT</i></b></div>
        <div className="cashflow-stat cashflow-electricity"><small>− ELECTRICITY / MIN</small><b>−{moneyPerMinute(powerPerMinute)} <i>RVT</i></b></div>
        <div className={'cashflow-stat cashflow-net '+(netPerMinute>=0?'positive':'negative')}><small>NET CASH FLOW / MIN</small><b>{netPerMinute>=0?'+':'−'}{moneyPerMinute(netPerMinute)} <i>RVT</i></b></div>
        <small className="cashflow-note">{!running?'Paused · staff wages and electricity stopped':s.breakdownEvent||s.powerCutEvent||s.cyberAttackEvent||s.writeOffEvent?'Incident · staff wages and electricity paused':s.powerShortage?'INSUFFICIENT POWER FUNDS · ship stored goods to restart machinery':!payrollFunded?'Not enough cash for payroll · dispatch paused':'Live estimates from automatic sales, payroll and electricity · excludes manual shipments and contracts'}{' · Starter grid credit: '+s.starterPowerCredit.toFixed(2)+' RVT'}</small>
      </section>
      {showStockReminder&&<section className="stock-sale-reminder" aria-label="Stock ready to sell">
        <span className="stock-sale-reminder-icon" aria-hidden="true"><Store size={20}/></span>
        <div className="stock-sale-reminder-copy"><b>{s.cash<30?'Cash running low · stock ready to sell':'Stock ready to sell'}</b><p>{fmt(saleReminder.units)} spare units worth {fmt(saleReminder.value)} RVT. Review your stock in the Warehouse to cover running costs.</p><small>Goods reserved for current contracts are excluded from this estimate.</small></div>
        <button type="button" className="secondary-button" onClick={()=>setPage('warehouse')}>VIEW STOCK <ArrowUpRight size={14}/></button>
        <button type="button" className="stock-sale-reminder-dismiss" aria-label="Dismiss stock reminder for 3 game minutes" onClick={()=>setStockPromptDismissedUntil(s.contractClock+180)}>×</button>
      </section>}
      {page==='extras'&&<div className="page-content">
        <div className="welcome-row"><div><span className="eyebrow">AFTER-HOURS EXTRAS</span><h1>Quality & Themes</h1><p>Earn cosmetic rewards by inspecting products. Themes never affect production, prices or difficulty.</p></div><div className="staff-summary"><b>{s.styleTokens}</b><span>STYLE TOKENS</span></div></div>
        {qcView?<QualityControlGame key={qcView} session={qcView} playing={economyActive&&!s.powerShortage} onFinish={(id,correct)=>setS(v=>finishQualityControl(v,id,correct))} onClose={()=>{setQcView(null);setS(v=>({...v,qcSession:null}));}}/>:<section className="qc-invite"><div><span className="eyebrow">OPTIONAL · ABOUT 25 SECONDS</span><h2>Quality Control</h2><p>Inspect 10 plates. Reject cracks and missing bolts. Three mistakes end your shift. Get 7 correct for 1 Style Token, or all 10 for 2.</p><small>One shift every 3 game minutes. Leaving or reloading ends the shift without a reward; no money or reputation is lost.</small></div><button type="button" className="primary-button" disabled={s.miner===0||!economyActive||s.powerShortage||s.contractClock<s.qcReadyAt} onClick={()=>{if(s.miner===0||!economyActive||s.powerShortage||s.contractClock<s.qcReadyAt)return;const id=Date.now()+'-'+Math.random();setS(v=>startQualityControl(v,id));setQcView(id);}}>{s.miner===0?'BUILD YOUR FIRST MINE':s.contractClock<s.qcReadyAt?'NEXT SHIFT · '+boostClock(s.qcReadyAt-s.contractClock):!economyActive||s.powerShortage?'RESUME PRODUCTION TO PLAY':'START QUALITY CHECK'}</button></section>}
        <section className="theme-shop"><div className="section-heading"><div><span className="eyebrow">FACTORY COLOURS</span><h2>Choose your theme</h2><p>Unlock a colour scheme once, then switch whenever you like. Themes and tokens stay with your save, even after a factory reset.</p></div></div><div className="theme-grid">{FACTORY_THEMES.map(theme=>{const owned=s.unlockedThemes.includes(theme.id);return <article className="theme-card" key={theme.id}><div className="theme-swatches" aria-hidden="true">{theme.colours.map(colour=><span key={colour} style={{background:colour}}/>)}</div><h3>{theme.name}</h3><button type="button" className={s.theme===theme.id?'primary-button':'secondary-button'} aria-pressed={s.theme===theme.id} disabled={!owned&&s.styleTokens<theme.cost} onClick={()=>setS(v=>buyFactoryTheme(v,theme.id))}>{s.theme===theme.id?'SELECTED':owned?'USE THEME':'UNLOCK · '+theme.cost+' STYLE TOKENS'}</button></article>})}</div></section>
      </div>}
      {page==='factory'&&<div className="page-content">
        <div className="factory-view-toolbar"><div><span className="eyebrow">FACTORY</span></div><div className="factory-view-switch" role="tablist" aria-label="Factory view"><button type="button" role="tab" aria-selected={factoryView==='overview'} className={factoryView==='overview'?'selected':''} onClick={()=>setFactoryView('overview')}><TrendingUp size={15}/> Dashboard</button><button type="button" role="tab" aria-selected={factoryView==='equipment'} className={factoryView==='equipment'?'selected':''} onClick={()=>setFactoryView('equipment')}><Factory size={15}/> Machines</button></div></div>
        {factoryView==='overview'&&<>
        <section className="home-hero" aria-label="Factory at a glance">
          <div className="home-hero-top"><div><span className="eyebrow">YOUR FACTORY · {companyRank}</span><h1>Your workshop</h1><p>Stage {currentStage.number} · {currentStage.name}</p></div><span className={'home-status '+(running&&!s.powerShortage&&!brokenCount?'is-running':'is-idle')}>{running&&!s.powerShortage&&!brokenCount?'● Producing':'● Needs attention'}</span></div>
          <div className="home-factory-machines">{(visibleMachines.filter(m=>s[m.id]>0).length?visibleMachines.filter(m=>s[m.id]>0):visibleMachines.slice(0,1)).slice(0,4).map(m=><button type="button" className="home-machine" key={m.id} onClick={()=>setFactoryView('equipment')}><MachineIcon id={m.id} size={72}/><b>{m.name}</b></button>)}</div>
          
        </section>
        <div className="home-stats" aria-label="Factory quick stats">
          <div><small>Machines active</small><strong>{machinesWorking}<span> / {machineCount}</span></strong></div>
          <div><small>Orders ready</small><strong>{readyOrders}</strong></div>
          <div><small>Reputation</small><strong>{s.reputation}</strong></div>
        </div>
        <section className="home-next" aria-label="Your next action">
          <div><span className="eyebrow">NEXT ACTION</span>
          {s.powerShortage?<><h2>Restore power</h2><p>Sell stock to cover electricity.</p></>:
          s.writeOffEvent?<><h2>Replace damaged equipment</h2><p>Resolve the incident to resume production.</p></>:
          brokenCount>0?<><h2>Repair {brokenCount} machine{brokenCount===1?'':'s'}</h2><p>Assign maintenance to get production moving.</p></>:
          readyOrders>0?<><h2>{readyOrders} order{readyOrders===1?'':'s'} ready</h2><p>Deliver stock and collect your reward.</p></>:
          machineCount===0?<><h2>Build your first machine</h2><p>Accept your first order and start mining.</p></>:
          unassigned>0?<><h2>Assign your mechanics</h2><p>{unassigned} mechanic{unassigned===1?' is':'s are'} waiting for work.</p></>:
          <><h2>{activeMission?.title||'Expand your factory'}</h2><p>{activeMission?.detail||'Invest in your next upgrade.'}</p></>}
          </div>
          <button type="button" className="primary-button" onClick={()=>{
            if(s.powerShortage){setPage('warehouse');return;}
            if(s.writeOffEvent||machineCount===0){setFactoryView('equipment');return;}
            if(brokenCount>0||unassigned>0){setPage('staff');setStaffTab('maintenance');return;}
            if(readyOrders>0){setInboxOpen(true);return;}
            setFactoryView('equipment');
          }}>{s.powerShortage?'OPEN WAREHOUSE':brokenCount>0||unassigned>0?'MANAGE STAFF':readyOrders>0?'VIEW ORDERS':'VIEW MACHINES'} <ArrowUpRight size={16}/></button>
        </section>
        {focusDelivery&&<section className="home-delivery"><div><span className="eyebrow">CURRENT ORDER</span><h2>{focusDelivery.name}</h2><small>{Math.round(orderCompletion(focusDelivery)*100)}% ready</small></div><div className="home-delivery-track"><i style={{width:Math.round(orderCompletion(focusDelivery)*100)+'%'}}/></div><button type="button" className="secondary-button" onClick={()=>{setInboxOpen(true);setExpandedMail(focusDelivery.key)}}>{orderCompletion(focusDelivery)>=1?'DELIVER':'VIEW ORDER'}</button></section>}
        <div className="home-secondary"><span>Level {progressionLevel} · {fmt(s.experience)} XP</span></div>
        </>}
        {factoryView==='equipment'&&<>
        <section className="line-panel"><div className="line-heading"><div><span className="eyebrow">LIVE PRODUCTION</span><h2>Assembly line</h2></div><span className="line-live"><i/> {running?'RUNNING':'PAUSED'}</span></div>
          <div className={'production-route '+(!running?'is-paused':'')}>
            {visibleMachines.map((m,i)=>{const owned=s[m.id]>0;return <div className={'route-stage '+(owned?'stage-owned':'stage-next')} key={m.id}>
              <span className="route-index">{String(i+1).padStart(2,'0')}</span><span className="route-symbol"><MachineIcon id={m.id} size={35}/></span><b>{m.name}</b><small>{owned?'INSTALLED':'NEXT STAGE'}</small>
              {i<visibleMachines.length-1&&<span className="route-link"><i/></span>}
            </div>;})}
          </div>
          <div className="line-caption"><span>YOUR CURRENT PRODUCTION ROUTE</span><span>{visibleMachines.length} STAGE{visibleMachines.length===1?'':'S'} SHOWN</span></div>
        </section>
        <section className="machines-heading"><div><span className="eyebrow">YOUR EQUIPMENT</span><h2>Machines</h2><p>Plan your supply chain: extra machines and overclocking can cost more power than they earn. Overclock specific machines for +50% output at 3× electricity.</p></div><span className="machine-count">{machineCount} BUILT</span></section>
        {s.miner===0&&<section className="starter-contract"><div><span className="eyebrow">YOUR FIRST COMMISSION</span><h2>First Ore Delivery</h2><p>A local foundry has placed a small order for five raw ore. Accept it for 65 RVT, a complimentary delivery van and your first driver. The driver earns wages while the factory runs.</p><div className="starter-contract-reward"><b>65 RVT ADVANCE</b><span>+85 RVT · +5 REP · FREE VAN & DRIVER</span></div></div><button className="primary-button" disabled={s.acceptedContracts.includes('first-ore')} onClick={()=>{setS(v=>({...v,acceptedContracts:[...v.acceptedContracts,'first-ore'],cash:v.cash+65,drivers:Math.max(1,v.drivers),driverAssignments:{...v.driverAssignments,iron:Math.max(1,v.driverAssignments.iron)}}));setNotice('Order accepted. The foundry has advanced 65 RVT. Your free van and starter driver are ready. Buy the Rockbreaker Mine to start hauling.')}}>{s.acceptedContracts.includes('first-ore')?'ORDER ACCEPTED · ADVANCE PAID':'ACCEPT ORDER · GET 65 RVT'}</button></section>}
        <section className="machine-grid">{visibleMachines.map(m=>{
          const owned=s[m.id];
          const unitsWorking=workingUnits(s,m.id);
          const failed=faultCount(s,m.id);
          // A downstream machine can use materials produced in the SAME tick.
          // Checking leftover warehouse inventory here incorrectly labels healthy copper machines STOPPED.
          const interrupted=!running||!!s.breakdownEvent||s.powerCutEvent||s.cyberAttackEvent||!!s.writeOffEvent||s.powerShortage;
          const active=!interrupted&&unitsWorking>0&&s.lastOutput[m.id]>0;
          const maxOutput=capacityOf(m.id);
           const efficiency=maxOutput>0?Math.max(0,Math.min(100,Math.round(100*s.lastOutput[m.id]/maxOutput))):0;
           const supplyLimited=active&&maxOutput>0&&efficiency<82;
           const overclock=s.overclocked[m.id];
           const perUnitRate=unitsWorking>0?s.lastOutput[m.id]/unitsWorking:0;
          const cycleSeconds=perUnitRate>0?1/perUnitRate:0;
          const lights:Array<'on'|'off'|'empty'>=Array.from({length:MAX_MACHINE_UNITS},(_,i)=>i>=owned?'empty':!active||(s.unitFaults[m.id][i]||0)>0?'off':'on');
          const inputNames:Partial<Record<MachineId,string>>={smelter:'raw ore',press:'iron ingots',beamMill:'iron ingots',assembler:'metal plates',copperSmelter:'copper ore',wiremill:'copper ingots',circuitpress:'copper wire',coilWinder:'copper wire',motorworks:'2 copper coils and 1 circuit board'};
          const stopReason=owned===0?'':!running?'Factory paused. Resume production to restart.':s.powerCutEvent?'Power cut. Resolve the incident to restore production.':s.cyberAttackEvent?'Network lockdown. Restore the factory systems.':s.breakdownEvent?'Emergency stop. Resolve or dismiss the active breakdown alert.':s.writeOffEvent?'A machine was written off. Acknowledge the incident.':s.powerShortage?'No electricity funds left. Ship goods from Warehouse to restore production.':unitsWorking===0?'All purchased units are broken. Repair at least one.':s.lastOutput[m.id]<=0?'Waiting for '+(inputNames[m.id]||'materials')+' from the previous production stage. Check upstream machines.':'';
          const machineStatus=owned===0?'NOT BUILT':unitsWorking===0?'BROKEN':!running?'PAUSED':s.powerCutEvent?'POWER CUT':s.cyberAttackEvent?'LOCKDOWN':s.breakdownEvent?'EMERGENCY STOP':s.writeOffEvent?'WRITE-OFF':s.powerShortage?'NO POWER':active?failed>0?'PARTIAL':supplyLimited?'SUPPLY LIMITED':'WORKING':'WAITING FOR INPUT';
          const cost=machineCost(m,s);
          const tier=s[`tier_${m.id}`];
          const repairCost=repairCostFor(m.id,tier);
          return <article className={'machine-card '+(owned?'owned':'locked')+(failed>0?' is-broken':'')} key={m.id}>
            <div className="machine-card-head"><span className="machine-number"><MachineIcon id={m.id} size={26}/> 0{machines.indexOf(m)+1} · {m.short}</span><span className={'status '+(unitsWorking===0&&owned>0?'bad':active?'good':'idle')}>{machineStatus}</span></div>
            <MachineArt id={m.id} active={active} broken={failed>0} lights={lights} cycleSeconds={cycleSeconds} progress={s.visualProgress[m.id]}/>
            <div className="machine-info"><div><h3>{m.name}</h3><p>{m.desc}</p></div><span className="machine-level">LV {tier+1}</span></div>
            <div className="machine-details"><span>OUTPUT</span><b>{rateFor(m).toFixed(2)} / sec</b><span>RUNNING / OWNED</span><b>{active?unitsWorking:0} / {owned}</b></div>
            <div className="machine-electricity"><Zap size={14}/><span>POWER · {ELECTRICITY_PER_MINUTE[m.id]} RVT/min/unit {overclock?'· 3× OVERCLOCK':''}</span><b>{active?(unitsWorking*ELECTRICITY_PER_MINUTE[m.id]*electricitySpeedFactor(speed)*machinePowerFactor(s,m.id)*powerCostMultiplier(s)).toFixed(1):'0.0'} RVT/min</b></div>
             {owned>0&&<div className="machine-balance"><div className="machine-balance-head"><span>CAPACITY USED</span><b className={efficiency<70?'low':''}>{active?efficiency:0}%</b></div><div className="machine-balance-track"><i style={{width:(active?efficiency:0)+'%'}}/></div><small>{!running?'Factory paused':supplyLimited?'Not enough input. Improve '+(upstreamAdvice[m.id]||'upstream machines')+' or change Warehouse routing.':active?'Healthy supply. Extra units will increase output if upstream can keep up.':unitsWorking===0?'Repair machines to restore production.':s.powerShortage?'Power funding needed; switch off overclock or ship stock.':'Waiting for input from '+(upstreamAdvice[m.id]||'upstream production')+'.'}</small></div>}
             {owned>0&&<div className="machine-overclock-row"><div><b><Zap size={14}/> OVERCLOCK</b><small>+50% machine speed · 3× electricity while producing</small></div><button type="button" role="switch" className={'dashboard-switch '+(overclock?'is-on':'')} aria-label={'Overclock '+m.name} aria-checked={overclock} onClick={()=>setS(v=>({...v,overclocked:{...v.overclocked,[m.id]:!v.overclocked[m.id]}}))}><i/></button></div>}
            {owned>0&&stopReason&&<div className="machine-stop-reason"><AlertTriangle size={13}/><span>{stopReason}</span></div>}
            {failed>0&&<div className="machine-repair"><span>{failed} broken unit{failed>1?'s':''} · {s.mechanicAssignments[m.id]>0?'mechanic repairing':'awaiting repair'}</span><button onClick={()=>{if(s.cash<repairCost){setNotice('Emergency repair costs '+repairCost+' Rivets per machine.');return;}const index=firstFault(s,m.id);if(index<0)return;setS(v=>({...repairUnit(v,m.id,index),cash:v.cash-repairCost}));setNotice(m.name+' unit '+(index+1)+' repaired.')}}>REPAIR ONE · {fmt(repairCost)} RVT</button></div>}
            <div className="machine-buttons">{owned===0?(!(s.pendingReplacement[m.id]>0)&&(!stageReached(machineStage[m.id])||s.experience<unlockAt[m.id]||s.reputation<reputationUnlock[m.id])?<div className="machine-locked-note">🔒 STAGE {machineStage[m.id]} · {unlockAt[m.id]} XP + {reputationUnlock[m.id]} REP</div>:<button className="primary-button" disabled={s.cash<cost} onClick={()=>buyMachine(m)}>{(s.pendingReplacement[m.id]||0)>0?'REPLACE DESTROYED UNIT':'BUILD MACHINE'} · {fmt(cost)} RVT</button>):<><button className="primary-button" disabled={owned>=MAX_MACHINE_UNITS||s.cash<cost} onClick={()=>buyMachine(m)}>{owned>=MAX_MACHINE_UNITS?'5/5 UNITS · MAX':'ADD UNIT '+(owned+1)+' · '+fmt(cost)+' RVT'}</button><button className="secondary-button" disabled={s.gears<(tier+1)*3} onClick={()=>upgradeMachine(m)}><ArrowUpRight size={15}/> UPGRADE · {(tier+1)*3} GEARS</button></>}</div>
            {owned>0&&<small className="machine-footnote">+25% output per upgrade · {m.output} · {owned}/{MAX_MACHINE_UNITS} units installed{(s.pendingReplacement[m.id]||0)>0?' · REPLACEMENT NEEDED':''}</small>}
            {owned>0&&s.unitPenalties[m.id].some(p=>p>0)&&<div className="machine-replacement-levels">UNIT LEVELS: {s.unitPenalties[m.id].slice(0,owned).map((pen,i)=>'Unit '+(i+1)+' LV '+(Math.max(0,tier-pen)+1)).join(' · ')} · replacement units are up to 5 levels lower</div>}
          </article>;
        })}</section>
        <section className="achievement-panel"><div className="achievement-heading"><div><span className="eyebrow">MILESTONES</span><h2>Factory achievements</h2></div><span>{achievements.filter(a=>a.done).length}/{achievements.length} UNLOCKED</span></div><div className="achievement-grid">{achievements.map(a=><div className={'achievement '+(a.done?'earned':'')} key={a.name}><span>{a.icon}</span><div><b>{a.name}</b><small>{a.detail}</small></div><strong>{a.done?'✓':'LOCKED'}</strong></div>)}</div></section>
        <section className="factory-footer"><div><Zap size={16}/><span>Production speed</span>{[1,2].map(x=><button key={x} className={speed===x?'selected':''} onClick={()=>setSpeed(x)} title={x===2?'Double output, 2× breakdown risk':'Normal speed and breakdown risk'}>{x}×</button>)}<small className="speed-risk-note">{speed===2?'⚠ 2× output · 2× breakdown risk':'1× output · normal breakdown risk'}</small></div><span className="saved"><CheckCircle2 size={14}/> Progress auto-saves</span></section>
        </>}
      </div>}
      {page==='staff'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">YOUR FACTORY TEAM</span><h1>Employees</h1><p>Hire staff, check wages and assign jobs. Each hire adds a recurring cost.</p></div><div className="staff-summary"><b>{s.mechanics+s.salespeople+s.cybersecuritySpecialists+s.drivers}</b><span>TEAM MEMBERS</span><small>{unassigned} mechanic{unassigned===1?'':'s'} unassigned</small></div></section>
        <section className="staff-command-overview">
          <div><small>STAFF WAGES</small><b>{payroll.toFixed(1)} RVT/min</b><span>Recurring cost, charged while running</span></div>
          <div><small>STAFF + POWER</small><b>{(payroll+powerPerMinute).toFixed(1)} RVT/min</b><span>Current combined operating expenses</span></div>
          <div><small>CASH COVERAGE</small><b>{payroll+powerPerMinute>0?(s.cash/(payroll+powerPerMinute)).toFixed(1)+' min':'NO COSTS'}</b><span>Before sales and contract income</span></div>
          <div><small>TEAM ASSIGNMENTS</small><b>{assignedTotal+assignedSales+s.driverAssignments.iron+s.driverAssignments.copper} / {s.mechanics+s.salespeople+s.drivers}</b><span>{unassigned} mechanics, {unassignedSales} sales, {availableDrivers} drivers unassigned</span></div>
        </section>
        <div className="staff-help-note"><CircleDollarSign size={17}/> Staff wages are charged while the factory runs. Check your cash coverage before hiring; assign mechanics and salespeople below.</div>
        <section className="staff-roles staff-roles-compact" aria-label="Hire and manage employees">
          <article className="role-card mechanic-role"><div className="staff-role-heading"><span className="staff-pixel-portrait mechanic" aria-hidden="true">🔧</span><div><h2>Mechanic</h2><small>Repairs broken machines</small></div><b className="staff-role-count">{s.mechanics} hired</b></div><p>Assign mechanics to machines in the Maintenance tab below.</p><div className="staff-role-meta"><span>Wages <b>{WAGES.mechanic} RVT/min each</b></span><span>Next hire <b>{fmt(mechanicCost(s))} RVT</b></span></div><div className="staff-role-actions"><button className="primary-button" disabled={s.cash<mechanicCost(s)} onClick={()=>hire('mechanic')}>+ Hire mechanic</button><button className="secondary-button" disabled={s.mechanics===0} onClick={()=>fire('mechanic')}>− Remove one</button></div></article>
          <article className="role-card sales-role"><div className="staff-role-heading"><span className="staff-pixel-portrait sales" aria-hidden="true">📋</span><div><h2>Sales</h2><small>Automatically sells surplus stock</small></div><b className="staff-role-count">{s.salespeople} hired</b></div><p>Your first salesperson automatically handles your first product. Assign others in Dispatch below; contract stock stays protected.</p><div className="staff-role-meta"><span>Team wages <b>{salesWages(s.salespeople)} RVT/min</b></span><span>Next hire <b>{fmt(salesCost(s))} RVT · +{s.salespeople===0?FIRST_SALES_WAGE:WAGES.sales}/min</b></span></div><div className="staff-role-actions"><button className="primary-button" disabled={s.cash<salesCost(s)} onClick={()=>hire('sales')}>+ Hire salesperson</button><button className="secondary-button" disabled={s.salespeople===0} onClick={()=>fire('sales')}>− Remove one</button></div></article>
          {s.contractsCompleted.includes(QA_TRIGGER_CONTRACT)&&<article className="role-card qa-role"><div className="staff-role-heading"><span className="staff-pixel-portrait qa" aria-hidden="true">🔍</span><div><h2>Quality Assurance</h2><small>Improves finished-product output</small></div><b className="staff-role-count">{s.qualityInspectors}/2 hired</b></div><p>{qaComplaintPending(s)?'Customer complaint: hire an inspector to release precision orders.':'Each inspector adds +8% finished-goods production (max +16%).'}</p><div className="staff-role-meta"><span>Wages <b>{WAGES.quality} RVT/min each</b></span><span>Next hire <b>{fmt(QA_HIRE_COST)} RVT</b></span></div><div className="staff-role-actions"><button className="primary-button" disabled={s.qualityInspectors>=2||s.cash<QA_HIRE_COST} onClick={hireQualityInspector}>{s.qualityInspectors>=2?'Team full':'+ Hire inspector'}</button><button className="secondary-button" disabled={s.qualityInspectors===0} onClick={fireQualityInspector}>− Remove one</button></div></article>}
          <article className="role-card cyber-role"><div className="staff-role-heading"><span className="staff-pixel-portrait cyber" aria-hidden="true">💻</span><div><h2>Cybersecurity</h2><small>Protects factory systems</small></div><b className="staff-role-count">{s.cybersecuritySpecialists} hired</b></div><p>Responds to cyber incidents and installs a permanent firewall.</p><div className="staff-role-meta"><span>Wages <b>{WAGES.cyber} RVT/min each</b></span><span>Next hire <b>{fmt(cybersecurityCost(s))} RVT</b></span></div><div className="staff-role-actions"><button className="primary-button" disabled={s.cash<cybersecurityCost(s)} onClick={hireCybersecuritySpecialist}>+ Hire specialist</button><button className="secondary-button" disabled={s.cybersecuritySpecialists===0} onClick={()=>fire('cyber')}>− Remove one</button></div></article>
        </section>
        <section className="staff-desk"><div className="section-heading"><div><span className="eyebrow">DEPARTMENT DESK</span><h2>Assign your team</h2><p>Choose a department to assign mechanics, salespeople or drivers.</p></div></div>
          <div className="staff-tab-bar" role="tablist" aria-label="Staff departments"><button type="button" role="tab" aria-selected={staffTab==='maintenance'} className={staffTab==='maintenance'?'selected':''} onClick={()=>setStaffTab('maintenance')}><Wrench size={16}/> MAINTENANCE · {assignedTotal}/{s.mechanics}</button><button type="button" role="tab" aria-selected={staffTab==='dispatch'} className={staffTab==='dispatch'?'selected':''} onClick={()=>setStaffTab('dispatch')}><Truck size={16}/> DISPATCH · {assignedSales}/{s.salespeople}</button><button type="button" role="tab" aria-selected={staffTab==='haulage'} className={staffTab==='haulage'?'selected':''} onClick={()=>setStaffTab('haulage')}><Truck size={16}/> HAULAGE · {s.driverAssignments.iron+s.driverAssignments.copper}/{s.drivers}</button></div>
        </section>
        {staffTab==='haulage'&&<section className="freight-workshop">
          <div className="freight-heading"><div><span className="eyebrow">MINE TO FACTORY</span><h2>Freight & Delivery Fleet</h2><p>Drivers move ore to the factory. Starter vans now cover a basic mine; if your mine grows beyond its transport capacity, it slows down rather than building an endless pile of ore.</p></div><div className="freight-driver-kpi"><span>ON PAYROLL</span><b>{s.drivers} DRIVERS</b><small>{s.drivers*WAGES.driver} RVT/min</small></div></div>
          <div className="freight-current"><div className="freight-current-symbol"><Truck size={31}/></div><div><span className="eyebrow">CURRENT VEHICLE</span><h3>{currentFreight.name}</h3><p>{currentFreight.description}</p></div><b>{currentFreight.capacity.toFixed(1)} <small>ORE/SEC PER DRIVER</small></b></div>
          <div className="freight-route-list">
            {([{route:'iron' as FreightRoute,name:'IRON MINE',stock:s.oreAtMine,owned:s.miner},{route:'copper' as FreightRoute,name:'COPPER MINE',stock:s.copperAtMine,owned:s.copperMiner}] as const).map(item=><div className="freight-route" key={item.route}>
              <div className="freight-route-title"><span className={item.route==='iron'?'freight-route-emblem':'freight-route-emblem copper'}><Truck size={19}/></span><div><b>{item.name}</b><small>{item.stock.toFixed(1)} ore waiting · {item.owned} mines · {item.owned>0&&freightThroughput(s,item.route)===0?'NO TRANSPORT':item.stock>freightThroughput(s,item.route)*30?'BACKLOG: add drivers or upgrade':!payrollFunded?'PAYROLL UNFUNDED': 'DELIVERING'}</small></div></div>
              <div className="freight-route-stats"><span><b>{freightThroughput(s,item.route).toFixed(1)}/sec</b><small>MAX DELIVERY</small></span><span><b>{s.driverAssignments[item.route]}</b><small>DRIVERS</small></span>{droneUnlocked(s)&&<span><b>{s.droneAssignments[item.route]}</b><small>DRONES</small></span>}</div>
              {(()=>{const miningCapacity=machineCapacity(s,item.route==='iron'?'miner':'copperMiner',speed,s.boostSeconds.production>0);
                const deliveryCapacity=freightThroughput(s,item.route);
                const utilisation=miningCapacity>0?Math.min(100,Math.round(deliveryCapacity/miningCapacity*100)):0;
                const shortfall=Math.max(0,miningCapacity-deliveryCapacity);
                const actualMined=s.freightLastMined[item.route];
                const actualDelivered=s.freightLastDelivered[item.route];
                const canClearBacklog=item.stock>0&&deliveryCapacity>miningCapacity;
                const nextDriverCapacity=FREIGHT_TIERS[s.freightTier].capacity*(1+s.freightRouteLevels[item.route]*.2)*(s.freightBoostSeconds[item.route]>0?2:1);
                return <div className="freight-flow-panel">
                  <div className="freight-flow-heading"><b>LIVE ORE FLOW</b><span className={shortfall>.01?'freight-flow-bad':'freight-flow-good'}>{item.owned===0?'NO MINE':deliveryCapacity===0?'NO TRANSPORT':shortfall>.01?'BOTTLENECK':'CAPACITY OK'}</span></div>
                  <div className="freight-flow-metrics"><span><small>MINED / SEC</small><strong>{actualMined.toFixed(2)}</strong></span><span><small>DELIVERED / SEC</small><strong>{actualDelivered.toFixed(2)}</strong></span><span><small>MINE CAPACITY</small><strong>{miningCapacity.toFixed(2)}/sec</strong></span><span><small>TRANSPORT CAPACITY</small><strong>{deliveryCapacity.toFixed(2)}/sec</strong></span></div>
                  <div className="freight-flow-track"><i style={{width:utilisation+'%'}}/></div>
                  <div className="freight-flow-foot"><span>TRANSPORT COVERAGE · {utilisation}%</span><span>{shortfall>.01?'SHORT '+shortfall.toFixed(2)+'/sec':canClearBacklog?'CLEARING BACKLOG':'CAPACITY MATCHED'}</span></div>
                  <p className="freight-flow-advice">{item.owned===0?'Build a mine to start this route.':deliveryCapacity<=0?'Assign a driver or drone to start deliveries.':!payrollFunded?'Operating funds are insufficient; transport is paused.':shortfall>.01?'Mine output exceeds your fleet. '+(nextDriverCapacity>=shortfall?'One additional driver would cover the shortfall.':'Add drivers, upgrade the route or use a temporary boost.'):(canClearBacklog?'Your fleet has spare capacity and can clear existing ore waiting at the mine.':'Transport is keeping up with mining. No additional drivers needed right now.')}</p>
                </div>;
              })()}
              <div className="freight-route-tuning"><div className="freight-route-tuning-copy"><b>ROUTE EFFICIENCY · LV {s.freightRouteLevels[item.route]}/{MAX_FREIGHT_ROUTE_LEVEL}</b><small>Permanent +{s.freightRouteLevels[item.route]*20}% transport · boost {s.freightBoostSeconds[item.route]>0?'ACTIVE '+s.freightBoostSeconds[item.route]+'s':s.contractClock<s.freightBoostReadyAt[item.route]?'READY IN '+(s.freightBoostReadyAt[item.route]-s.contractClock)+'s':'READY'}</small></div><div className="freight-route-tuning-buttons"><button type="button" className="secondary-button" disabled={s.freightRouteLevels[item.route]>=MAX_FREIGHT_ROUTE_LEVEL||s.cash<freightRouteUpgradeCost(s,item.route)} onClick={()=>upgradeFreightRoute(item.route)}>{s.freightRouteLevels[item.route]>=MAX_FREIGHT_ROUTE_LEVEL?'MAX UPGRADE':'UPGRADE · '+fmt(freightRouteUpgradeCost(s,item.route))+' RVT'}</button><button type="button" className="primary-button" disabled={s.freightBoostSeconds[item.route]>0||s.contractClock<s.freightBoostReadyAt[item.route]||s.cash<freightBoostCost(s,item.route)||freightThroughput(s,item.route)<=0} onClick={()=>boostFreightRoute(item.route)}><Zap size={13}/> {s.freightBoostSeconds[item.route]>0?'BOOST ACTIVE':s.contractClock<s.freightBoostReadyAt[item.route]?'COOLDOWN':'BOOST 2× · '+fmt(freightBoostCost(s,item.route))+' RVT'}</button></div></div>
              <div className="freight-allocations"><div className="assignment-stepper" role="group" aria-label={item.name+' driver allocation'}><button type="button" aria-label={'Remove driver from '+item.name} disabled={s.driverAssignments[item.route]===0} onClick={()=>assignDriver(item.route,s.driverAssignments[item.route]-1)}>−</button><output>{s.driverAssignments[item.route]}</output><button type="button" aria-label={'Assign driver to '+item.name} disabled={availableDrivers===0} onClick={()=>assignDriver(item.route,s.driverAssignments[item.route]+1)}>+</button></div>{droneUnlocked(s)&&<div className="freight-drone-stepper"><span>DRONES</span><div className="assignment-stepper" role="group" aria-label={item.name+' drone allocation'}><button type="button" aria-label={'Remove drone from '+item.name} disabled={s.droneAssignments[item.route]===0} onClick={()=>assignDrone(item.route,s.droneAssignments[item.route]-1)}>−</button><output>{s.droneAssignments[item.route]}</output><button type="button" aria-label={'Assign drone to '+item.name} disabled={availableDrones===0} onClick={()=>assignDrone(item.route,s.droneAssignments[item.route]+1)}>+</button></div></div>}</div>
            </div>)}
          </div>
          <div className="freight-actions"><div><span className="eyebrow">DRIVER ROSTER</span><strong>{availableDrivers} available</strong><small>Each driver costs {WAGES.driver} RVT per minute. Assign them to collect ore; uncollected mine stock slows further mining.</small></div><button className="primary-button" disabled={s.cash<driverHireCost(s)} onClick={hireDriver}>HIRE DRIVER · {fmt(driverHireCost(s))} RVT</button><button className="secondary-button" disabled={s.drivers===0} onClick={fireDriver}>FIRE ONE</button></div>
          <div className="freight-upgrade"><div><span className="eyebrow">FLEET EXPANSION</span><h3>{s.freightTier<3?'Next: '+FREIGHT_TIERS[s.freightTier+1].name:'Largest lorries unlocked'}</h3><p>{s.freightTier<3?'Your drivers carry more ore per second. If mine stock is building up, upgrade vehicles or add drivers.':'Your fleet has reached maximum lorry capacity.'}</p></div><button className="primary-button" disabled={s.freightTier>=3||s.cash<(FREIGHT_TIERS[s.freightTier+1]?.cost??Infinity)} onClick={upgradeFreight}>{s.freightTier>=3?'FLEET MAXED':'UPGRADE · '+fmt(FREIGHT_TIERS[s.freightTier+1].cost)+' RVT'}</button></div>
          <div className={'freight-drone-hangar'+(droneUnlocked(s)?' active':' locked')}>
            <div className="freight-drone-heading"><div className="freight-drone-symbol"><Zap size={24}/></div><div><span className="eyebrow">AUTONOMOUS FREIGHT</span><h3>Drone Delivery Hangar</h3><p>{droneUnlocked(s)?'Drones deliver ore automatically, without hiring drivers. Assign them to iron or copper routes above.':'Unlock Large Lorries first to open drone freight operations.'}</p></div></div>
            {droneUnlocked(s)?<><div className="freight-drone-metrics"><span><b>{s.drones}/{MAX_DRONES}</b><small>OWNED</small></span><span><b>{availableDrones}</b><small>AVAILABLE</small></span><span><b>{DRONE_CAPACITY.toFixed(1)}</b><small>ORE/SEC EACH</small></span><span><b>{fmt(droneRunningCount(s)*DRONE_RUNNING_COST)}</b><small>RVT/MIN BATTERIES</small></span></div><div className="freight-drone-buy"><small>Each drone costs {fmt(DRONE_PRICE)} RVT upfront and {DRONE_RUNNING_COST} RVT/min when assigned. No driver wages. Battery costs are included in operating payroll.</small><button type="button" className="primary-button" disabled={s.drones>=MAX_DRONES||s.cash<DRONE_PRICE} onClick={buyDrone}>BUY DRONE · {fmt(DRONE_PRICE)} RVT</button></div></>:<div className="freight-drone-requirement"><Zap size={15}/> LOCKED · REQUIRES LARGE LORRIES</div>}
          </div>
        </section>}
        {staffTab==='maintenance'&&<section className="staff-assignments">
          <div className="section-heading"><div><span className="eyebrow">TEAM SETUP</span><h2>Assign your staff</h2><p>Choose where each mechanic works. One mechanic repairs one machine at a time.</p></div><div className="available-staff"><b>{unassigned}</b><span>AVAILABLE MECHANICS</span></div></div>
          <div className="assignment-list">{machines.filter(m=>s[m.id]>0).map(m=><div className="assignment-row" key={m.id}><span className="assignment-machine"><Cog size={19}/></span><div className="assignment-copy"><b>{m.name}</b><small>{faultCount(s,m.id)>0?faultCount(s,m.id)+' broken unit(s) · '+(s.mechanicAssignments[m.id]>0?'being repaired':'awaiting mechanic'):s[m.id]>0?'Machines operational':'Not built yet'}</small></div><div className="assignment-stepper" role="group" aria-label={m.name+' mechanic assignments'}><button type="button" aria-label={'Remove a mechanic from '+m.name} disabled={s.mechanicAssignments[m.id]===0} onClick={()=>assignMechanic(m.id,Math.max(0,s.mechanicAssignments[m.id]-1))}>−</button><output aria-live="polite">{s.mechanicAssignments[m.id]}</output><button type="button" aria-label={'Assign a mechanic to '+m.name} disabled={s.mechanics===0||unassigned===0} onClick={()=>assignMechanic(m.id,s.mechanicAssignments[m.id]+1)}>+</button></div></div>)}</div>
          {s.mechanics===0&&<div className="empty-hint"><Wrench size={17}/> Hire a mechanic above to unlock machine assignments.</div>}
        </section>}
        {staffTab==='dispatch'&&<section className="sales-setup"><div className="sales-setup-title"><span className="role-icon"><Truck size={22}/></span><div><span className="eyebrow">DISPATCH SETTINGS</span><h2>Sales team assignments</h2><p>Assign your sales representatives to different goods. Each sells their assigned product independently.</p></div></div><div className="contract-summary"><span><b>{assignedSales}</b> ASSIGNED</span><span><b>{unassignedSales}</b> AVAILABLE</span><span><b>{s.salespeople}</b> TOTAL SALESPEOPLE</span></div><div className="assignment-list">{goods.filter(g=>s[contractProducer[g.id]]>0).map(g=><div className="assignment-row" key={g.id}><span className="assignment-machine"><ProductIcon id={g.id} size={33}/></span><div className="assignment-copy"><b>{g.name}</b><small>{((s.salesAssignments[g.id]||0)*SALES_UNITS_PER_SECOND).toFixed(2)} units/sec when automatic sales are on</small></div><div className="assignment-stepper" role="group" aria-label={g.name+' sales assignments'}><button type="button" aria-label={'Remove a salesperson from '+g.name} disabled={(s.salesAssignments[g.id]||0)===0} onClick={()=>assignSales(g.id,Math.max(0,(s.salesAssignments[g.id]||0)-1))}>−</button><output aria-live="polite">{s.salesAssignments[g.id]||0}</output><button type="button" aria-label={'Assign a salesperson to '+g.name} disabled={s.salespeople===0||unassignedSales===0} onClick={()=>assignSales(g.id,(s.salesAssignments[g.id]||0)+1)}>+</button></div></div>)}</div><div className="sales-controls"><div className="sales-toggle-row"><span><b>Automatic dispatch</b><small>{s.autoSell?'Staff are actively shipping available products.':'Turn on to let your sales team ship automatically.'} Contract reserves are protected.</small></span><button type="button" role="switch" className={'dashboard-switch '+(s.autoSell?'is-on':'')} aria-checked={s.autoSell} aria-label="Automatic dispatch" disabled={s.salespeople===0} onClick={()=>setS(v=>({...v,autoSell:!v.autoSell}))}><i/></button></div></div></section>}
      </div>}
      {page==='capital'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">LONG-TERM INDUSTRIAL INVESTMENT</span><h1>Capital Projects</h1><p>Spend Rivets on permanent infrastructure that makes your factory more efficient and reliable. Prices rise with each level, and every purchase stays saved.</p></div><div className="staff-summary"><b>{fmt(s.capitalSpent)}</b><span>RIVETS INVESTED</span><small>{fmt(s.cash)} RVT currently available</small></div></section>
        <section className="capital-grid">{CAPITAL_PROJECTS.map(project=>{const level=s.capitalLevels[project.id];const maxed=level>=project.max;const price=capitalPrice(s,project.id);return <article className={'capital-card '+(maxed?'capital-maxed':'')} key={project.id}><div className="capital-card-heading"><span className="capital-icon">{project.icon}</span><div><small>{project.subtitle}</small><h2>{project.name}</h2></div><span className="capital-level">LV {level}/{project.max}</span></div><p>{project.description}</p><div className="capital-effect"><CheckCircle2 size={15}/>{project.effect}</div><div className="capital-progress">{Array.from({length:project.max},(_,i)=><i key={i} className={i<level?'done':''}/>)}</div><button className="primary-button" disabled={maxed||s.cash<price} onClick={()=>buyCapital(project.id)}>{maxed?'PROJECT COMPLETE':s.cash<price?'SAVE '+fmt(price-s.cash)+' MORE RVT':'FUND LEVEL '+(level+1)+' · '+fmt(price)+' RVT'}</button></article>})}</section>
        <section className="charity-panel" aria-label="Charity donations">
          <div className="charity-heading">
            <div><span className="eyebrow">CORPORATE SOCIAL RESPONSIBILITY</span><h2><HeartHandshake size={20}/> Community Giving</h2><p>Put some of your factory's profits back into the world around it. These are fictional in-game initiatives funded with Rivets, not real-world charity payments.</p></div>
            <div className="charity-lifetime"><small>LIFETIME DONATIONS</small><strong>{fmt(s.charityTotal)} <span>RVT</span></strong><small>{s.charityCount} contributions made</small></div>
          </div>
          <div className="charity-milestone"><div className="charity-milestone-title"><span>COMMUNITY REPUTATION</span><b>+200 REP PER 100,000 RVT DONATED</b></div><div className="charity-milestone-track"><i style={{width:((s.charityTotal%CHARITY_MILESTONE_RVT)/CHARITY_MILESTONE_RVT*100)+'%'}}/></div><small>{fmt(s.charityTotal%CHARITY_MILESTONE_RVT)} / 100,000 RVT towards your next milestone · {fmt(CHARITY_MILESTONE_RVT-(s.charityTotal%CHARITY_MILESTONE_RVT))} RVT remaining</small></div>
          <div className="charity-section-title">CHOOSE A CAUSE</div>
          <div className="charity-causes" role="group" aria-label="Choose a charity initiative">
            {CHARITY_CAUSES.map(cause=>{
              const Icon=cause.id==='apprenticeships'?GraduationCap:cause.id==='community'?HeartHandshake:cause.id==='environment'?Sprout:LifeBuoy;
              return <button className={'charity-cause '+(charityCause===cause.id?'selected':'')} key={cause.id} type="button" aria-pressed={charityCause===cause.id} onClick={()=>setCharityCause(cause.id)}><Icon size={22}/><span><small>{cause.tag}</small><b>{cause.name}</b><em>{cause.description}</em></span>{charityCause===cause.id&&<CheckCircle2 size={17} className="charity-selected-icon"/>}</button>;
            })}
          </div>
          <div className="charity-donate-bottom">
            <div className="charity-amounts"><div className="charity-section-title">DONATION AMOUNT</div><div className="charity-amount-grid" role="group" aria-label="Donation amount">{CHARITY_AMOUNT_OPTIONS.map(amount=><button type="button" key={amount} className={charityAmount===amount?'selected':''} aria-pressed={charityAmount===amount} onClick={()=>setCharityAmount(amount)}>{fmt(amount)} <small>RVT</small></button>)}</div></div>
            <div className="charity-action">
              <div className="charity-benefit"><Heart size={16}/><span>{charityMilestoneReward(s.charityTotal,charityAmount)>0?'Milestone reward: +'+charityMilestoneReward(s.charityTotal,charityAmount)+' reputation':'Progress towards the next 100,000 RVT donation milestone'}</span></div>
              <button className="primary-button" disabled={s.cash<charityAmount} onClick={()=>setCharityConfirmation(true)}><HeartHandshake size={17}/> DONATE {fmt(charityAmount)} RVT</button>
              <small>{s.cash<charityAmount?'You need '+fmt(charityAmount-s.cash)+' more RVT.':'Every cumulative 100,000 RVT donated earns 200 reputation; partial progress carries over.'} Donations are optional and cannot be refunded.</small>
            </div>
          </div>
          {s.charityHistory.length>0&&<div className="charity-history"><span className="charity-section-title">RECENT CONTRIBUTIONS</span><div>{[...s.charityHistory].reverse().slice(0,3).map((entry,i)=><span key={i}><b>{CHARITY_CAUSES.find(c=>c.id===entry.cause)?.name??'Community fund'}</b><small>{fmt(entry.amount)} RVT{entry.rep>0?' · +'+entry.rep+' REP':''}</small></span>)}</div></div>}
        </section>
        <div className="sales-note"><CircleDollarSign size={18}/> Capital investments and community donations use only in-game Rivets. Infrastructure upgrades are permanent. Charity donations are voluntary and earn 200 REP for each cumulative 100,000 RVT donated, with no real-world transfer of money.</div>
      </div>}
      {page==='store'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">SHORT-TERM FACTORY ADVANTAGES</span><h1>Boost Store</h1><p>Spend Rivets on temporary boosts. No real-money purchases; every upgrade uses your in-game balance.</p></div><div className="staff-summary"><b>{fmt(s.cash)}</b><span>RIVETS AVAILABLE</span><small>Boost timers pause when production is paused or an incident stops the factory.</small></div></section>
        <section className="boost-store-grid">{BOOSTS.map(offer=>{const remaining=s.boostSeconds[offer.id];const active=remaining>0;return <article className={'boost-store-card '+(active?'boost-active':'')} key={offer.id}>
          <div className="boost-store-heading"><span className="boost-store-symbol">{offer.id==='production'?'⚙️':offer.id==='dispatch'?'🚚':'🛡️'}</span><span className="boost-store-tag">{active?'ACTIVE · '+boostClock(remaining):offer.subtitle}</span></div>
          <h2>{offer.name}</h2><p>{offer.description}</p><div className="boost-store-timer"><span>DURATION</span><b>{active?boostClock(remaining):boostClock(offer.duration)}</b></div>
          <button className="primary-button" disabled={remaining>360||s.cash<offer.cost} onClick={()=>buyBoost(offer.id)}>{remaining>360?'TIMER FULL · MAX 9 MIN':s.cash<offer.cost?'NEED '+fmt(offer.cost-s.cash)+' MORE RVT':(active?'ADD 3 MIN · ':'ACTIVATE · ')+fmt(offer.cost)+' RVT'}</button>
        </article>})}</section>
        <div className="sales-note"><Zap size={18}/> Buy the same boost up to three times to bank 9 minutes. Stacking extends duration only; it never multiplies the effect. Production +30%, dispatch +30%, insurance halves breakdown risk. Timers pause when the factory stops.</div>
      </div>}
      {page==='research'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">THE NEXT INDUSTRIAL REVOLUTION</span><h1>Research &amp; Technology</h1><p>Invest Gears into permanent factory-wide improvements. Every discovery stays unlocked, even when you leave the game.</p></div><div className="staff-summary research-summary"><b>{s.researched.filter(id=>technologies.some(t=>t.id===id)).length}/{technologies.length}</b><span>TECHNOLOGIES</span><small>{fmt(s.gears)} Gears available</small></div></section>
        <section className="research-overview"><div><FlaskConical size={22}/><span><b>Research department</b><small>Turn precision parts into permanent competitive advantages.</small></span></div><div className="research-active-effects">{s.researched.length===0?'No technologies researched yet':s.researched.map(id=>technologies.find(t=>t.id===id)?.effect).filter(Boolean).join(' · ')}</div></section>
        <section className="technology-tree research-map"><div className="technology-heading"><div><span className="eyebrow">TIERED TECHNOLOGY TREE</span><h2>Research progression</h2><p>Start with workshop fundamentals, then unlock industrial engineering and advanced automation. Earlier discoveries are kept.</p></div><span className="machine-count">{technologies.filter(t=>s.researched.includes(t.id)).length} / {technologies.length} UNLOCKED</span></div>
          {[1,2,3].map(tier=>{const tierTech=technologies.filter(t=>t.tier===tier);const tierOpen=researchTierUnlocked(tier,s.researched);const tierDone=tierTech.filter(t=>s.researched.includes(t.id)).length;return <div className={'research-tier '+(tierOpen?'tier-open':'tier-locked')} key={tier}><div className="research-tier-heading"><div><span className="eyebrow">TIER {tier}</span><h3>{researchTierNames[tier]}</h3><small>{tier===1?'Available from the start':tier===2?'Unlocks after Efficient Extraction':'Unlocks after Precision Tooling'}</small></div><span className="research-tier-count">{tierOpen?'OPEN':'LOCKED'} · {tierDone}/{tierTech.length}</span></div><div className="technology-grid research-node-grid">{tierTech.map(tech=>{const done=s.researched.includes(tech.id);const unlocked=tierOpen&&tech.requires.every(req=>s.researched.includes(req));const Icon=tech.icon;return <article className={'technology-card research-node '+(done?'researched':unlocked?'available':'locked-tech')} key={tech.id}><div className="technology-top"><span className="technology-icon"><Icon size={21}/></span><span className="technology-branch">{tech.branch}</span></div><h3>{tech.name}</h3><p>{tech.detail}</p><div className="technology-effect">{tech.effect}</div>{tech.requires.length>0&&<small className="research-prerequisites">↳ Requires {tech.requires.map(id=>technologies.find(t=>t.id===id)?.name||id).join(" + ")}</small>}{done?<div className="technology-complete"><CheckCircle2 size={16}/> RESEARCH COMPLETE</div>:<><small className="technology-cost">COST · {tech.cost} GEARS</small><button className="primary-button" disabled={!unlocked||s.gears<tech.cost} onClick={()=>researchTech(tech.id)}>{!tierOpen?'TIER '+tier+' LOCKED':!unlocked?'LOCKED · PREREQUISITES':s.gears<tech.cost?'NEED MORE GEARS':'RESEARCH · '+tech.cost+' GEARS'}</button></>}</article>})}</div></div>})}
        </section>
        <div className="research-footnote"><Cog size={16}/> Research effects apply automatically across every machine and sale. Your discoveries are saved with your factory.</div>
      </div>}
      {page==='warehouse'&&<div className="page-content">
        <section className="welcome-row"><div><span className="eyebrow">STORAGE & DISPATCH</span><h1>Warehouse</h1><p>Keep an eye on your stock and decide when to turn it into Rivets.</p></div><div className="warehouse-total"><small>TOTAL STOCK VALUE</small><b>{fmt(stockValue)} RVT</b><button type="button" className="primary-button" disabled={saleReminder.units===0} onClick={shipSurplus}>SELL SURPLUS · {fmt(saleReminder.value)} RVT</button><small>Keeps goods reserved for current contracts. Full units only.</small><button className="primary-button" disabled={!goods.some(g=>s[g.id]>=1)} onClick={shipAllStock}>SHIP ALL PRODUCTS · {fmt(goods.reduce((total,g)=>total+Math.floor(s[g.id])*g.price*saleMultiplier,0))} RVT</button></div></section>
        <div className="gear-banner"><Cog size={21}/><span><b>{fmt(s.gears)} Gears</b><small>Earn 1 Gear per 12 total finished goods shipped (Precision Parts, Circuit Boards, Steel Beams or Copper Coils). Current progress: {s.gearShipmentProgress.toFixed(1)}/12. Mission rewards also grant Gears.</small></span></div>
        {(s.miner>0||s.copperMiner>0)&&<section className="freight-inventory-note"><div><Truck size={19}/><span><strong>ORE WAITING AT THE MINES</strong><small>Drivers collect this ore. Mines slow down if the queue gets too large; add drivers or upgrade the fleet to restore full output.</small></span></div><div className="freight-inventory-values">{s.miner>0&&<span>IRON <b>{s.oreAtMine.toFixed(1)}</b></span>}{s.copperMiner>0&&<span>COPPER <b>{s.copperAtMine.toFixed(1)}</b></span>}</div><button type="button" className="secondary-button" onClick={()=>{setPage('staff');setStaffTab('haulage')}}>MANAGE DRIVERS</button></section>}
        <section className="warehouse-grid">{visibleGoods.map(g=><article className="stock-card" key={g.id}><span className="stock-emoji"><ProductIcon id={g.id} size={43}/></span><div><h3>{g.name}</h3><p>{g.detail} · {g.price} RVT each</p><b>{fmt(s[g.id])} <small>IN STOCK</small></b>{(g.id==='ingot'||g.id==='wire')&&<div className="stock-flow-control"><div className="stock-flow-head"><span>WHERE SHOULD IT GO?</span><b>{s.flowMode[g.id as IntermediateStock]==='stockpile'?'STOCKPILE':s.flowMode[g.id as IntermediateStock]==='feed'?'PRODUCTION':'BALANCED'}</b></div><div className="stock-flow-switch" role="group" aria-label={g.name+' material routing'}>{([{id:'stockpile',label:'Store',hint:'Keep everything for orders'},{id:'balanced',label:'Split',hint:'Protect orders and feed machines'},{id:'feed',label:'Use',hint:'Send it to production'}] as const).map(option=><button key={option.id} type="button" aria-pressed={s.flowMode[g.id as IntermediateStock]===option.id} title={option.hint} className={s.flowMode[g.id as IntermediateStock]===option.id?'is-selected':''} onClick={()=>setS(v=>({...v,flowMode:{...v.flowMode,[g.id]:option.id}}))}>{option.label}</button>)}</div><small>{s.flowMode[g.id as IntermediateStock]==='stockpile'?'Save all new stock for shipping or contracts.':s.flowMode[g.id as IntermediateStock]==='feed'?'Other machines can use all available stock.':'Reserve contract quantities and keep production flowing.'}</small></div>}</div><button disabled={s[g.id]<1} onClick={()=>sellStock(g.id)}>SHIP ALL · {fmt(Math.floor(s[g.id])*g.price)} RVT</button></article>)}</section>
        <section className="contracts-panel"><div className="section-heading"><div><span className="eyebrow">CUSTOMER EMAILS</span><h2>Order Desk</h2><p>Easy, Standard, Hard and Rush orders arrive in the Order Inbox. Late orders pay less and cost 2 reputation; expired orders disappear and cost 3 in total. New offers are spaced at least 2½ minutes apart.</p></div><button className="primary-button" onClick={()=>setInboxOpen(true)}>OPEN INBOX · {incomingMail.length}</button></div><div className="contract-summary"><span><b>{readyOrders}</b> READY</span><span><b>{activeOrders}</b> PREPARING</span><span><b>{completedOrders}</b> STORY DELIVERIES</span></div></section>
        <div className="sales-note"><CircleDollarSign size={18}/> {s.salespeople>0&&s.autoSell?'Your assigned sales team is automatically dispatching stock.':'Hire sales staff and enable automatic sales from the Staff page to automate dispatch.'}</div>
      </div>}
    </main>
    {charityConfirmation&&<div className="modal-backdrop" role="presentation"><section className="charity-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="charity-confirm-title"><div className="charity-confirm-icon"><HeartHandshake size={27}/></div><span className="eyebrow">CONFIRM IN-GAME DONATION</span><h2 id="charity-confirm-title">Support {CHARITY_CAUSES.find(c=>c.id===charityCause)?.name}?</h2><p>This will spend <strong>{fmt(charityAmount)} RVT</strong> from your factory account. {charityMilestoneReward(s.charityTotal,charityAmount)>0?'You will receive +'+charityMilestoneReward(s.charityTotal,charityAmount)+' reputation for crossing a donation milestone.':'The amount counts towards your next 100,000 RVT milestone.'} It uses fictional currency and cannot be undone.</p><div className="charity-confirm-actions"><button className="secondary-button" onClick={()=>setCharityConfirmation(false)}>CANCEL</button><button className="primary-button" disabled={s.cash<charityAmount} onClick={donateToCharity}>CONFIRM DONATION</button></div></section></div>}
    {s.writeOffEvent&&<div className="incident-backdrop" role="dialog" aria-modal="true" aria-labelledby="writeoff-title"><section className="incident-panel writeoff-panel"><div className="incident-siren"><AlertTriangle size={28}/><span>CATASTROPHIC EQUIPMENT LOSS</span></div><p className="incident-kicker">FACTORY ASSET REPORT</p><h2 id="writeoff-title">That machine is beyond repair.</h2><p className="incident-copy"><b>{machines.find(m=>m.id===s.writeOffEvent?.id)?.name}</b> unit {s.writeOffEvent.unit} has been permanently written off. Its production has stopped and it cannot be repaired by a mechanic.</p><div className="incident-readout"><span>OLD MACHINE LEVEL</span><b>LEVEL {s.writeOffEvent.oldLevel}</b><span>REPLACEMENT</span><b>BUY A NEW UNIT · UP TO 5 LEVELS LOWER</b></div><button className="primary-button" onClick={()=>{setS(v=>({...v,writeOffEvent:null}));setPage('factory');setNotice('Equipment written off. Buy a replacement machine to restore capacity.');}}>ACKNOWLEDGE · REPLACE WHEN READY</button></section></div>}
    {s.cyberAttackEvent&&<div className="cyberattack-backdrop" role="dialog" aria-modal="true" aria-labelledby="cyberattack-title"><section className="cyberattack-panel"><div className="powercut-topline"><span>ORE &amp; ORDER · INCIDENT 002</span><span className="cyberattack-live"><i/> NETWORK BREACH</span></div><h2 id="cyberattack-title">Someone's in the system.</h2><p className="powercut-intro">The new Mech Assembly has just joined the line when every terminal flashes red. An unknown process has seized the factory network, locked the control systems and frozen production. This isn't a blown fuse — someone has got inside.</p><img className="powercut-storyboard" src="/resources/Factory Lockdown_ Cyberattack Alert.png" alt="Six-panel comic storyboard showing a factory network breach, warning terminal, frozen machinery and red emergency lighting"/><div className="powercut-choice-heading"><b>TAKE BACK CONTROL</b><span>Production stays paused until recovery</span></div><div className="powercut-actions"><button className="primary-button" disabled={s.cash<cybersecurityCost(s)} onClick={hireCybersecuritySpecialist}>HIRE CYBERSECURITY SPECIALIST · {fmt(cybersecurityCost(s))} RVT <small>Contains the breach and installs permanent protection</small></button><button className="secondary-button" onClick={emergencyCyberRecovery}>{s.cash<120?'EMERGENCY MANUAL REBOOT · FREE':'EXTERNAL SYSTEM RESTORE · 120 RVT'} <small>{s.cash<120?'Last-resort recovery so your factory cannot be stranded':'Restores production without an in-house specialist'}</small></button></div><small className="powercut-footnote">The incident is one-time. A specialist stays on your team and protects the factory network.</small></section></div>}
    {s.powerCutEvent&&<div className="powercut-backdrop" role="dialog" aria-modal="true" aria-labelledby="powercut-title"><section className="powercut-panel"><div className="powercut-topline"><span>ORE &amp; ORDER · INCIDENT 001</span><span className="powercut-live"><i/> POWER FAILURE</span></div><h2 id="powercut-title">Well, that's put a stop to things.</h2><p className="powercut-intro">The lights flicker. The Rockbreaker Mine gives one last shudder, then everything goes quiet. Your first proper factory problem has arrived.</p><img className="powercut-storyboard" src="/resources/D2023E3F-6B90-49C0-A813-BBFAEFD28354.png" alt="Comic storyboard showing the factory lights flickering, a machine sparking, the factory going dark and emergency red lights coming on"/><div className="powercut-choice-heading"><b>GET THE MINE BACK ONLINE</b><span>Choose how to recover</span></div><div className="powercut-actions"><button className="primary-button" disabled={s.cash<60} onClick={()=>resolvePowerCut(true)}>HIRE A MECHANIC · 60 RVT <small>First-day discount · keeps them on your team</small></button><button className="secondary-button" onClick={()=>resolvePowerCut(false)}>{s.cash<40?'EMERGENCY RESET · FREE':'ONE-OFF REPAIR · 40 RVT'} <small>Fix the mine without hiring staff</small></button></div><small className="powercut-footnote">Your factory is paused until the mine is repaired. This incident only happens once.</small></section></div>}
    {s.breakdownEvent&&<div className="incident-backdrop" role="dialog" aria-modal="true" aria-labelledby="incident-title"><section className="incident-panel"><div className="incident-siren"><AlertTriangle size={28}/><span>EMERGENCY STOP · 01</span></div><p className="incident-kicker">FACTORY INCIDENT REPORT</p><h2 id="incident-title">Critical machine failure</h2><p className="incident-copy"><b>{machines.find(m=>m.id===s.breakdownEvent)?.name}</b> has suffered a mechanical failure. The line has been stopped while the fault is isolated. Production and automatic dispatch are temporarily suspended.</p><div className="incident-readout"><span>FAULT DETECTED</span><b>DRIVE ASSEMBLY OVERHEATING</b><span>REQUIRED ACTION</span><b>REPAIR THE AFFECTED MACHINE</b></div><div className="incident-actions">{s.mechanicAssignments[s.breakdownEvent]>0&&<button className="primary-button" onClick={()=>resolveBreakdown(true)}>USE ASSIGNED MECHANIC · FREE</button>}<button className="primary-button" disabled={s.cash<repairCostFor(s.breakdownEvent,s[`tier_${s.breakdownEvent}`])} onClick={()=>resolveBreakdown(false)}>EMERGENCY REPAIR · {fmt(repairCostFor(s.breakdownEvent,s[`tier_${s.breakdownEvent}`]))} RVT</button><button className="secondary-button" onClick={()=>{setS(v=>({...v,breakdownEvent:null}));setNotice('Emergency stop cleared. '+machines.find(m=>m.id===s.breakdownEvent)?.name+' still needs repair.')}}>CONTINUE · REPAIR LATER</button></div><small className="incident-footnote">Tip: assign a mechanic in Staff to handle future breakdowns. You can also repair the machine from its factory card.</small></section></div>}
    {rewardSplash&&<div className={'reward-splash reward-'+rewardSplash.kind} key={rewardSplash.id} role="status" aria-live="polite"><div className="reward-splash-mark">{rewardSplash.kind==='contract'?<CheckCircle2 size={26}/>:rewardSplash.kind==='upgrade'?<Cog size={26}/>:<Truck size={26}/>}</div><div className="reward-splash-content"><small>{rewardSplash.kind==='contract'?'CUSTOMER DELIGHTED':rewardSplash.kind==='upgrade'?'FACTORY IMPROVED':'DISPATCH COMPLETE'}</small><h3>{rewardSplash.title}</h3><p>{rewardSplash.detail}</p><div className="reward-splash-values">{rewardSplash.cash!==undefined&&<b>+{fmt(rewardSplash.cash)} RVT</b>}{rewardSplash.xp!==undefined&&rewardSplash.xp>0&&<b>+{fmt(rewardSplash.xp)} XP</b>}{rewardSplash.rep!==undefined&&rewardSplash.rep>0&&<b>+{fmt(rewardSplash.rep)} REP</b>}</div></div><button type="button" aria-label="Close celebration" onClick={()=>setRewardSplash(null)}>×</button></div>}
    {notice&&<div className="toast" role="status" aria-live="polite"><span className="toast-icon">{noticeKind==='ORDER DESK'?'📦':noticeKind==='QUICK HEADS-UP'?'🛠️':'🏭'}</span><div className="toast-copy"><small>{noticeKind}</small><b>{noticeTitle}</b><p>{notice}</p></div><button className="toast-close" aria-label="Dismiss notification" onClick={()=>setNotice('')}>×</button></div>
    }{showReset&&<div className="modal-backdrop"><div className="reset-modal"><h2>Reset your factory?</h2><p>This clears machines, Rivets, Gears and staff saved on this device.</p><div><button onClick={()=>setShowReset(false)}>CANCEL</button><button className="danger" onClick={reset}>RESET FACTORY</button></div></div></div>}
    <Analytics />
  </div>;
}
